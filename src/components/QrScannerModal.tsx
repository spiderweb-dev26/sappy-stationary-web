"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  X,
  AlertCircle,
  Search,
  UploadCloud,
  FlipHorizontal,
  Loader2,
} from "lucide-react";
import jsQR from "jsqr";
import { normalizeScannedCode } from "@/lib/format";
import { playScanBeep } from "@/lib/qr";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedSerial: string) => void;
}

export default function QrScannerModal({
  isOpen,
  onClose,
  onScan,
}: QrScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }

    let isSubscribed = true;
    setIsInitializing(true);
    setCameraError(null);

    const initCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          if (isSubscribed && videoInputs.length > 0) {
            setVideoDevices(videoInputs);
            if (!selectedDeviceId) {
              const backCam = videoInputs.find((d) =>
                d.label.toLowerCase().includes("back") ||
                d.label.toLowerCase().includes("rear") ||
                d.label.toLowerCase().includes("environment")
              );
              setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
            }
          }
        }

        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.muted = true;
          
          await videoRef.current.play().catch(() => {});
          setIsInitializing(false);

          if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
        }
      } catch (err: any) {
        if (isSubscribed) {
          setCameraError(
            "Camera permission denied or camera not available. You can enter the serial below or upload a QR image."
          );
          setIsInitializing(false);
        }
      }
    };

    initCamera();

    return () => {
      isSubscribed = false;
      stopCameraStream();
    };
  }, [isOpen, selectedDeviceId]);

  const stopCameraStream = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const scanVideoFrame = () => {
    if (!isOpen) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState >= 2 && canvas) {
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (vw > 0 && vh > 0) {
        canvas.width = vw;
        canvas.height = vh;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, vw, vh);
          const imageData = ctx.getImageData(0, 0, vw, vh);
          
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (qrCode && qrCode.data && qrCode.data.trim()) {
            const clean = normalizeScannedCode(qrCode.data);
            if (clean) {
              handleSuccessfulScan(clean);
              return;
            }
          }
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleSuccessfulScan = (code: string) => {
    playScanBeep();
    stopCameraStream();
    onScan(code);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          if (qrCode && qrCode.data) {
            const clean = normalizeScannedCode(qrCode.data);
            if (clean) {
              handleSuccessfulScan(clean);
              return;
            }
          }
        }
        alert("No QR code found in the uploaded image. Please try a clearer picture.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeScannedCode(manualCode);
    if (clean) {
      handleSuccessfulScan(clean);
      setManualCode("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 animate-scale-up space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                Scan Item QR Code
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Align the 2D QR code inside the green target frame.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {videoDevices.length > 1 && (
          <div className="flex items-center gap-2">
            <FlipHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {videoDevices.map((c) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || `Camera ${c.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {!cameraError && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-44 h-44 border-2 border-emerald-400 rounded-2xl bg-emerald-400/10 relative overflow-hidden shadow-[0_0_25px_rgba(52,211,153,0.4)]">
                <div className="w-full h-0.5 bg-emerald-300 shadow-[0_0_10px_#34d399] absolute top-0 animate-[bounce_2s_infinite]" />
              </div>
            </div>
          )}

          {isInitializing && !cameraError && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white gap-2 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="font-bold">Starting camera...</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 p-5 bg-slate-900 flex flex-col items-center justify-center text-center text-xs text-slate-300 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="leading-relaxed">{cameraError}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Or Scan From Photo:</span>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 font-bold text-emerald-700 hover:underline"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Choose QR Photo</span>
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter serial manually (e.g. SL-26-P0101)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
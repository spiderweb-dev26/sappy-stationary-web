"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, X, RefreshCw, AlertCircle, Search } from "lucide-react";
import jsQR from "jsqr";
import { normalizeScannedCode } from "@/lib/format";

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
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError(
        "Camera unavailable or permission denied. You can manually enter the serial number below."
      );
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            const normalized = normalizeScannedCode(code.data);
            if (normalized) {
              onScan(normalized);
              stopCamera();
              onClose();
              return;
            }
          }
        }
      }
    }
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeScannedCode(manualCode);
    if (normalized) {
      onScan(normalized);
      setManualCode("");
      stopCamera();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                Scan Item QR Code
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Align the stationery QR label within the scanner box.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Scanner Area */}
        <div className="mt-4">
          <div className="relative w-full h-56 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
            {cameraError ? (
              <div className="p-4 text-center text-rose-300 text-xs">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <p>{cameraError}</p>
              </div>
            ) : (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {/* Target overlay */}
                <div className="absolute inset-0 border-2 border-emerald-400/40 pointer-events-none flex items-center justify-center">
                  <div className="w-36 h-36 border-2 border-emerald-400 rounded-xl bg-emerald-400/10 shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Manual Fallback Input */}
        <form onSubmit={handleManualSubmit} className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Or Enter Serial Manually
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. SL-26-P0101"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

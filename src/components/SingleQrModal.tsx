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
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerElementId = "sappy-qr-reader-box";

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsInitializing(true);
    setCameraError(null);

    const initScanner = async () => {
      try {
        // 1. Enumerate video cameras
        const devices = await Html5Qrcode.getCameras().catch(() => []);
        if (mounted && devices && devices.length > 0) {
          setCameras(devices);
          if (!selectedCameraId) {
            const backCam = devices.find((d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("environment")
            );
            setSelectedCameraId(backCam ? backCam.id : devices[0].id);
          }
        }

        // 2. Instantiate QR scanner engine
        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        // 3. Start camera stream
        const cameraConfig = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: "environment" };

        await html5QrCode.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const edgeSize = Math.floor(minEdge * 0.72);
              return { width: edgeSize, height: edgeSize };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {}
        );

        if (mounted) setIsInitializing(false);
      } catch (err: any) {
        console.warn("Scanner camera init error:", err);
        try {
          if (scannerRef.current) {
            await scannerRef.current.start(
              { facingMode: "user" },
              { fps: 15, qrbox: { width: 220, height: 220 } },
              (decodedText) => handleScanSuccess(decodedText),
              () => {}
            );
            if (mounted) setIsInitializing(false);
            return;
          }
        } catch (fallbackErr) {}

        if (mounted) {
          setCameraError(
            "Camera permission not granted or no camera available. You can type the serial code below or upload a picture of the QR code."
          );
          setIsInitializing(false);
        }
      }
    };

    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScannerInstance();
    };
  }, [isOpen, selectedCameraId]);

  const stopScannerInstance = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
  };

  const handleScanSuccess = async (rawCode: string) => {
    const clean = normalizeScannedCode(rawCode);
    if (!clean) return;

    playScanBeep();
    await stopScannerInstance();
    onScan(clean);
    onClose();
  };

  // Image Upload QR Decode
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let qrEngine = scannerRef.current;
      if (!qrEngine) {
        qrEngine = new Html5Qrcode(readerElementId);
      }

      const decoded = await qrEngine.scanFile(file, true);
      if (decoded) {
        handleScanSuccess(decoded);
      }
    } catch (err) {
      alert("No QR code detected in this picture. Please upload a clear photo.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeScannedCode(manualCode);
    if (clean) {
      handleScanSuccess(clean);
      setManualCode("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 animate-scale-up space-y-4">
        {/* Header */}
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
                Hold the stationery QR label in front of the lens.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await stopScannerInstance();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Selector Dropdown */}
        {cameras.length > 1 && (
          <div className="flex items-center gap-2">
            <FlipHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Viewport */}
        <div className="relative w-full min-h-[260px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
          <div id={readerElementId} className="w-full h-full overflow-hidden" />

          {isInitializing && !cameraError && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white gap-2 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="font-bold">Accessing camera...</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 p-5 bg-slate-900 flex flex-col items-center justify-center text-center text-xs text-slate-300 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="leading-relaxed">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Action Controls: Photo Upload & Manual Serial */}
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
              <span>Choose Picture</span>
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
import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, Check, HelpCircle } from 'lucide-react';
import { Tree } from '../types';

interface CameraSimulatorProps {
  mode: 'QR_SCANNER' | 'PHOTO_BEFORE' | 'PHOTO_AFTER';
  targetTree?: Tree;
  taskType?: string;
  onQrScanned?: (scannedCode: string, isCorrect: boolean) => void;
  onPhotoCaptured?: (photoUrl: string) => void;
  onReportQrError?: () => void;
}

// Preset visual graphics representing "Before" and "After" states of urban trees by task type
const MOCK_PHOTOS: Record<string, { before: string; after: string }> = {
  'Tưới nước': {
    before: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=500&auto=format&fit=crop&q=80', // Dry ground tree
    after: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500&auto=format&fit=crop&q=80'   // Rich green wet foliage
  },
  'Cắt tỉa cành': {
    before: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80', // Wild dense branches
    after: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=500&auto=format&fit=crop&q=80'   // Well spaced managed trees
  },
  'Bón phân': {
    before: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&auto=format&fit=crop&q=80', // Standard soil base
    after: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&auto=format&fit=crop&q=80'   // Fertile base with woodchips
  },
  'Phun thuốc': {
    before: 'https://images.unsplash.com/photo-1621886292650-520f76c747d6?w=500&auto=format&fit=crop&q=80', // Bare bark trunk with dark bark
    after: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=80'   // Painted bottom tree trunk
  },
  'Kiểm tra sâu bệnh': {
    before: 'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?w=500&auto=format&fit=crop&q=80', // Rotten bark detail
    after: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500&auto=format&fit=crop&q=80'   // Healed bark seal
  }
};

const DEFAULT_PHOTOS = {
  before: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=500&auto=format&fit=crop&q=80',
  after: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500&auto=format&fit=crop&q=80'
};

export const CameraSimulator: React.FC<CameraSimulatorProps> = ({
  mode,
  targetTree,
  taskType = 'Tưới nước',
  onQrScanned,
  onPhotoCaptured,
  onReportQrError
}) => {
  const [captured, setCaptured] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<{ status: 'idle' | 'success' | 'failed'; message: string }>({
    status: 'idle',
    message: ''
  });

  // Get active photo resources based on work types
  const photoPair = MOCK_PHOTOS[taskType] || DEFAULT_PHOTOS;
  const currentFeedUrl = mode === 'PHOTO_BEFORE' ? photoPair.before : photoPair.after;

  useEffect(() => {
    // Reset state when mode shifts
    setCaptured(null);
    setQrStatus({ status: 'idle', message: '' });
  }, [mode]);

  // Simulate scanning code
  const handleScanCode = (code: string) => {
    if (!targetTree) return;
    const isCorrect = code === targetTree.qrCode;
    
    if (isCorrect) {
      setQrStatus({ status: 'success', message: 'Hợp lệ! Đúng mã QR của cây mục tiêu.' });
      if (onQrScanned) {
        setTimeout(() => {
          onQrScanned(code, true);
        }, 1200);
      }
    } else {
      setQrStatus({ status: 'failed', message: `Sai mã! Mã quét được là ${code}, yêu cầu ${targetTree.qrCode}.` });
      if (onQrScanned) {
        onQrScanned(code, false);
      }
    }
  };

  const handleCapture = () => {
    setCaptured(currentFeedUrl);
  };

  const handleRetake = () => {
    setCaptured(null);
  };

  const handleUsePhoto = () => {
    if (captured && onPhotoCaptured) {
      onPhotoCaptured(captured);
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden flex flex-col justify-between shadow-inner select-none border border-slate-800">
      
      {/* 1. TOP HEADER / STATUS */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center text-xs text-white">
        <span className="flex items-center gap-1.5 font-medium tracking-wide">
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          {mode === 'QR_SCANNER' && 'QUÉT MÃ QR CÂY XANH'}
          {mode === 'PHOTO_BEFORE' && 'CHỤP ẢNH TRƯỚC (BEFORE)'}
          {mode === 'PHOTO_AFTER' && 'CHỤP ẢNH SAU (AFTER)'}
        </span>
        {mode !== 'QR_SCANNER' && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            mode === 'PHOTO_BEFORE' ? 'bg-amber-500/90' : 'bg-emerald-500/90'
          }`}>
            {mode === 'PHOTO_BEFORE' ? 'BEFORE' : 'AFTER'}
          </span>
        )}
      </div>

      {/* 2. CAMERA VIEWFINDER */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center">
        {mode === 'QR_SCANNER' ? (
          /* QR CODE SCREEN */
          <div className="w-full h-full relative flex flex-col justify-between p-6">
            <div className="flex-1 flex flex-col justify-center items-center">
              {/* Scan target visual box */}
              <div className="relative w-48 h-48 border-2 border-dashed border-emerald-500 rounded-2xl flex items-center justify-center bg-emerald-950/20 shadow-lg">
                {/* Laser animation */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-emerald-500/50 shadow-md animate-bounce" />
                
                {/* Small QR representation inside viewfinder */}
                <div className="w-24 h-24 bg-white p-2 rounded-lg flex flex-col items-center justify-center shadow-md">
                  <div className="grid grid-cols-4 gap-1 w-full h-full opacity-80">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${
                          (i % 3 === 0 || i % 5 === 2 || i === 0 || i === 3 || i === 12 || i === 15)
                            ? 'bg-slate-900'
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-white text-xs text-center mt-5 leading-relaxed px-4 opacity-90 drop-shadow-md">
                Di chuyển camera lại gần bảng mã QR gắn trên gốc cây ({targetTree?.id})
              </p>
            </div>

            {/* QR Feedback State */}
            {qrStatus.status !== 'idle' && (
              <div className={`absolute bottom-4 left-4 right-4 p-3 rounded-xl border flex items-start gap-2 text-xs backdrop-blur-md shadow-lg transition-all duration-300 ${
                qrStatus.status === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/90 border-rose-500 text-rose-200'
              }`}>
                {qrStatus.status === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <span className="flex-1 leading-snug">{qrStatus.message}</span>
              </div>
            )}
          </div>
        ) : (
          /* PHOTO BEFORE / AFTER VIEWFINDER */
          <div className="w-full h-full relative">
            <img
              src={captured || currentFeedUrl}
              alt="Simulated Camera Stream"
              className={`w-full h-full object-cover transition-all duration-500 ${
                captured ? 'brightness-105' : 'brightness-90 hover:brightness-95'
              }`}
              referrerPolicy="no-referrer"
            />
            
            {/* Guide overlay markers */}
            {!captured && (
              <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-8 h-8 border-t border-l border-white/60 absolute top-0 left-0 rounded-tl-lg" />
                <div className="w-8 h-8 border-t border-r border-white/60 absolute top-0 right-0 rounded-tr-lg" />
                <div className="w-8 h-8 border-b border-l border-white/60 absolute bottom-0 left-0 rounded-bl-lg" />
                <div className="w-8 h-8 border-b border-r border-white/60 absolute bottom-0 right-0 rounded-br-lg" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                  Đảm bảo thấy rõ thân & tán cây
                </span>
              </div>
            )}

            {/* Indicator of Captured Preview state */}
            {captured && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                <div className="bg-slate-900/95 border border-slate-700/80 p-4 rounded-2xl max-w-[80%] text-center shadow-2xl scale-in">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Ảnh đã được ghi lại</h4>
                  <p className="text-xs text-slate-400 mt-1">Vui lòng kiểm tra độ sắc nét trước khi lưu lại bằng chứng.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BOTTOM PANEL CONTROLS */}
      <div className="p-4 bg-gradient-to-t from-black/95 to-slate-950/90 border-t border-slate-800/60 z-10 flex flex-col gap-3">
        {mode === 'QR_SCANNER' ? (
          /* SCANNER CONTROLS */
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2">
              {/* Simulate correct QR */}
              <button
                type="button"
                onClick={() => handleScanCode(targetTree?.qrCode || '')}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Simulate đúng mã QR</span>
              </button>

              {/* Simulate wrong QR */}
              <button
                type="button"
                onClick={() => handleScanCode('NOVYX-WRONG-QR-999')}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1 active:scale-95 transition-all"
                title="Quét mã của cây khác"
              >
                <RefreshCw className="w-4 h-4 text-amber-500" />
                <span>Quét sai cây</span>
              </button>
            </div>

            {/* Link to Report QR error if requested by flow */}
            {onReportQrError && (
              <button
                type="button"
                onClick={onReportQrError}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium py-1.5 flex items-center justify-center gap-1 mt-0.5 border border-dashed border-rose-950 hover:bg-rose-950/20 rounded-lg transition-all"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Báo lỗi QR hỏng / mất mã gắn trên cây</span>
              </button>
            )}
          </div>
        ) : (
          /* PHOTO CAPTURE CONTROLS */
          <div className="flex items-center justify-between w-full px-2">
            {!captured ? (
              /* Capture Trigger view */
              <>
                <div className="w-10" /> {/* Spacer */}
                <button
                  type="button"
                  onClick={handleCapture}
                  className="w-16 h-16 bg-white hover:bg-slate-100 active:scale-90 rounded-full flex items-center justify-center p-1.5 transition-all shadow-lg shadow-white/10"
                >
                  <div className="w-full h-full rounded-full border-2 border-slate-950 bg-white flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-slate-900" />
                  </div>
                </button>
                <div className="text-slate-400 text-xs flex flex-col items-center gap-0.5" title="Chọn ảnh mẫu có sẵn">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px]">Giả lập</span>
                </div>
              </>
            ) : (
              /* Preview action buttons */
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Chụp lại</span>
                </button>
                <button
                  type="button"
                  onClick={handleUsePhoto}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-950/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Sử dụng ảnh này</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

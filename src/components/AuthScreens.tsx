import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, MapPin, Camera, Sparkles, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreensProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onLoginSuccess: (role: 'Staff' | 'Manager', email: string) => void;
  gpsPermission: boolean;
  cameraPermission: boolean;
  setGpsPermission: (val: boolean) => void;
  setCameraPermission: (val: boolean) => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({
  currentScreen,
  onNavigate,
  onLoginSuccess,
  gpsPermission,
  cameraPermission,
  setGpsPermission,
  setCameraPermission
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password sub-state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập Email hoặc Số điện thoại.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Quick role check
    if (normalizedEmail.includes('admin') || normalizedEmail.includes('manager') || normalizedEmail === 'manager@novyx.vn') {
      onLoginSuccess('Manager', normalizedEmail);
    } else {
      // Default to Staff
      onLoginSuccess('Staff', normalizedEmail || 'hung.nguyen@novyx.vn');
    }
  };

  const handleQuickLogin = (role: 'Staff' | 'Manager') => {
    if (role === 'Staff') {
      setEmail('hung.nguyen@novyx.vn');
      setPassword('staff123');
      onLoginSuccess('Staff', 'hung.nguyen@novyx.vn');
    } else {
      setEmail('manager@novyx.vn');
      setPassword('admin123');
      onLoginSuccess('Manager', 'manager@novyx.vn');
    }
  };

  if (currentScreen === 'Forgot_Password') {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-slate-50">
        <div className="pt-8">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Khôi phục mật khẩu</h2>
          <p className="text-xs text-slate-500 mt-1.5">
            Nhập email của bạn. Chúng tôi sẽ gửi mã OTP xác nhận cấp lại mật khẩu.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); setForgotSuccess(true); }} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Email đã đăng ký
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="ten.nhanvien@novyx.vn"
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] transition-all shadow-xs"
                required
              />
            </div>

            {forgotSuccess ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs leading-relaxed">
                <p className="font-semibold text-emerald-900 mb-0.5">Thành công!</p>
                Link đặt lại mật khẩu đã được gửi về email của bạn. Hãy kiểm tra hộp thư đến.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={forgotSuccess}
              className="w-full py-3 px-4 bg-[#4CAF50] hover:bg-[#43A047] disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-98 mt-2"
            >
              Gửi liên kết khôi phục
            </button>
          </form>
        </div>

        <button
          onClick={() => { onNavigate('S02_Login'); setForgotSuccess(false); }}
          className="text-xs text-[#4CAF50] font-bold py-2 hover:underline text-center"
        >
          Quay lại màn hình Đăng nhập
        </button>
      </div>
    );
  }

  if (currentScreen === 'S02_Login') {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-emerald-50/50 via-white to-white">
        
        {/* LOGO & HERO AREA */}
        <div className="flex flex-col items-center pt-10 pb-6">
          <div className="w-16 h-16 bg-[#4CAF50] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-700/20 mb-3.5 relative overflow-hidden">
            {/* Absolute shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-pulse" />
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#2e6d2a] tracking-tight">NOVYX</h1>
          <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest mt-1">
            Urban Green Verification
          </p>
          <p className="text-xs text-slate-400 mt-2 text-center max-w-[230px]">
            Hệ thống quản lý cây xanh &amp; xác minh công việc hiện trường
          </p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-1.5">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Email hoặc Số điện thoại
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="hung.nguyen@novyx.vn"
              className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] transition-all shadow-xs text-slate-800"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] transition-all shadow-xs text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={() => onNavigate('Forgot_Password')}
              className="text-xs text-[#4CAF50] font-bold hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#4CAF50] hover:bg-[#43A047] active:bg-[#388E3C] text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-800/10 active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Đăng nhập</span>
          </button>
        </form>

        {/* DEMO ACCOUNTS AREA */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Dành cho Kiểm thử nhanh (Quick Login)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('Staff')}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100/80 active:scale-95 border border-emerald-100 rounded-xl text-left transition-all"
            >
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">ROLE NHÂN VIÊN</p>
              <p className="text-xs font-semibold text-emerald-950 truncate mt-0.5">N.V. Hùng (Staff)</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('Manager')}
              className="p-2.5 bg-sky-50 hover:bg-sky-100/80 active:scale-95 border border-sky-100 rounded-xl text-left transition-all"
            >
              <p className="text-[10px] font-bold text-sky-800 uppercase tracking-wide">ROLE QUẢN LÝ</p>
              <p className="text-xs font-semibold text-sky-950 truncate mt-0.5">Admin (Manager)</p>
            </button>
          </div>
        </div>

      </div>
    );
  }

  if (currentScreen === 'S03_Permission') {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-slate-900 text-white">
        
        {/* Permission Explanation Header */}
        <div className="pt-10">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Cấp quyền thiết bị</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            NOVYX cần quyền truy cập hệ thống định vị GPS và Camera trực tiếp để xác minh tác nghiệp thời gian thực tại hiện trường bồn cây.
          </p>
        </div>

        {/* PERMISSIONS CARDS */}
        <div className="space-y-4 my-auto">
          {/* 1. Location permission card */}
          <button
            type="button"
            onClick={() => setGpsPermission(true)}
            className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all active:scale-98 ${
              gpsPermission
                ? 'bg-emerald-950/30 border-emerald-500 text-emerald-100'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 text-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              gpsPermission ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold">Quyền truy cập vị trí (GPS)</h4>
                {gpsPermission && (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    ĐÃ CẤP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                Xác thực nhân viên đứng sát bồn cây (&lt; 10m) giúp tránh sai sót và gian lận định vị.
              </p>
            </div>
          </button>

          {/* 2. Camera permission card */}
          <button
            type="button"
            onClick={() => setCameraPermission(true)}
            className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all active:scale-98 ${
              cameraPermission
                ? 'bg-emerald-950/30 border-emerald-500 text-emerald-100'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 text-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              cameraPermission ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
            }`}>
              <Camera className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold">Quyền truy cập Camera</h4>
                {cameraPermission && (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    ĐÃ CẤP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                Quét mã QR gắn chặt trên vỏ cây và chụp ảnh Before / After đối chiếu chất lượng thi công.
              </p>
            </div>
          </button>
        </div>

        {/* CONTINUE BUTTON */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              // Ensure both are simulated as true before moving on, or force them true
              setGpsPermission(true);
              setCameraPermission(true);
              onNavigate('S04_Staff_Home');
            }}
            className="w-full py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 text-center flex items-center justify-center gap-1.5"
          >
            <span>Tiếp tục vào trang chủ</span>
          </button>
          <p className="text-[10px] text-center text-slate-500">
            Bằng việc tiếp tục, thiết bị của bạn đồng ý các điều khoản an toàn bảo mật.
          </p>
        </div>

      </div>
    );
  }

  return null;
};

// Simple utility component to avoid custom icons missing
const AlertCircleIcon = ({ className }: { className: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

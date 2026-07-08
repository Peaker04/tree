import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData } from './data';
import { Tree, Staff, Task, AppNotification, Role, TaskStatus } from './types';
import { DeviceSimulator } from './components/DeviceSimulator';
import { AuthScreens } from './components/AuthScreens';
import { StaffScreens } from './components/StaffScreens';
import { ManagerScreens } from './components/ManagerScreens';
import { 
  Sparkles, Shield, User, HelpCircle, RefreshCw, MapPin, CheckCircle, 
  AlertTriangle, Navigation, List, ArrowRight, Settings2, Compass,
  Trees, ClipboardCheck, Activity, Users, CheckSquare, Eye
} from 'lucide-react';

export default function App() {
  // Load state from localStorage on boot
  const [data, setData] = useState(() => getStoredData());
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [userEmail, setUserEmail] = useState('');
  
  // Device location simulation states (Tao Dan default)
  const [userLat, setUserLat] = useState(10.7745);
  const [userLng, setUserLng] = useState(106.6912);
  
  // App navigation state
  const [currentScreen, setCurrentScreen] = useState('S02_Login'); // 'S02_Login' | 'Forgot_Password' | 'S03_Permission' | 'App_Main'
  const [currentTab, setCurrentTab] = useState(''); // Active bottom navigation tab

  // Permissions simulation
  const [gpsPermission, setGpsPermission] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);

  // Active workflow state for Staff
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [workflowStep, setWorkflowStep] = useState('LIST'); // 'LIST' | 'DETAIL' | 'MAP' | 'GPS_CHECK' | 'QR_SCAN' | 'BEFORE_PHOTO' | 'CHECKLIST' | 'AFTER_PHOTO' | 'REVIEW' | 'SUCCESS' | 'REPORT_QR_ERROR'

  // Active review state for Manager
  const [reviewTask, setReviewTask] = useState<Task | null>(null);
  const [managerStep, setManagerStep] = useState('LIST'); // 'LIST' | 'REVIEW_DETAIL' | 'REJECT_REASON' | 'CREATE_STEP_1' ...

  // Sync back to local storage whenever data changes
  useEffect(() => {
    saveStoredData({
      trees: data.trees,
      staff: data.staff,
      tasks: data.tasks,
      notifications: data.notifications
    });
  }, [data]);

  // Handle successful logins
  const handleLoginSuccess = (role: Role, email: string) => {
    setActiveRole(role);
    setUserEmail(email);
    
    if (role === 'Staff') {
      setCurrentTab('S04_Staff_Home');
      setWorkflowStep('LIST');
      
      // If permissions not yet granted, route to Permissions first
      if (!gpsPermission || !cameraPermission) {
        setCurrentScreen('S03_Permission');
      } else {
        setCurrentScreen('App_Main');
      }
    } else {
      // Manager role defaults
      setCurrentTab('M01_Manager_Home');
      setManagerStep('LIST');
      setCurrentScreen('App_Main');
    }
  };

  // Switch role helper for testing panel (no login required)
  const handleSimulatedRoleSwitch = (targetRole: Role) => {
    setActiveRole(targetRole);
    setUserEmail(targetRole === 'Manager' ? 'manager@novyx.vn' : 'hung.nguyen@novyx.vn');
    setCurrentScreen('App_Main');
    
    if (targetRole === 'Staff') {
      setCurrentTab('S04_Staff_Home');
      setWorkflowStep('LIST');
      setGpsPermission(true);
      setCameraPermission(true);
    } else {
      setCurrentTab('M01_Manager_Home');
      setManagerStep('LIST');
    }
  };

  const handleLogout = () => {
    setActiveRole(null);
    setUserEmail('');
    setCurrentScreen('S02_Login');
    setCurrentTab('');
    setActiveTask(null);
    setReviewTask(null);
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'QUICK_QR') {
      const staffId = 'STF-01';
      const staffTasks = data.tasks.filter(t => t.assignedStaffId === staffId);
      const incompleteTask = staffTasks.find(t => t.status !== TaskStatus.COMPLETED) || staffTasks[0];
      
      if (incompleteTask) {
        // Automatically start or select this task and go straight to QR_SCAN step for the demo!
        const updatedTasks = data.tasks.map(t => {
          if (t.id === incompleteTask.id && (t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.REWORK_REQUIRED)) {
            return { ...t, status: TaskStatus.IN_PROGRESS, updatedAt: new Date().toISOString() };
          }
          return t;
        });
        setData(prev => ({ ...prev, tasks: updatedTasks }));
        
        setActiveTask({ ...incompleteTask, status: TaskStatus.IN_PROGRESS });
        setWorkflowStep('QR_SCAN');
        setCurrentTab('S04_Staff_Home');
      } else {
        alert('Không tìm thấy nhiệm vụ nào khả dụng của nhân viên để khởi động quét mã QR cây xanh.');
      }
    } else {
      setCurrentTab(tabId);
    }
  };

  // Warp GPS coordinates to predefined test cases
  const handleWarpCoordinates = (lat: number, lng: number) => {
    setUserLat(lat);
    setUserLng(lng);
  };

  // Reset all application data
  const handleResetApplicationData = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả dữ liệu tác nghiệp hiện trường về mặc định?')) {
      localStorage.removeItem('NOVYX_INITIALIZED');
      localStorage.removeItem('NOVYX_TREES');
      localStorage.removeItem('NOVYX_STAFF');
      localStorage.removeItem('NOVYX_TASKS');
      localStorage.removeItem('NOVYX_NOTIFICATIONS');
      
      const FreshData = getStoredData();
      setData(FreshData);
      
      // Reset variables
      setGpsPermission(false);
      setCameraPermission(false);
      handleLogout();
    }
  };

  // Listeners to update nested data
  const handleUpdateTasks = (updatedTasks: Task[]) => {
    setData(prev => ({ ...prev, tasks: updatedTasks }));
  };

  const handleUpdateNotifications = (updatedNotifications: AppNotification[]) => {
    setData(prev => ({ ...prev, notifications: updatedNotifications }));
  };

  // Decide if navigation tab bar should be hidden
  const shouldHideNavigationBar = () => {
    if (currentScreen === 'S02_Login' || currentScreen === 'Forgot_Password' || currentScreen === 'S03_Permission') {
      return true;
    }
    if (activeRole === 'Staff' && workflowStep !== 'LIST' && workflowStep !== 'NOTIFICATIONS' && workflowStep !== 'ACCOUNT') {
      return true; // Hide during active tree task verification steps (GPS, Camera, Checklist)
    }
    if (activeRole === 'Manager' && (managerStep === 'REVIEW_DETAIL' || managerStep === 'REJECT_REASON' || managerStep === 'CREATE_STEP_2' || managerStep === 'CREATE_STEP_3' || managerStep === 'CREATE_STEP_4')) {
      return true; // Hide during creating/reviewing workflow sub-screens
    }
    return false;
  };

  // Currently focused tree in Staff workflow
  const currentTargetTree = activeTask ? data.trees.find(t => t.id === activeTask.treeId) : null;

  // Real-time stats calculated dynamically
  const totalTrees = data.trees.length;
  const activeTasksCount = data.tasks.filter(t => t.status !== TaskStatus.COMPLETED).length;
  const waitingReviewCount = data.tasks.filter(t => t.status === TaskStatus.WAITING_REVIEW).length;
  const completedTasksCount = data.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-slate-100 font-sans p-4 md:p-8 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Top Professional Navigation Brand Header */}
      <header className="w-full max-w-7xl mx-auto mb-6 md:mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 rounded-2xl shadow-lg shadow-emerald-500/20">
            <Trees className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wider">NOVYX <span className="text-emerald-400 font-medium text-sm">GreenOps</span></h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                Hệ thống thực địa Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Nền tảng Giám sát & Quản trị Cây xanh Đô thị số hóa GPS + QR Code
            </p>
          </div>
        </div>
        
        {/* Real-time server status indicators */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] font-bold text-slate-300 font-mono uppercase tracking-wider">Local Sandbox: Sẵn sàng</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Tài khoản hiện tại</p>
            <p className="font-bold text-emerald-400 flex items-center gap-1 justify-end">
              {activeRole === 'Manager' ? <Shield className="w-3.5 h-3.5 text-sky-400" /> : <User className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{userEmail || 'Chưa đăng nhập'}</span>
            </p>
          </div>
        </div>
      </header>
      
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
        
        {/* 1. LEFT COLUMN: COMMAND DECK PANEL */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* INTRODUCTORY & EXPLAINER BOARD */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[28px] border border-white/5 space-y-3 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Giao Diện Demo Chuyên Nghiệp (Ready-to-Deploy)</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trang web này đóng vai trò là một **Command Center** hoàn chỉnh. Module mô phỏng bên phải chạy đầy đủ quy trình xác minh chặt chẽ ngoài hiện trường của nhân viên. Bất kỳ lệnh giao việc hay phê duyệt nào bạn thực hiện đều được lưu trữ trực tiếp và cập nhật lập tức lên bảng thống kê bên dưới.
            </p>
          </div>

          {/* DYNAMIC METRIC BOARD (LIVE SAAS METRICS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all group">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Cây xanh bồn</span>
                <Trees className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-white font-mono">{totalTrees}</span>
                <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">● Đã định vị GPS</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all group">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Việc Đang Chạy</span>
                <Activity className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-white font-mono">{activeTasksCount}</span>
                <span className="text-[9px] text-amber-400 font-bold block mt-0.5">🚀 Đang thực địa</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all group">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Chờ Duyệt (QL)</span>
                <Eye className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-white font-mono">{waitingReviewCount}</span>
                <span className="text-[9px] text-sky-400 font-bold block mt-0.5">🔎 Cần đối soát ảnh</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all group">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Đã hoàn thành</span>
                <ClipboardCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-white font-mono">{completedTasksCount}</span>
                <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">🏆 100% minh chứng</span>
              </div>
            </div>
          </div>

          {/* SIMULATE GPS / COORDINATES CONTROLLER */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[28px] border border-white/5 space-y-4 shadow-2xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
              <span>Giả lập tín hiệu GPS thiết bị</span>
            </h3>

            {/* Current coordinate reading */}
            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Vĩ độ thiết bị (Lat)</span>
                <p className="font-mono font-bold text-emerald-400 text-sm mt-0.5">{userLat.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Kinh độ thiết bị (Lng)</span>
                <p className="font-mono font-bold text-emerald-400 text-sm mt-0.5">{userLng.toFixed(6)}</p>
              </div>
            </div>

            {/* Presets buttons to warp user */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Chọn Vị Trí Giả Lập Của Nhân Viên:
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Preset 1: Near Target Tree #01 */}
                <button
                  type="button"
                  onClick={() => handleWarpCoordinates(10.77421, 106.69101)}
                  className={`p-3 text-left rounded-xl text-xs font-semibold border transition-all flex flex-col justify-between ${
                    Math.abs(userLat - 10.77421) < 0.0001
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[9px] text-emerald-400 font-extrabold uppercase">ĐÚNG ĐIỂM (DƯỚI 10m)</span>
                  <span className="mt-1 leading-tight">Đứng sát gốc Cây Xà Cừ #01 (Cách 2m)</span>
                </button>

                {/* Preset 2: Far from trees */}
                <button
                  type="button"
                  onClick={() => handleWarpCoordinates(10.7715, 106.6980)}
                  className={`p-3 text-left rounded-xl text-xs font-semibold border transition-all flex flex-col justify-between ${
                    Math.abs(userLat - 10.7715) < 0.0001
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/10'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[9px] text-rose-400 font-extrabold uppercase font-mono">SAI LỆCH (TRÊN 150m)</span>
                  <span className="mt-1 leading-tight">Đứng ngoài bến xe bus Phạm Ngũ Lão</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
              💡 <strong>Hỗ trợ kiểm thử:</strong> Khi mô phỏng nhân viên đến bồn cây, hệ thống sẽ đo khoảng cách thực tế giữa GPS thiết bị và GPS bồn cây gốc. Chọn <strong>"ĐÚNG ĐIỂM"</strong> để vượt qua kiểm tra định vị an toàn!
            </p>
          </div>

          {/* DUAL-ROLE FAST SWITCHER */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[28px] border border-white/5 space-y-4 shadow-2xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-emerald-400" />
              <span>Chuyển đổi phân vai nhanh chóng</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Switch to Staff */}
              <button
                type="button"
                onClick={() => handleSimulatedRoleSwitch('Staff')}
                className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex items-center gap-3 ${
                  activeRole === 'Staff' && currentScreen === 'App_Main'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-600/10'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className={`p-2 rounded-xl ${activeRole === 'Staff' ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-slate-400'}`}>
                  <User className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">NHÂN VIÊN</h4>
                  <p className={`text-[9px] ${activeRole === 'Staff' ? 'text-emerald-100' : 'text-slate-400'} font-medium`}>
                    N.V. Hùng (STF-01)
                  </p>
                </div>
              </button>

              {/* Switch to Manager */}
              <button
                type="button"
                onClick={() => handleSimulatedRoleSwitch('Manager')}
                className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex items-center gap-3 ${
                  activeRole === 'Manager' && currentScreen === 'App_Main'
                    ? 'bg-sky-600 border-sky-400 text-white shadow-xl shadow-sky-600/10'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className={`p-2 rounded-xl ${activeRole === 'Manager' ? 'bg-sky-500 text-slate-950' : 'bg-white/5 text-slate-400'}`}>
                  <Shield className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">QUẢN LÝ</h4>
                  <p className={`text-[9px] ${activeRole === 'Manager' ? 'text-sky-100' : 'text-slate-400'} font-medium`}>
                    Kỹ Sư Trưởng HQ
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* INTERACTIVE WORKFLOW PLAYBOOK */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[28px] border border-white/5 space-y-3.5 shadow-2xl text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Quy trình trình diễn mượt mà (Playbook):</span>
            </h4>
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-white/3 p-2.5 rounded-xl border border-white/5">
                <span className="w-5 h-5 bg-white/10 text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-bold text-white text-[11px]">BƯỚC 1: Quản lý ra lệnh Giao việc mới</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Chọn role **Quản lý**, vào tab **Giao việc**, sử dụng nút **"Điền nhanh"** bồn Xà Cừ để khởi tạo checklist 3 bước, chọn **Hùng** và bấm **Xác nhận**.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-white/3 p-2.5 rounded-xl border border-white/5">
                <span className="w-5 h-5 bg-white/10 text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-bold text-white text-[11px]">BƯỚC 2: Nhân viên tiếp nhận thực tế</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Đổi role sang **Nhân viên**, bạn thấy ngay việc vừa giao. Bấm vào, nhấp **Bắt đầu**, rồi chọn nút **"Đúng điểm GPS"** bên trái và quét mã QR.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 bg-white/3 p-2.5 rounded-xl border border-white/5">
                <span className="w-5 h-5 bg-white/10 text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-bold text-white text-[11px]">BƯỚC 3: Đối soát & Duyệt chất lượng</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Quay lại role **Quản lý** để vào tab **Duyệt**, mở báo cáo nghiệm thu xem hình ảnh thực địa và chấm điểm chất lượng cây.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RECOVERY & FOOTER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-500">
            <span>Hệ thống NOVYX GreenOps © 2026</span>
            <button
              type="button"
              onClick={handleResetApplicationData}
              className="flex items-center gap-1.5 py-2 px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all border border-white/5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Khôi Phục Sandbox Gốc</span>
            </button>
          </div>

        </div>

        {/* 2. RIGHT COLUMN: THE SMARTPHONE PHONE DEVICE DECORATOR */}
        <div className="lg:col-span-5 flex justify-center">
          <DeviceSimulator
            role={activeRole}
            currentTab={currentTab}
            onTabChange={handleTabChange}
            hideNav={shouldHideNavigationBar()}
          >
            {/* RENDER ACTIVE SCREEN BASED ON APP STATE */}
            {currentScreen === 'S02_Login' || currentScreen === 'Forgot_Password' || currentScreen === 'S03_Permission' ? (
              <AuthScreens
                currentScreen={currentScreen}
                onNavigate={(screen) => {
                  if (screen === 'S04_Staff_Home') {
                    // Force login defaults for bypass
                    handleLoginSuccess('Staff', 'hung.nguyen@novyx.vn');
                  } else {
                    setCurrentScreen(screen);
                  }
                }}
                onLoginSuccess={handleLoginSuccess}
                gpsPermission={gpsPermission}
                cameraPermission={cameraPermission}
                setGpsPermission={setGpsPermission}
                setCameraPermission={setCameraPermission}
              />
            ) : activeRole === 'Staff' ? (
              <StaffScreens
                tasks={data.tasks}
                trees={data.trees}
                notifications={data.notifications}
                userEmail={userEmail}
                userLat={userLat}
                userLng={userLng}
                onUpdateTasks={handleUpdateTasks}
                onUpdateNotifications={handleUpdateNotifications}
                onLogout={handleLogout}
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                activeTask={activeTask}
                setActiveTask={setActiveTask}
                workflowStep={workflowStep}
                setWorkflowStep={setWorkflowStep}
              />
            ) : (
              <ManagerScreens
                tasks={data.tasks}
                trees={data.trees}
                staff={data.staff}
                notifications={data.notifications}
                userEmail={userEmail}
                onUpdateTasks={handleUpdateTasks}
                onUpdateNotifications={handleUpdateNotifications}
                onLogout={handleLogout}
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                reviewTask={reviewTask}
                setReviewTask={setReviewTask}
                managerStep={managerStep}
                setManagerStep={setManagerStep}
              />
            )}
          </DeviceSimulator>
        </div>

      </main>

    </div>
  );
}

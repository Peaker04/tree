import React, { useState, useEffect } from 'react';
import { Task, Tree, AppNotification, TaskStatus } from '../types';
import { MapSimulator, getDistanceMeters } from './MapSimulator';
import { CameraSimulator } from './CameraSimulator';
import {
  Calendar, MapPin, CheckSquare, Clock, ArrowLeft, Play, ScanLine, 
  Sparkles, ClipboardList, CheckCircle2, ChevronRight, AlertTriangle, 
  Map, Bell, User, LogOut, Check, ChevronLeft, Phone, Mail, Award, X, Info, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffScreensProps {
  tasks: Task[];
  trees: Tree[];
  notifications: AppNotification[];
  userEmail: string;
  userLat: number;
  userLng: number;
  onUpdateTasks: (updatedTasks: Task[]) => void;
  onUpdateNotifications: (updatedNotifications: AppNotification[]) => void;
  onLogout: () => void;
  currentTab: string; // 'S04_Staff_Home' | 'S08_QR_Scanner' | 'Notifications_Screen' | 'Account_Screen'
  setCurrentTab: (tab: string) => void;
  activeTask: Task | null;
  setActiveTask: (task: Task | null) => void;
  workflowStep: string; // 'LIST' | 'DETAIL' | 'MAP' | 'GPS_CHECK' | 'QR_SCAN' | 'BEFORE_PHOTO' | 'CHECKLIST' | 'AFTER_PHOTO' | 'REVIEW' | 'SUCCESS' | 'REPORT_QR_ERROR'
  setWorkflowStep: (step: string) => void;
}

export const StaffScreens: React.FC<StaffScreensProps> = ({
  tasks,
  trees,
  notifications,
  userEmail,
  userLat,
  userLng,
  onUpdateTasks,
  onUpdateNotifications,
  onLogout,
  currentTab,
  setCurrentTab,
  activeTask,
  setActiveTask,
  workflowStep,
  setWorkflowStep
}) => {
  // Local state for filling the report details during workflow
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [notes, setNotes] = useState('');
  const [tempBeforePhoto, setTempBeforePhoto] = useState<string | null>(null);
  const [tempAfterPhoto, setTempAfterPhoto] = useState<string | null>(null);
  const [qrReportText, setQrReportText] = useState('');
  const [qrReportSuccess, setQrReportSuccess] = useState(false);

  // Synchronize internal states when activeTask changes
  useEffect(() => {
    if (activeTask) {
      setChecklistItems(activeTask.checklist.map(item => ({ ...item })));
      setNotes(activeTask.notes || '');
      setTempBeforePhoto(activeTask.beforePhoto || null);
      setTempAfterPhoto(activeTask.afterPhoto || null);
    } else {
      setChecklistItems([]);
      setNotes('');
      setTempBeforePhoto(null);
      setTempAfterPhoto(null);
    }
  }, [activeTask]);

  // Active staff ID based on simulation setup
  const staffId = 'STF-01'; // Default simulated active staff
  const staffName = 'Nguyễn Văn Hùng';

  // Filter tasks belonging only to STF-01
  const staffTasks = tasks.filter(t => t.assignedStaffId === staffId);
  const todayTasks = staffTasks.filter(t => t.status !== TaskStatus.COMPLETED);
  const completedTasksCount = staffTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const totalTasksCount = staffTasks.length;
  const progressPct = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  // Retrieve current active tree
  const activeTree = activeTask ? trees.find(t => t.id === activeTask.treeId) : null;
  const distanceToActiveTree = activeTree ? getDistanceMeters(userLat, userLng, activeTree.lat, activeTree.lng) : 999;

  // Start a task
  const handleStartTask = (task: Task) => {
    const updated = tasks.map(t => {
      if (t.id === task.id) {
        return { ...t, status: TaskStatus.IN_PROGRESS, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    onUpdateTasks(updated);
    
    // Set up workflow states
    setActiveTask({ ...task, status: TaskStatus.IN_PROGRESS });
    setChecklistItems(task.checklist.map(item => ({ ...item })));
    setNotes('');
    setTempBeforePhoto(null);
    setTempAfterPhoto(null);
    setWorkflowStep('MAP'); // Direct to S06_Map_Location as specified by "target_success": "S06_Map_Location"
  };

  // Toggle single checklist checkbox
  const handleToggleChecklist = (id: string) => {
    setChecklistItems(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  // GPS Check
  const handleGpsCheckIn = () => {
    if (!activeTask || !activeTree) return;
    
    const isVerified = distanceToActiveTree < 10;
    const updated = tasks.map(t => {
      if (t.id === activeTask.id) {
        return {
          ...t,
          gpsCheck: {
            verified: isVerified,
            distance: distanceToActiveTree,
            timestamp: new Date().toISOString(),
            lat: userLat,
            lng: userLng
          }
        };
      }
      return t;
    });
    onUpdateTasks(updated);
    setActiveTask({
      ...activeTask,
      gpsCheck: {
        verified: isVerified,
        distance: distanceToActiveTree,
        timestamp: new Date().toISOString(),
        lat: userLat,
        lng: userLng
      }
    });
    setWorkflowStep('GPS_CHECK');
  };

  // QR Scanned callback
  const handleQrScanned = (code: string, isCorrect: boolean) => {
    if (!activeTask) return;
    if (isCorrect) {
      const updated = tasks.map(t => {
        if (t.id === activeTask.id) {
          return {
            ...t,
            qrCheck: {
              verified: true,
              scannedCode: code,
              timestamp: new Date().toISOString()
            }
          };
        }
        return t;
      });
      onUpdateTasks(updated);
      setActiveTask({
        ...activeTask,
        qrCheck: {
          verified: true,
          scannedCode: code,
          timestamp: new Date().toISOString()
        }
      });
      // Move to S10_Before_Photo as target_success
      setTimeout(() => {
        setWorkflowStep('BEFORE_PHOTO');
      }, 1500);
    }
  };

  // Submit report to review
  const handleSubmitReport = () => {
    if (!activeTask) return;

    const updated = tasks.map(t => {
      if (t.id === activeTask.id) {
        return {
          ...t,
          status: TaskStatus.WAITING_REVIEW,
          beforePhoto: tempBeforePhoto || t.beforePhoto,
          afterPhoto: tempAfterPhoto || t.afterPhoto,
          checklist: checklistItems,
          notes: notes,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    onUpdateTasks(updated);

    // Create a notification for the manager (system auto notification)
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Báo cáo nghiệm thu mới',
      body: `Nhân viên ${staffName} đã gửi báo cáo công việc "${activeTask.title}" chờ bạn duyệt.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'success',
      taskId: activeTask.id
    };
    onUpdateNotifications([newNotif, ...notifications]);

    setWorkflowStep('SUCCESS');
  };

  // Report bad QR code action
  const handleReportQrError = () => {
    if (!activeTask) return;
    setQrReportSuccess(true);
    // Log an issue, and simulate completing with notes
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Yêu cầu kiểm tra mã QR hỏng',
      body: `Nhân viên ${staffName} báo cáo mã QR tại cây ${activeTask.treeId} bị hỏng hoặc mất cắp.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'danger',
      taskId: activeTask.id
    };
    onUpdateNotifications([newNotif, ...notifications]);
    
    setTimeout(() => {
      setQrReportSuccess(false);
      setQrReportText('');
      setWorkflowStep('BEFORE_PHOTO'); // Standard bypass to photo checklist after reporting
    }, 2000);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    // Read notification
    onUpdateNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.taskId) {
      const task = tasks.find(t => t.id === notif.taskId);
      if (task) {
        setActiveTask(task);
        setChecklistItems(task.checklist);
        setNotes(task.notes || '');
        setTempBeforePhoto(task.beforePhoto || null);
        setTempAfterPhoto(task.afterPhoto || null);
        setWorkflowStep('DETAIL');
      }
    }
  };

  // RENDER TAB: 1. WORKSHOPS (HOME TODAY)
  const renderHomeTab = () => {
    if (workflowStep === 'DETAIL' && activeTask) {
      /* S05_Task_Detail */
      return (
        <div className="flex-1 flex flex-col bg-slate-50">
          {/* Header */}
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10">
            <button
              onClick={() => { setWorkflowStep('LIST'); setActiveTask(null); }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800 text-sm">Chi tiết công việc</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Task summary card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  activeTask.status === TaskStatus.REWORK_REQUIRED
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {activeTask.status === TaskStatus.REWORK_REQUIRED ? 'CẦN LÀM LẠI' : 'CHƯA BẮT ĐẦU'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ID: {activeTask.id}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {activeTask.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {activeTask.description}
                </p>
              </div>

              {activeTask.rejectReason && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-rose-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Lý do từ chối kiểm duyệt trước:</span>
                  </p>
                  <p className="text-rose-800 font-medium italic">{activeTask.rejectReason}</p>
                  {activeTask.rejectChips && activeTask.rejectChips.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {activeTask.rejectChips.map((c, idx) => (
                        <span key={idx} className="bg-rose-200/60 text-rose-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tree Info Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hồ sơ cây mục tiêu</h4>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-600 font-bold text-xs border border-emerald-100">
                  {activeTask.treeId.split('-')[1]}
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-800">{activeTask.treeName}</h5>
                  <p className="text-xs text-slate-400 font-mono italic">{activeTree?.species}</p>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-3 space-y-2 text-xs">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{activeTask.treeAddress}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Hạn chót: <strong className="text-slate-800">{activeTask.deadline}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Yêu cầu xác minh: <strong className="text-emerald-700">GPS (&lt; 10m) + Quét mã QR</strong></span>
                </div>
              </div>
            </div>

            {/* Care guidelines */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Các bước thực hiện
              </h4>
              <ul className="space-y-2">
                {activeTask.checklist.map((item, idx) => (
                  <li key={item.id} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="w-4.5 h-4.5 bg-slate-100 rounded-full text-slate-500 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-tight pt-0.5">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* S05 Action Button */}
          <div className="p-4 bg-white border-t border-slate-100">
            <button
              onClick={() => handleStartTask(activeTask)}
              className="w-full py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/5 active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Bắt đầu công việc</span>
            </button>
          </div>
        </div>
      );
    }

    if (workflowStep === 'MAP' && activeTask) {
      /* S06_Map_Location */
      return (
        <div className="flex-1 flex flex-col bg-slate-50">
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWorkflowStep('DETAIL')}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-800 text-sm">Bản đồ di chuyển</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              S06
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="p-1 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <MapSimulator
                allTrees={trees}
                targetTree={activeTree || undefined}
                userLat={userLat}
                userLng={userLng}
                interactive={true}
              />
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hướng dẫn di chuyển
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Di chuyển dọc theo các lối đi công viên về phía điểm đánh dấu màu <strong className="text-emerald-700">Xanh Lá ({activeTask.treeId})</strong>. Khoảng cách định vị GPS cần dưới 10 mét để có thể bắt đầu tác nghiệp.
              </p>
            </div>
          </div>

          {/* Navigation trigger to S07 */}
          <div className="p-4 bg-white border-t border-slate-100">
            <button
              onClick={handleGpsCheckIn}
              className="w-full py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>Kiểm tra GPS</span>
            </button>
          </div>
        </div>
      );
    }

    if (workflowStep === 'GPS_CHECK' && activeTask) {
      /* S07_GPS_Checkin */
      const verified = activeTask.gpsCheck?.verified ?? false;
      const currentDist = activeTask.gpsCheck?.distance ?? 999;

      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10">
            <button onClick={() => setWorkflowStep('MAP')} className="p-1 hover:bg-slate-100 rounded text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800 text-sm">Xác minh GPS</span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center items-center text-center space-y-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg transition-transform ${
              verified
                ? 'bg-emerald-50 border-emerald-500 text-emerald-600 scale-105'
                : 'bg-rose-50 border-rose-500 text-rose-500 animate-pulse'
            }`}>
              {verified ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className={`text-lg font-bold ${verified ? 'text-emerald-800' : 'text-rose-600'}`}>
                {verified ? 'Xác minh GPS Hợp lệ' : 'Sai lệch vị trí GPS!'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                {verified
                  ? `Hệ thống xác định bạn đang cách gốc cây ${currentDist.toFixed(1)}m. Khoảng cách hợp lệ an toàn (dưới 10m).`
                  : `Vị trí định vị của điện thoại đang cách gốc cây ${currentDist.toFixed(1)}m. Khoảng cách yêu cầu tối đa là 10m.`}
              </p>
            </div>

            {/* Mini details card */}
            <div className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-400 font-medium">Cây tác nghiệp:</span>
                <span className="font-semibold text-slate-800">{activeTask.treeName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-400 font-medium">Khoảng cách quét:</span>
                <span className={`font-bold font-mono ${verified ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {currentDist.toFixed(1)} m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Thời gian:</span>
                <span className="text-slate-500 font-mono">
                  {new Date(activeTask.gpsCheck?.timestamp || '').toLocaleTimeString('vi-VN')}
                </span>
              </div>
            </div>

            {!verified && (
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-800 text-left leading-relaxed flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span><strong>Mẹo:</strong> Bạn có thể nhấn vào <strong>Bản đồ</strong> trong bảng điều khiển bên trái để dịch chuyển vị trí của bạn lại sát cây để kiểm thử luồng xanh lá (hợp lệ)!</span>
              </div>
            )}
          </div>

          {/* Action buttons matching exact design: "Thử lại" (warning if error), "Mở bản đồ" (secondary), "Tiếp tục quét QR" (primary if valid) */}
          <div className="p-4 bg-white border-t border-slate-100 space-y-2.5">
            {verified ? (
              <button
                onClick={() => setWorkflowStep('QR_SCAN')}
                className="w-full py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
              >
                <span>Tiếp tục quét mã QR</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2.5">
                <button
                  onClick={() => setWorkflowStep('MAP')}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all text-center"
                >
                  Mở bản đồ
                </button>
                <button
                  onClick={handleGpsCheckIn}
                  className="flex-1 py-3 px-4 bg-[#FF9800] hover:bg-[#F57C00] text-white rounded-xl text-sm font-bold transition-all text-center flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại</span>
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (workflowStep === 'QR_SCAN' && activeTask) {
      /* S08_QR_Scanner */
      return (
        <div className="flex-1 flex flex-col bg-slate-900 text-white justify-between">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800/60 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button onClick={() => setWorkflowStep('GPS_CHECK')} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="font-bold text-slate-200 text-sm">Quét mã QR cây</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
              S08
            </span>
          </div>

          {/* Camera Scan Simulation View */}
          <div className="p-4 flex-1 flex flex-col justify-center">
            <CameraSimulator
              mode="QR_SCANNER"
              targetTree={activeTree || undefined}
              onQrScanned={handleQrScanned}
              onReportQrError={() => setWorkflowStep('REPORT_QR_ERROR')}
            />
          </div>
        </div>
      );
    }

    if (workflowStep === 'REPORT_QR_ERROR' && activeTask) {
      /* Report Issue Screen for QR Error */
      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button onClick={() => setWorkflowStep('QR_SCAN')} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-800 text-sm">Báo cáo sự cố QR</span>
            </div>
          </div>

          <div className="p-4 flex-1 space-y-4 overflow-y-auto">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2">
              <div className="w-9 h-9 bg-rose-50 rounded-lg text-rose-500 flex items-center justify-center border border-rose-100 mb-1">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Mã QR bị hỏng, mờ hoặc mất cắp?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhập mô tả sự cố để báo cáo cho ban quản lý. Hệ thống sẽ ghi nhận và cho phép bạn tiếp tục thực hiện công việc thủ công bằng chụp ảnh đối chiếu vị trí.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Chi tiết tình trạng mã QR</label>
              <textarea
                value={qrReportText}
                onChange={(e) => setQrReportText(e.target.value)}
                placeholder="Ví dụ: Bảng mã QR kim loại gắn trên thân cây bị trầy xước nặng không thể quét được bằng camera..."
                className="w-full h-28 p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 text-slate-800 resize-none shadow-xs"
              />
            </div>

            {qrReportSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-1.5 scale-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Gửi báo cáo sự cố thành công! Đang chuyển sang chụp ảnh...</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <button
              onClick={handleReportQrError}
              disabled={!qrReportText || qrReportSuccess}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-98 text-center"
            >
              Gửi yêu cầu &amp; Bỏ qua bước quét QR
            </button>
          </div>
        </div>
      );
    }

    if (workflowStep === 'BEFORE_PHOTO' && activeTask) {
      /* S10_Before_Photo */
      return (
        <div className="flex-1 flex flex-col bg-slate-900 justify-between">
          <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800/60 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button onClick={() => setWorkflowStep('QR_SCAN')} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="font-bold text-slate-200 text-sm">Chụp ảnh TRƯỚC (Before)</span>
            </div>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded">
              BEFORE
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-center">
            <CameraSimulator
              mode="PHOTO_BEFORE"
              taskType={activeTask.taskType}
              onPhotoCaptured={(url) => setTempBeforePhoto(url)}
            />
          </div>

          {/* Action on Captured Photo */}
          <div className="p-4 bg-slate-950 border-t border-slate-800/40 text-center">
            {tempBeforePhoto ? (
              <button
                onClick={() => setWorkflowStep('CHECKLIST')}
                className="w-full py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-sm font-bold shadow-md active:scale-98 transition-all"
              >
                <span>Lưu ảnh &amp; Đi tiếp Checklist</span>
              </button>
            ) : (
              <p className="text-[11px] text-slate-500">Nhấn nút Tròn Trắng ở trên để chụp ảnh trước khi tác nghiệp</p>
            )}
          </div>
        </div>
      );
    }

    if (workflowStep === 'CHECKLIST' && activeTask) {
      /* S11_Care_Checklist */
      const allDone = checklistItems.every(i => i.done);

      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button onClick={() => setWorkflowStep('BEFORE_PHOTO')} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-800 text-sm">Checklist công việc</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
              S11
            </span>
          </div>

          <div className="p-4 flex-1 space-y-4 overflow-y-auto">
            {/* Checklist description summary */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono">NHIỆM VỤ ĐANG THỰC HIỆN</span>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">{activeTask.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tích chọn các hạng mục dưới đây sau khi đã hoàn thành đầy đủ ngoài hiện trường bồn cây.
              </p>
            </div>

            {/* Checkbox checklist */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden divide-y divide-slate-50">
              {checklistItems.map((item, idx) => (
                <label
                  key={item.id}
                  className={`p-4 flex items-start gap-3.5 cursor-pointer active:bg-slate-50/50 transition-colors ${
                    item.done ? 'bg-emerald-50/20' : 'bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleChecklist(item.id)}
                    className="w-5 h-5 rounded-md text-[#4CAF50] border-slate-300 focus:ring-0 cursor-pointer mt-0.5 accent-[#4CAF50]"
                  />
                  <div className="flex-1 select-none">
                    <p className={`text-xs font-semibold leading-relaxed ${item.done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                      {item.text}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Notes Textarea */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600">Ghi chú bất thường (Nếu có)</label>
                <span className="text-[10px] text-slate-400 font-mono">Tùy chọn</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Phát hiện bồn cây hơi lún nhẹ, vỏ thân phía dưới có một vài vết nứt nhỏ..."
                className="w-full h-24 p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/10 focus:border-[#4CAF50] text-slate-800 resize-none shadow-xs"
              />
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <button
              onClick={() => setWorkflowStep('AFTER_PHOTO')}
              className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98 ${
                allDone
                  ? 'bg-[#4CAF50] hover:bg-[#43A047] text-white shadow-md'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Tiếp tục chụp ảnh SAU (After)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            {!allDone && (
              <p className="text-[10px] text-rose-500 text-center mt-2.5 font-medium">
                * Vui lòng hoàn thành &amp; tích chọn tất cả hạng mục công việc để đi tiếp.
              </p>
            )}
          </div>
        </div>
      );
    }

    if (workflowStep === 'AFTER_PHOTO' && activeTask) {
      /* S12_After_Photo */
      return (
        <div className="flex-1 flex flex-col bg-slate-900 justify-between">
          <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800/60 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button onClick={() => setWorkflowStep('CHECKLIST')} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="font-bold text-slate-200 text-sm">Chụp ảnh SAU (After)</span>
            </div>
            <span className="text-[10px] bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded">
              AFTER
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-center">
            <CameraSimulator
              mode="PHOTO_AFTER"
              taskType={activeTask.taskType}
              onPhotoCaptured={(url) => setTempAfterPhoto(url)}
            />
          </div>

          {/* Action on Captured Photo */}
          <div className="p-4 bg-slate-950 border-t border-slate-800/40 text-center">
            {tempAfterPhoto ? (
              <button
                onClick={() => setWorkflowStep('REVIEW')}
                className="w-full py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-sm font-bold shadow-md active:scale-98 transition-all"
              >
                <span>Xem lại &amp; Báo cáo</span>
              </button>
            ) : (
              <p className="text-[11px] text-slate-500">Nhấn nút Tròn Trắng ở trên để chụp ảnh sau khi hoàn thành</p>
            )}
          </div>
        </div>
      );
    }

    if (workflowStep === 'REVIEW' && activeTask) {
      /* S13_Review_Submission */
      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10">
            <button onClick={() => setWorkflowStep('CHECKLIST')} className="p-1 hover:bg-slate-100 rounded text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800 text-sm">Xem lại báo cáo</span>
          </div>

          <div className="p-4 flex-1 space-y-4 overflow-y-auto">
            {/* GPS Valid Card */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-emerald-900">GPS &amp; Thời gian hợp lệ</h4>
                <p className="text-emerald-800 mt-0.5 leading-snug">
                  Định vị chuẩn bồn cây: <span className="font-mono">{activeTask.gpsCheck?.distance.toFixed(1)}m</span> ({new Date(activeTask.gpsCheck?.timestamp || '').toLocaleTimeString('vi-VN')})
                </p>
              </div>
            </div>

            {/* Photo comparison row */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ảnh minh chứng hiện trường</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-center font-bold text-amber-600 uppercase tracking-wider">TRƯỚC (Before)</p>
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img src={tempBeforePhoto || activeTask.beforePhoto} alt="Before" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-center font-bold text-emerald-600 uppercase tracking-wider">SAU (After)</p>
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img src={tempAfterPhoto || activeTask.afterPhoto} alt="After" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Completed Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hạng mục đã hoàn thành</h4>
              <ul className="space-y-2">
                {checklistItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-xs text-slate-600">
                    <div className="w-4 h-4 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="leading-tight">{item.text}</span>
                  </li>
                ))}
              </ul>

              {notes && (
                <div className="border-t border-slate-50 pt-2.5 mt-2.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ghi chú báo cáo:</span>
                  <p className="text-xs text-slate-700 font-medium italic mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <button
              onClick={handleSubmitReport}
              className="w-full py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/5 active:scale-98 transition-all"
            >
              <span>Gửi báo cáo nghiệm thu</span>
            </button>
          </div>
        </div>
      );
    }

    if (workflowStep === 'SUCCESS' && activeTask) {
      /* S14_Submit_Success */
      return (
        <div className="flex-1 flex flex-col bg-white p-6 justify-between text-center select-none">
          <div /> {/* Spacer */}

          <div className="space-y-6 flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-50 border-4 border-emerald-500 rounded-full flex items-center justify-center text-[#4CAF50] shadow-xl shadow-emerald-100 animate-bounce">
              <CheckCircle2 className="w-14 h-14" />
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Báo cáo thành công!</h2>
              <p className="text-xs text-slate-400 leading-relaxed px-4">
                Công việc <strong className="text-slate-700">"{activeTask.title}"</strong> đã được cập nhật thành trạng thái <strong className="text-amber-600">"Chờ duyệt"</strong>.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed px-4 mt-1.5">
                Thông tin định vị GPS, mã QR và ảnh Before-After đã được đẩy lên máy chủ ban quản lý để phê duyệt.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setWorkflowStep('LIST');
                setActiveTask(null);
                setCurrentTab('S04_Staff_Home');
              }}
              className="w-full py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-950/10 active:scale-98 transition-all"
            >
              Quay lại danh sách việc hôm nay
            </button>
          </div>
        </div>
      );
    }

    // LIST S04
    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Greetings and summary header */}
        <div className="bg-white p-4 border-b border-slate-100 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-medium">Chào ngày mới,</p>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>{staffName}</span>
                <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-current animate-pulse" />
              </h2>
            </div>
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-full overflow-hidden shadow-xs">
              <img src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* S04 Card: Tóm tắt tiến độ */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
            {/* Absolute background visual rings */}
            <div className="absolute right-[-10px] top-[-20px] w-28 h-28 rounded-full border border-white/5 bg-white/5 pointer-events-none" />
            
            <div className="relative space-y-3.5">
              <div>
                <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">
                  Tiến độ công việc hôm nay
                </p>
                <div className="flex justify-between items-baseline mt-1">
                  <h4 className="text-2xl font-black font-mono">
                    {completedTasksCount} / {totalTasksCount}
                  </h4>
                  <span className="text-xs text-emerald-200 font-medium">
                    Hoàn thành {progressPct.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-emerald-950/40 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-[#4CAF50] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="text-[11px] text-emerald-100 leading-snug">
                {todayTasks.length > 0
                  ? `Bạn còn ${todayTasks.length} nhiệm vụ chờ thực hiện ngoài hiện trường công viên.`
                  : 'Tuyệt vời! Bạn đã hoàn thành tất cả công việc được phân công hôm nay.'}
              </p>
            </div>
          </div>
        </div>

        {/* Task List container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Nhiệm vụ của bạn ({todayTasks.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">HẠN CHÓT: HÔM NAY</span>
          </div>

          {todayTasks.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-200 space-y-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">Không có việc tồn đọng</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Mọi công việc bồn cây hôm nay đã hoàn tất hoặc đang chờ phê duyệt. Bạn hãy nghỉ ngơi!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    setActiveTask(task);
                    setWorkflowStep('DETAIL');
                  }}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-[#4CAF50]/30 cursor-pointer active:scale-99 transition-all space-y-3 relative group overflow-hidden"
                >
                  {/* Status badge and Tree ID */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      task.status === TaskStatus.REWORK_REQUIRED
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : task.status === TaskStatus.IN_PROGRESS
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {task.status === TaskStatus.REWORK_REQUIRED
                        ? 'CẦN LÀM LẠI'
                        : task.status === TaskStatus.IN_PROGRESS
                        ? 'ĐANG LÀM'
                        : 'CHỜ BẮT ĐẦU'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">ID: {task.id}</span>
                  </div>

                  {/* Body text */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#4CAF50] transition-colors leading-snug">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Cây: {task.treeName} ({task.treeId})</p>
                  </div>

                  {/* Footer metadata */}
                  <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="line-clamp-1 max-w-[160px]">{task.treeAddress}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#4CAF50] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // RENDER TAB: 2. NOTIFICATIONS SCREEN
  const renderNotificationsTab = () => {
    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="bg-white p-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Thông báo</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tin nhắn cập nhật nhiệm vụ và kiểm duyệt hiện trường</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-200 text-slate-400 text-xs">
              Không có thông báo mới nào
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-99 ${
                  notif.read ? 'bg-white border-slate-100' : 'bg-emerald-50/20 border-emerald-100/70 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    notif.type === 'danger'
                      ? 'bg-rose-100 text-rose-600'
                      : notif.type === 'warning'
                      ? 'bg-amber-100 text-amber-600'
                      : notif.type === 'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-sky-100 text-sky-600'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className={`text-xs font-bold truncate ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">{notif.body}</p>
                    
                    {notif.taskId && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4CAF50] mt-2 hover:underline">
                        <span>Chi tiết công việc</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // RENDER TAB: 3. ACCOUNT PROFILE SCREEN
  const renderAccountTab = () => {
    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <img src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{staffName}</h2>
            <p className="text-xs text-slate-400">Nhân viên kỹ thuật hiện trường</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Profile details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3.5 text-xs text-slate-600">
            <h3 className="font-bold text-slate-700">Thông tin liên hệ</h3>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>hung.nguyen@novyx.vn</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>0901 234 567</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-slate-400" />
              <span>Nhóm: Chăm sóc Công viên Quận 1</span>
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">HOÀN THÀNH</span>
              <p className="text-xl font-bold font-mono text-emerald-600 mt-0.5">{completedTasksCount}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">TỔNG NHIỆM VỤ</span>
              <p className="text-xl font-bold font-mono text-slate-700 mt-0.5">{totalTasksCount}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-100 shadow-inner active:scale-98 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>
    );
  };

  // Main navigation controller
  const renderActiveContent = () => {
    switch (currentTab) {
      case 'S04_Staff_Home':
        return renderHomeTab();
      case 'Notifications_Screen':
        return renderNotificationsTab();
      case 'Account_Screen':
        return renderAccountTab();
      default:
        return renderHomeTab();
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden relative bg-white">
      {renderActiveContent()}
    </div>
  );
};

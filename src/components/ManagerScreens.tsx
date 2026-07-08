import React, { useState, useEffect } from 'react';
import { Task, Tree, Staff, AppNotification, TaskStatus } from '../types';
import { 
  Calendar, MapPin, CheckSquare, Plus, CheckCircle, ChevronRight, 
  ChevronLeft, AlertTriangle, User, Eye, Check, X, Clipboard, 
  Map, Sparkles, Filter, Search, Award, CheckCircle2, Trash, Mail, Phone, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ManagerScreensProps {
  tasks: Task[];
  trees: Tree[];
  staff: Staff[];
  notifications: AppNotification[];
  userEmail: string;
  onUpdateTasks: (updatedTasks: Task[]) => void;
  onUpdateNotifications: (updatedNotifications: AppNotification[]) => void;
  onLogout: () => void;
  currentTab: string; // 'M01_Manager_Home' | 'M02_Create_Task' | 'Tree_List_Screen' | 'M07_Pending_Review' | 'Account_Screen'
  setCurrentTab: (tab: string) => void;
  reviewTask: Task | null;
  setReviewTask: (task: Task | null) => void;
  managerStep: string; // 'LIST' | 'REVIEW_DETAIL' | 'REJECT_REASON' | 'CREATE_STEP_1' | 'CREATE_STEP_2' | 'CREATE_STEP_3' | 'CREATE_STEP_4'
  setManagerStep: (step: string) => void;
}

export const ManagerScreens: React.FC<ManagerScreensProps> = ({
  tasks,
  trees,
  staff,
  notifications,
  userEmail,
  onUpdateTasks,
  onUpdateNotifications,
  onLogout,
  currentTab,
  setCurrentTab,
  reviewTask,
  setReviewTask,
  managerStep,
  setManagerStep
}) => {
  // 1. Task Creation States
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'Tưới nước' | 'Cắt tỉa cành' | 'Bón phân' | 'Phun thuốc' | 'Kiểm tra sâu bệnh' | 'Trồng mới'>('Tưới nước');
  const [newDeadline, setNewDeadline] = useState('2026-07-08');
  const [newDesc, setNewDesc] = useState('');
  const [selectedTreeId, setSelectedTreeId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [treeSearch, setTreeSearch] = useState('');
  const [customChecklist, setCustomChecklist] = useState<string[]>([]);
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [latestCreatedTask, setLatestCreatedTask] = useState<Task | null>(null);

  useEffect(() => {
    let initialItems: string[] = [];
    if (newType === 'Tưới nước') {
      initialItems = [
        'Kiểm tra độ ẩm gốc bồn cây trước khi tưới',
        'Tưới đủ lượng nước từ 50L - 100L tản đều quanh gốc',
        'Nhặt sạch rác thải nhựa và cỏ dại xung quanh bồn'
      ];
    } else if (newType === 'Cắt tỉa cành') {
      initialItems = [
        'Đặt biển cảnh báo khu vực cắt tỉa nhánh trên cao',
        'Cắt bỏ nhánh sâu bệnh/cành khô theo đúng góc nghiêng kỹ thuật',
        'Bôi keo sẹo bảo vệ nốt cắt tránh úng thối'
      ];
    } else if (newType === 'Phun thuốc') {
      initialItems = [
        'Trang bị bảo hộ lao động đầy đủ trước khi phun',
        'Phun thuốc đặc trị đều khắp mặt lá và vỏ thân cây',
        'Thu dọn vỏ chai lọ thuốc bảo vệ thực vật đúng nơi quy định'
      ];
    } else if (newType === 'Bón phân') {
      initialItems = [
        'Xới nhẹ đất quanh gốc tránh gây tổn hại rễ chính',
        'Rải đều phân bón hữu cơ theo liều lượng quy chuẩn',
        'Tưới nước ẩm gốc để phân bón hòa tan nhanh'
      ];
    } else if (newType === 'Kiểm tra sâu bệnh') {
      initialItems = [
        'Gõ thân và soi kẽ lá tìm dấu vết sâu đục thân/nấm',
        'Đo đạc đường kính tán và lập biên bản mức độ sâu hại',
        'Đề xuất loại thuốc hoặc phương án xử lý tiếp theo'
      ];
    } else {
      initialItems = [
        'Xác minh tọa độ GPS bồn đất trồng mới hợp lệ',
        'Đào hố rộng hơn bầu cây tối thiểu 20cm',
        'Nén chặt đất quanh bầu và đóng cọc chống đỡ gió bão'
      ];
    }
    setCustomChecklist(initialItems);
  }, [newType]);
  
  // 2. Reject states
  const [rejectText, setRejectText] = useState('');
  const [selectedRejectChips, setSelectedRejectChips] = useState<string[]>([]);
  const REJECT_CHIPS_PRESET = ['Ảnh chụp mờ', 'Sai gốc cây mục tiêu', 'Chưa dọn dẹp hiện trường', 'Làm thiếu checklist', 'GPS sai lệch vị trí'];

  // Calculate task counts for dashboard
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const pendingReview = tasks.filter(t => t.status === TaskStatus.WAITING_REVIEW).length;
  const activeTasks = tasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.REWORK_REQUIRED).length;

  // Tree filter
  const [searchTreeText, setSearchTreeText] = useState('');

  // Move from step 1 (M02) to step 2 (M03)
  const handleProceedToSelectTree = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setManagerStep('CREATE_STEP_2');
  };

  // Move to step 3 (M04)
  const handleProceedToAssignStaff = (tree: Tree) => {
    setSelectedTreeId(tree.id);
    setManagerStep('CREATE_STEP_3');
  };

  // Move to step 4 (M05_Task_Confirmation)
  const handleProceedToConfirm = (selectedStaff: Staff) => {
    setSelectedStaffId(selectedStaff.id);
    setManagerStep('CREATE_STEP_4');
  };

  // Confirm task creation
  const handleConfirmCreateTask = () => {
    const chosenTree = trees.find(t => t.id === selectedTreeId)!;
    const chosenStaff = staff.find(s => s.id === selectedStaffId)!;

    // Use customChecklist mapping
    const autoChecklist = customChecklist.map((item, index) => ({
      id: `ca-${Date.now()}-${index}`,
      text: item,
      done: false
    }));

    const newTask: Task = {
      id: `TSK-${100 + tasks.length + 1}`,
      title: newTitle,
      taskType: newType,
      description: newDesc || `Thực hiện nghiệp vụ ${newType} cho cây ${chosenTree.name}. Đảm bảo các bước kỹ thuật an toàn đô thị.`,
      treeId: chosenTree.id,
      treeName: chosenTree.name,
      treeAddress: chosenTree.address,
      assignedStaffId: chosenStaff.id,
      assignedStaffName: chosenStaff.name,
      deadline: newDeadline,
      status: TaskStatus.PENDING,
      checklist: autoChecklist,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onUpdateTasks([newTask, ...tasks]);

    // Send notification to worker
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Công việc mới được phân công',
      body: `Bạn được giao việc "${newTitle}" tại ${chosenTree.name}. Hạn chót: ${newDeadline}.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'info',
      taskId: newTask.id
    };
    onUpdateNotifications([newNotif, ...notifications]);

    // Set latest created task for the success screen
    setLatestCreatedTask(newTask);

    // Reset input fields but move to success step instead of list
    setNewTitle('');
    setNewDesc('');
    setManagerStep('CREATE_SUCCESS');
  };

  // Reject review item
  const handleRejectSubmission = () => {
    if (!reviewTask) return;

    const updated = tasks.map(t => {
      if (t.id === reviewTask.id) {
        return {
          ...t,
          status: TaskStatus.REWORK_REQUIRED,
          rejectReason: rejectText,
          rejectChips: selectedRejectChips,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    onUpdateTasks(updated);

    // Create a notification for the staff
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Yêu cầu làm lại công việc ⚠️',
      body: `Nhiệm vụ "${reviewTask.title}" bị từ chối duyệt. Lý do: ${rejectText || selectedRejectChips.join(', ')}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'danger',
      taskId: reviewTask.id
    };
    onUpdateNotifications([newNotif, ...notifications]);

    // Reset and return
    setRejectText('');
    setSelectedRejectChips([]);
    setReviewTask(null);
    setManagerStep('LIST');
    setCurrentTab('M07_Pending_Review');
  };

  // Approve review item
  const handleApproveSubmission = () => {
    if (!reviewTask) return;

    const updated = tasks.map(t => {
      if (t.id === reviewTask.id) {
        return {
          ...t,
          status: TaskStatus.COMPLETED,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    onUpdateTasks(updated);

    // Create approval notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Công việc đã được phê duyệt ✅',
      body: `Nhiệm vụ "${reviewTask.title}" tại cây ${reviewTask.treeId} đã được phê duyệt thành công!`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'success',
      taskId: reviewTask.id
    };
    onUpdateNotifications([newNotif, ...notifications]);

    setReviewTask(null);
    setManagerStep('LIST');
    setCurrentTab('M07_Pending_Review');
  };

  const toggleRejectChip = (chip: string) => {
    if (selectedRejectChips.includes(chip)) {
      setSelectedRejectChips(selectedRejectChips.filter(c => c !== chip));
    } else {
      setSelectedRejectChips([...selectedRejectChips, chip]);
    }
  };

  // filtered trees for search list in step 2
  const filteredTrees = trees.filter(tree =>
    tree.id.toLowerCase().includes(treeSearch.toLowerCase()) ||
    tree.name.toLowerCase().includes(treeSearch.toLowerCase()) ||
    tree.species.toLowerCase().includes(treeSearch.toLowerCase())
  );

  // Filtered tree list screen
  const registryFilteredTrees = trees.filter(tree =>
    tree.id.toLowerCase().includes(searchTreeText.toLowerCase()) ||
    tree.name.toLowerCase().includes(searchTreeText.toLowerCase()) ||
    tree.species.toLowerCase().includes(searchTreeText.toLowerCase())
  );

  // M01_Manager_Home rendering
  const renderManagerHome = () => {
    const complPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const reviewPct = totalTasks > 0 ? (pendingReview / totalTasks) * 100 : 0;

    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Header greeting */}
        <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400 font-medium">Bảng điều khiển,</p>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Kỹ sư Trưởng (Manager)</h2>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-full uppercase">
            NOVYX HQ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Dashboard stats cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-3xs">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">TỔNG VIỆC</span>
              <p className="text-xl font-bold text-slate-700 font-mono mt-0.5">{totalTasks}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-3xs">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">HOÀN THÀNH</span>
              <p className="text-xl font-bold text-emerald-600 font-mono mt-0.5">{completedTasks}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-3xs relative">
              {pendingReview > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              )}
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">CHỜ DUYỆT</span>
              <p className="text-xl font-bold text-amber-600 font-mono mt-0.5">{pendingReview}</p>
            </div>
          </div>

          {/* Chart SVG progress */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tình hình tác nghiệp ngày</h4>
              <span className="text-[10px] text-emerald-700 font-bold">Live</span>
            </div>

            {/* Custom high fidelity SVG chart representing tasks */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* SVG Ring progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="transparent" stroke="#F1F5F9" strokeWidth="5.5" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="transparent"
                    stroke="#4CAF50"
                    strokeWidth="5.5"
                    strokeDasharray="163"
                    strokeDashoffset={163 - (163 * complPct) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-bold font-mono text-slate-700">
                  {complPct.toFixed(0)}%
                </span>
              </div>

              <div className="flex-1 space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#4CAF50] inline-block" />
                    <span>Đã xong (Completed)</span>
                  </span>
                  <span className="font-bold text-slate-800">{completedTasks}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" />
                    <span>Chờ xét duyệt (Pending)</span>
                  </span>
                  <span className="font-bold text-slate-800">{pendingReview}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-slate-300 inline-block" />
                    <span>Chưa bắt đầu (Pending)</span>
                  </span>
                  <span className="font-bold text-slate-800">{activeTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Hành động nhanh
            </h4>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => { setManagerStep('CREATE_STEP_1'); setCurrentTab('M02_Create_Task'); }}
                className="p-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl text-left transition-all flex flex-col justify-between aspect-video shadow-md shadow-emerald-900/10"
              >
                <Plus className="w-5 h-5 text-emerald-100" />
                <div>
                  <h4 className="text-xs font-bold tracking-wide">TẠO VIỆC MỚI</h4>
                  <p className="text-[10px] text-emerald-100/80 mt-0.5">Phân công bồn cây mới</p>
                </div>
              </button>

              <button
                onClick={() => { setManagerStep('LIST'); setCurrentTab('M07_Pending_Review'); }}
                className="p-4 bg-white hover:bg-slate-100 border border-slate-100 active:scale-95 text-slate-800 rounded-2xl text-left transition-all flex flex-col justify-between aspect-video shadow-3xs"
              >
                <div className="relative">
                  <Clipboard className="w-5 h-5 text-amber-500" />
                  {pendingReview > 0 && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full text-[7px] text-white font-bold flex items-center justify-center">
                      {pendingReview}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-wide text-slate-700">DANH SÁCH DUYỆT</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Kiểm tra minh chứng</p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent tasks log list */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Nhật ký công việc gần đây
            </h4>
            <div className="space-y-2.5">
              {tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-3xs flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-semibold text-slate-800 line-clamp-1">{task.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Nhân viên: {task.assignedStaffName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    task.status === TaskStatus.COMPLETED
                      ? 'bg-emerald-100 text-emerald-800'
                      : task.status === TaskStatus.WAITING_REVIEW
                      ? 'bg-amber-100 text-amber-800'
                      : task.status === TaskStatus.REWORK_REQUIRED
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {task.status === TaskStatus.COMPLETED
                      ? 'HOÀN THÀNH'
                      : task.status === TaskStatus.WAITING_REVIEW
                      ? 'CHỜ DUYỆT'
                      : task.status === TaskStatus.REWORK_REQUIRED
                      ? 'Y/C LÀM LẠI'
                      : 'CHƯA XONG'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // M02_Create_Task flow (Step 1-4)
  const renderCreateTaskFlow = () => {
    if (managerStep === 'CREATE_STEP_1') {
      /* M02: Form bước 1 */
      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white px-4 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Tạo công việc mới (1/4)</h2>
            <p className="text-xs text-slate-400 mt-0.5">Xác định loại công việc kỹ thuật</p>
          </div>

          <form onSubmit={handleProceedToSelectTree} className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Quick Demo Autofill Box */}
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center justify-between gap-2.5 shadow-3xs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
                </span>
                <div>
                  <h4 className="text-[10px] font-bold text-emerald-950">Chế độ Demo giao việc</h4>
                  <p className="text-[9px] text-emerald-700">Tự động điền dữ liệu kiểm thử chuẩn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewTitle('Phun thuốc sâu bọ bồn Xà Cừ #01');
                  setNewType('Phun thuốc');
                  setNewDeadline('2026-07-09');
                  setNewDesc('Thực hiện phun thuốc trừ sâu sinh học đặc trị quanh thân cây, quét vôi trắng gốc để bảo tồn sức khỏe cây đại thụ.');
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[9px] font-bold rounded-lg transition-all shadow-xs shrink-0"
              >
                Điền nhanh
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tên công việc</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Tưới nước cây Xà Cừ cổ thụ đột xuất"
                className="w-full px-3.5 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/15 focus:border-[#4CAF50] text-slate-800 shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Loại công việc</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3.5 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/15 focus:border-[#4CAF50] text-slate-800 shadow-3xs"
              >
                <option value="Tưới nước">Tưới nước</option>
                <option value="Cắt tỉa cành">Cắt tỉa cành</option>
                <option value="Bón phân">Bón phân</option>
                <option value="Phun thuốc">Phun thuốc đặc trị sâu bệnh</option>
                <option value="Kiểm tra sâu bệnh">Kiểm tra sâu bệnh</option>
                <option value="Trồng mới">Trồng bồn cây mới</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Hạn chót (Deadline)</label>
              <input
                type="date"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full px-3.5 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/15 focus:border-[#4CAF50] text-slate-800 shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mô tả hướng dẫn kỹ thuật</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Nhập yêu cầu thực hiện ngoài hiện trường..."
                className="w-full h-24 p-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/15 focus:border-[#4CAF50] text-slate-800 resize-none shadow-3xs"
              />
            </div>
          </form>

          <div className="p-4 bg-white border-t border-slate-100">
            <button
              onClick={handleProceedToSelectTree}
              disabled={!newTitle}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-md text-center"
            >
              Tiếp tục chọn cây mục tiêu
            </button>
          </div>
        </div>
      );
    }

    if (managerStep === 'CREATE_STEP_2') {
      /* M03: Chọn cây */
      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setManagerStep('CREATE_STEP_1')} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-800 text-sm">Chọn cây mục tiêu (2/4)</span>
            </div>
          </div>

          {/* Search tree registry */}
          <div className="p-3 bg-white border-b border-slate-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
              placeholder="Tìm theo ID, Tên cây, Loài..."
              className="flex-1 text-xs border-none focus:ring-0 p-1 text-slate-800"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredTrees.map((tree) => {
              const isRecommended = tree.id === 'TRE-0824';
              return (
                <div
                  key={tree.id}
                  onClick={() => handleProceedToAssignStaff(tree)}
                  className={`p-3.5 rounded-2xl border cursor-pointer shadow-3xs flex justify-between items-center group transition-all active:scale-99 ${
                    isRecommended 
                      ? 'border-emerald-500 bg-emerald-50/15' 
                      : 'bg-white border-slate-100 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xs">
                      {tree.id.split('-')[1]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors flex items-center gap-1.5 flex-wrap">
                        <span>{tree.name}</span>
                        {isRecommended && (
                          <span className="bg-emerald-600 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse">
                            Khuyên dùng cho Demo
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 italic line-clamp-1">{tree.species}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5" />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (managerStep === 'CREATE_STEP_3') {
      /* M04: Phân công nhân viên */
      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setManagerStep('CREATE_STEP_2')} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-800 text-sm">Phân công nhân viên (3/4)</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {staff.map((person) => {
              // calculate actual workload from current tasks
              const personWorkload = tasks.filter(t => t.assignedStaffId === person.id && t.status !== TaskStatus.COMPLETED).length;
              const isRecommended = person.id === 'STF-01';

              return (
                <div
                  key={person.id}
                  onClick={() => handleProceedToConfirm(person)}
                  className={`p-3.5 rounded-2xl border cursor-pointer shadow-3xs flex justify-between items-center group transition-all active:scale-99 ${
                    isRecommended 
                      ? 'border-emerald-500 bg-emerald-50/15' 
                      : 'bg-white border-slate-100 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={person.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-100" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors flex items-center gap-1.5 flex-wrap">
                        <span>{person.name}</span>
                        {isRecommended && (
                          <span className="bg-emerald-600 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse">
                            Nhân viên chính (Hùng)
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{person.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      personWorkload >= 3
                        ? 'bg-rose-100 text-rose-700'
                        : personWorkload > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {personWorkload} VIỆC CHƯA XONG
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (managerStep === 'CREATE_STEP_4') {
      /* M05_Task_Confirmation */
      const tree = trees.find(t => t.id === selectedTreeId)!;
      const worker = staff.find(s => s.id === selectedStaffId)!;

      const handleAddChecklistItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newChecklistItemText.trim()) {
          setCustomChecklist([...customChecklist, newChecklistItemText.trim()]);
          setNewChecklistItemText('');
        }
      };

      const handleRemoveChecklistItem = (index: number) => {
        setCustomChecklist(customChecklist.filter((_, idx) => idx !== index));
      };

      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setManagerStep('CREATE_STEP_3')} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-800 text-sm">Xác nhận công việc (4/4)</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Task summary */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-3.5">
              <div className="border-b border-slate-50 pb-2 flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Nội dung tóm tắt</span>
                  <h3 className="text-sm font-bold text-slate-800 leading-snug mt-0.5">{newTitle}</h3>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-extrabold">
                  {newType}
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Bồn cây mục tiêu:</span>
                    <p className="text-slate-500 mt-0.5">{tree.name} ({tree.id})</p>
                    <p className="text-[10px] text-slate-400 italic mt-0.5">{tree.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 pt-1 border-t border-slate-50/50">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Nhân viên thực hiện:</span>
                    <p className="text-slate-500 mt-0.5">{worker.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 pt-1 border-t border-slate-50/50">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Hạn chót hoàn thành:</span>
                    <p className="text-slate-500 mt-0.5 font-bold font-mono text-emerald-600">{newDeadline}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Checklist Editor */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Checklist nghiệm thu ({customChecklist.length})</h4>
                  <p className="text-[9px] text-slate-400">Các bước nhân viên buộc phải xác nhận tại hiện trường</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Trigger effect again by briefly setting state
                    setNewType(newType);
                  }}
                  className="text-[10px] text-emerald-600 font-semibold hover:underline"
                >
                  Đặt lại mặc định
                </button>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {customChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 group">
                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-700 leading-snug truncate">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(idx)}
                      className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {customChecklist.length === 0 && (
                  <div className="py-4 text-center text-slate-400 text-[10px]">
                    Chưa có bước checklist nào. Vui lòng thêm bên dưới.
                  </div>
                )}
              </div>

              {/* Add checklist item form */}
              <form onSubmit={handleAddChecklistItem} className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={newChecklistItemText}
                  onChange={(e) => setNewChecklistItemText(e.target.value)}
                  placeholder="Thêm bước kỹ thuật mới..."
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-800"
                />
                <button
                  type="submit"
                  className="px-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 text-[10px] font-bold flex items-center justify-center transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-[10px] text-sky-800 leading-relaxed flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <span>
                <strong>Hướng dẫn Demo:</strong> Bạn có thể tùy chỉnh thêm bớt các đầu việc kỹ thuật ở trên. Khi nhân viên thực địa nhận việc, họ sẽ nhìn thấy chính xác danh mục kiểm tra này!
              </span>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <button
              onClick={handleConfirmCreateTask}
              disabled={customChecklist.length === 0}
              className={`w-full py-3.5 text-white rounded-xl text-sm font-bold shadow-md text-center flex items-center justify-center gap-1.5 transition-all ${
                customChecklist.length === 0
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-[#4CAF50] hover:bg-[#43A047] active:scale-99'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Gửi lệnh Giao việc</span>
            </button>
          </div>
        </div>
      );
    }

    if (managerStep === 'CREATE_SUCCESS' && latestCreatedTask) {
      const tree = trees.find(t => t.id === latestCreatedTask.treeId)!;
      const worker = staff.find(s => s.id === latestCreatedTask.assignedStaffId)!;
      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white p-4 border-b border-slate-100 text-center">
            <span className="font-bold text-slate-800 text-sm">Giao việc thành công</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-md border border-emerald-100">
              <CheckCircle className="w-9 h-9 text-emerald-500 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">Đã kích hoạt & chuyển tiếp công việc!</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-[280px]">
                Công việc đã được cập nhật lên hệ thống định vị GPS và gửi thông báo khẩn cấp đến thiết bị của nhân viên.
              </p>
            </div>

            {/* Task Summary Card */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-3xs w-full text-left space-y-2.5">
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <span className="text-[9px] font-bold text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">{latestCreatedTask.id}</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[8px] font-extrabold uppercase">
                  {latestCreatedTask.taskType}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Tên nhiệm vụ</span>
                  <p className="font-bold text-slate-800 leading-snug">{latestCreatedTask.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-50">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Cây bồn số</span>
                    <p className="font-bold text-slate-700 truncate">{tree.name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Người đảm nhiệm</span>
                    <p className="font-bold text-slate-700 truncate">{worker.name}</p>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-50">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Checklist đã giao ({latestCreatedTask.checklist.length} bước)</span>
                  <div className="space-y-1">
                    {latestCreatedTask.checklist.map((item, idx) => (
                      <div key={item.id} className="flex items-start gap-1 text-[10px] text-slate-600 leading-tight">
                        <CheckSquare className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{idx + 1}. {item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100/60 p-3 rounded-xl text-[10px] text-emerald-800 text-left w-full leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <span>
                <strong>Hướng dẫn Demo:</strong> Bạn đã giao việc thành công! Giờ hãy chọn vai trò sang <strong>Nhân viên</strong> ở bảng mô phỏng thiết bị phía dưới để bắt đầu nhận việc này, quét QR bồn cây và chụp ảnh nghiệm thu!
              </span>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex gap-2.5">
            <button
              onClick={() => {
                setLatestCreatedTask(null);
                setManagerStep('CREATE_STEP_1');
              }}
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold text-center active:scale-97 transition-transform"
            >
              Giao việc khác
            </button>
            <button
              onClick={() => {
                setLatestCreatedTask(null);
                setSelectedTreeId('');
                setSelectedStaffId('');
                setManagerStep('LIST');
                setCurrentTab('M01_Manager_Home');
              }}
              className="flex-1 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-xs font-bold text-center active:scale-97 transition-transform"
            >
              Về trang chủ QL
            </button>
          </div>
        </div>
      );
    }
  };

  // M07_Pending_Review list rendering
  const renderPendingReviewList = () => {
    const reviewTasks = tasks.filter(t => t.status === TaskStatus.WAITING_REVIEW);

    if (managerStep === 'REVIEW_DETAIL' && reviewTask) {
      /* M08_Evidence_Review */
      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setReviewTask(null); setManagerStep('LIST'); }}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-800 text-sm">Duyệt bằng chứng</span>
            </div>
          </div>

          <div className="p-4 flex-1 space-y-4 overflow-y-auto">
            {/* GPS Valid card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Xác minh GPS &amp; Timestamp</h4>
              <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900">Vị trí hợp lý (Cách gốc {reviewTask.gpsCheck?.distance.toFixed(1)}m)</p>
                  <p className="text-slate-500 mt-0.5 font-mono">
                    Tác nghiệp: {new Date(reviewTask.gpsCheck?.timestamp || '').toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Image comparison grid (Before vs After) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đối chiếu ảnh hiện trường</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[9px] text-center font-bold text-amber-600 uppercase tracking-wide">BEFORE</p>
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-100 relative">
                    <img src={reviewTask.beforePhoto} alt="Before" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-center font-bold text-emerald-600 uppercase tracking-wide">AFTER</p>
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-100 relative">
                    <img src={reviewTask.afterPhoto} alt="After" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist results */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hạng mục đã thực hiện</h4>
              <ul className="space-y-2">
                {reviewTask.checklist.map((item) => (
                  <li key={item.id} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="leading-tight">{item.text}</span>
                  </li>
                ))}
              </ul>

              {reviewTask.notes && (
                <div className="border-t border-slate-50 pt-2.5 mt-2.5 space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ghi chú từ nhân viên:</span>
                  <p className="text-xs text-slate-600 font-medium italic leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {reviewTask.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
            <button
              onClick={() => setManagerStep('REJECT_REASON')}
              className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 shadow-inner active:scale-98 transition-all text-center"
            >
              Từ chối (Reject)
            </button>
            <button
              onClick={handleApproveSubmission}
              className="flex-1 py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl text-xs font-bold shadow-md active:scale-98 transition-all text-center flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Phê duyệt</span>
            </button>
          </div>
        </div>
      );
    }

    if (managerStep === 'REJECT_REASON' && reviewTask) {
      /* M10_Reject_Reason */
      return (
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button onClick={() => setManagerStep('REVIEW_DETAIL')} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-800 text-sm">Lý do từ chối</span>
            </div>
          </div>

          <div className="p-4 flex-1 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Lý do từ chối nhanh (Chips)</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {REJECT_CHIPS_PRESET.map((chip) => {
                  const isSelected = selectedRejectChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleRejectChip(chip)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-600">Lời nhắn chi tiết cho nhân viên</label>
              <textarea
                value={rejectText}
                onChange={(e) => setRejectText(e.target.value)}
                placeholder="Yêu cầu cụ thể của bạn để nhân viên thực hiện lại (ví dụ: Chụp lại ảnh sau bồn cây rõ ràng hơn, dọn sạch vỉa hè...)"
                className="w-full h-28 p-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 text-slate-800 resize-none shadow-3xs"
              />
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <button
              onClick={handleRejectSubmission}
              disabled={selectedRejectChips.length === 0 && !rejectText}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-98 text-center"
            >
              Gửi yêu cầu làm lại
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="bg-white p-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Danh sách chờ duyệt</h2>
          <p className="text-xs text-slate-400 mt-0.5">Các công việc đã hoàn thành bồn cây, đang đợi bạn kiểm thử phê duyệt</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {reviewTasks.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-200 space-y-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 font-bold">Tất cả bồn cây đã sạch</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Hiện tại không có báo cáo hiện trường nào tồn đọng đang chờ bạn kiểm duyệt.
              </p>
            </div>
          ) : (
            reviewTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setReviewTask(task);
                  setManagerStep('REVIEW_DETAIL');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-emerald-500/30 cursor-pointer shadow-3xs space-y-3.5 transition-all active:scale-99"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                      CHỜ KIỂM DUYỆT
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug mt-2">
                      {task.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cây: {task.treeName}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {task.id}</span>
                </div>

                <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-600">Nhân viên: {task.assignedStaffName}</span>
                  <span className="font-mono">{new Date(task.updatedAt).toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Tree registry database tab (Tree_List_Screen)
  const renderTreeListTab = () => {
    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="bg-white p-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Hồ sơ cây xanh công viên</h2>
          <p className="text-xs text-slate-400 mt-0.5">Danh mục bồn cây thuộc phân khu quản lý của bạn</p>
        </div>

        {/* Search registry */}
        <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchTreeText}
            onChange={(e) => setSearchTreeText(e.target.value)}
            placeholder="Tìm theo mã cây, tên, loài cổ thụ..."
            className="flex-1 text-xs border-none focus:ring-0 p-1 text-slate-800 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {registryFilteredTrees.map((tree) => {
            let statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-100';
            if (tree.healthStatus === 'Cần chăm sóc') statusColor = 'bg-amber-50 text-amber-800 border-amber-100';
            if (tree.healthStatus === 'Sâu bệnh') statusColor = 'bg-rose-50 text-rose-800 border-rose-100';

            return (
              <div key={tree.id} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-3xs space-y-2.5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-700 font-bold rounded-lg flex items-center justify-center text-xs">
                      {tree.id.split('-')[1]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{tree.name}</h4>
                      <p className="text-[10px] text-slate-400 italic mt-0.5">{tree.species}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 font-bold">
                    {tree.id}
                  </span>
                </div>

                <div className="text-[11px] space-y-1 text-slate-600 border-t border-slate-50 pt-2.5">
                  <p className="flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{tree.address}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Tuổi đời: <span className="font-bold text-slate-700">{tree.ageYears} năm</span>
                  </p>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${statusColor}`}>
                    Sức khỏe: {tree.healthStatus}
                  </span>
                  
                  {/* View QR Code details */}
                  <span className="text-[9px] text-slate-400 font-mono">
                    Mã QR: {tree.qrCode}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Manager Account tab
  const renderAccountTab = () => {
    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-50 border border-sky-100 rounded-full flex items-center justify-center text-sky-700 font-extrabold text-sm">
            M
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Kỹ sư Trưởng</h2>
            <p className="text-xs text-slate-400">Trưởng ban kỹ thuật NOVYX</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-4 space-y-3.5 text-xs text-slate-600">
            <h3 className="font-bold text-slate-700">Thông tin tài khoản</h3>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>manager@novyx.vn</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>0911 999 888</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-slate-400" />
              <span>Cấp bậc: Trưởng phòng Quản lý Lâm nghiệp Đô thị</span>
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

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'M01_Manager_Home':
        return renderManagerHome();
      case 'M02_Create_Task':
        return renderCreateTaskFlow();
      case 'Tree_List_Screen':
        return renderTreeListTab();
      case 'M07_Pending_Review':
        return renderPendingReviewList();
      case 'Account_Screen':
        return renderAccountTab();
      default:
        return renderManagerHome();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
      {renderActiveTab()}
    </div>
  );
};

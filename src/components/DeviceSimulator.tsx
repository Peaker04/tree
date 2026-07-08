import React, { useState, useEffect } from 'react';
import { 
  Home, Scan, ClipboardList, Bell, User, LayoutDashboard, 
  CalendarPlus, TreePine, FileCheck, Signal, Wifi, Battery, MapPin 
} from 'lucide-react';
import { Role } from '../types';

interface DeviceSimulatorProps {
  children: React.ReactNode;
  role: Role | null;
  currentTab: string;
  onTabChange: (tab: string) => void;
  hideNav: boolean; // Hide tab bar on login/permissions/active tasks
}

export const DeviceSimulator: React.FC<DeviceSimulatorProps> = ({
  children,
  role,
  currentTab,
  onTabChange,
  hideNav
}) => {
  const [time, setTime] = useState('08:30');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours().toString().padStart(2, '0');
      let minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  interface NavigationTab {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    highlight?: boolean;
  }

  // Map requested bottom tabs for Staff Role
  const staffTabs: NavigationTab[] = [
    { id: 'S04_Staff_Home', label: 'Trang chủ', icon: Home },
    { id: 'S04_Staff_Home_Alt', label: 'Công việc', icon: ClipboardList },
    { id: 'QUICK_QR', label: 'Quét QR', icon: Scan, highlight: true },
    { id: 'Notifications_Screen', label: 'Thông báo', icon: Bell },
    { id: 'Account_Screen', label: 'Tài khoản', icon: User }
  ];

  // Map requested bottom tabs for Manager Role
  const managerTabs: NavigationTab[] = [
    { id: 'M01_Manager_Home', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'M02_Create_Task', label: 'Giao việc', icon: CalendarPlus },
    { id: 'Tree_List_Screen', label: 'Hồ sơ cây', icon: TreePine },
    { id: 'M07_Pending_Review', label: 'Duyệt', icon: FileCheck },
    { id: 'Account_Screen', label: 'Tài khoản', icon: User }
  ];

  const activeTabs = role === 'Manager' ? managerTabs : staffTabs;

  const handleTabClick = (tabId: string) => {
    if (tabId === 'S04_Staff_Home_Alt') {
      onTabChange('S04_Staff_Home');
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div className="w-full max-w-[400px] aspect-[9/19] rounded-[48px] bg-slate-900 p-3.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-[4px] border-slate-800 relative flex flex-col overflow-hidden select-none select-none">
      
      {/* PHONE INNER SCREEN CONTAINER */}
      <div className="flex-1 bg-white rounded-[36px] overflow-hidden flex flex-col relative border border-slate-950/20">
        
        {/* TOP STATUS BAR */}
        <div className="h-10 bg-white/80 backdrop-blur-md flex justify-between items-center px-6 text-slate-800 z-30 select-none flex-shrink-0 text-xs font-semibold">
          {/* Time */}
          <span className="font-bold tracking-tight text-[13px]">{time}</span>
          
          {/* Notch / Dynamic Island simulation */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center">
            {/* Camera lens glint */}
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800 absolute right-4" />
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <Signal className="w-3.5 h-3.5 stroke-[2.5]" />
            <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
            <div className="flex items-center gap-0.5 border border-slate-400 rounded px-0.5 py-0.2">
              <span className="text-[9px] font-bold">100%</span>
              <Battery className="w-3.5 h-3.5 fill-current text-slate-800" />
            </div>
          </div>
        </div>

        {/* MAIN APPLICATION VIEWPORT */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
          {children}
        </div>

        {/* BOTTOM TAB BAR */}
        {!hideNav && role && (
          <div className="h-16 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-2 z-30 flex-shrink-0 select-none pb-1.5">
            {activeTabs.map((tab) => {
              const TabIcon = tab.icon;
              // Check active status
              const isHomeOrAlt = (tab.id === 'S04_Staff_Home_Alt' && currentTab === 'S04_Staff_Home');
              const isActive = currentTab === tab.id || isHomeOrAlt;

              if (tab.highlight) {
                // Floating Scan button style for Staff Scan tab
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className="w-11 h-11 bg-[#4CAF50] hover:bg-[#43A047] active:scale-95 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-800/10 -translate-y-2.5 transition-all"
                    title={tab.label}
                  >
                    <TabIcon className="w-5.5 h-5.5" />
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="flex flex-col items-center justify-center flex-1 py-1.5 transition-colors focus:outline-none"
                >
                  <TabIcon className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-[#4CAF50] scale-110 stroke-[2.5]' : 'text-slate-400 hover:text-slate-600 stroke-[2]'
                  }`} />
                  <span className={`text-[9px] mt-1 font-bold tracking-tight transition-colors ${
                    isActive ? 'text-[#4CAF50]' : 'text-slate-400'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* PHONE HOME INDICATOR BAR */}
        <div className="h-4 bg-white/95 backdrop-blur-md flex items-center justify-center flex-shrink-0 z-30">
          <div className="w-32 h-1 bg-slate-300 rounded-full" />
        </div>

      </div>
    </div>
  );
};

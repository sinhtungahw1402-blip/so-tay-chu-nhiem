import React from 'react';
import { LayoutDashboard, CheckSquare, Users, FileText, Settings } from 'lucide-react';

export type TabType = 'overview' | 'checkin' | 'students' | 'reports' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  todayViolationCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  todayViolationCount,
}) => {
  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'checkin' as TabType,
      label: 'Chấm lỗi',
      icon: CheckSquare,
      badge: todayViolationCount > 0 ? todayViolationCount : undefined,
    },
    {
      id: 'students' as TabType,
      label: 'Học sinh',
      icon: Users,
    },
    {
      id: 'reports' as TabType,
      label: 'Báo cáo & Zalo',
      icon: FileText,
    },
    {
      id: 'settings' as TabType,
      label: 'Cài đặt',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[var(--sab)]">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 font-semibold scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight truncate max-w-full px-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React from 'react';
import { ClassInfo } from '../types';
import { GraduationCap, Cloud } from 'lucide-react';

interface NavbarProps {
  classInfo: ClassInfo;
  activeTab: string;
  onOpenCloudSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ classInfo, onOpenCloudSync }) => {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md pt-[var(--sat)]">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
            <GraduationCap className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight">{classInfo.schoolName || 'Sổ Chủ Nhiệm'}</h1>
              <span className="text-[10px] bg-yellow-400 text-blue-950 font-bold px-1.5 py-0.5 rounded-full uppercase">
                {classInfo.className || 'Lớp'}
              </span>
            </div>
            <p className="text-xs text-blue-100 flex items-center gap-1">
              <span>{classInfo.teacherName || 'Giáo viên chủ nhiệm'}</span>
              <span>•</span>
              <span>{classInfo.schoolYear}</span>
            </p>
          </div>
        </div>

        {onOpenCloudSync && (
          <button
            type="button"
            onClick={onOpenCloudSync}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:scale-95 px-2.5 py-1.5 rounded-xl border border-white/30 text-white font-bold transition-all shadow-xs"
            title="Đồng bộ nhanh Đám mây qua mã PIN 6 số"
          >
            <Cloud className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-[11px]">Đồng bộ PIN</span>
          </button>
        )}
      </div>
    </header>
  );
};

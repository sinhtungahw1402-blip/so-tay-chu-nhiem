import React from 'react';
import { Student, ViolationRecord, ClassInfo, ViolationCategory } from '../types';
import { getTodayDateString, getCurrentWeekRange, formatDateVN, getDayOfWeekVN } from '../utils/date';
import { TabType } from '../components/BottomNav';
import { Users, AlertTriangle, CheckCircle, PlusCircle, ArrowRight, TrendingUp, Calendar, Zap } from 'lucide-react';

interface OverviewViewProps {
  students: Student[];
  records: ViolationRecord[];
  categories: ViolationCategory[];
  classInfo: ClassInfo;
  onChangeTab: (tab: TabType) => void;
  onOpenCheckinStudent?: (studentId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  students,
  records,
  classInfo,
  onChangeTab,
}) => {
  const today = getTodayDateString();
  const currentWeek = getCurrentWeekRange();

  // Today's records
  const todayRecords = records.filter(r => r.date === today);
  const weekRecords = records.filter(r => r.date >= currentWeek.start && r.date <= currentWeek.end);

  // Set of students who violated this week
  const weekViolatedStudentIds = new Set(weekRecords.map(r => r.studentId));
  const goodStudentsCount = students.length - weekViolatedStudentIds.size;

  // Recent 5 violations
  const recentRecords = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="p-4 space-y-4 pb-24 max-w-md mx-auto">
      {/* Banner Welcome */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-2">
            Năm học {classInfo.schoolYear}
          </span>
          <h2 className="text-xl font-black">
            Lớp {classInfo.className} • {classInfo.schoolName}
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            GVCN: <strong>{classInfo.teacherName}</strong>
          </p>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-blue-100">
              <Calendar className="w-3.5 h-3.5 text-yellow-300" />
              <span>Hôm nay: {getDayOfWeekVN(today)}, {formatDateVN(today)}</span>
            </span>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onChangeTab('students')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Sĩ số lớp</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800">{students.length}</span>
            <span className="text-xs text-slate-500">học sinh</span>
          </div>
        </div>

        <div
          onClick={() => onChangeTab('checkin')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-rose-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Lỗi hôm nay</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-600">{todayRecords.length}</span>
            <span className="text-xs text-slate-500">lượt</span>
          </div>
        </div>

        <div
          onClick={() => onChangeTab('reports')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-emerald-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Nề nếp tốt tuần</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600">{goodStudentsCount}</span>
            <span className="text-xs text-slate-500">/{students.length} em</span>
          </div>
        </div>

        <div
          onClick={() => onChangeTab('reports')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-indigo-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Vi phạm tuần này</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600">{weekRecords.length}</span>
            <span className="text-xs text-slate-500">lượt</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Thao tác nhanh cho GVCN</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChangeTab('checkin')}
            className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 text-xs font-bold hover:brightness-105 transition-all text-left"
          >
            <PlusCircle className="w-5 h-5 shrink-0 text-yellow-300" />
            <div>
              <span>Chấm lỗi hôm nay</span>
              <span className="block text-[10px] text-blue-100 font-normal">Đánh dấu vi phạm</span>
            </div>
          </button>

          <button
            onClick={() => onChangeTab('reports')}
            className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-500/20 text-xs font-bold hover:brightness-105 transition-all text-left"
          >
            <ArrowRight className="w-5 h-5 shrink-0 text-emerald-200" />
            <div>
              <span>Gửi tin Zalo tuần</span>
              <span className="block text-[10px] text-emerald-100 font-normal">Xuất ảnh & tin nhắn</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Violation Records */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Vi phạm ghi nhận gần đây</span>
          </h3>
          <button
            onClick={() => onChangeTab('reports')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Xem tất cả
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">Lớp chưa có ghi nhận vi phạm nào!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bấm &quot;Chấm lỗi&quot; để ghi nhận khi cần</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentRecords.map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{r.studentName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                      {formatDateVN(r.date)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {r.categoryName} {r.note ? `(${r.note})` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                    -{r.pointsDeducted}đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

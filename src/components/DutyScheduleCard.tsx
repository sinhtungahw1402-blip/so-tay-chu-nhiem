import React from 'react';
import { ClassInfo } from '../types';
import { DutyScheduleResult } from '../utils/dutySchedule';
import { Sparkles, AlertTriangle, ClipboardList, GraduationCap } from 'lucide-react';

interface DutyScheduleCardProps {
  classInfo: ClassInfo;
  timePeriodLabel: string;
  schedule: DutyScheduleResult;
  topLimit: number;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export const DutyScheduleCard: React.FC<DutyScheduleCardProps> = ({
  classInfo,
  timePeriodLabel,
  schedule,
  topLimit,
  cardRef,
}) => {
  const displayTop = topLimit > 0 ? schedule.topViolators.slice(0, topLimit) : schedule.topViolators;
  const fridayHighlightCount = Math.min(schedule.fridayAfternoonCount, schedule.totalViolated);

  return (
    <div
      ref={cardRef}
      className="w-[460px] bg-white p-5 rounded-3xl shadow-lg border border-slate-200 text-slate-800 font-sans mx-auto text-left relative overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              {classInfo.schoolName || 'TRƯỜNG THCS'}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Năm học: {classInfo.schoolYear} • GVCN: {classInfo.teacherName}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-black rounded-xl">
          LỚP {classInfo.className}
        </span>
      </div>

      {/* Main Title */}
      <div className="text-center mb-3.5">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
          Bảng Tổng Hợp Vi Phạm &amp; Phân Công Trực Nhật
        </h2>
        <p className="text-[11px] font-bold text-orange-600 mt-0.5">{timePeriodLabel}</p>
        <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
          Xếp &amp; chia theo: <strong className="text-slate-700">{schedule.sortBy === 'points' ? 'Số điểm trừ nhiều nhất' : 'Số lỗi vi phạm nhiều nhất'}</strong>
        </p>
      </div>

      {/* Section 1: Top Violators Table */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-[11px] font-black text-rose-700 uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Học sinh vi phạm nhiều nhất ({displayTop.length}/{schedule.totalViolated} em)</span>
          </h4>
          <span className="text-[9px] text-slate-500 font-semibold">
            Top {fridayHighlightCount}: Lau dọn chiều T6
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px]">
                <th className="py-1.5 px-2 font-bold w-8 text-center">#</th>
                <th className="py-1.5 px-2 font-bold">Học sinh</th>
                <th className="py-1.5 px-2 font-bold text-center">
                  {schedule.sortBy === 'points' ? 'Điểm trừ (Số lỗi)' : 'Số lỗi (Điểm trừ)'}
                </th>
                <th className="py-1.5 px-2 font-bold text-right">Còn lại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayTop.map((s, idx) => {
                const isFridayCleanup = idx < fridayHighlightCount;
                return (
                  <tr
                    key={s.student.id}
                    className={isFridayCleanup ? 'bg-rose-50/70' : ''}
                  >
                    <td className="py-1 px-2 text-center font-black text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-2 font-bold text-slate-900">
                      <span>{s.student.name}</span>
                      {isFridayCleanup && (
                        <span className="ml-1.5 text-[9px] bg-rose-100 text-rose-700 border border-rose-200 px-1 py-0.2 rounded font-bold">
                          Lau lớp T6
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-center font-bold text-rose-600">
                      {schedule.sortBy === 'points'
                        ? `-${s.totalPointsDeducted}đ (${s.totalViolations} lỗi)`
                        : `${s.totalViolations} lỗi (-${s.totalPointsDeducted}đ)`}
                    </td>
                    <td className="py-1 px-2 text-right font-extrabold text-slate-700">
                      {s.currentScore}đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Duty Schedule Table */}
      <div className="mb-3">
        <h4 className="text-[11px] font-black text-blue-800 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
          <span>Lịch trực nhật tự động (Tối thiểu {schedule.minPerDay} bạn/buổi)</span>
        </h4>

        <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50 text-blue-900 border-b border-blue-100 text-[10px]">
                <th className="py-1.5 px-2.5 font-bold w-28">Buổi trực</th>
                <th className="py-1.5 px-2.5 font-bold">Học sinh thực hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.slots.map(slot => (
                <tr
                  key={slot.id}
                  className={slot.isSpecialCleanup ? 'bg-amber-50/80' : ''}
                >
                  <td className="py-2 px-2.5 align-top">
                    <div className={`font-black ${slot.isSpecialCleanup ? 'text-rose-700' : 'text-slate-800'}`}>
                      {slot.label}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {slot.isSpecialCleanup ? 'Lau dọn lớp' : `${slot.assignees.length} bạn`}
                    </div>
                  </td>
                  <td className="py-2 px-2.5 align-top">
                    <div className="flex flex-wrap gap-1">
                      {slot.assignees.map((a, i) => (
                        <span
                          key={`${slot.id}_${a.summary.student.id}_${i}`}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-bold text-[10px] border ${
                            slot.isSpecialCleanup
                              ? 'bg-rose-100 text-rose-900 border-rose-200'
                              : a.isExtra
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {a.summary.student.name}
                          {a.isExtra ? ' (tăng cường)' : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Kính nhờ Quý Phụ huynh nhắc nhở các em trực nhật đúng giờ!</span>
        </span>
      </div>
    </div>
  );
};

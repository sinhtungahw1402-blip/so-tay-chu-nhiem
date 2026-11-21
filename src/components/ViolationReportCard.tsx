import React from 'react';
import { StudentViolationSummary, ClassInfo } from '../types';
import { formatDateVN, getDayOfWeekVN } from '../utils/date';
import { Award, AlertCircle, CheckCircle, GraduationCap } from 'lucide-react';

interface ViolationReportCardProps {
  summary: StudentViolationSummary;
  classInfo: ClassInfo;
  timePeriodLabel: string;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export const ViolationReportCard: React.FC<ViolationReportCardProps> = ({
  summary,
  classInfo,
  timePeriodLabel,
  cardRef,
}) => {
  const { student, records, totalViolations, currentScore, rank } = summary;

  const rankColor = {
    'Tốt': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Khá': 'bg-blue-100 text-blue-800 border-blue-300',
    'Đạt': 'bg-amber-100 text-amber-800 border-amber-300',
    'Cần rèn luyện': 'bg-rose-100 text-rose-800 border-rose-300',
  }[rank];

  return (
    <div
      ref={cardRef}
      className="w-[420px] bg-white p-6 rounded-3xl shadow-lg border border-slate-200 text-slate-800 font-sans mx-auto text-left relative overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Decorative top header bar */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

      {/* School Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              {classInfo.schoolName || 'TRƯỜNG THCS'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Năm học: {classInfo.schoolYear}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold rounded-xl">
            LỚP {classInfo.className}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-3">
        <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
          Phiếu Thông Báo Rèn Luyện Nề Nếp
        </h2>
        <p className="text-xs font-semibold text-blue-600 mt-0.5">
          {timePeriodLabel}
        </p>
      </div>

      {/* Student Profile Box */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500 text-[11px]">Học sinh:</span>
          <p className="font-bold text-slate-900 text-sm">{student.name}</p>
        </div>
        <div>
          <span className="text-slate-500 text-[11px]">Tổ / Nhóm:</span>
          <p className="font-semibold text-slate-800">{student.group || 'Tổ 1'} ({student.gender})</p>
        </div>
        <div>
          <span className="text-slate-500 text-[11px]">Phụ huynh:</span>
          <p className="font-medium text-slate-800">{student.parentName || 'Quý phụ huynh'}</p>
        </div>
        <div>
          <span className="text-slate-500 text-[11px]">SĐT nhận tin:</span>
          <p className="font-mono font-medium text-slate-800">{student.parentPhone || 'Chưa cập nhật'}</p>
        </div>
      </div>

      {/* Summary Score Badges */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Vi phạm</span>
          <span className="text-base font-black text-rose-600">{totalViolations}</span>
          <span className="text-[10px] text-slate-500 ml-0.5">lần</span>
        </div>

        <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Điểm nề nếp</span>
          <span className="text-base font-black text-blue-600">{currentScore}</span>
          <span className="text-[10px] text-slate-500 ml-0.5">/ 100</span>
        </div>

        <div className={`p-2.5 rounded-xl border ${rankColor} flex flex-col justify-center items-center`}>
          <span className="text-[10px] uppercase font-semibold block">Xếp loại</span>
          <span className="text-xs font-black">{rank}</span>
        </div>
      </div>

      {/* Violations List or Commendation */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Chi tiết ghi nhận nề nếp</span>
        </h4>

        {totalViolations === 0 ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-emerald-900">Em thực hiện rất tốt nội quy!</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Không ghi nhận lỗi vi phạm nào trong thời gian qua.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px]">
                  <th className="py-1.5 px-2 font-bold">Ngày</th>
                  <th className="py-1.5 px-2 font-bold">Nội dung vi phạm</th>
                  <th className="py-1.5 px-2 font-bold text-right">Trừ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 align-top text-slate-500 font-medium whitespace-nowrap">
                      {formatDateVN(r.date)}
                      <span className="block text-[9px] text-slate-400">{getDayOfWeekVN(r.date)}</span>
                    </td>
                    <td className="py-1.5 px-2 align-top text-slate-800">
                      <div className="font-semibold text-slate-900">{r.categoryName}</div>
                      {(r.period || r.subject || r.note) && (
                        <div className="text-[10px] text-slate-500">
                          {r.period ? `${r.period} ` : ''}
                          {r.subject ? `• Môn ${r.subject} ` : ''}
                          {r.note ? `• ${r.note}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-2 align-top text-right font-bold text-rose-600 whitespace-nowrap">
                      -{r.pointsDeducted}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note & Teacher Signature */}
      <div className="pt-2 border-t border-slate-200 flex justify-between items-end text-xs">
        <div className="max-w-[200px]">
          <p className="text-[10px] text-slate-500 italic">
            * Kính mong Quý Phụ huynh phối hợp cùng nhà trường đôn đốc, nhắc nhở em.
          </p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-slate-500 font-medium">Giáo viên chủ nhiệm</p>
          <div className="h-8 flex items-center justify-center">
            <span className="font-serif italic text-blue-800 font-bold text-xs">{classInfo.teacherName}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-800">{classInfo.teacherName}</p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Student, ViolationRecord, ClassInfo, StudentViolationSummary, TimeFilterType } from '../types';
import {
  getCurrentWeekRange,
  getLastWeekRange,
  getCurrentMonthRange,
  getSemester1Range,
  getSemester2Range,
  getSchoolYearRange,
  formatDateVN,
  getDayOfWeekVN
} from '../utils/date';
import { exportViolationReportToExcel } from '../utils/excel';
import { copyToClipboard } from '../utils/zalo';
import {
  Calendar,
  Filter,
  FileSpreadsheet,
  Copy,
  Send,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface ReportsViewProps {
  students: Student[];
  records: ViolationRecord[];
  classInfo: ClassInfo;
  onOpenSendZalo: (summary: StudentViolationSummary, timePeriodLabel: string) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  records,
  classInfo,
  onOpenSendZalo,
  onToast,
}) => {
  const [filterType, setFilterType] = useState<TimeFilterType>('week');
  const [customStart, setCustomStart] = useState<string>(getCurrentWeekRange().start);
  const [customEnd, setCustomEnd] = useState<string>(getCurrentWeekRange().end);
  const [viewFilter, setViewFilter] = useState<'all' | 'violated_only' | 'good_only'>('all');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Compute date range based on filterType
  let startDate = '';
  let endDate = '';
  let timeLabel = '';

  const now = new Date();
  switch (filterType) {
    case 'week': {
      const range = getCurrentWeekRange(now);
      startDate = range.start;
      endDate = range.end;
      timeLabel = `Tuần này (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
      break;
    }
    case 'last_week': {
      const range = getLastWeekRange(now);
      startDate = range.start;
      endDate = range.end;
      timeLabel = `Tuần trước (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
      break;
    }
    case 'month': {
      const range = getCurrentMonthRange(now);
      startDate = range.start;
      endDate = range.end;
      const m = now.getMonth() + 1;
      timeLabel = `Tháng ${m}/${now.getFullYear()}`;
      break;
    }
    case 'hk1': {
      const range = getSemester1Range(now.getFullYear());
      startDate = range.start;
      endDate = range.end;
      timeLabel = `Học kì 1 (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
      break;
    }
    case 'hk2': {
      const range = getSemester2Range(now.getFullYear());
      startDate = range.start;
      endDate = range.end;
      timeLabel = `Học kì 2 (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
      break;
    }
    case 'year': {
      const range = getSchoolYearRange(now.getFullYear());
      startDate = range.start;
      endDate = range.end;
      timeLabel = `Cả năm học (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
      break;
    }
    case 'custom': {
      startDate = customStart;
      endDate = customEnd;
      timeLabel = `Từ ${formatDateVN(startDate)} đến ${formatDateVN(endDate)}`;
      break;
    }
  }

  // Filter records within the date range
  const filteredRecords = records.filter(r => r.date >= startDate && r.date <= endDate);

  // Calculate summaries for each student
  const summaries: StudentViolationSummary[] = students.map(student => {
    const studentRecords = filteredRecords.filter(r => r.studentId === student.id);
    const totalPointsDeducted = studentRecords.reduce((acc, r) => acc + r.pointsDeducted, 0);
    const currentScore = Math.max(0, (classInfo.initialScore || 100) - totalPointsDeducted);

    let rank: 'Tốt' | 'Khá' | 'Đạt' | 'Cần rèn luyện' = 'Tốt';
    if (studentRecords.length === 0 || currentScore >= 95) {
      rank = 'Tốt';
    } else if (currentScore >= 80) {
      rank = 'Khá';
    } else if (currentScore >= 65) {
      rank = 'Đạt';
    } else {
      rank = 'Cần rèn luyện';
    }

    return {
      student,
      records: studentRecords,
      totalViolations: studentRecords.length,
      totalPointsDeducted,
      currentScore,
      rank,
    };
  });

  // Filter view based on viewFilter
  const displaySummaries = summaries.filter(s => {
    if (viewFilter === 'violated_only') return s.totalViolations > 0;
    if (viewFilter === 'good_only') return s.totalViolations === 0;
    return true;
  });

  // Sort: students with most violations on top for teachers to easily see who needs follow up
  displaySummaries.sort((a, b) => b.totalViolations - a.totalViolations);

  const totalClassViolations = filteredRecords.length;
  const totalViolatedStudents = summaries.filter(s => s.totalViolations > 0).length;
  const goodStudentsCount = students.length - totalViolatedStudents;

  // Export full class summary to Excel
  const handleExportExcel = () => {
    if (students.length === 0) {
      onToast('Chưa có học sinh để xuất báo cáo!', 'error');
      return;
    }
    exportViolationReportToExcel(summaries, classInfo.className, timeLabel);
    onToast(`Đã xuất báo cáo Excel cho lớp ${classInfo.className}!`, 'success');
  };

  // Copy whole class summary to clipboard for sending to Zalo Class Group
  const handleCopyClassSummary = async () => {
    const textLines = [
      `📢 BÁO CÁO NỀ NẾP LỚP ${classInfo.className} - ${timeLabel.toUpperCase()}`,
      `Trường: ${classInfo.schoolName} • GVCN: ${classInfo.teacherName}`,
      `---------------------------------------`,
      `📊 Tổng kết chung:`,
      `- Sĩ số: ${students.length} học sinh`,
      `- Số học sinh thực hiện tốt (0 vi phạm): ${goodStudentsCount} em 🌸`,
      `- Số học sinh có vi phạm: ${totalViolatedStudents} em (${totalClassViolations} lượt vi phạm)`,
      ``,
    ];

    if (totalViolatedStudents > 0) {
      textLines.push(`📋 Danh sách học sinh cần lưu ý nhắc nhở:`);
      summaries.filter(s => s.totalViolations > 0).forEach((s, idx) => {
        textLines.push(`${idx + 1}. Em ${s.student.name} (${s.student.group || 'Tổ'}): ${s.totalViolations} lỗi (-${s.totalPointsDeducted}đ) -> Còn ${s.currentScore}đ [Xếp loại: ${s.rank}]`);
      });
      textLines.push(``);
    }

    textLines.push(`Kính mong Quý Phụ huynh phối hợp cùng GVCN để giúp các con ngày càng tiến bộ hơn! Trân trọng cảm ơn!`);

    const fullMsg = textLines.join('\n');
    const copied = await copyToClipboard(fullMsg);
    if (copied) {
      onToast('Đã sao chép báo cáo tổng hợp cả lớp vào bộ nhớ tạm!', 'success');
    } else {
      onToast('Không thể sao chép tự động!', 'error');
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-md mx-auto">
      {/* Time Range Selector Tabs */}
      <div className="bg-white p-3.5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Kỳ báo cáo tổng hợp:</span>
          </span>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
            {timeLabel}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setFilterType('week')}
            className={`py-2 rounded-xl transition-all ${
              filterType === 'week' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tuần này
          </button>
          <button
            onClick={() => setFilterType('last_week')}
            className={`py-2 rounded-xl transition-all ${
              filterType === 'last_week' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tuần trước
          </button>
          <button
            onClick={() => setFilterType('month')}
            className={`py-2 rounded-xl transition-all ${
              filterType === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setFilterType('hk1')}
            className={`py-2 rounded-xl transition-all ${
              filterType === 'hk1' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Học kì 1
          </button>
          <button
            onClick={() => setFilterType('hk2')}
            className={`py-2 rounded-xl transition-all ${
              filterType === 'hk2' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Học kì 2
          </button>
          <button
            onClick={() => setFilterType('year')}
            className={`py-2 rounded-xl transition-all ${
              filterType === 'year' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cả năm
          </button>
        </div>

        {/* Custom date range option */}
        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={() => setFilterType('custom')}
            className={`text-xs font-bold ${filterType === 'custom' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {filterType === 'custom' ? '• Chọn khoảng ngày tùy ý:' : 'Tùy chọn khoảng ngày...'}
          </button>
          {filterType === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-[11px] font-bold px-1.5 py-1 bg-slate-50 border border-slate-300 rounded-lg"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-[11px] font-bold px-1.5 py-1 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Tổng vi phạm</span>
          <span className="text-xl font-black text-rose-600">{totalClassViolations}</span>
          <span className="text-[10px] text-slate-500 ml-0.5">lượt</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Có vi phạm</span>
          <span className="text-xl font-black text-amber-600">{totalViolatedStudents}</span>
          <span className="text-[10px] text-slate-500 ml-0.5">em</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Nề nếp tốt</span>
          <span className="text-xl font-black text-emerald-600">{goodStudentsCount}</span>
          <span className="text-[10px] text-slate-500 ml-0.5">em</span>
        </div>
      </div>

      {/* Class Action Bar: Copy summary to Zalo Group or Export Excel */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleCopyClassSummary}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 hover:brightness-105 transition-all"
        >
          <Copy className="w-4 h-4" />
          <span>Chép tin nhắn báo cáo cả lớp</span>
        </button>

        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Excel cả lớp</span>
        </button>
      </div>

      {/* Filter view: all vs violated only vs good only */}
      <div className="flex gap-1.5 bg-slate-200/70 p-1 rounded-2xl text-xs">
        <button
          onClick={() => setViewFilter('all')}
          className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
            viewFilter === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tất cả ({summaries.length})
        </button>
        <button
          onClick={() => setViewFilter('violated_only')}
          className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
            viewFilter === 'violated_only' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Có lỗi ({totalViolatedStudents})
        </button>
        <button
          onClick={() => setViewFilter('good_only')}
          className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
            viewFilter === 'good_only' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tốt ({goodStudentsCount})
        </button>
      </div>

      {/* Student Violation Cards List */}
      <div className="space-y-3">
        {displaySummaries.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
            <p className="text-xs font-bold text-slate-600">Không có dữ liệu trong khoảng này</p>
          </div>
        ) : (
          displaySummaries.map((summary) => {
            const isExpanded = expandedStudentId === summary.student.id;
            const rankBadge = {
              'Tốt': 'bg-emerald-100 text-emerald-800 border-emerald-200',
              'Khá': 'bg-blue-100 text-blue-800 border-blue-200',
              'Đạt': 'bg-amber-100 text-amber-800 border-amber-200',
              'Cần rèn luyện': 'bg-rose-100 text-rose-800 border-rose-200',
            }[summary.rank];

            return (
              <div
                key={summary.student.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hover:border-blue-300 transition-all"
              >
                {/* Main Row */}
                <div className="p-3.5 flex items-center justify-between">
                  <div
                    onClick={() => setExpandedStudentId(isExpanded ? null : summary.student.id)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                  >
                    <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                      {summary.student.stt}
                    </span>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900">{summary.student.name}</h4>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md border ${rankBadge}`}>
                          {summary.rank}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {summary.student.group || 'Tổ 1'} • Điểm nề nếp:{' '}
                        <strong className="text-slate-800">{summary.currentScore}đ</strong>
                        {summary.totalViolations > 0 ? (
                          <span className="text-rose-600 font-bold ml-1">
                            ({summary.totalViolations} lỗi, -{summary.totalPointsDeducted}đ)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold ml-1">(0 lỗi)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Send Zalo Button */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => onOpenSendZalo(summary, timeLabel)}
                      className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
                    >
                      <Send className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Gửi Zalo</span>
                    </button>

                    <button
                      onClick={() => setExpandedStudentId(isExpanded ? null : summary.student.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Violations List */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>Chi tiết các vi phạm trong kỳ:</span>
                      <span className="text-slate-500">
                        SĐT Zalo:{' '}
                        <strong className="text-blue-600 font-mono">
                          {summary.student.parentPhone || 'Chưa cập nhật'}
                        </strong>
                      </span>
                    </div>

                    {summary.records.length === 0 ? (
                      <p className="text-xs text-emerald-600 py-1 font-medium">
                        ✨ Em không vi phạm lỗi nào trong kỳ này!
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {summary.records.map((r, i) => (
                          <div
                            key={i}
                            className="p-2 bg-white rounded-xl border border-slate-200 flex items-start justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{r.categoryName}</p>
                              <p className="text-[10px] text-slate-500">
                                {formatDateVN(r.date)} ({getDayOfWeekVN(r.date)})
                                {r.period ? ` • ${r.period}` : ''}
                                {r.subject ? ` • Môn ${r.subject}` : ''}
                                {r.note ? ` • ${r.note}` : ''}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-rose-600 whitespace-nowrap ml-2">
                              -{r.pointsDeducted}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

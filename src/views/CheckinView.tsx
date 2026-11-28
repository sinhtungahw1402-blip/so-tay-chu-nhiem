import React, { useState } from 'react';
import { Student, ViolationCategory, ViolationRecord, ViolationGroup, ClassInfo } from '../types';
import { getTodayDateString, formatDateVN, getDayOfWeekVN } from '../utils/date';
import { generateCompactDailyMessage } from '../utils/zalo';
import { BulkSendTarget } from '../components/BulkSendModal';
import {
  CheckSquare,
  Calendar,
  Users,
  Search,
  Trash2,
  Plus,
  Check,
  Clock,
  BookOpen,
  AlertCircle,
  Send,
  MessageCircle
} from 'lucide-react';

interface CheckinViewProps {
  students: Student[];
  categories: ViolationCategory[];
  records: ViolationRecord[];
  classInfo: ClassInfo;
  onSaveRecords: (newRecords: ViolationRecord[]) => void;
  onDeleteRecord: (id: string) => void;
  onOpenCategoryModal: () => void;
  onOpenBulkSend: (
    targets: BulkSendTarget[],
    title: string,
    subtitle: string,
    sendType?: 'daily' | 'period',
    periodLabel?: string,
    initialMode?: 'group' | 'individual' | 'zaloweb'
  ) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CheckinView: React.FC<CheckinViewProps> = ({
  students,
  categories,
  records,
  classInfo,
  onSaveRecords,
  onDeleteRecord,
  onOpenCategoryModal,
  onOpenBulkSend,
  onToast,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [inputMode, setInputMode] = useState<'by_student' | 'by_category'>('by_student');

  // Mode 1: By student state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<string>('Tiết 1');
  const [subject, setSubject] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('Tất cả');

  // Mode 2: By category state
  const [batchCatId, setBatchCatId] = useState<string>(categories[0]?.id || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [batchPeriod, setBatchPeriod] = useState<string>('Tiết 1');
  const [batchNote, setBatchNote] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Filter records for selected date
  const recordsForDate = records.filter(r => r.date === selectedDate);

  // Group records by student for daily sending
  const dailyStudentMap = new Map<string, { student: Student; records: ViolationRecord[] }>();
  recordsForDate.forEach(r => {
    const stu = students.find(s => s.id === r.studentId);
    if (stu) {
      if (!dailyStudentMap.has(stu.id)) {
        dailyStudentMap.set(stu.id, { student: stu, records: [] });
      }
      dailyStudentMap.get(stu.id)!.records.push(r);
    }
  });
  const dailyStudentsWithViolations = Array.from(dailyStudentMap.values());

  // Group categories by ViolationGroup
  const groups: ViolationGroup[] = ['Chuyên cần', 'Học tập', 'Kỷ luật - Tác phong', 'Vệ sinh - Lao động', 'Khác'];

  // Toggle category in Mode 1
  const toggleCategory = (catId: string) => {
    setSelectedCatIds(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // Toggle student in Mode 2
  const toggleStudent = (stuId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(stuId)) {
        next.delete(stuId);
      } else {
        next.add(stuId);
      }
      return next;
    });
  };

  // Select all or deselect all students in Mode 2
  const handleSelectAllStudents = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map(s => s.id)));
    }
  };

  // Submit Mode 1
  const handleSaveByStudent = () => {
    if (!selectedStudentId) {
      onToast('Vui lòng chọn học sinh!', 'error');
      return;
    }
    if (selectedCatIds.size === 0) {
      onToast('Vui lòng chọn ít nhất 1 lỗi vi phạm!', 'error');
      return;
    }

    const currentStudent = students.find(s => s.id === selectedStudentId);
    if (!currentStudent) return;

    const newRecords: ViolationRecord[] = [];
    const nowIso = new Date().toISOString();

    selectedCatIds.forEach(catId => {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        newRecords.push({
          id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          categoryId: cat.id,
          categoryName: cat.name,
          group: cat.group,
          pointsDeducted: cat.pointsDeducted,
          date: selectedDate,
          period,
          subject: subject.trim(),
          note: note.trim(),
          createdAt: nowIso,
        });
      }
    });

    onSaveRecords(newRecords);
    setSelectedCatIds(new Set());
    setNote('');
    onToast(`Đã lưu ${newRecords.length} lỗi vi phạm cho em ${currentStudent.name}!`, 'success');
  };

  // Submit Mode 2
  const handleSaveByCategory = () => {
    if (!batchCatId) {
      onToast('Vui lòng chọn lỗi vi phạm!', 'error');
      return;
    }
    if (selectedStudentIds.size === 0) {
      onToast('Vui lòng chọn ít nhất 1 học sinh vi phạm!', 'error');
      return;
    }

    const currentCat = categories.find(c => c.id === batchCatId);
    if (!currentCat) return;

    const newRecords: ViolationRecord[] = [];
    const nowIso = new Date().toISOString();

    selectedStudentIds.forEach(stuId => {
      const stu = students.find(s => s.id === stuId);
      if (stu) {
        newRecords.push({
          id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          studentId: stu.id,
          studentName: stu.name,
          categoryId: currentCat.id,
          categoryName: currentCat.name,
          group: currentCat.group,
          pointsDeducted: currentCat.pointsDeducted,
          date: selectedDate,
          period: batchPeriod,
          note: batchNote.trim(),
          createdAt: nowIso,
        });
      }
    });

    onSaveRecords(newRecords);
    setSelectedStudentIds(new Set());
    setBatchNote('');
    onToast(`Đã lưu lỗi "${currentCat.name}" cho ${newRecords.length} học sinh!`, 'success');
  };

  // Trigger Bulk Send for the selected day
  const handleOpenDailyBulkSend = () => {
    if (dailyStudentsWithViolations.length === 0) {
      onToast('Không có học sinh vi phạm nào trong ngày này để gửi!', 'info');
      return;
    }

    const targets: BulkSendTarget[] = dailyStudentsWithViolations.map(item => ({
      student: item.student,
      records: item.records,
      date: selectedDate,
      message: generateCompactDailyMessage(
        item.student.name,
        classInfo.className,
        selectedDate,
        item.records
      ),
    }));

    onOpenBulkSend(
      targets,
      `Gửi vi phạm ngày ${formatDateVN(selectedDate)}`,
      `Gửi tự động cho ${targets.length} phụ huynh có con vi phạm hôm nay`,
      'daily'
    );
  };

  // Trigger Send for a single student on the selected day
  const handleSendSingleDaily = (item: { student: Student; records: ViolationRecord[] }) => {
    const target: BulkSendTarget = {
      student: item.student,
      records: item.records,
      date: selectedDate,
      message: generateCompactDailyMessage(
        item.student.name,
        classInfo.className,
        selectedDate,
        item.records
      ),
    };

    onOpenBulkSend(
      [target],
      `Gửi vi phạm em ${item.student.name}`,
      `Gửi tin nề nếp ngày ${formatDateVN(selectedDate)}`
    );
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="p-4 space-y-4 pb-24 max-w-md mx-auto">
      {/* Date Selector & Day header */}
      <div className="bg-white p-3.5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Ngày chấm lỗi:</span>
            <p className="text-xs font-bold text-slate-800">
              {getDayOfWeekVN(selectedDate)}, {formatDateVN(selectedDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setInputMode('by_student')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            inputMode === 'by_student'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Theo từng học sinh</span>
        </button>
        <button
          type="button"
          onClick={() => setInputMode('by_category')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            inputMode === 'by_category'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Chấm nhanh cả nhóm</span>
        </button>
      </div>

      {/* MODE 1: CHẤM THEO TỪNG HỌC SINH */}
      {inputMode === 'by_student' ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          {/* Select Student */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Chọn học sinh vi phạm:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none text-slate-800"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.stt}. {s.name} ({s.group || 'Lớp'} - {s.gender})
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter for Categories */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Đánh dấu các lỗi vi phạm:
              </label>
              <button
                type="button"
                onClick={onOpenCategoryModal}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm lỗi mới</span>
              </button>
            </div>

            {/* Quick group filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {['Tất cả', ...groups].map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroupFilter(grp)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors ${
                    selectedGroupFilter === grp
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Checklist of Violation Categories */}
            <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {categories
                .filter(c => selectedGroupFilter === 'Tất cả' || c.group === selectedGroupFilter)
                .map((cat) => {
                  const isChecked = selectedCatIds.has(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isChecked ? 'text-blue-950' : 'text-slate-800'}`}>
                            {cat.name}
                          </p>
                          <span className="text-[10px] text-slate-500">{cat.group}</span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                        -{cat.pointsDeducted}đ
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Additional details: Period, Subject, Note */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Tiết vi phạm</span>
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="Tiết 1">Tiết 1</option>
                  <option value="Tiết 2">Tiết 2</option>
                  <option value="Tiết 3">Tiết 3</option>
                  <option value="Tiết 4">Tiết 4</option>
                  <option value="Tiết 5">Tiết 5</option>
                  <option value="Ra chơi">Giờ ra chơi</option>
                  <option value="Đầu giờ">15 phút đầu giờ</option>
                  <option value="Cả buổi">Cả buổi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-slate-400" />
                  <span>Môn học (nếu có)</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Toán, Văn..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Ghi chú chi tiết (nếu có):
              </label>
              <input
                type="text"
                placeholder="VD: Không mang vở bài tập, nói chuyện 3 lần..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSaveByStudent}
            disabled={selectedCatIds.size === 0}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            <span>
              Lưu vi phạm ({selectedCatIds.size} lỗi đã chọn cho em {selectedStudent?.name})
            </span>
          </button>
        </div>
      ) : (
        /* MODE 2: CHẤM NHANH THEO LỖI VI PHẠM */
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                1. Chọn lỗi vi phạm cần chấm:
              </label>
              <button
                type="button"
                onClick={onOpenCategoryModal}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm lỗi mới</span>
              </button>
            </div>
            <select
              value={batchCatId}
              onChange={(e) => setBatchCatId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none text-slate-800"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (-{c.pointsDeducted}đ) • {c.group}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                2. Chọn các học sinh vi phạm:
              </label>
              <button
                type="button"
                onClick={handleSelectAllStudents}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                {selectedStudentIds.size === students.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            {/* Quick search student */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên học sinh..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Students checklist */}
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {students
                .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                .map((s) => {
                  const isChecked = selectedStudentIds.has(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleStudent(s.id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-500'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs font-bold ${isChecked ? 'text-blue-950' : 'text-slate-800'}`}>
                          {s.stt}. {s.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{s.group || ''}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tiết vi phạm</label>
              <select
                value={batchPeriod}
                onChange={(e) => setBatchPeriod(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
              >
                <option value="Tiết 1">Tiết 1</option>
                <option value="Tiết 2">Tiết 2</option>
                <option value="Tiết 3">Tiết 3</option>
                <option value="Tiết 4">Tiết 4</option>
                <option value="Tiết 5">Tiết 5</option>
                <option value="Ra chơi">Ra chơi</option>
                <option value="Cả buổi">Cả buổi</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ghi chú thêm</label>
              <input
                type="text"
                placeholder="Ghi chú chung..."
                value={batchNote}
                onChange={(e) => setBatchNote(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveByCategory}
            disabled={selectedStudentIds.size === 0}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            <span>
              Lưu vi phạm cho {selectedStudentIds.size} học sinh đã chọn
            </span>
          </button>
        </div>
      )}

      {/* Daily Records History for Selected Date */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Vi phạm ngày {formatDateVN(selectedDate)} ({recordsForDate.length} lượt)</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            {dailyStudentsWithViolations.length} học sinh
          </span>
        </div>

        {/* PROMINENT DAILY BULK SEND BUTTON */}
        {dailyStudentsWithViolations.length > 0 && (
          <button
            type="button"
            onClick={handleOpenDailyBulkSend}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 text-yellow-300" />
            <span>Gửi vi phạm ngày này cho PH ({dailyStudentsWithViolations.length} em - Hàng loạt)</span>
          </button>
        )}

        {recordsForDate.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            Chưa có ghi nhận vi phạm nào trong ngày này.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {/* Grouped by student for clarity */}
            {dailyStudentsWithViolations.map((item) => (
              <div
                key={item.student.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{item.student.name}</span>
                    <span className="text-[10px] text-slate-500">({item.student.group || 'Lớp'})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendSingleDaily(item)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 transition-colors"
                      title="Gửi riêng lỗi ngày này cho phụ huynh"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>Gửi tin</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 pl-1 border-l-2 border-slate-200">
                  {item.records.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-[11px] py-0.5">
                      <div className="text-slate-700">
                        <span>• {r.categoryName}</span>
                        {(r.period || r.subject || r.note) && (
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({r.period ? `${r.period} ` : ''}{r.subject ? `• Môn ${r.subject} ` : ''}{r.note ? `• ${r.note}` : ''})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-rose-600 text-[10px]">-{r.pointsDeducted}đ</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Xóa ghi nhận lỗi "${r.categoryName}" của em ${r.studentName}?`)) {
                              onDeleteRecord(r.id);
                              onToast('Đã xóa ghi nhận vi phạm!', 'info');
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                          title="Xóa lỗi"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

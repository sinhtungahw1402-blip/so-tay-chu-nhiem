import React, { useState } from 'react';
import { Student, ClassInfo } from '../types';
import { getZaloChatUrl } from '../utils/zalo';
import { downloadSampleExcel, exportStudentsToExcel } from '../utils/excel';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  FileDown,
  UserPlus
} from 'lucide-react';

interface StudentsViewProps {
  students: Student[];
  classInfo: ClassInfo;
  onOpenAddModal: () => void;
  onOpenEditModal: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onOpenExcelImportModal: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classInfo,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteStudent,
  onOpenExcelImportModal,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Tất cả');

  // Groups list
  const availableGroups = ['Tất cả', ...Array.from(new Set(students.map(s => s.group || 'Tổ 1')))];

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentPhone.includes(searchTerm) ||
      (s.parentName && s.parentName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGroup = selectedGroup === 'Tất cả' || s.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const maleCount = students.filter(s => s.gender === 'Nam').length;
  const femaleCount = students.filter(s => s.gender === 'Nữ').length;

  const handleExportExcel = () => {
    if (students.length === 0) {
      onToast('Lớp chưa có học sinh để xuất file!', 'error');
      return;
    }
    exportStudentsToExcel(students, classInfo.className);
    onToast(`Đã xuất danh sách lớp ${classInfo.className} ra Excel!`, 'success');
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-md mx-auto">
      {/* Header Info & Stats */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Danh sách học sinh</h2>
              <p className="text-[11px] text-slate-500">
                Sĩ số: <strong className="text-slate-800">{students.length}</strong> (Nam: {maleCount}, Nữ: {femaleCount})
              </p>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm HS</span>
            </button>
          </div>
        </div>

        {/* Action bar: Excel options */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={onOpenExcelImportModal}
            className="flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={downloadSampleExcel}
            className="flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải mẫu</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Xuất file</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, SĐT phụ huynh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

        {/* Group pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {availableGroups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedGroup === grp
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-2.5">
        {filteredStudents.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-600">Không tìm thấy học sinh nào</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Thử tìm từ khóa khác hoặc bấm &quot;Thêm HS&quot;</p>
          </div>
        ) : (
          filteredStudents.map((s) => {
            const zaloUrl = getZaloChatUrl(s.parentPhone);
            return (
              <div
                key={s.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                      {s.stt}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-slate-900">{s.name}</h3>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                            s.gender === 'Nữ'
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {s.gender}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {s.group || 'Tổ 1'} {s.dob ? `• Sinh: ${s.dob}` : ''} {s.notes ? `• ${s.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditModal(s)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa học sinh"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa học sinh ${s.name}?`)) {
                          onDeleteStudent(s.id);
                          onToast(`Đã xóa học sinh ${s.name}`, 'info');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa học sinh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Parent Contact and Action row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="text-[11px] text-slate-500">Phụ huynh:</span>
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {s.parentName || 'Quý phụ huynh'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {s.parentPhone ? (
                      <>
                        <a
                          href={`tel:${s.parentPhone}`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>Gọi</span>
                        </a>

                        <a
                          href={zaloUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg border border-blue-200 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-blue-600" />
                          <span>Zalo</span>
                        </a>
                      </>
                    ) : (
                      <span className="text-[10px] text-rose-500 italic">Chưa có SĐT</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

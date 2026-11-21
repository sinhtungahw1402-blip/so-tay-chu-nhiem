import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { X, User, Phone, Calendar, Bookmark, Hash } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  editingStudent?: Student | null;
  nextStt: number;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStudent,
  nextStt,
}) => {
  const [name, setName] = useState('');
  const [stt, setStt] = useState(nextStt);
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dob, setDob] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [group, setGroup] = useState('Tổ 1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name);
      setStt(editingStudent.stt);
      setGender(editingStudent.gender);
      setDob(editingStudent.dob || '');
      setParentPhone(editingStudent.parentPhone || '');
      setParentName(editingStudent.parentName || '');
      setGroup(editingStudent.group || 'Tổ 1');
      setNotes(editingStudent.notes || '');
    } else {
      setName('');
      setStt(nextStt);
      setGender('Nam');
      setDob('');
      setParentPhone('');
      setParentName('');
      setGroup('Tổ 1');
      setNotes('');
    }
    setError('');
  }, [editingStudent, nextStt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên học sinh!');
      return;
    }

    const cleanedPhone = parentPhone.replace(/[^0-9]/g, '');
    if (cleanedPhone && (cleanedPhone.length < 9 || cleanedPhone.length > 11)) {
      setError('Số điện thoại phụ huynh không đúng định dạng!');
      return;
    }

    const savedStudent: Student = {
      id: editingStudent ? editingStudent.id : `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      stt: Number(stt) || nextStt,
      name: name.trim(),
      gender,
      dob: dob.trim(),
      parentPhone: cleanedPhone,
      parentName: parentName.trim(),
      group: group.trim() || 'Tổ 1',
      notes: notes.trim(),
    };

    onSave(savedStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>{editingStudent ? 'Chỉnh sửa thông tin học sinh' : 'Thêm học sinh mới'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">STT</label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  value={stt}
                  onChange={(e) => setStt(parseInt(e.target.value) || 1)}
                  className="w-full pl-8 pr-2 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn An"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none font-medium text-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Giới tính</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGender('Nam')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    gender === 'Nam' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Nữ')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    gender === 'Nữ' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  Nữ
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tổ / Nhóm</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Tổ 1">Tổ 1</option>
                <option value="Tổ 2">Tổ 2</option>
                <option value="Tổ 3">Tổ 3</option>
                <option value="Tổ 4">Tổ 4</option>
                <option value="Tổ 5">Tổ 5</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày sinh</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="VD: 15/03/2012 hoặc 2012-03-15"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center gap-1.5 text-blue-900 text-xs font-bold">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Thông tin liên lạc Phụ huynh (Nhận Zalo)</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Số điện thoại Zalo phụ huynh
              </label>
              <input
                type="tel"
                placeholder="VD: 0987654321 (Dùng mở Zalo chat)"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none font-medium tracking-wide text-slate-800"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                💡 Số này dùng để gửi tin nhắn hoặc ảnh báo cáo trực tiếp qua Zalo phụ huynh.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Họ tên Phụ huynh / Người giám hộ
              </label>
              <input
                type="text"
                placeholder="VD: Bác Nguyễn Văn Bình (Bố em An)"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Ghi chú riêng của GVCN</span>
            </label>
            <input
              type="text"
              placeholder="VD: Cán sự lớp, học sinh bán trú, cần kèm thêm..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-xl transition-all"
            >
              {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

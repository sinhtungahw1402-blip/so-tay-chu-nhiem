import React, { useState, useEffect } from 'react';
import { ViolationCategory, ViolationGroup } from '../types';
import { X, AlertOctagon, Plus, Trash2 } from 'lucide-react';

interface ViolationCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: ViolationCategory) => void;
  onDelete?: (id: string) => void;
  editingCategory?: ViolationCategory | null;
}

export const ViolationCategoryModal: React.FC<ViolationCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingCategory,
}) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState<ViolationGroup>('Kỷ luật - Tác phong');
  const [pointsDeducted, setPointsDeducted] = useState(2);
  const [severity, setSeverity] = useState<'nhe' | 'trung_binh' | 'nang'>('nhe');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setGroup(editingCategory.group);
      setPointsDeducted(editingCategory.pointsDeducted);
      setSeverity(editingCategory.severity);
    } else {
      setName('');
      setGroup('Kỷ luật - Tác phong');
      setPointsDeducted(2);
      setSeverity('nhe');
    }
    setError('');
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên lỗi vi phạm!');
      return;
    }

    const savedCat: ViolationCategory = {
      id: editingCategory ? editingCategory.id : `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      group,
      pointsDeducted: Math.max(0, pointsDeducted),
      severity,
      isCustom: true,
    };

    onSave(savedCat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-600 text-white rounded-xl">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {editingCategory ? 'Chỉnh sửa lỗi vi phạm' : 'Thêm mới lỗi vi phạm'}
              </h2>
              <p className="text-xs text-amber-700">GVCN tự quy định theo nội quy của trường/lớp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên lỗi vi phạm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Không mặc đồng phục, Nói chuyện riêng..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none font-medium text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nhóm vi phạm</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as ViolationGroup)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Chuyên cần">Chuyên cần</option>
                <option value="Học tập">Học tập</option>
                <option value="Kỷ luật - Tác phong">Kỷ luật - Tác phong</option>
                <option value="Vệ sinh - Lao động">Vệ sinh - Lao động</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Điểm trừ nề nếp
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pointsDeducted}
                  onChange={(e) => setPointsDeducted(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none font-bold text-rose-600"
                />
                <span className="ml-2 text-xs text-slate-500 font-medium">điểm</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ vi phạm</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('nhe')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  severity === 'nhe'
                    ? 'bg-amber-100 border-amber-400 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Nhẹ
              </button>
              <button
                type="button"
                onClick={() => setSeverity('trung_binh')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  severity === 'trung_binh'
                    ? 'bg-orange-100 border-orange-400 text-orange-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Trung bình
              </button>
              <button
                type="button"
                onClick={() => setSeverity('nang')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  severity === 'nang'
                    ? 'bg-rose-100 border-rose-400 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Nghiêm trọng
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            {editingCategory && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa lỗi này khỏi danh mục?')) {
                    onDelete(editingCategory.id);
                    onClose();
                  }
                }}
                className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                title="Xóa lỗi"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{editingCategory ? 'Cập nhật lỗi' : 'Lưu lỗi mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

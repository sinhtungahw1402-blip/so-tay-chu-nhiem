import React, { useState, useRef } from 'react';
import { ClassInfo, ViolationCategory, AppBackupData } from '../types';
import { createBackupPayload, restoreBackupPayload, clearAllData, DEFAULT_VIOLATION_CATEGORIES, SAMPLE_STUDENTS, DEFAULT_CLASS_INFO } from '../utils/storage';
import {
  Settings,
  School,
  AlertOctagon,
  Download,
  Upload,
  Smartphone,
  Plus,
  Edit2,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SettingsViewProps {
  classInfo: ClassInfo;
  categories: ViolationCategory[];
  onSaveClassInfo: (info: ClassInfo) => void;
  onOpenAddCategory: () => void;
  onOpenEditCategory: (category: ViolationCategory) => void;
  onDeleteCategory: (id: string) => void;
  onReloadAllData: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  classInfo,
  categories,
  onSaveClassInfo,
  onOpenAddCategory,
  onOpenEditCategory,
  onDeleteCategory,
  onReloadAllData,
  onToast,
}) => {
  // Local state for Class Info Form
  const [formData, setFormData] = useState<ClassInfo>(classInfo);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveClassInfo(formData);
    onToast('Đã lưu thông tin lớp học thành công!', 'success');
  };

  // Export Backup File (.json)
  const handleExportBackup = () => {
    const backupData = createBackupPayload();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const safeClassName = classInfo.className.replace(/\s+/g, '_');
    const fileName = `SaoLuu_SoChuNhiem_Lop_${safeClassName}_${dateStr}.json`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onToast('Đã tạo và tải file sao lưu dữ liệu (.json) về máy!', 'success');
  };

  // Restore Backup File (.json)
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string) as AppBackupData;
        const res = restoreBackupPayload(jsonContent, restoreMode);
        if (res.success) {
          onToast('Phục hồi dữ liệu thành công! Đang tải lại...', 'success');
          onReloadAllData();
        } else {
          onToast(res.message, 'error');
        }
      } catch (err) {
        console.error(err);
        onToast('Tệp không đúng định dạng JSON sao lưu của ứng dụng!', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetSample = () => {
    if (confirm('Bạn có muốn khôi phục lại dữ liệu mẫu ban đầu để dùng thử nghiệm?')) {
      clearAllData();
      onReloadAllData();
      onToast('Đã khôi phục dữ liệu mẫu!', 'success');
    }
  };

  return (
    <div className="p-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* 1. THÔNG TIN LỚP HỌC */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Thông tin Lớp & GVCN</h2>
            <p className="text-[11px] text-slate-500">Hiển thị trên phiếu báo cáo và tin nhắn gửi phụ huynh</p>
          </div>
        </div>

        <form onSubmit={handleSaveInfo} className="space-y-3 pt-1 border-t border-slate-100 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tên lớp chủ nhiệm <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: 9A1"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Năm học</label>
              <input
                type="text"
                placeholder="VD: 2026 - 2027"
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tên trường
            </label>
            <input
              type="text"
              placeholder="VD: THCS Lê Quý Đôn"
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Họ tên GVCN
              </label>
              <input
                type="text"
                placeholder="VD: Cô Nguyễn Thị Mai"
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                SĐT GVCN
              </label>
              <input
                type="text"
                placeholder="VD: 0912345678"
                value={formData.teacherPhone}
                onChange={(e) => setFormData({ ...formData, teacherPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thông tin lớp</span>
          </button>
        </form>
      </div>

      {/* 2. QUẢN LÝ DANH MỤC LỖI VI PHẠM (THÊM/SỬA/XÓA BỞI GVCN) */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Danh mục lỗi vi phạm</h2>
              <p className="text-[11px] text-slate-500">GVCN tự quy định & tùy chỉnh số điểm trừ</p>
            </div>
          </div>

          <button
            onClick={onOpenAddCategory}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm lỗi</span>
          </button>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 pt-1 border-t border-slate-100">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs hover:bg-slate-100 transition-colors"
            >
              <div>
                <p className="font-bold text-slate-800">{c.name}</p>
                <p className="text-[10px] text-slate-500">{c.group}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                  -{c.pointsDeducted}đ
                </span>
                <button
                  onClick={() => onOpenEditCategory(c)}
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Xóa lỗi "${c.name}" khỏi danh mục?`)) {
                      onDeleteCategory(c.id);
                      onToast('Đã xóa lỗi vi phạm khỏi danh mục!', 'info');
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Xóa lỗi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SAO LƯU & PHỤC HỒI DỮ LIỆU ĐỔI ĐIỆN THOẠI */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Sao lưu & Đổi máy</h2>
            <p className="text-[11px] text-slate-500">Dữ liệu độc lập trên từng máy, không lo lẫn lộn</p>
          </div>
        </div>

        {/* Explain local-first multi-device security */}
        <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl text-[11px] text-purple-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Sử dụng trên nhiều điện thoại độc lập:</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Ứng dụng lưu trữ toàn bộ dữ liệu <strong>trực tiếp trong bộ nhớ của từng điện thoại</strong> (không dùng chung server). Giáo viên trường khác hoặc lớp khác trên máy của họ hoàn toàn không thể xem hay làm nhầm lẫn dữ liệu của thầy/cô!
          </p>
        </div>

        {/* Backup and Restore Action Buttons */}
        <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
          <div>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Sao lưu dữ liệu ra file (.json)</span>
            </button>
            <p className="text-[10px] text-slate-500 mt-1 text-center">
              Tải file dự phòng về máy, có thể gửi qua Zalo &quot;Cloud của tôi&quot; hoặc Google Drive để lưu trữ.
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-700">Chế độ phục hồi:</span>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={restoreMode === 'overwrite'}
                    onChange={() => setRestoreMode('overwrite')}
                  />
                  <span>Thay thế toàn bộ (Đổi máy)</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={restoreMode === 'merge'}
                    onChange={() => setRestoreMode('merge')}
                  />
                  <span>Gộp thêm</span>
                </label>
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-purple-600" />
              <span>Chọn file sao lưu (.json) để phục hồi</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </div>
        </div>

        {/* How to transfer to new phone instruction */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-[11px]">
          <p className="font-bold text-slate-800">📱 Hướng dẫn chuyển sang điện thoại mới:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-600 pl-1">
            <li>Trên điện thoại cũ: Bấm nút <strong>&quot;Sao lưu dữ liệu ra file (.json)&quot;</strong>.</li>
            <li>Gửi file sao lưu đó qua Zalo sang điện thoại mới (hoặc lưu Google Drive).</li>
            <li>Trên điện thoại mới: Mở ứng dụng, bấm <strong>&quot;Chọn file sao lưu (.json) để phục hồi&quot;</strong>.</li>
            <li>Toàn bộ học sinh và lịch sử vi phạm sẽ xuất hiện ngay lập tức!</li>
          </ol>
        </div>
      </div>

      {/* 4. DỮ LIỆU THỬ NGHIỆM */}
      <div className="p-3 text-center">
        <button
          onClick={handleResetSample}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Tải lại dữ liệu mẫu lớp 9A1 ban đầu</span>
        </button>
      </div>
    </div>
  );
};

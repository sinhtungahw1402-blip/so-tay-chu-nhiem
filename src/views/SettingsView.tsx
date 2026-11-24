import React, { useState, useRef } from 'react';
import { ClassInfo, ViolationCategory, AppBackupData, GatewayConfig, FailedDispatchRecord } from '../types';
import { createBackupPayload, restoreBackupPayload, clearAllData } from '../utils/storage';
import { copyToClipboard } from '../utils/zalo';
import { formatDateVN } from '../utils/date';
import {
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
  Info,
  Radio,
  PhoneOff,
  Copy,
  Phone,
  CheckCircle2,
  Clock,
  Cloud,
  Sparkles
} from 'lucide-react';

interface SettingsViewProps {
  classInfo: ClassInfo;
  categories: ViolationCategory[];
  gatewayConfig: GatewayConfig;
  failedDispatches: FailedDispatchRecord[];
  onSaveClassInfo: (info: ClassInfo) => void;
  onSaveGatewayConfig: (config: GatewayConfig) => void;
  onClearFailedDispatches: () => void;
  onOpenAddCategory: () => void;
  onOpenEditCategory: (category: ViolationCategory) => void;
  onDeleteCategory: (id: string) => void;
  onReloadAllData: () => void;
  onOpenCloudSync?: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  classInfo,
  categories,
  gatewayConfig,
  failedDispatches,
  onSaveClassInfo,
  onSaveGatewayConfig,
  onClearFailedDispatches,
  onOpenAddCategory,
  onOpenEditCategory,
  onDeleteCategory,
  onReloadAllData,
  onOpenCloudSync,
  onToast,
}) => {
  const [formData, setFormData] = useState<ClassInfo>(classInfo);
  const [gatewayForm, setGatewayForm] = useState<GatewayConfig>(gatewayConfig);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveClassInfo(formData);
    onToast('Đã lưu thông tin lớp học thành công!', 'success');
  };

  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGatewayConfig(gatewayForm);
    onToast('Đã lưu cấu hình cổng gửi tin tự động!', 'success');
  };

  // Test webhook connection if configured
  const handleTestWebhook = async () => {
    if (!gatewayForm.webhookUrl || !gatewayForm.webhookUrl.trim().startsWith('http')) {
      onToast('Vui lòng nhập đường dẫn Webhook hợp lệ (bắt đầu bằng http:// hoặc https://)!', 'error');
      return;
    }

    setIsTestingWebhook(true);
    try {
      const res = await fetch(gatewayForm.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: true,
          message: 'Kiểm tra kết nối cổng gửi tự động Sổ Chủ Nhiệm Số',
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        onToast('Kết nối cổng gửi Zalo/Webhook thành công!', 'success');
      } else {
        onToast(`Cổng phản hồi mã lỗi: ${res.status} (${res.statusText})`, 'error');
      }
    } catch (err: unknown) {
      const errStr = err instanceof Error ? err.message : String(err);
      onToast(`Không thể kết nối đến Webhook: ${errStr}`, 'error');
    } finally {
      setIsTestingWebhook(false);
    }
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

  // Copy failed list
  const handleCopyFailedList = async () => {
    if (failedDispatches.length === 0) return;
    const lines = [
      `📋 DANH SÁCH CÁC SỐ CHƯA GỬI ĐƯỢC ZALO (${failedDispatches.length} lượt):`,
      ...failedDispatches.map((r, idx) => {
        return `${idx + 1}. Em ${r.studentName} - SĐT: ${r.parentPhone || 'Chưa có'} (${r.date}): ${r.reason}`;
      }),
      `\n* GVCN liên hệ phụ huynh bằng cách gọi điện trực tiếp hoặc gửi tin nhắn SMS.`,
    ];
    const success = await copyToClipboard(lines.join('\n'));
    if (success) {
      onToast('Đã sao chép danh sách số chưa gửi được vào bộ nhớ tạm!', 'success');
    }
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
            <p className="text-[11px] text-slate-500">Hiển thị trên thông báo và báo cáo</p>
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

      {/* 2. SỔ LƯU CÁC SỐ CHƯA GỬI ĐƯỢC ZALO (PERSISTENT LOG) */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <PhoneOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Các số chưa gửi được Zalo</h2>
              <p className="text-[11px] text-slate-500">Lưu lại các số lỗi hoặc không tìm thấy để gọi lại</p>
            </div>
          </div>

          {failedDispatches.length > 0 && (
            <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
              {failedDispatches.length} số
            </span>
          )}
        </div>

        {failedDispatches.length === 0 ? (
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center text-xs text-emerald-800">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="font-bold">Không có số điện thoại nào bị lỗi!</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Tất cả phụ huynh đều đã được gửi tin thuận lợi.</p>
          </div>
        ) : (
          <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyFailedList}
                className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép danh sách ({failedDispatches.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa lịch sử các số chưa gửi được?')) {
                    onClearFailedDispatches();
                    onToast('Đã xóa lịch sử số lỗi!', 'info');
                  }
                }}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                title="Xóa danh sách"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {failedDispatches.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px]"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{r.studentName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {r.parentPhone || 'Chưa có SĐT'}
                      </span>
                    </div>
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium truncate">
                      ⚠️ {r.reason} ({formatDateVN(r.date)})
                    </p>
                  </div>

                  {r.parentPhone && (
                    <a
                      href={`tel:${r.parentPhone}`}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1 text-[10px] shrink-0 shadow-xs"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Gọi điện</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. CẤU HÌNH CỔNG GỬI ZALO TỰ ĐỘNG (TÙY CHỌN) */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Cổng gửi tin tự động</h2>
            <p className="text-[11px] text-slate-500">Tùy chọn kết nối Zalo Bot, ZNS hoặc Webhook</p>
          </div>
        </div>

        <form onSubmit={handleSaveGateway} className="space-y-3 pt-1 border-t border-slate-100 text-xs">
          <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-2xl text-[11px] text-teal-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Chế độ gửi trực tiếp mặc định:</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Mặc định ứng dụng sử dụng <strong>Trình gửi tự động tích hợp sẵn</strong>: Tự động kiểm tra số điện thoại, gửi hàng loạt và tự động bỏ qua số lỗi mà không làm gián đoạn danh sách. Nếu thầy/cô có Webhook Zalo Bot riêng, hãy dán liên kết bên dưới.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Đường dẫn Webhook Zalo Bot / Gateway (Tùy chọn):
            </label>
            <input
              type="url"
              placeholder="VD: https://zalo-bot.your-school.edu.vn/webhook hoặc bỏ trống"
              value={gatewayForm.webhookUrl}
              onChange={(e) => setGatewayForm({ ...gatewayForm, webhookUrl: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tốc độ gửi giữa các tin:
              </label>
              <select
                value={gatewayForm.autoSendDelayMs}
                onChange={(e) => setGatewayForm({ ...gatewayForm, autoSendDelayMs: parseInt(e.target.value) || 400 })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
              >
                <option value={200}>Nhanh (200ms)</option>
                <option value={400}>Bình thường (400ms)</option>
                <option value={800}>Ổn định (800ms)</option>
                <option value={1500}>Chậm (1.5s)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                disabled={isTestingWebhook || !gatewayForm.webhookUrl}
                onClick={handleTestWebhook}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isTestingWebhook ? 'Đang thử...' : 'Thử kết nối'}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Lưu cấu hình gửi</span>
          </button>
        </form>
      </div>

      {/* 4. QUẢN LÝ DANH MỤC LỖI VI PHẠM (THÊM/SỬA/XÓA BỞI GVCN) */}
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

      {/* 5. ĐỒNG BỘ ĐÁM MÂY (MÃ PIN 6 SỐ) */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-4 rounded-3xl border-2 border-indigo-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Cloud className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
              <span>Đồng bộ nhanh Điện thoại & Máy tính</span>
              <span className="text-[10px] bg-indigo-200 text-indigo-900 font-black px-1.5 py-0.5 rounded-full">
                Mã PIN 6 số
              </span>
            </h2>
            <p className="text-[11px] text-indigo-700">Chuyển dữ liệu sang máy tính dùng Zalo Web tức thì</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCloudSync}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Mở tính năng Đồng bộ Đám mây (Mã PIN)</span>
        </button>
      </div>

      {/* 6. SAO LƯU & PHỤC HỒI DỮ LIỆU ĐỔI ĐIỆN THOẠI (FILE .JSON) */}
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

        <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
          <div>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Sao lưu dữ liệu ra file (.json)</span>
            </button>
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
                  <span>Thay thế toàn bộ</span>
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
      </div>

      {/* 6. DỮ LIỆU THỬ NGHIỆM */}
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

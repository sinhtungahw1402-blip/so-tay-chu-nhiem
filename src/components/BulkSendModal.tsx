import React, { useState, useEffect } from 'react';
import { Student, ViolationRecord, GatewayConfig, FailedDispatchRecord } from '../types';
import { dispatchMessageDirectly, copyToClipboard } from '../utils/zalo';
import {
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Users,
  Eye,
  Phone,
  Check,
  PhoneOff,
  Clock,
  Sparkles
} from 'lucide-react';

export interface BulkSendTarget {
  student: Student;
  records: ViolationRecord[];
  message: string;
  date: string;
}

interface BulkSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  targets: BulkSendTarget[];
  gatewayConfig: GatewayConfig;
  onSaveFailedRecords: (failed: FailedDispatchRecord[]) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ItemStatus = 'idle' | 'sending' | 'success' | 'failed';

export const BulkSendModal: React.FC<BulkSendModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  targets,
  gatewayConfig,
  onSaveFailedRecords,
  onToast,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusMap, setStatusMap] = useState<Record<string, { status: ItemStatus; reason?: string }>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize selected IDs when targets change or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(targets.map(t => t.student.id)));
      const initialMap: Record<string, { status: ItemStatus; reason?: string }> = {};
      targets.forEach(t => {
        initialMap[t.student.id] = { status: 'idle' };
      });
      setStatusMap(initialMap);
      setIsRunning(false);
      setIsFinished(false);
      setCurrentIndex(0);
      setPreviewStudentId(targets[0]?.student.id || null);
    }
  }, [isOpen, targets]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (isRunning) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isRunning) return;
    if (selectedIds.size === targets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(targets.map(t => t.student.id)));
    }
  };

  // Run the batch sending process
  const handleStartSending = async () => {
    if (selectedIds.size === 0) {
      onToast('Vui lòng chọn ít nhất 1 học sinh để gửi!', 'error');
      return;
    }

    setIsRunning(true);
    setIsFinished(false);

    const selectedTargets = targets.filter(t => selectedIds.has(t.student.id));
    const newStatusMap: Record<string, { status: ItemStatus; reason?: string }> = { ...statusMap };
    const newlyFailed: FailedDispatchRecord[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < selectedTargets.length; i++) {
      setCurrentIndex(i + 1);
      const target = selectedTargets[i];
      const stuId = target.student.id;

      // Mark sending
      newStatusMap[stuId] = { status: 'sending' };
      setStatusMap({ ...newStatusMap });

      // Dispatch
      try {
        const result = await dispatchMessageDirectly(
          target.student.parentPhone,
          target.message,
          target.student.name,
          gatewayConfig
        );

        if (result.success) {
          newStatusMap[stuId] = { status: 'success' };
          successCount++;
        } else {
          const reason = result.reason || 'Lỗi không xác định khi kết nối Zalo';
          newStatusMap[stuId] = { status: 'failed', reason };
          failedCount++;

          newlyFailed.push({
            id: `fail_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            studentId: target.student.id,
            studentName: target.student.name,
            parentPhone: target.student.parentPhone || '',
            date: target.date,
            reason,
            message: target.message,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : 'Lỗi kết nối mạng';
        newStatusMap[stuId] = { status: 'failed', reason };
        failedCount++;

        newlyFailed.push({
          id: `fail_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          studentId: target.student.id,
          studentName: target.student.name,
          parentPhone: target.student.parentPhone || '',
          date: target.date,
          reason,
          message: target.message,
          createdAt: new Date().toISOString(),
        });
      }

      setStatusMap({ ...newStatusMap });
    }

    setIsRunning(false);
    setIsFinished(true);

    // Save failed dispatches to persistent storage
    if (newlyFailed.length > 0) {
      onSaveFailedRecords(newlyFailed);
      onToast(
        `Hoàn tất gửi hàng loạt! Thành công: ${successCount}, Không gửi được: ${failedCount} (Đã ghi nhận danh sách lỗi)`,
        'info'
      );
    } else {
      onToast(`Tuyệt vời! Đã gửi thành công cho toàn bộ ${successCount} phụ huynh!`, 'success');
    }
  };

  // Filter list of failed targets for summary
  const failedTargets = targets.filter(t => statusMap[t.student.id]?.status === 'failed');
  const successTargets = targets.filter(t => statusMap[t.student.id]?.status === 'success');

  // Copy failed numbers report
  const handleCopyFailedList = async () => {
    if (failedTargets.length === 0) return;
    const lines = [
      `📋 DANH SÁCH SĐT PHỤ HUYNH CHƯA GỬI ĐƯỢC ZALO (${failedTargets.length} em):`,
      ...failedTargets.map((t, idx) => {
        const reason = statusMap[t.student.id]?.reason || 'Không kết nối được';
        return `${idx + 1}. Em ${t.student.name} - SĐT: ${t.student.parentPhone || 'Chưa có'} (Lý do: ${reason})`;
      }),
      `\n* GVCN liên hệ gọi điện trực tiếp hoặc gửi tin nhắn SMS dự phòng.`,
    ];
    const success = await copyToClipboard(lines.join('\n'));
    if (success) {
      onToast('Đã sao chép danh sách số chưa gửi được!', 'success');
    }
  };

  const selectedPreviewTarget = targets.find(t => t.student.id === previewStudentId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 backdrop-blur-xs rounded-xl border border-white/20">
              <Send className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                <span>{title}</span>
                <span className="text-[10px] bg-yellow-400 text-blue-950 font-black px-1.5 py-0.5 rounded-full">
                  Hàng loạt
                </span>
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Top Control Bar: Total count, select all, batch status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">
                {targets.length} học sinh có vi phạm
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                (Đã chọn: <strong className="text-blue-600">{selectedIds.size}</strong>)
              </span>
            </div>

            {!isRunning && !isFinished && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                {selectedIds.size === targets.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            )}
          </div>

          {/* Progress bar when sending */}
          {isRunning && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span>Đang gửi tự động... ({currentIndex}/{selectedIds.size})</span>
                </span>
                <span>{Math.round((currentIndex / selectedIds.size) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentIndex / selectedIds.size) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-blue-700 italic">
                💡 Hệ thống tự động chuyển tiếp phụ huynh khác nếu gặp số không kết nối được.
              </p>
            </div>
          )}

          {/* Finished Summary Results */}
          {isFinished && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Thành công</span>
                  <div className="text-xl font-black text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{successTargets.length}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600">phụ huynh đã nhận</span>
                </div>

                <div className={`p-3 rounded-2xl border ${failedTargets.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${failedTargets.length > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                    Không gửi được
                  </span>
                  <div className={`text-xl font-black flex items-center justify-center gap-1 ${failedTargets.length > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                    {failedTargets.length > 0 ? <AlertTriangle className="w-5 h-5 text-rose-500" /> : <CheckCircle2 className="w-5 h-5 text-slate-400" />}
                    <span>{failedTargets.length}</span>
                  </div>
                  <span className={`text-[10px] ${failedTargets.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {failedTargets.length > 0 ? 'cần kiểm tra lại' : '0 số lỗi'}
                  </span>
                </div>
              </div>

              {/* Failed List Callout with actions */}
              {failedTargets.length > 0 && (
                <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                      <PhoneOff className="w-4 h-4 text-rose-600" />
                      <span>Các số chưa gửi được ({failedTargets.length}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyFailedList}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Sao chép danh sách</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {failedTargets.map((t) => {
                      const reason = statusMap[t.student.id]?.reason || 'Không kết nối được';
                      return (
                        <div
                          key={t.student.id}
                          className="p-2 bg-white rounded-xl border border-rose-200 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{t.student.name}</span>
                            <span className="text-slate-500 ml-1.5 font-mono">
                              ({t.student.parentPhone || 'Chưa có SĐT'})
                            </span>
                            <p className="text-[10px] text-rose-600 font-medium mt-0.5">⚠️ {reason}</p>
                          </div>
                          {t.student.parentPhone && (
                            <a
                              href={`tel:${t.student.parentPhone}`}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold flex items-center gap-1 text-[10px]"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Gọi</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Targets Checklist */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>Danh sách học sinh nhận tin ({targets.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Chạm tên để xem trước tin</span>
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
              {targets.map((t) => {
                const isChecked = selectedIds.has(t.student.id);
                const status = statusMap[t.student.id]?.status || 'idle';
                const reason = statusMap[t.student.id]?.reason;
                const isPreview = previewStudentId === t.student.id;

                return (
                  <div
                    key={t.student.id}
                    className={`p-2.5 flex items-center justify-between transition-colors ${
                      isPreview ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        disabled={isRunning}
                        onClick={() => toggleSelect(t.student.id)}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div
                        className="cursor-pointer flex-1 min-w-0"
                        onClick={() => setPreviewStudentId(t.student.id)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 truncate text-xs">
                            {t.student.name}
                          </span>
                          <span className="text-[10px] text-slate-400">({t.student.group || 'Lớp'})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-500">
                            {t.student.parentPhone || 'Chưa có SĐT'}
                          </span>
                          <span className="text-[10px] text-rose-600 font-semibold">
                            {t.records.length} lỗi
                          </span>
                        </div>
                        {status === 'failed' && reason && (
                          <p className="text-[10px] text-rose-600 font-medium mt-0.5 truncate">
                            ❌ {reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 ml-2">
                      {status === 'idle' && (
                        <button
                          type="button"
                          onClick={() => setPreviewStudentId(t.student.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                          title="Xem trước tin nhắn"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {status === 'sending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg animate-pulse">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Đang gửi...</span>
                        </span>
                      )}
                      {status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã gửi</span>
                        </span>
                      )}
                      {status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Lỗi</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Message Preview (Compact format - NO parent full name) */}
          {selectedPreviewTarget && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Xem trước mẫu tin nhắn ngắn gọn (Em {selectedPreviewTarget.student.name}):</span>
                </span>
                <span className="text-[10px] text-slate-400">Không ghi họ tên PH</span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-sans text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed selectable-text">
                {selectedPreviewTarget.message}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            disabled={isRunning}
            onClick={onClose}
            className="py-2.5 px-4 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-colors disabled:opacity-40"
          >
            {isFinished ? 'Đóng' : 'Hủy'}
          </button>

          {!isFinished ? (
            <button
              type="button"
              disabled={isRunning || selectedIds.size === 0}
              onClick={handleStartSending}
              className="flex-1 py-2.5 px-4 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-blue-500/25 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-yellow-300" />
              <span>
                {isRunning
                  ? `Đang gửi (${currentIndex}/${selectedIds.size})...`
                  : `Bắt đầu gửi hàng loạt (${selectedIds.size} phụ huynh)`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                // Retry failed
                if (failedTargets.length > 0) {
                  setSelectedIds(new Set(failedTargets.map(t => t.student.id)));
                  setIsFinished(false);
                } else {
                  onClose();
                }
              }}
              className="flex-1 py-2.5 px-4 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {failedTargets.length > 0 ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Thử gửi lại cho {failedTargets.length} số lỗi</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất & Đóng</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

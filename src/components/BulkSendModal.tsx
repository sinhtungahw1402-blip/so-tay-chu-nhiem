import React, { useState, useEffect } from 'react';
import { Student, ViolationRecord, GatewayConfig, FailedDispatchRecord } from '../types';
import {
  dispatchMessageDirectly,
  copyToClipboard,
  getZaloChatUrl,
  validateVietnamesePhone,
  generateClassDailySummaryMessage,
  generateClassPeriodSummaryMessage,
  shareViaMobile
} from '../utils/zalo';
import {
  generateZaloWebAutoScript,
  generateZaloWebBatchPayload,
  generateZaloWebBookmarklet
} from '../utils/zaloWebScript';
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
  Sparkles,
  MessageCircle,
  Share2,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Bot,
  Terminal,
  Monitor,
  Bookmark
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
  className?: string;
  sendType?: 'daily' | 'period';
  periodLabel?: string;
  initialMode?: 'group' | 'individual' | 'zaloweb';
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
  className = 'Lớp',
  sendType = 'daily',
  periodLabel,
  initialMode = 'group',
  gatewayConfig,
  onSaveFailedRecords,
  onToast,
}) => {
  // Modal Mode: 'group' (Gửi vào nhóm Zalo lớp), 'individual' (Gửi riêng từng PH), 'zaloweb' (Tự động Zalo Web trên máy tính)
  const [sendMode, setSendMode] = useState<'group' | 'individual' | 'zaloweb'>(initialMode);
  const [zaloWebMethod, setZaloWebMethod] = useState<'bookmark' | 'console'>('bookmark');
  const [hasCopiedScript, setHasCopiedScript] = useState(false);
  const [hasCopiedBatchData, setHasCopiedBatchData] = useState(false);
  const [hasCopiedBookmarklet, setHasCopiedBookmarklet] = useState(false);

  // Selected targets for individual queue
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusMap, setStatusMap] = useState<Record<string, { status: ItemStatus; reason?: string }>>({});
  const [activeQueueIndex, setActiveQueueIndex] = useState(0);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const [isRunningWebhook, setIsRunningWebhook] = useState(false);
  const [copiedGroupMessage, setCopiedGroupMessage] = useState(false);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSendMode(initialMode);
      setSelectedIds(new Set(targets.map(t => t.student.id)));
      const initialMap: Record<string, { status: ItemStatus; reason?: string }> = {};
      targets.forEach(t => {
        const val = validateVietnamesePhone(t.student.parentPhone || '');
        if (!val.valid) {
          initialMap[t.student.id] = { status: 'failed', reason: val.reason };
        } else {
          initialMap[t.student.id] = { status: 'idle' };
        }
      });
      setStatusMap(initialMap);
      setActiveQueueIndex(0);
      setPreviewStudentId(targets[0]?.student.id || null);
      setIsRunningWebhook(false);
      setCopiedGroupMessage(false);
    }
  }, [isOpen, targets, initialMode]);

  if (!isOpen) return null;

  const isPeriod = sendType === 'period' || Boolean(periodLabel);

  // Generate Group Message for the whole class
  const groupMessage = isPeriod
    ? generateClassPeriodSummaryMessage(className, periodLabel || 'kỳ này', targets)
    : generateClassDailySummaryMessage(className, targets[0]?.date || '', targets);

  // Active queue target
  const activeTarget = targets[activeQueueIndex];
  const activeValidation = activeTarget ? validateVietnamesePhone(activeTarget.student.parentPhone || '') : null;

  // Counts
  const totalCount = targets.length;
  const successTargets = targets.filter(t => statusMap[t.student.id]?.status === 'success');
  const failedTargets = targets.filter(t => statusMap[t.student.id]?.status === 'failed');
  const remainingTargets = targets.filter(t => statusMap[t.student.id]?.status === 'idle');

  // Handler: Copy & Open Zalo Group
  const handleSendToZaloGroup = async () => {
    const copied = await copyToClipboard(groupMessage);
    if (copied) {
      setCopiedGroupMessage(true);
      onToast('Đã sao chép thông báo nề nếp lớp! Đang mở Zalo...', 'success');
      setTimeout(() => setCopiedGroupMessage(false), 4000);
    }

    // Try web share first on mobile
    const shared = await shareViaMobile({
      title: `Thông báo nề nếp lớp ${className}`,
      text: groupMessage,
    });

    if (!shared) {
      // Open Zalo web/app
      window.open('https://zalo.me/', '_blank');
    }
  };

  const reportTitle = isPeriod ? `Báo cáo ${periodLabel || 'theo tuần'}` : `Báo cáo ngày ${targets[0]?.date || ''}`;
  const bookmarkletHref = generateZaloWebBookmarklet();

  // Handler: Copy Batch Payload for Bookmarklet (NO F12)
  const handleCopyBatchData = async () => {
    const payload = generateZaloWebBatchPayload(targets, className, reportTitle);
    const ok = await copyToClipboard(payload);
    if (ok) {
      setHasCopiedBatchData(true);
      onToast('Đã chép dữ liệu gửi! Hãy sang tab Zalo Web và bấm Dấu trang "⚡ Gửi Zalo Sổ Chủ Nhiệm".', 'success');
      setTimeout(() => setHasCopiedBatchData(false), 5000);
    }
  };

  // Handler: Copy Bookmarklet URL for manual bookmark creation
  const handleCopyBookmarkletCode = async () => {
    const ok = await copyToClipboard(bookmarkletHref);
    if (ok) {
      setHasCopiedBookmarklet(true);
      onToast('Đã chép mã Dấu trang! Chuột phải vào Thanh dấu trang ➔ Thêm trang ➔ Dán vào ô URL.', 'success');
      setTimeout(() => setHasCopiedBookmarklet(false), 5000);
    }
  };

  // Handler: Copy Zalo Web Auto Script (F12 Console)
  const handleCopyZaloWebScript = async () => {
    const script = generateZaloWebAutoScript(targets, className, reportTitle);
    const ok = await copyToClipboard(script);
    if (ok) {
      setHasCopiedScript(true);
      onToast('Đã sao chép mã F12! Nhớ gõ "allow pasting" + Enter trước nếu trình duyệt chặn dán.', 'success');
      setTimeout(() => setHasCopiedScript(false), 5000);
    }
  };

  // Handler: 1-Tap Send Individual Zalo
  const handleSendSingleInQueue = async (target: BulkSendTarget) => {
    const val = validateVietnamesePhone(target.student.parentPhone || '');
    if (!val.valid) {
      onToast(`SĐT em ${target.student.name} không hợp lệ: ${val.reason}`, 'error');
      setStatusMap(prev => ({
        ...prev,
        [target.student.id]: { status: 'failed', reason: val.reason },
      }));
      onSaveFailedRecords([
        {
          id: `fail_${Date.now()}_${target.student.id}`,
          studentId: target.student.id,
          studentName: target.student.name,
          parentPhone: target.student.parentPhone || '',
          date: target.date,
          reason: val.reason || 'Số điện thoại không hợp lệ',
          message: target.message,
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    // 1. Copy message
    await copyToClipboard(target.message);
    onToast(`Đã sao chép tin nhắn em ${target.student.name}! Đang mở Zalo...`, 'success');

    // 2. Mark as sent in state
    setStatusMap(prev => ({
      ...prev,
      [target.student.id]: { status: 'success' },
    }));

    // 3. Open Zalo chat
    const zaloUrl = getZaloChatUrl(val.cleanedPhone);
    window.open(zaloUrl, '_blank');

    // 4. Move to next target in queue
    if (activeQueueIndex < targets.length - 1) {
      setActiveQueueIndex(prev => prev + 1);
    }
  };

  // Handler: Skip with error
  const handleSkipWithError = (target: BulkSendTarget, customReason?: string) => {
    const reason = customReason || 'Không tìm thấy Zalo / Không thể kết nối';
    setStatusMap(prev => ({
      ...prev,
      [target.student.id]: { status: 'failed', reason },
    }));

    onSaveFailedRecords([
      {
        id: `fail_${Date.now()}_${target.student.id}`,
        studentId: target.student.id,
        studentName: target.student.name,
        parentPhone: target.student.parentPhone || '',
        date: target.date,
        reason,
        message: target.message,
        createdAt: new Date().toISOString(),
      },
    ]);

    onToast(`Đã ghi nhận số lỗi em ${target.student.name} và chuyển tiếp!`, 'info');

    // Move to next in queue
    if (activeQueueIndex < targets.length - 1) {
      setActiveQueueIndex(prev => prev + 1);
    }
  };

  // Handler: Webhook automated dispatch (if configured)
  const handleStartWebhookSending = async () => {
    if (!gatewayConfig.webhookUrl || !gatewayConfig.webhookUrl.trim()) {
      onToast('Bạn chưa cấu hình Cổng Webhook trong Cài đặt! Hãy sử dụng chế độ gửi 1-Chạm Zalo.', 'info');
      return;
    }

    setIsRunningWebhook(true);
    const selectedTargets = targets.filter(t => selectedIds.has(t.student.id));
    const newlyFailed: FailedDispatchRecord[] = [];

    for (let i = 0; i < selectedTargets.length; i++) {
      const target = selectedTargets[i];
      const stuId = target.student.id;

      setStatusMap(prev => ({
        ...prev,
        [stuId]: { status: 'sending' },
      }));

      try {
        const result = await dispatchMessageDirectly(
          target.student.parentPhone,
          target.message,
          target.student.name,
          gatewayConfig
        );

        if (result.success) {
          setStatusMap(prev => ({
            ...prev,
            [stuId]: { status: 'success' },
          }));
        } else {
          const reason = result.reason || 'Lỗi gửi tin qua Webhook';
          setStatusMap(prev => ({
            ...prev,
            [stuId]: { status: 'failed', reason },
          }));
          newlyFailed.push({
            id: `fail_${Date.now()}_${i}`,
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
        const reason = err instanceof Error ? err.message : 'Lỗi kết nối';
        setStatusMap(prev => ({
          ...prev,
          [stuId]: { status: 'failed', reason },
        }));
        newlyFailed.push({
          id: `fail_${Date.now()}_${i}`,
          studentId: target.student.id,
          studentName: target.student.name,
          parentPhone: target.student.parentPhone || '',
          date: target.date,
          reason,
          message: target.message,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (newlyFailed.length > 0) {
      onSaveFailedRecords(newlyFailed);
    }
    setIsRunningWebhook(false);
    onToast(`Đã gửi qua Webhook xong! Thành công: ${selectedTargets.length - newlyFailed.length}, Lỗi: ${newlyFailed.length}`, 'info');
  };

  // Copy failed list
  const handleCopyFailedList = async () => {
    if (failedTargets.length === 0) return;
    const lines = [
      `📋 DANH SÁCH SĐT PHỤ HUYNH CHƯA GỬI ĐƯỢC ZALO (${failedTargets.length} em):`,
      ...failedTargets.map((t, idx) => {
        const reason = statusMap[t.student.id]?.reason || 'Không kết nối được';
        return `${idx + 1}. Em ${t.student.name} - SĐT: ${t.student.parentPhone || 'Chưa có'} (Lý do: ${reason})`;
      }),
      `\n* GVCN liên hệ gọi điện trực tiếp hoặc gửi SMS.`,
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
                  {targets.length} học sinh
                </span>
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Send Modes Switching Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSendMode('group')}
            className={`py-2 px-2.5 rounded-2xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 sm:flex-1 ${
              sendMode === 'group'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Nhóm Zalo lớp</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full hidden sm:inline">
              1 chạm
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSendMode('individual')}
            className={`py-2 px-2.5 rounded-2xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 sm:flex-1 ${
              sendMode === 'individual'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Gửi riêng 1-chạm</span>
          </button>

          <button
            type="button"
            onClick={() => setSendMode('zaloweb')}
            className={`py-2 px-2.5 rounded-2xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 sm:flex-1 ${
              sendMode === 'zaloweb'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            <span>Tự động Zalo Web</span>
            <span className="text-[9px] bg-yellow-400 text-purple-950 font-black px-1.5 py-0.5 rounded-full">
              HOT (PC)
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">

          {/* ================= MODE 1: SEND TO ZALO GROUP ================= */}
          {sendMode === 'group' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Highlight Banner */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs">Giải pháp gửi nhanh nhất cho GVCN:</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Thay vì phải gửi {targets.length} lần riêng lẻ, Thầy/Cô chỉ cần bấm <strong>&quot;Mở Zalo gửi vào Nhóm Lớp&quot;</strong> bên dưới. Hệ thống sẽ tự động tổng hợp danh sách cả {targets.length} em vào 1 tin nhắn và mở Zalo, Thầy/Cô chỉ cần chạm dán vào <strong>Nhóm Zalo lớp</strong> là toàn bộ phụ huynh đều nhận được ngay!
                </p>
              </div>

              {/* Class Group Message Box Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
                  <span>Nội dung tin nhắn thông báo lớp ({targets.length} em):</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const copied = await copyToClipboard(groupMessage);
                      if (copied) {
                        setCopiedGroupMessage(true);
                        onToast('Đã sao chép tin nhắn nhóm lớp!', 'success');
                        setTimeout(() => setCopiedGroupMessage(false), 3000);
                      }
                    }}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[11px]"
                  >
                    {copiedGroupMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedGroupMessage ? 'Đã sao chép' : 'Sao chép tin nhắn'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-64 overflow-y-auto text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed selectable-text">
                  {groupMessage}
                </div>
              </div>

              {/* Primary Action Button for Group Mode */}
              <button
                type="button"
                onClick={handleSendToZaloGroup}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4 text-yellow-300" />
                <span>Mở Zalo & Gửi vào Nhóm Lớp (1 Lần cho cả {targets.length} em)</span>
              </button>
            </div>
          )}

          {/* ================= MODE 2: SEND INDIVIDUAL TO EACH PARENT ================= */}
          {sendMode === 'individual' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Security Policy Clarification Alert */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cơ chế bảo mật của Zalo cá nhân:</span>
                </div>
                <p className="leading-relaxed">
                  Zalo cá nhân không cho phép ứng dụng bên ngoài tự ý gửi tin nhắn ngầm. Trình gửi <strong>&quot;1-Chạm Tuần tự&quot;</strong> bên dưới sẽ tự động chép tin nhắn ngắn gọn và mở thẳng đoạn chat Zalo của từng phụ huynh, Thầy/Cô chỉ cần chạm dán &amp; gửi liên tiếp mà không cần tìm danh bạ!
                </p>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Chờ gửi</span>
                  <span className="text-base font-black text-slate-700">{remainingTargets.length}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] text-emerald-600 font-bold block uppercase">Đã gửi</span>
                  <span className="text-base font-black text-emerald-600">{successTargets.length}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${failedTargets.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-bold block uppercase ${failedTargets.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    Số lỗi / Chưa gửi
                  </span>
                  <span className={`text-base font-black ${failedTargets.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {failedTargets.length}
                  </span>
                </div>
              </div>

              {/* ACTIVE 1-TAP SENDER CARD */}
              {activeTarget ? (
                <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white border-2 border-blue-400 rounded-3xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      <span>Đang chờ gửi (Em {activeQueueIndex + 1}/{targets.length}):</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-lg">
                      {activeTarget.student.parentPhone || 'Chưa có SĐT'}
                    </span>
                  </div>

                  {/* Student details */}
                  <div className="bg-white p-3 rounded-2xl border border-blue-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{activeTarget.student.name}</span>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        {activeTarget.records.length} lỗi vi phạm
                      </span>
                    </div>

                    {/* Compact message preview */}
                    <div className="p-2 bg-slate-50 rounded-xl text-[11px] text-slate-700 whitespace-pre-wrap font-sans border border-slate-100">
                      {activeTarget.message}
                    </div>

                    {!activeValidation?.valid && (
                      <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{activeValidation?.reason}</span>
                      </p>
                    )}
                  </div>

                  {/* Action Buttons for Active Student */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleSendSingleInQueue(activeTarget)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4 text-yellow-300" />
                      <span>👉 Mở Zalo gửi PH em {activeTarget.student.name}</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSkipWithError(activeTarget, 'Không tìm thấy Zalo / Số không liên lạc được')}
                        className="flex-1 py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <PhoneOff className="w-3.5 h-3.5 text-rose-500" />
                        <span>Bỏ qua (Zalo lỗi/Không tìm thấy)</span>
                      </button>

                      {activeQueueIndex < targets.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setActiveQueueIndex(prev => prev + 1)}
                          className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Sang em tiếp</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-extrabold text-sm text-emerald-900">Đã duyệt hết danh sách học sinh!</p>
                  <p className="text-xs text-emerald-700">
                    Đã gửi thành công: <strong>{successTargets.length}</strong> | Chưa gửi được: <strong>{failedTargets.length}</strong>
                  </p>
                </div>
              )}

              {/* Optional Webhook button if user configured a Webhook API */}
              {gatewayConfig.webhookUrl && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Cổng tự động API đã kết nối:</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Sẵn sàng
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isRunningWebhook}
                    onClick={handleStartWebhookSending}
                    className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                  >
                    {isRunningWebhook ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isRunningWebhook ? 'Đang gửi qua Webhook API...' : 'Chạy gửi ngầm tự động qua Webhook'}</span>
                  </button>
                </div>
              )}

              {/* Student targets list with status and manual triggers */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>Toàn bộ danh sách học sinh ({targets.length})</span>
                  <span className="text-[10px] text-slate-500">Chạm để chọn hoặc gửi lại</span>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {targets.map((t, idx) => {
                    const status = statusMap[t.student.id]?.status || 'idle';
                    const reason = statusMap[t.student.id]?.reason;
                    const isActive = idx === activeQueueIndex;

                    return (
                      <div
                        key={t.student.id}
                        className={`p-2.5 flex items-center justify-between transition-colors ${
                          isActive ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            setActiveQueueIndex(idx);
                            setPreviewStudentId(t.student.id);
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {idx + 1}. {t.student.name}
                            </span>
                            <span className="text-[10px] text-slate-400">({t.student.group || 'Lớp'})</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 mt-0.5">
                            <span>{t.student.parentPhone || 'Chưa có SĐT'}</span>
                            <span className="text-[10px] text-rose-600 font-semibold">{t.records.length} lỗi</span>
                          </div>
                          {status === 'failed' && reason && (
                            <p className="text-[10px] text-rose-600 font-medium mt-0.5 truncate">⚠️ {reason}</p>
                          )}
                        </div>

                        {/* Status / Quick Action */}
                        <div className="shrink-0 ml-2">
                          {status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã gửi</span>
                            </span>
                          ) : status === 'failed' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQueueIndex(idx);
                                handleSendSingleInQueue(t);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200"
                              title="Thử gửi lại"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Gửi lại</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQueueIndex(idx);
                                handleSendSingleInQueue(t);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200"
                            >
                              <Send className="w-3 h-3 text-blue-600" />
                              <span>Gửi</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Failed Numbers Summary Callout */}
              {failedTargets.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                      <PhoneOff className="w-4 h-4 text-rose-600" />
                      <span>Các số chưa gửi được ({failedTargets.length} em):</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyFailedList}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1 text-[11px]">
                    {failedTargets.map(t => (
                      <div key={t.student.id} className="p-1.5 bg-white rounded-lg border border-rose-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900">{t.student.name}</span>
                          <span className="text-slate-500 ml-1.5 font-mono">({t.student.parentPhone || 'Chưa có'})</span>
                        </div>
                        {t.student.parentPhone && (
                          <a
                            href={`tel:${t.student.parentPhone}`}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold text-[10px] flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Gọi</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= MODE 3: AUTOMATION ON ZALO WEB (PC / LAPTOP) ================= */}
          {sendMode === 'zaloweb' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Highlight Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white rounded-3xl shadow-md space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-xs">
                    <Bot className="w-5 h-5 text-yellow-300" />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm">Công cụ Tự động gửi tin nhắn trên Zalo Web (Máy tính)</span>
                </div>
                <p className="text-[11px] text-blue-100 leading-relaxed">
                  Tự động tìm từng số điện thoại, dán tin nhắn và gửi lần lượt cho toàn bộ <strong>{targets.length} học sinh</strong> ngay trên <strong>Zalo Web (chat.zalo.me)</strong>.
                </p>
              </div>

              {/* Sub-mode Toggle: Bookmarklet (NO F12) vs F12 Console */}
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setZaloWebMethod('bookmark')}
                  className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${
                    zaloWebMethod === 'bookmark'
                      ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cách Dấu trang (Không cần F12)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZaloWebMethod('console')}
                  className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${
                    zaloWebMethod === 'console'
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cách F12 (Dự phòng)</span>
                </button>
              </div>

              {zaloWebMethod === 'bookmark' ? (
                <div className="space-y-3">
                  {/* Step 0: One-time Bookmark setup */}
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5">
                    <div className="font-extrabold text-xs text-amber-950 flex items-center justify-between">
                      <span>📌 Bước chuẩn bị (Chỉ làm 1 lần duy nhất):</span>
                      <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-bold">Không cần F12</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Thầy/Cô hãy giữ chuột kéo nút màu tím dưới đây thả lên <strong>Thanh dấu trang</strong> (ngay dưới thanh địa chỉ Chrome/Edge):
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        ref={(el) => {
                          if (el) el.setAttribute('href', bookmarkletHref);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          onToast('Hãy GIỮ CHUỘT và KÉO nút này thả lên Thanh dấu trang phía trên (hoặc bấm Sao chép mã dấu trang)!', 'info');
                        }}
                        draggable
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs rounded-xl shadow-md cursor-grab active:cursor-grabbing select-none"
                        title="Kéo nút này lên Thanh dấu trang Chrome"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-yellow-300" />
                        <span>⚡ Gửi Zalo Sổ Chủ Nhiệm</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyBookmarkletCode}
                        className="px-2.5 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold flex items-center gap-1"
                      >
                        {hasCopiedBookmarklet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{hasCopiedBookmarklet ? 'Đã chép mã dấu trang' : 'Hoặc chép mã dấu trang'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-800">
                      * Nếu thanh dấu trang đang ẩn, bấm <kbd className="px-1 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold">Ctrl + Shift + B</kbd> để hiện lên. Hoặc chuột phải vào thanh dấu trang ➔ <em>Thêm trang</em> ➔ dán mã vào ô <strong>URL</strong>.
                    </p>
                  </div>

                  {/* Step 1 & 2 Actions */}
                  <button
                    type="button"
                    onClick={handleCopyBatchData}
                    className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {hasCopiedBatchData ? (
                      <>
                        <Check className="w-5 h-5 text-yellow-300 stroke-[3]" />
                        <span>ĐÃ CHÉP DỮ LIỆU {targets.length} EM! MỞ ZALO WEB & BẤM DẤU TRANG</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 text-yellow-300" />
                        <span>📋 1. SAO CHÉP DỮ LIỆU GỬI ({targets.length} EM)</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://chat.zalo.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>2. Mở Zalo Web (chat.zalo.me) rồi bấm Dấu trang ⚡ vừa tạo</span>
                  </a>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      Khi bấm <strong>⚡ Gửi Zalo Sổ Chủ Nhiệm</strong> trên Zalo Web, bảng điều khiển sẽ hiện ra ngay (nếu trình duyệt chưa tự nạp, Thầy/Cô chỉ cần nhấn <kbd className="px-1 py-0.5 bg-white border border-emerald-300 rounded font-mono font-bold">Ctrl + V</kbd> vào ô hiện trên bảng là xong, hoàn toàn không bị chặn!).
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Fix Self-XSS F12 Alert */}
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5 text-[11px] text-rose-900">
                    <div className="font-extrabold text-rose-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Cách xử lý khi F12 hiện chữ đỏ &quot;Dừng lại!&quot; và không dán được:</span>
                    </div>
                    <p className="leading-relaxed">
                      1. Chữ đỏ <strong>&quot;Dừng lại!&quot;</strong> chỉ là cảnh báo mặc định của Zalo, không phải lỗi.<br />
                      2. Chrome/Edge chặn dán lần đầu để bảo mật: hãy bấm vào dòng cuối cùng có dấu <kbd className="px-1 bg-white border border-rose-300 rounded font-mono font-bold">&gt;</kbd> trong Console, gõ đúng chữ <kbd className="px-1.5 py-0.5 bg-white border border-rose-300 rounded font-mono font-bold text-rose-700">allow pasting</kbd> rồi nhấn <kbd className="px-1 bg-white border border-rose-300 rounded font-mono font-bold">Enter</kbd>. Sau đó mới nhấn <kbd className="px-1 bg-white border border-rose-300 rounded font-mono font-bold">Ctrl + V</kbd> + <kbd className="px-1 bg-white border border-rose-300 rounded font-mono font-bold">Enter</kbd>.
                    </p>
                  </div>

                  {/* Primary Action Button */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCopyZaloWebScript}
                      className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {hasCopiedScript ? (
                        <>
                          <Check className="w-5 h-5 text-yellow-300 stroke-[3]" />
                          <span>ĐÃ CHÉP MÃ F12! SẴN SÀNG MỞ ZALO WEB</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 text-yellow-300" />
                          <span>📋 SAO CHÉP MÃ CHẠY F12 CHO {targets.length} EM</span>
                        </>
                      )}
                    </button>

                    <a
                      href="https://chat.zalo.me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Mở Zalo Web (chat.zalo.me) trong tab mới</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-colors"
          >
            Đóng
          </button>

          <span className="text-[11px] text-slate-500 font-medium">
            {sendMode === 'group'
              ? '💡 Gửi 1 tin duy nhất vào nhóm Zalo lớp'
              : sendMode === 'zaloweb'
              ? '🤖 Chạy tự động 100% trên Zalo Web (chat.zalo.me)'
              : `Tiến độ gửi riêng: ${successTargets.length}/${targets.length} em`}
          </span>
        </div>

      </div>
    </div>
  );
};

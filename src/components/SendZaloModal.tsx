import React, { useState, useRef } from 'react';
import { StudentViolationSummary, ClassInfo } from '../types';
import { generateZaloMessage, getZaloChatUrl, copyToClipboard, shareViaMobile } from '../utils/zalo';
import { exportElementToCanvas, canvasToPngBlob, triggerPngDownload } from '../utils/imageExport';
import { ViolationReportCard } from './ViolationReportCard';
import { X, Send, Copy, Download, Share2, FileText, Image as ImageIcon, CheckCircle2, Phone } from 'lucide-react';

interface SendZaloModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: StudentViolationSummary | null;
  classInfo: ClassInfo;
  timePeriodLabel: string;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SendZaloModal: React.FC<SendZaloModalProps> = ({
  isOpen,
  onClose,
  summary,
  classInfo,
  timePeriodLabel,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !summary) return null;

  const textContent = generateZaloMessage(summary, classInfo, timePeriodLabel);
  const zaloUrl = getZaloChatUrl(summary.student.parentPhone);
  const phone = summary.student.parentPhone;

  const handleCopyText = async () => {
    const success = await copyToClipboard(textContent);
    if (success) {
      setHasCopiedText(true);
      onToast('Đã sao chép nội dung tin nhắn vào bộ nhớ tạm!', 'success');
      setTimeout(() => setHasCopiedText(false), 3000);
    } else {
      onToast('Không thể sao chép tự động, vui lòng chọn văn bản và sao chép thủ công.', 'error');
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExportingImage(true);
      onToast('Đang tạo ảnh báo cáo chất lượng cao...', 'info');
      const canvas = await exportElementToCanvas(cardRef.current);
      const safeName = summary.student.name.replace(/\s+/g, '_');
      triggerPngDownload(canvas, `Bao_Cao_Ne_Nep_${safeName}_${timePeriodLabel.replace(/\s+/g, '_')}.png`);
      onToast('Đã tải ảnh báo cáo về máy thành công!', 'success');
    } catch (err) {
      console.error(err);
      onToast('Lỗi khi xuất ảnh, vui lòng thử lại!', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExportingImage(true);
      const canvas = await exportElementToCanvas(cardRef.current);
      const blob = await canvasToPngBlob(canvas);

      if (blob) {
        const file = new File([blob], `Bao_Cao_${summary.student.name}.png`, { type: 'image/png' });
        const shared = await shareViaMobile({
          title: `Báo cáo nề nếp em ${summary.student.name}`,
          text: textContent,
          file,
        });
        if (shared) return;
      }

      const safeName = summary.student.name.replace(/\s+/g, '_');
      triggerPngDownload(canvas, `Bao_Cao_Ne_Nep_${safeName}.png`);
      onToast('Đã tải ảnh báo cáo về máy thành công!', 'success');
    } catch (err) {
      console.error(err);
      onToast('Lỗi khi xuất ảnh, vui lòng thử lại!', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleOpenZaloChat = async () => {
    if (!phone) {
      onToast('Học sinh này chưa có số điện thoại phụ huynh! Vui lòng cập nhật số điện thoại.', 'error');
      return;
    }

    // First, copy text so teacher can immediately paste in Zalo chat
    await copyToClipboard(textContent);
    onToast(`Đã sao chép tin nhắn! Đang mở Zalo phụ huynh (${phone})...`, 'success');

    // Open Zalo chat
    window.open(zaloUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Send className="w-5 h-5 text-yellow-300" />
              <span>Gửi báo cáo qua Zalo phụ huynh</span>
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Học sinh: <strong className="text-white">{summary.student.name}</strong> • Lớp {classInfo.className}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Text vs Image */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'text'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dạng văn bản (Tin nhắn)</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'image'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Dạng ảnh (Phiếu báo cáo)</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'text' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Nội dung tin nhắn gửi Zalo:</span>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors"
                >
                  {hasCopiedText ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép tin nhắn</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed selectable-text">
                {textContent}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <span className="text-base">💡</span>
                <div>
                  <strong>Mẹo cho GVCN:</strong> Bấm nút <strong>&quot;Mở Zalo phụ huynh&quot;</strong> bên dưới. Hệ thống sẽ tự động chép nội dung tin nhắn và mở thẳng Zalo của phụ huynh em {summary.student.name}, thầy/cô chỉ cần nhấn giữ và chọn <strong>Dán (Paste)</strong> để gửi!
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Xem trước phiếu báo cáo dạng ảnh:</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadImage}
                    disabled={isExportingImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải ảnh (.png)</span>
                  </button>
                  <button
                    onClick={handleShareImage}
                    disabled={isExportingImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 p-2 sm:p-4 rounded-2xl overflow-x-auto flex justify-center">
                <ViolationReportCard
                  summary={summary}
                  classInfo={classInfo}
                  timePeriodLabel={timePeriodLabel}
                  cardRef={cardRef}
                />
              </div>
            </div>
          )}

          {/* Quick Parent Phone Information */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">
                  {summary.student.parentName || 'Phụ huynh'}:{' '}
                  <span className="font-mono text-blue-700 font-extrabold">{phone || 'Chưa có SĐT'}</span>
                </p>
                <p className="text-[11px] text-blue-700">Liên kết trực tiếp tới tài khoản Zalo theo số điện thoại</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleOpenZaloChat}
            className="flex-1 py-3 px-4 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Mở Zalo phụ huynh ({phone || 'Nhập SĐT'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

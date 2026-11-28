import React, { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { ClassInfo, StudentViolationSummary } from '../types';
import { generateDutySchedule, generateDutyScheduleText } from '../utils/dutySchedule';
import { copyToClipboard, shareViaMobile } from '../utils/zalo';
import { DutyScheduleCard } from './DutyScheduleCard';
import {
  X,
  Image as ImageIcon,
  FileText,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  Users
} from 'lucide-react';

interface DutyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaries: StudentViolationSummary[];
  classInfo: ClassInfo;
  timePeriodLabel: string;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DutyScheduleModal: React.FC<DutyScheduleModalProps> = ({
  isOpen,
  onClose,
  summaries,
  classInfo,
  timePeriodLabel,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [fridayCount, setFridayCount] = useState<4 | 5>(5);
  const [topLimit, setTopLimit] = useState<number>(10);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const schedule = useMemo(
    () => generateDutySchedule(summaries, { fridayAfternoonCount: fridayCount, minPerDay: 2 }),
    [summaries, fridayCount]
  );

  const textContent = useMemo(
    () => generateDutyScheduleText(classInfo.className, timePeriodLabel, schedule, topLimit),
    [classInfo.className, timePeriodLabel, schedule, topLimit]
  );

  if (!isOpen) return null;

  const handleCopyText = async () => {
    const ok = await copyToClipboard(textContent);
    if (ok) {
      setHasCopiedText(true);
      onToast('Đã sao chép bảng tổng hợp & lịch trực nhật!', 'success');
      setTimeout(() => setHasCopiedText(false), 3000);
    } else {
      onToast('Không thể sao chép tự động!', 'error');
    }
  };

  const handleSendTextToZaloGroup = async () => {
    await copyToClipboard(textContent);
    onToast('Đã chép lịch trực nhật! Đang mở Zalo để dán vào nhóm lớp...', 'success');

    const shared = await shareViaMobile({
      title: `Lịch trực nhật lớp ${classInfo.className}`,
      text: textContent,
    });
    if (!shared) {
      window.open('https://zalo.me/', '_blank');
    }
  };

  const generateCardCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null;
    return await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  };

  const handleDownloadImage = async () => {
    try {
      setIsExportingImage(true);
      onToast('Đang tạo ảnh bảng trực nhật sắc nét...', 'info');
      const canvas = await generateCardCanvas();
      if (!canvas) throw new Error('Không thể tạo ảnh');

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Truc_Nhat_Lop_${classInfo.className}_${timePeriodLabel.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();

      onToast('Đã tải ảnh bảng trực nhật về máy! Hãy gửi vào nhóm Zalo lớp.', 'success');
    } catch (err) {
      console.error(err);
      onToast('Lỗi khi xuất ảnh, vui lòng thử lại!', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleShareImageToZalo = async () => {
    try {
      setIsExportingImage(true);
      const canvas = await generateCardCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Truc_Nhat_Lop_${classInfo.className}.png`, { type: 'image/png' });
        const shared = await shareViaMobile({
          title: `Lịch trực nhật lớp ${classInfo.className}`,
          text: `Bảng tổng hợp vi phạm & lịch trực nhật ${timePeriodLabel}`,
          file,
        });

        if (!shared) {
          // Desktop fallback: download image and open Zalo Web
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `Truc_Nhat_Lop_${classInfo.className}.png`;
          link.href = dataUrl;
          link.click();
          onToast('Đã tải ảnh về máy và mở Zalo! Thầy/Cô thả ảnh vừa tải vào nhóm lớp nhé.', 'success');
          window.open('https://zalo.me/', '_blank');
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      handleDownloadImage();
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-200" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                Phân công trực nhật tự động ({schedule.totalViolated} em vi phạm)
              </h2>
              <p className="text-[11px] text-orange-100 mt-0.5">
                Lớp {classInfo.className} • {timePeriodLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-amber-950">Chiều T6 lau lớp:</span>
            <button
              type="button"
              onClick={() => setFridayCount(4)}
              className={`px-2 py-0.5 rounded-lg font-bold border transition-all ${
                fridayCount === 4
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              4 bạn
            </button>
            <button
              type="button"
              onClick={() => setFridayCount(5)}
              className={`px-2 py-0.5 rounded-lg font-bold border transition-all ${
                fridayCount === 5
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              5 bạn
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-amber-950">Bảng lỗi:</span>
            {[
              { label: 'Top 5', val: 5 },
              { label: 'Top 10', val: 10 },
              { label: `Tất cả (${schedule.totalViolated})`, val: 0 },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setTopLimit(opt.val)}
                className={`px-2 py-0.5 rounded-lg font-bold border transition-all ${
                  topLimit === opt.val
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switch: Image vs Text */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black border-b-2 transition-all ${
              activeTab === 'image'
                ? 'border-orange-600 text-orange-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Dạng Hình ảnh (Bảng đẹp)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black border-b-2 transition-all ${
              activeTab === 'text'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dạng Văn bản (Gửi Nhóm)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
          {schedule.totalViolated === 0 ? (
            <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold">
              Tuần/kỳ này không có học sinh nào vi phạm để phân công trực nhật!
            </div>
          ) : activeTab === 'image' ? (
            <div className="space-y-3">
              <div className="overflow-x-auto bg-slate-100 p-2 rounded-2xl border border-slate-200">
                <DutyScheduleCard
                  classInfo={classInfo}
                  timePeriodLabel={timePeriodLabel}
                  schedule={schedule}
                  topLimit={topLimit}
                  cardRef={cardRef}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isExportingImage}
                  onClick={handleDownloadImage}
                  className="py-3 px-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingImage ? 'Đang tạo ảnh...' : 'Tải ảnh PNG'}</span>
                </button>

                <button
                  type="button"
                  disabled={isExportingImage}
                  onClick={handleShareImageToZalo}
                  className="py-3 px-3 bg-gradient-to-r from-orange-600 to-rose-600 hover:brightness-110 disabled:opacity-50 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Share2 className="w-4 h-4 text-yellow-200" />
                  <span>Gửi ảnh vào Nhóm Zalo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Nội dung gửi Nhóm Zalo lớp:</span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs"
                >
                  {hasCopiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopiedText ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-72 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                {textContent}
              </div>

              <button
                type="button"
                onClick={handleSendTextToZaloGroup}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-yellow-300" />
                <span>Sao chép &amp; Mở Zalo gửi Nhóm Lớp</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

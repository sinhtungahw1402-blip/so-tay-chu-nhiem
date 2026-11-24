import React, { useState } from 'react';
import { AppBackupData } from '../types';
import { createBackupPayload, restoreBackupPayload } from '../utils/storage';
import { generateSyncPin, uploadToCloudSync, downloadFromCloudSync } from '../utils/cloudSync';
import { copyToClipboard } from '../utils/zalo';
import {
  X,
  Cloud,
  ArrowUpCircle,
  ArrowDownCircle,
  Copy,
  Check,
  Smartphone,
  Monitor,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: (data: AppBackupData) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'download'>('upload');

  // Upload state
  const [generatedPin, setGeneratedPin] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [hasCopiedPin, setHasCopiedPin] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Download state
  const [inputPin, setInputPin] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle generating PIN and uploading data
  const handleGenerateAndUpload = async () => {
    setIsUploading(true);
    setUploadSuccess(false);
    const pin = generateSyncPin();

    const payload = createBackupPayload();
    const result = await uploadToCloudSync(payload, pin);

    setIsUploading(false);
    if (result.success) {
      setGeneratedPin(pin);
      setUploadSuccess(true);
      onToast(`Đã tạo mã PIN ${pin}! Dữ liệu đã sẵn sàng để đồng bộ sang máy tính.`, 'success');
    } else {
      setGeneratedPin('');
      onToast(result.error || 'Lỗi khi tải dữ liệu lên đám mây!', 'error');
    }
  };

  // Handle Copy PIN
  const handleCopyPin = async () => {
    if (!generatedPin) return;
    const ok = await copyToClipboard(generatedPin);
    if (ok) {
      setHasCopiedPin(true);
      onToast('Đã sao chép mã PIN vào bộ nhớ tạm!', 'success');
      setTimeout(() => setHasCopiedPin(false), 3000);
    }
  };

  // Handle downloading data using PIN
  const handleDownload = async () => {
    const cleanPin = inputPin.trim().replace(/\s+/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      setDownloadError('Vui lòng nhập đủ 6 chữ số mã PIN!');
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    const result = await downloadFromCloudSync(cleanPin);
    setIsDownloading(false);

    if (result.success && result.data) {
      // Restore locally
      restoreBackupPayload(result.data);
      onRestoreSuccess(result.data);
      onToast(
        `Đồng bộ thành công! Đã tải về dữ liệu lớp ${result.data.classInfo.className} (${result.data.students.length} học sinh).`,
        'success'
      );
      onClose();
    } else {
      setDownloadError(result.error || 'Không tìm thấy dữ liệu cho mã PIN này!');
      onToast(result.error || 'Lỗi khi đồng bộ dữ liệu!', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 backdrop-blur-xs rounded-xl border border-white/20">
              <Cloud className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                <span>Đồng bộ Đám mây (Mã PIN 6 số)</span>
                <span className="text-[10px] bg-yellow-400 text-blue-950 font-black px-1.5 py-0.5 rounded-full">
                  Nhanh 1s
                </span>
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Chuyển dữ liệu giữa Điện thoại và Máy tính tức thì
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Upload (from phone) vs Download (on PC) */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 text-purple-600" />
            <span>Lấy mã PIN (Gửi đi)</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded-full">
              Trên ĐT
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'download'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
            <span>Nhập mã PIN (Nhận về)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
              Trên Máy tính
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* TAB 1: UPLOAD & GET PIN (Usually on Phone) */}
          {activeTab === 'upload' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-1.5 text-purple-900">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>Dành cho máy đang có dữ liệu (Ví dụ: Điện thoại):</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Bấm nút bên dưới để đóng gói toàn bộ danh sách lớp, nề nếp và cấp <strong>1 mã PIN gồm 6 chữ số</strong>. Thầy/Cô chỉ cần nhập 6 số này vào Máy tính là xong!
                </p>
              </div>

              {!generatedPin ? (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleGenerateAndUpload}
                  className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang mã hóa và đẩy lên đám mây...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Tạo mã PIN đồng bộ ngay (Chỉ 1 giây)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-5 bg-gradient-to-br from-purple-50 via-indigo-50/60 to-white border-2 border-purple-300 rounded-3xl text-center space-y-3 shadow-sm">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-widest block">
                    Mã PIN đồng bộ của Thầy/Cô:
                  </span>

                  {/* Big PIN Display */}
                  <div className="py-2.5 px-4 bg-white border border-purple-200 rounded-2xl inline-flex items-center justify-center gap-2 shadow-inner">
                    <span className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-purple-900 selection:bg-purple-200">
                      {generatedPin.slice(0, 3)} {generatedPin.slice(3)}
                    </span>
                  </div>

                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyPin}
                      className="px-3.5 py-1.5 bg-white hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      {hasCopiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{hasCopiedPin ? 'Đã sao chép' : 'Sao chép mã'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={handleGenerateAndUpload}
                      className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                      title="Tạo mã mới"
                    >
                      <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
                      <span>Tạo mã mới</span>
                    </button>
                  </div>

                  {uploadSuccess && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Đã sẵn sàng! Hãy mở Máy tính và nhập 6 số này.</span>
                    </div>
                  )}

                  {/* Step-by-step instructions */}
                  <div className="text-left bg-white/80 p-3 rounded-2xl border border-purple-100 text-[11px] text-slate-700 space-y-1">
                    <p className="font-bold text-purple-950">Các bước nhận dữ liệu trên Máy tính:</p>
                    <p>1. Mở link trang web trên máy tính (Laptop/PC).</p>
                    <p>2. Bấm nút <strong>&quot;Đồng bộ Đám mây&quot;</strong> góc trên.</p>
                    <p>3. Chọn tab <strong>&quot;Nhập mã PIN (Nhận về)&quot;</strong> và gõ <strong>{generatedPin}</strong> ➔ Xong!</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOWNLOAD & ENTER PIN (Usually on PC) */}
          {activeTab === 'download' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-1.5 text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  <span>Dành cho máy muốn nhận dữ liệu (Ví dụ: Máy tính / Laptop):</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Nhập mã PIN 6 số đã được tạo từ điện thoại vào ô bên dưới, hệ thống sẽ kéo toàn bộ dữ liệu lớp về máy tính ngay lập tức.
                </p>
              </div>

              {/* PIN input field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 text-center uppercase tracking-wider">
                  Nhập mã PIN 6 số:
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="______"
                    value={inputPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setInputPin(val);
                      if (downloadError) setDownloadError(null);
                    }}
                    className="w-56 text-center text-3xl font-mono font-black tracking-widest py-3 px-4 bg-slate-50 border-2 border-emerald-400 focus:border-emerald-600 focus:bg-white rounded-2xl outline-none transition-all shadow-inner text-slate-900"
                  />
                </div>

                {downloadError && (
                  <p className="text-xs text-rose-600 font-bold text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{downloadError}</span>
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isDownloading || inputPin.length !== 6}
                onClick={handleDownload}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang tải dữ liệu từ đám mây...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="w-4 h-4 text-yellow-300" />
                    <span>Đồng bộ về máy này ngay</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dữ liệu được truyền tải bảo mật và tự động hủy sau khi đồng bộ.</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

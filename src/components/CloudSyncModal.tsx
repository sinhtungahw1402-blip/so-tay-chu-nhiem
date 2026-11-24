import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  ClipboardPaste,
  Send
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
  const [hasCopiedZaloCode, setHasCopiedZaloCode] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Download state
  const [inputPin, setInputPin] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');

  // Auto-generate PIN and upload when upload tab opens
  useEffect(() => {
    if (isOpen && activeTab === 'upload' && !generatedPin) {
      handleGenerateAndUpload();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Handle generating PIN and uploading data
  const handleGenerateAndUpload = async () => {
    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError(null);
    const pin = generateSyncPin();

    const payload = createBackupPayload();
    const result = await uploadToCloudSync(payload, pin);

    setIsUploading(false);
    if (result.success) {
      setGeneratedPin(pin);
      setUploadSuccess(true);
      onToast(`Đã tạo mã PIN ${pin}! Dữ liệu đã sẵn sàng để đồng bộ sang máy tính.`, 'success');
    } else {
      setGeneratedPin(pin); // keep pin so user sees
      setUploadError(result.error || 'Lỗi khi tải dữ liệu lên đám mây!');
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

  // Copy full backup string for Zalo My Documents fallback
  const handleCopyZaloCode = async () => {
    try {
      const payload = createBackupPayload();
      const raw = JSON.stringify(payload);
      // encode as base64 for compact copy-pasting
      const encoded = btoa(unescape(encodeURIComponent(raw)));
      const prefix = `[SOCHUNIEM_BACKUP]${encoded}`;
      const ok = await copyToClipboard(prefix);
      if (ok) {
        setHasCopiedZaloCode(true);
        onToast('Đã sao chép mã dữ liệu! Thầy/Cô chỉ cần dán vào Zalo (My Documents) gửi sang máy tính.', 'success');
        setTimeout(() => setHasCopiedZaloCode(false), 4000);
      }
    } catch {
      onToast('Không thể sao chép mã dữ liệu!', 'error');
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

  // Handle restoring from pasted Zalo string
  const handleRestoreFromManualCode = () => {
    if (!manualCode.trim()) {
      onToast('Vui lòng dán đoạn mã dữ liệu từ Zalo vào ô!', 'error');
      return;
    }

    try {
      let jsonStr = manualCode.trim();
      if (jsonStr.startsWith('[SOCHUNIEM_BACKUP]')) {
        const b64 = jsonStr.replace('[SOCHUNIEM_BACKUP]', '');
        jsonStr = decodeURIComponent(escape(atob(b64)));
      }

      const parsed: AppBackupData = JSON.parse(jsonStr);
      if (!parsed || !parsed.classInfo || !Array.isArray(parsed.students)) {
        throw new Error('Dữ liệu không đúng cấu trúc!');
      }

      restoreBackupPayload(parsed);
      onRestoreSuccess(parsed);
      onToast(`Đồng bộ thành công dữ liệu lớp ${parsed.classInfo.className}!`, 'success');
      onClose();
    } catch {
      onToast('Mã dữ liệu không hợp lệ! Vui lòng kiểm tra lại.', 'error');
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
                  Hệ thống đã tự động tạo <strong>mã PIN 6 số</strong> bên dưới. Thầy/Cô chỉ cần mở Máy tính và gõ 6 số này vào là dữ liệu sẽ nhảy sang máy tính ngay!
                </p>
              </div>

              {/* Big PIN Display */}
              <div className="p-5 bg-gradient-to-br from-purple-50 via-indigo-50/60 to-white border-2 border-purple-300 rounded-3xl text-center space-y-3 shadow-sm">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-widest block">
                  Mã PIN đồng bộ của Thầy/Cô:
                </span>

                <div className="py-2.5 px-4 bg-white border border-purple-200 rounded-2xl inline-flex items-center justify-center gap-2 shadow-inner">
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-purple-700 py-1">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-bold">Đang tạo mã PIN...</span>
                    </div>
                  ) : (
                    <span className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-purple-900 selection:bg-purple-200">
                      {generatedPin ? `${generatedPin.slice(0, 3)} ${generatedPin.slice(3)}` : 'Đang tạo...'}
                    </span>
                  )}
                </div>

                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!generatedPin}
                    onClick={handleCopyPin}
                    className="px-3.5 py-1.5 bg-white hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-40"
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

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-700 flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Step-by-step instructions */}
                <div className="text-left bg-white/80 p-3 rounded-2xl border border-purple-100 text-[11px] text-slate-700 space-y-1">
                  <p className="font-bold text-purple-950">Các bước nhận dữ liệu trên Máy tính:</p>
                  <p>1. Mở link trang web trên máy tính (Laptop/PC).</p>
                  <p>2. Bấm nút <strong>&quot;Đồng bộ PIN&quot;</strong> góc trên.</p>
                  <p>3. Chọn tab <strong>&quot;Nhập mã PIN (Nhận về)&quot;</strong> và gõ <strong>{generatedPin}</strong> ➔ Xong!</p>
                </div>
              </div>

              {/* Fallback Option: Copy Zalo code */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-blue-600" />
                    <span>Cách dự phòng (Gửi mã qua Zalo My Documents):</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Nếu mạng 4G chập chờn không gửi được mã PIN, Thầy/Cô chỉ cần bấm nút bên dưới để sao chép mã dữ liệu rồi dán vào <strong>My Documents (Zalo)</strong> gửi sang máy tính!
                </p>
                <button
                  type="button"
                  onClick={handleCopyZaloCode}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  {hasCopiedZaloCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
                  <span>{hasCopiedZaloCode ? 'Đã chép mã dữ liệu! Dán vào Zalo ngay' : 'Sao chép mã dữ liệu lớp (Gửi qua Zalo)'}</span>
                </button>
              </div>
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

              {/* Manual code paste fallback for PC */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Hoặc dán mã dữ liệu từ Zalo (Dự phòng):
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Dán mã [SOCHUNIEM_BACKUP]... vào đây"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleRestoreFromManualCode}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Dán &amp; Nhận</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dữ liệu được truyền tải bảo mật và tự động xóa sau khi đồng bộ.</span>
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

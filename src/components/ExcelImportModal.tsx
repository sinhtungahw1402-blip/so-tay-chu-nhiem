import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { downloadSampleExcel, parseStudentsFromExcel } from '../utils/excel';
import { X, FileSpreadsheet, Download, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: Student[], mode: 'replace' | 'append') => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const students = await parseStudentsFromExcel(file);
      if (students.length === 0) {
        setErrorMessage('Không tìm thấy dữ liệu học sinh trong file. Vui lòng kiểm tra lại cấu trúc file mẫu!');
      } else {
        setParsedStudents(students);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Lỗi khi đọc file Excel. Vui lòng tải file định dạng .xlsx hoặc .xls hợp lệ!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (parsedStudents.length === 0) return;
    onImport(parsedStudents, importMode);
    onClose();
  };

  const handleReset = () => {
    setParsedStudents([]);
    setFileName('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Nhập danh sách học sinh từ Excel</h2>
              <p className="text-xs text-emerald-700">Tự động nhận diện cột Họ tên, SĐT Zalo, Tổ...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Download Sample Button */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-slate-700">Chưa có file mẫu Excel?</p>
              <p className="text-[11px] text-slate-500">Tải file mẫu chuẩn về máy để điền thông tin</p>
            </div>
            <button
              onClick={downloadSampleExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu .xlsx</span>
            </button>
          </div>

          {/* Upload Area */}
          {parsedStudents.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5"
            >
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {isLoading ? 'Đang đọc dữ liệu...' : 'Bấm vào đây để chọn file Excel'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hỗ trợ định dạng .xlsx, .xls, .csv từ máy tính hoặc điện thoại
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      Đã đọc thành công: {parsedStudents.length} học sinh
                    </p>
                    <p className="text-[11px] text-emerald-700 truncate max-w-[240px]">{fileName}</p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-600 hover:text-rose-600 px-2 py-1 bg-white border border-slate-200 rounded-lg"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Mode choice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tùy chọn nhập dữ liệu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-start gap-2 p-2.5 border rounded-xl cursor-pointer text-xs transition-all ${
                      importMode === 'replace'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-bold">Thay thế toàn bộ</p>
                      <p className="text-[10px] text-slate-500">Xóa danh sách cũ, nạp mới hoàn toàn</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 border rounded-xl cursor-pointer text-xs transition-all ${
                      importMode === 'append'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-bold">Gộp thêm vào</p>
                      <p className="text-[10px] text-slate-500">Giữ danh sách cũ, thêm học sinh mới</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>Xem trước danh sách ({parsedStudents.length})</span>
                  <span className="text-[10px] text-slate-500">Hiển thị 5 em đầu tiên</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {parsedStudents.slice(0, 5).map((s, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-800">{s.stt}. {s.name}</span>
                        <span className="ml-2 text-[10px] text-slate-500">({s.gender} - {s.group})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono text-blue-600 font-medium">
                          {s.parentPhone || 'Chưa có SĐT'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {parsedStudents.length > 5 && (
                    <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50">
                      ... và {parsedStudents.length - 5} học sinh khác
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={parsedStudents.length === 0}
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-emerald-500/20 rounded-xl transition-all"
            >
              Xác nhận nhập ({parsedStudents.length} HS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

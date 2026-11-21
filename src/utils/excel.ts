import * as XLSX from 'xlsx';
import { Student, StudentViolationSummary } from '../types';

export function downloadSampleExcel(): void {
  const sampleData = [
    {
      'STT': 1,
      'Họ và tên': 'Nguyễn Văn An',
      'Giới tính': 'Nam',
      'Ngày sinh': '15/03/2012',
      'SĐT Phụ huynh (Zalo)': '0987654321',
      'Tên phụ huynh': 'Bác Nguyễn Văn Bình',
      'Tổ': 'Tổ 1',
      'Ghi chú': 'Lớp trưởng'
    },
    {
      'STT': 2,
      'Họ và tên': 'Trần Thị Bích',
      'Giới tính': 'Nữ',
      'Ngày sinh': '22/07/2012',
      'SĐT Phụ huynh (Zalo)': '0978123456',
      'Tên phụ huynh': 'Cô Lê Thị Cúc',
      'Tổ': 'Tổ 1',
      'Ghi chú': 'Lớp phó học tập'
    },
    {
      'STT': 3,
      'Họ và tên': 'Lê Hoàng Dũng',
      'Giới tính': 'Nam',
      'Ngày sinh': '05/11/2012',
      'SĐT Phụ huynh (Zalo)': '0912345678',
      'Tên phụ huynh': 'Chú Lê Văn Dậu',
      'Tổ': 'Tổ 2',
      'Ghi chú': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Họ và tên
    { wch: 10 }, // Giới tính
    { wch: 14 }, // Ngày sinh
    { wch: 22 }, // SĐT Phụ huynh (Zalo)
    { wch: 22 }, // Tên phụ huynh
    { wch: 10 }, // Tổ
    { wch: 20 }, // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachHocSinh');
  XLSX.writeFile(workbook, 'Mau_Danh_Sach_Hoc_Sinh_Chu_Nhiem.xlsx');
}

export async function parseStudentsFromExcel(file: File): Promise<Student[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON array of objects
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const students: Student[] = [];

  rawRows.forEach((row, index) => {
    // Normalization helper
    const keys = Object.keys(row);
    const getVal = (patterns: string[]): string => {
      for (const pattern of patterns) {
        const foundKey = keys.find(k => k.toLowerCase().trim().includes(pattern.toLowerCase().trim()));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          return String(row[foundKey]).trim();
        }
      }
      return '';
    };

    const name = getVal(['họ và tên', 'họ tên', 'tên học sinh', 'tên', 'ho va ten', 'ho ten']);
    if (!name) return; // Skip empty rows

    const rawStt = getVal(['stt', 'số thứ tự', 'so thu tu']);
    const stt = rawStt ? parseInt(rawStt, 10) : (index + 1);

    const rawGender = getVal(['giới tính', 'gioi tinh', 'nam/nữ', 'phái']);
    const gender: 'Nam' | 'Nữ' = rawGender.toLowerCase().includes('nữ') || rawGender.toLowerCase().includes('nu') ? 'Nữ' : 'Nam';

    const dob = getVal(['ngày sinh', 'ngaysinh', 'ngay sinh', 'năm sinh', 'dob']);
    
    // Clean phone number (remove spaces, dots, dashes)
    let parentPhone = getVal(['sđt phụ huynh', 'sđt ph', 'số điện thoại', 'điện thoại', 'sdt', 'zalo', 'phone']);
    parentPhone = parentPhone.replace(/[^0-9]/g, '');

    const parentName = getVal(['tên phụ huynh', 'họ tên phụ huynh', 'phụ huynh', 'người giám hộ']);
    const group = getVal(['tổ', 'nhóm', 'to', 'to hoc tap']) || 'Tổ 1';
    const notes = getVal(['ghi chú', 'ghi chu', 'chức vụ', 'năng khiếu', 'chú thích']);

    students.push({
      id: `stu_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      stt: isNaN(stt) ? (index + 1) : stt,
      name,
      gender,
      dob,
      parentPhone,
      parentName,
      group,
      notes,
    });
  });

  return students;
}

export function exportStudentsToExcel(students: Student[], className: string): void {
  const exportData = students.map((s, idx) => ({
    'STT': s.stt || (idx + 1),
    'Họ và tên': s.name,
    'Giới tính': s.gender,
    'Ngày sinh': s.dob || '',
    'SĐT Phụ huynh (Zalo)': s.parentPhone,
    'Tên phụ huynh': s.parentName || '',
    'Tổ': s.group || '',
    'Ghi chú': s.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 20 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Lop_${className}`);
  XLSX.writeFile(workbook, `Danh_Sach_Hoc_Sinh_Lop_${className}.xlsx`);
}

export function exportViolationReportToExcel(summaries: StudentViolationSummary[], className: string, timeLabel: string): void {
  const exportData = summaries.map((item, idx) => ({
    'STT': item.student.stt || (idx + 1),
    'Họ và tên': item.student.name,
    'Tổ': item.student.group || '',
    'SĐT Phụ huynh': item.student.parentPhone,
    'Số lần vi phạm': item.totalViolations,
    'Điểm trừ nề nếp': item.totalPointsDeducted,
    'Điểm rèn luyện còn lại': item.currentScore,
    'Xếp loại nề nếp': item.rank,
    'Chi tiết lỗi': item.records.map(r => `${r.date}: ${r.categoryName}${r.note ? ` (${r.note})` : ''}`).join('; ')
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TongHopLoi');
  XLSX.writeFile(workbook, `Bao_Cao_Ne_Nep_Lop_${className}_${timeLabel.replace(/\s+/g, '_')}.xlsx`);
}

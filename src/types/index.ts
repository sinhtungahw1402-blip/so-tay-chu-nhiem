export interface ClassInfo {
  className: string;
  schoolName: string;
  teacherName: string;
  teacherPhone: string;
  schoolYear: string;
  currentSemester: 'HK1' | 'HK2' | 'CaNam';
  initialScore: number; // Mặc định 100 điểm nề nếp
}

export interface Student {
  id: string;
  stt: number;
  name: string;
  gender: 'Nam' | 'Nữ';
  dob?: string;
  parentPhone: string;
  parentName?: string;
  group?: string; // Tổ 1, Tổ 2, Tổ 3, Tổ 4...
  notes?: string;
}

export type ViolationGroup = 'Chuyên cần' | 'Học tập' | 'Kỷ luật - Tác phong' | 'Vệ sinh - Lao động' | 'Khác';

export interface ViolationCategory {
  id: string;
  name: string;
  group: ViolationGroup;
  pointsDeducted: number;
  severity: 'nhe' | 'trung_binh' | 'nang';
  isCustom?: boolean;
}

export interface ViolationRecord {
  id: string;
  studentId: string;
  studentName: string;
  categoryId: string;
  categoryName: string;
  group: ViolationGroup;
  pointsDeducted: number;
  date: string; // YYYY-MM-DD
  period?: string; // Tiết 1, 2, 3...
  subject?: string; // Toán, Văn, Lý...
  note?: string; // Chi tiết vi phạm
  createdAt: string;
}

export type TimeFilterType = 'week' | 'last_week' | 'month' | 'hk1' | 'hk2' | 'year' | 'custom';

export interface TimeFilter {
  type: TimeFilterType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
}

export interface StudentViolationSummary {
  student: Student;
  records: ViolationRecord[];
  totalViolations: number;
  totalPointsDeducted: number;
  currentScore: number;
  rank: 'Tốt' | 'Khá' | 'Đạt' | 'Cần rèn luyện';
}

export interface AppBackupData {
  version: string;
  appName: string;
  exportedAt: string;
  classInfo: ClassInfo;
  students: Student[];
  violationCategories: ViolationCategory[];
  violationRecords: ViolationRecord[];
}

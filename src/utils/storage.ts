import { ClassInfo, Student, ViolationCategory, ViolationRecord, AppBackupData } from '../types';

const STORAGE_KEYS = {
  CLASS_INFO: 'sochunhiem_class_info_v1',
  STUDENTS: 'sochunhiem_students_v1',
  CATEGORIES: 'sochunhiem_categories_v1',
  RECORDS: 'sochunhiem_records_v1',
};

export const DEFAULT_CLASS_INFO: ClassInfo = {
  className: '9A1',
  schoolName: 'THCS Lê Quý Đôn',
  teacherName: 'Cô Nguyễn Thị Mai',
  teacherPhone: '0912345678',
  schoolYear: '2026 - 2027',
  currentSemester: 'HK1',
  initialScore: 100,
};

export const DEFAULT_VIOLATION_CATEGORIES: ViolationCategory[] = [
  // Chuyên cần
  { id: 'cat_1', name: 'Đi học muộn', group: 'Chuyên cần', pointsDeducted: 2, severity: 'nhe' },
  { id: 'cat_2', name: 'Nghỉ học không phép', group: 'Chuyên cần', pointsDeducted: 5, severity: 'nang' },
  { id: 'cat_3', name: 'Trốn tiết / Bỏ tiết', group: 'Chuyên cần', pointsDeducted: 10, severity: 'nang' },

  // Học tập
  { id: 'cat_4', name: 'Không học bài cũ', group: 'Học tập', pointsDeducted: 3, severity: 'trung_binh' },
  { id: 'cat_5', name: 'Không làm bài tập về nhà', group: 'Học tập', pointsDeducted: 3, severity: 'trung_binh' },
  { id: 'cat_6', name: 'Quên sách vở / Đồ dùng học tập', group: 'Học tập', pointsDeducted: 2, severity: 'nhe' },
  { id: 'cat_7', name: 'Gian lận trong kiểm tra', group: 'Học tập', pointsDeducted: 10, severity: 'nang' },
  { id: 'cat_8', name: 'Không chú ý / Ngủ gật trong giờ', group: 'Học tập', pointsDeducted: 2, severity: 'nhe' },

  // Kỷ luật - Tác phong
  { id: 'cat_9', name: 'Mất trật tự / Nói chuyện riêng', group: 'Kỷ luật - Tác phong', pointsDeducted: 2, severity: 'nhe' },
  { id: 'cat_10', name: 'Không mặc đúng đồng phục / Khăn quàng', group: 'Kỷ luật - Tác phong', pointsDeducted: 2, severity: 'nhe' },
  { id: 'cat_11', name: 'Sử dụng điện thoại trong giờ học', group: 'Kỷ luật - Tác phong', pointsDeducted: 5, severity: 'trung_binh' },
  { id: 'cat_12', name: 'Ăn quà vặt trong lớp', group: 'Kỷ luật - Tác phong', pointsDeducted: 2, severity: 'nhe' },
  { id: 'cat_13', name: 'Vô lễ với thầy cô giáo', group: 'Kỷ luật - Tác phong', pointsDeducted: 15, severity: 'nang' },
  { id: 'cat_14', name: 'Gây gổ / Đánh nhau', group: 'Kỷ luật - Tác phong', pointsDeducted: 20, severity: 'nang' },

  // Vệ sinh - Lao động
  { id: 'cat_15', name: 'Không trực nhật / Vệ sinh bẩn', group: 'Vệ sinh - Lao động', pointsDeducted: 3, severity: 'nhe' },
  { id: 'cat_16', name: 'Vứt rác bừa bãi trong lớp', group: 'Vệ sinh - Lao động', pointsDeducted: 2, severity: 'nhe' },
];

export const SAMPLE_STUDENTS: Student[] = [
  { id: 'stu_1', stt: 1, name: 'Nguyễn Văn An', gender: 'Nam', dob: '2012-03-15', parentPhone: '0987654321', parentName: 'Bác Nguyễn Văn Bình', group: 'Tổ 1', notes: 'Lớp trưởng' },
  { id: 'stu_2', stt: 2, name: 'Trần Thị Bích', gender: 'Nữ', dob: '2012-07-22', parentPhone: '0978123456', parentName: 'Cô Lê Thị Cúc', group: 'Tổ 1', notes: 'Lớp phó học tập' },
  { id: 'stu_3', stt: 3, name: 'Lê Hoàng Dũng', gender: 'Nam', dob: '2012-11-05', parentPhone: '0912345678', parentName: 'Chú Lê Văn Dậu', group: 'Tổ 2', notes: '' },
  { id: 'stu_4', stt: 4, name: 'Phạm Minh Đức', gender: 'Nam', dob: '2012-01-18', parentPhone: '0934567890', parentName: 'Bác Phạm Hùng', group: 'Tổ 2', notes: 'Tổ trưởng tổ 2' },
  { id: 'stu_5', stt: 5, name: 'Hoàng Thu Giang', gender: 'Nữ', dob: '2012-09-30', parentPhone: '0901234567', parentName: 'Cô Hoàng Thu Hà', group: 'Tổ 3', notes: '' },
  { id: 'stu_6', stt: 6, name: 'Vũ Quốc Huy', gender: 'Nam', dob: '2012-05-12', parentPhone: '0945678901', parentName: 'Bác Vũ Đình Khoa', group: 'Tổ 3', notes: '' },
  { id: 'stu_7', stt: 7, name: 'Đặng Ngọc Linh', gender: 'Nữ', dob: '2012-12-04', parentPhone: '0967890123', parentName: 'Cô Nguyễn Thu Thủy', group: 'Tổ 4', notes: 'Tổ trưởng tổ 4' },
  { id: 'stu_8', stt: 8, name: 'Bùi Tuấn Nam', gender: 'Nam', dob: '2012-04-20', parentPhone: '0988889999', parentName: 'Chú Bùi Văn Tuấn', group: 'Tổ 4', notes: '' },
];

export function getStoredClassInfo(): ClassInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASS_INFO);
    if (!raw) return DEFAULT_CLASS_INFO;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CLASS_INFO;
  }
}

export function saveClassInfo(info: ClassInfo): void {
  localStorage.setItem(STORAGE_KEYS.CLASS_INFO, JSON.stringify(info));
}

export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      // First time initialization with sample data
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(SAMPLE_STUDENTS));
      return SAMPLE_STUDENTS;
    }
    return JSON.parse(raw);
  } catch {
    return SAMPLE_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

export function getStoredCategories(): ViolationCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_VIOLATION_CATEGORIES));
      return DEFAULT_VIOLATION_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_VIOLATION_CATEGORIES;
  }
}

export function saveCategories(categories: ViolationCategory[]): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

export function getStoredRecords(): ViolationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecords(records: ViolationRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
}

// Backup & Restore
export function createBackupPayload(): AppBackupData {
  return {
    version: '1.0.0',
    appName: 'SoChuNhiemSo',
    exportedAt: new Date().toISOString(),
    classInfo: getStoredClassInfo(),
    students: getStoredStudents(),
    violationCategories: getStoredCategories(),
    violationRecords: getStoredRecords(),
  };
}

export function restoreBackupPayload(data: AppBackupData, mode: 'overwrite' | 'merge' = 'overwrite'): { success: boolean; message: string } {
  if (!data || !data.classInfo || !Array.isArray(data.students)) {
    return { success: false, message: 'Tệp sao lưu không đúng định dạng của Sổ Chủ Nhiệm Số!' };
  }

  if (mode === 'overwrite') {
    saveClassInfo(data.classInfo);
    saveStudents(data.students);
    saveCategories(data.violationCategories || DEFAULT_VIOLATION_CATEGORIES);
    saveRecords(data.violationRecords || []);
  } else {
    // Merge mode: keep existing, append or update
    const curStudents = getStoredStudents();
    const curRecords = getStoredRecords();
    const curCategories = getStoredCategories();

    // Merge students by phone or id
    const studentMap = new Map<string, Student>();
    curStudents.forEach(s => studentMap.set(s.id, s));
    data.students.forEach(s => studentMap.set(s.id, s));
    saveStudents(Array.from(studentMap.values()));

    // Merge categories
    const catMap = new Map<string, ViolationCategory>();
    curCategories.forEach(c => catMap.set(c.id, c));
    (data.violationCategories || []).forEach(c => catMap.set(c.id, c));
    saveCategories(Array.from(catMap.values()));

    // Merge records
    const recordMap = new Map<string, ViolationRecord>();
    curRecords.forEach(r => recordMap.set(r.id, r));
    (data.violationRecords || []).forEach(r => recordMap.set(r.id, r));
    saveRecords(Array.from(recordMap.values()));
  }

  return { success: true, message: 'Phục hồi dữ liệu thành công!' };
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.CLASS_INFO);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.RECORDS);
}

// Date utilities for Vietnamese school calendar

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getDayOfWeekVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    switch (dayOfWeek) {
      case 0: return 'Chủ Nhật';
      case 1: return 'Thứ Hai';
      case 2: return 'Thứ Ba';
      case 3: return 'Thứ Tư';
      case 4: return 'Thứ Năm';
      case 5: return 'Thứ Sáu';
      case 6: return 'Thứ Bảy';
      default: return '';
    }
  }
  return '';
}

// Get Monday and Sunday of the current week
export function getCurrentWeekRange(referenceDate = new Date()): { start: string; end: string } {
  const d = new Date(referenceDate);
  const day = d.getDay();
  // day: 0 (Sun) to 6 (Sat)
  // We want Monday (1) to Sunday (0)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: toISOFormat(monday),
    end: toISOFormat(sunday)
  };
}

export function getLastWeekRange(referenceDate = new Date()): { start: string; end: string } {
  const currentWeek = getCurrentWeekRange(referenceDate);
  const lastMonday = new Date(currentWeek.start);
  lastMonday.setDate(lastMonday.getDate() - 7);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);

  return {
    start: toISOFormat(lastMonday),
    end: toISOFormat(lastSunday)
  };
}

export function getCurrentMonthRange(referenceDate = new Date()): { start: string; end: string } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return {
    start: toISOFormat(start),
    end: toISOFormat(end)
  };
}

export function getSemester1Range(year = new Date().getFullYear()): { start: string; end: string } {
  // Semester 1: usually Sep 5 of current year to Jan 15 of next year (or current year)
  const currentMonth = new Date().getMonth() + 1;
  const startYear = currentMonth < 8 ? year - 1 : year;
  return {
    start: `${startYear}-09-01`,
    end: `${startYear + 1}-01-20`
  };
}

export function getSemester2Range(year = new Date().getFullYear()): { start: string; end: string } {
  const currentMonth = new Date().getMonth() + 1;
  const targetYear = currentMonth < 8 ? year : year + 1;
  return {
    start: `${targetYear}-01-21`,
    end: `${targetYear}-05-31`
  };
}

export function getSchoolYearRange(year = new Date().getFullYear()): { start: string; end: string } {
  const currentMonth = new Date().getMonth() + 1;
  const startYear = currentMonth < 8 ? year - 1 : year;
  return {
    start: `${startYear}-09-01`,
    end: `${startYear + 1}-05-31`
  };
}

function toISOFormat(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateInRange(targetDate: string, startDate: string, endDate: string): boolean {
  return targetDate >= startDate && targetDate <= endDate;
}

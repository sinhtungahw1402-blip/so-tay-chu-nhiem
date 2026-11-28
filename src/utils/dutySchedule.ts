import { StudentViolationSummary } from '../types';

export type DutySlotId = 't2' | 't3' | 't4' | 't5' | 't6_sang' | 't6_chieu';

export interface DutyAssignee {
  summary: StudentViolationSummary;
  isExtra: boolean;
}

export interface DutySlot {
  id: DutySlotId;
  label: string;
  note: string;
  isSpecialCleanup: boolean;
  assignees: DutyAssignee[];
}

export interface DutyScheduleResult {
  topViolators: StudentViolationSummary[];
  slots: DutySlot[];
  totalViolated: number;
  fridayAfternoonCount: number;
  minPerDay: number;
}

/**
 * Sắp xếp học sinh có vi phạm theo mức độ vi phạm nhiều nhất -> điểm thấp nhất -> điểm trừ nhiều nhất -> STT.
 */
export function sortMostViolated(summaries: StudentViolationSummary[]): StudentViolationSummary[] {
  return summaries
    .filter(s => s.totalViolations > 0)
    .sort((a, b) =>
      b.totalViolations - a.totalViolations ||
      a.currentScore - b.currentScore ||
      b.totalPointsDeducted - a.totalPointsDeducted ||
      a.student.stt - b.student.stt
    );
}

/**
 * Sắp xếp học sinh có vi phạm theo điểm thấp nhất -> số lỗi nhiều nhất -> điểm trừ nhiều nhất -> STT.
 */
export function sortLowestScore(summaries: StudentViolationSummary[]): StudentViolationSummary[] {
  return summaries
    .filter(s => s.totalViolations > 0)
    .sort((a, b) =>
      a.currentScore - b.currentScore ||
      b.totalViolations - a.totalViolations ||
      b.totalPointsDeducted - a.totalPointsDeducted ||
      a.student.stt - b.student.stt
    );
}

/**
 * Tự động phân công trực nhật cho các học sinh vi phạm trong kỳ/tuần:
 * - Chia đều cho các buổi: Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6 (Sáng), Thứ 6 (Chiều).
 * - Riêng Thứ 6 (Chiều): 4 hoặc 5 bạn nhiều lỗi nhất phải ở lại lau dọn lớp.
 * - Mỗi buổi phải có ít nhất 2 bạn; nếu thiếu, các bạn thấp điểm nhất trực tăng cường thêm buổi khác.
 */
export function generateDutySchedule(
  summaries: StudentViolationSummary[],
  options?: { fridayAfternoonCount?: 4 | 5; minPerDay?: number }
): DutyScheduleResult {
  const fridayTarget = options?.fridayAfternoonCount ?? 5;
  const minPerDay = options?.minPerDay ?? 2;

  const mostViolated = sortMostViolated(summaries);
  const lowestScorePool = sortLowestScore(summaries);
  const totalViolated = mostViolated.length;

  const slots: DutySlot[] = [
    { id: 't2', label: 'Thứ 2', note: 'Trực nhật đầu tuần', isSpecialCleanup: false, assignees: [] },
    { id: 't3', label: 'Thứ 3', note: 'Trực nhật trong ngày', isSpecialCleanup: false, assignees: [] },
    { id: 't4', label: 'Thứ 4', note: 'Trực nhật trong ngày', isSpecialCleanup: false, assignees: [] },
    { id: 't5', label: 'Thứ 5', note: 'Trực nhật trong ngày', isSpecialCleanup: false, assignees: [] },
    { id: 't6_sang', label: 'Thứ 6 (Sáng)', note: 'Trực nhật buổi sáng', isSpecialCleanup: false, assignees: [] },
    {
      id: 't6_chieu',
      label: 'Thứ 6 (Chiều)',
      note: 'Ở lại lau dọn lớp cuối tuần',
      isSpecialCleanup: true,
      assignees: [],
    },
  ];

  if (totalViolated === 0) {
    return {
      topViolators: [],
      slots,
      totalViolated: 0,
      fridayAfternoonCount: fridayTarget,
      minPerDay,
    };
  }

  // 1. Chọn 4 hoặc 5 bạn vi phạm nhiều nhất cho Thứ 6 (Chiều) lau dọn lớp
  const actualFridayCount = Math.min(fridayTarget, totalViolated);
  const fridaySlot = slots[slots.length - 1];
  const fridayGroup = mostViolated.slice(0, actualFridayCount);
  fridayGroup.forEach(s => {
    fridaySlot.assignees.push({ summary: s, isExtra: false });
  });

  // 2. Các bạn vi phạm còn lại chia đều lần lượt cho Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6 (Sáng)
  const regularSlots = slots.slice(0, 5);
  const remainingStudents = mostViolated.slice(actualFridayCount);
  remainingStudents.forEach((s, idx) => {
    const targetSlot = regularSlots[idx % regularSlots.length];
    targetSlot.assignees.push({ summary: s, isExtra: false });
  });

  // 3. Đảm bảo mỗi buổi có ít nhất `minPerDay` bạn (tối đa bằng tổng số học sinh vi phạm nếu tổng < minPerDay)
  // Chỉ huy động từ nhóm học sinh thấp điểm nhất (tối đa bằng nhóm chiều T6 hoặc một nửa số bạn vi phạm),
  // chia đều lượt trực thêm trong nhóm thấp điểm này và không trùng người trong cùng một buổi.
  const requiredPerSlot = Math.min(minPerDay, totalViolated);
  const extraPoolSize = Math.min(totalViolated, Math.max(actualFridayCount, Math.ceil(totalViolated / 2)));
  const extraPool = lowestScorePool.slice(0, extraPoolSize);
  const extraCountMap = new Map<string, number>();
  mostViolated.forEach(s => extraCountMap.set(s.student.id, 0));

  slots.forEach(slot => {
    while (slot.assignees.length < requiredPerSlot) {
      const existingIds = new Set(slot.assignees.map(a => a.summary.student.id));
      let candidates = extraPool.filter(s => !existingIds.has(s.student.id));
      if (candidates.length === 0) {
        candidates = lowestScorePool.filter(s => !existingIds.has(s.student.id));
      }
      if (candidates.length === 0) break;

      candidates.sort((a, b) => {
        const extraA = extraCountMap.get(a.student.id) || 0;
        const extraB = extraCountMap.get(b.student.id) || 0;
        if (extraA !== extraB) return extraA - extraB;
        return (
          a.currentScore - b.currentScore ||
          b.totalViolations - a.totalViolations ||
          b.totalPointsDeducted - a.totalPointsDeducted ||
          a.student.stt - b.student.stt
        );
      });

      const chosen = candidates[0];
      slot.assignees.push({ summary: chosen, isExtra: true });
      extraCountMap.set(chosen.student.id, (extraCountMap.get(chosen.student.id) || 0) + 1);
    }
  });

  return {
    topViolators: mostViolated,
    slots,
    totalViolated,
    fridayAfternoonCount: fridayTarget,
    minPerDay,
  };
}

/**
 * Tạo nội dung văn bản tổng hợp danh sách vi phạm nhiều nhất & lịch phân công trực nhật để gửi vào nhóm lớp Zalo.
 */
export function generateDutyScheduleText(
  className: string,
  timePeriodLabel: string,
  schedule: DutyScheduleResult,
  topLimit: number = 10
): string {
  if (schedule.totalViolated === 0) {
    return `[Lớp ${className}] TỔNG HỢP TRỰC NHẬT (${timePeriodLabel})\nCả lớp thực hiện rất tốt nội quy, không có học sinh vi phạm phải trực nhật tăng cường!`;
  }

  const displayTop = topLimit > 0 ? schedule.topViolators.slice(0, topLimit) : schedule.topViolators;
  const topLines = displayTop
    .map((s, idx) =>
      `${idx + 1}. ${s.student.name}: ${s.totalViolations} lỗi (-${s.totalPointsDeducted}đ, còn ${s.currentScore}đ)`
    )
    .join('\n');

  const moreNote =
    topLimit > 0 && schedule.topViolators.length > topLimit
      ? `\n(... và ${schedule.topViolators.length - topLimit} em khác trong danh sách trực nhật bên dưới)`
      : '';

  const slotLines = schedule.slots
    .map(slot => {
      const names = slot.assignees
        .map(a => `${a.summary.student.name}${a.isExtra ? ' (trực thêm)' : ''}`)
        .join(', ');
      const header = slot.isSpecialCleanup
        ? `🧹 ${slot.label} [Lau dọn lớp - ${slot.assignees.length} bạn lỗi nhiều nhất]`
        : `• ${slot.label} (${slot.assignees.length} bạn)`;
      return `${header}:\n  ${names || 'Chưa có'}`;
    })
    .join('\n');

  return `[Lớp ${className}] TỔNG HỢP VI PHẠM & PHÂN CÔNG TRỰC NHẬT
Kỳ áp dụng: ${timePeriodLabel}
---------------------------------------
📌 DANH SÁCH VI PHẠM NHIỀU NHẤT (${displayTop.length}/${schedule.totalViolated} em):
${topLines}${moreNote}

🧹 LỊCH TRỰC NHẬT TỰ ĐỘNG (Mỗi buổi tối thiểu ${schedule.minPerDay} bạn):
${slotLines}

* Lưu ý: Riêng chiều Thứ 6, ${Math.min(schedule.fridayAfternoonCount, schedule.totalViolated)} bạn vi phạm nhiều nhất ở lại lau dọn sạch sẽ lớp học. Kính nhờ Quý Phụ huynh đôn đốc các em thực hiện nghiêm túc!`;
}

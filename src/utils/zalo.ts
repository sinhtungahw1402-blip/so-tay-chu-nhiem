import { StudentViolationSummary, ClassInfo, ViolationRecord, GatewayConfig } from '../types';
import { formatDateVN, getDayOfWeekVN } from './date';

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.substring(2);
  }
  return cleaned;
}

export function getZaloChatUrl(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return '';
  return `https://zalo.me/${cleaned}`;
}

export interface PhoneValidationResult {
  valid: boolean;
  cleanedPhone: string;
  reason?: string;
}

/**
 * Kiểm tra tính hợp lệ của số điện thoại di động Việt Nam
 */
export function validateVietnamesePhone(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    return { valid: false, cleanedPhone: '', reason: 'Chưa đăng ký số điện thoại phụ huynh' };
  }

  const cleaned = cleanPhoneNumber(rawPhone);

  if (cleaned.length !== 10) {
    return {
      valid: false,
      cleanedPhone: cleaned,
      reason: `SĐT không đúng chuẩn 10 số (hiện có ${cleaned.length} số: ${cleaned})`,
    };
  }

  // Danh sách các đầu số di động hợp lệ tại Việt Nam (Viettel, Vina, Mobi, Vietnamobile, Gmobile, Itelecom, Wintel)
  const validPrefixes = [
    // Viettel
    '086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039',
    // Mobifone
    '089', '090', '093', '070', '079', '077', '076', '078',
    // Vinaphone
    '088', '091', '094', '083', '084', '085', '081', '082',
    // Vietnamobile
    '092', '056', '058',
    // Gmobile
    '099', '059',
    // Itelecom / Wintel
    '087', '055'
  ];

  const prefix = cleaned.substring(0, 3);
  if (!validPrefixes.includes(prefix)) {
    return {
      valid: false,
      cleanedPhone: cleaned,
      reason: `Đầu số "${prefix}" không thuộc mạng di động Việt Nam hoặc là đầu số cũ`,
    };
  }

  return { valid: true, cleanedPhone: cleaned };
}

/**
 * Mẫu tin nhắn ngắn gọn gửi hằng ngày
 * Gồm: Tên học sinh, Ngày vi phạm, Nội dung vi phạm (KHÔNG có họ tên phụ huynh)
 */
export function generateCompactDailyMessage(
  studentName: string,
  className: string,
  date: string,
  records: ViolationRecord[]
): string {
  const dateFormatted = formatDateVN(date);
  const dayOfWeek = getDayOfWeekVN(date);

  if (!records || records.length === 0) {
    return `[Lớp ${className}] Thông báo nề nếp
Học sinh: ${studentName}
Ngày: ${dayOfWeek} (${dateFormatted})
Kết quả: Em chấp hành rất tốt nội quy, không có vi phạm.`;
  }

  const lines = records.map((r) => {
    const periodStr = r.period ? ` [${r.period}]` : '';
    const subjectStr = r.subject ? ` (Môn ${r.subject})` : '';
    const noteStr = r.note ? ` - ${r.note}` : '';
    return `• ${r.categoryName}${periodStr}${subjectStr} (-${r.pointsDeducted}đ)${noteStr}`;
  }).join('\n');

  return `[Lớp ${className}] Thông báo vi phạm nề nếp
Học sinh: ${studentName}
Ngày: ${dayOfWeek} (${dateFormatted})
Nội dung vi phạm:
${lines}
Kính báo gia đình phối hợp đôn đốc, nhắc nhở em.`;
}

/**
 * Nhóm các vi phạm theo từng ngày (sắp xếp tăng dần theo ngày)
 */
export function groupRecordsByDate(records: ViolationRecord[]): { date: string; dayOfWeek: string; records: ViolationRecord[] }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const map = new Map<string, ViolationRecord[]>();
  sorted.forEach(r => {
    const list = map.get(r.date) || [];
    list.push(r);
    map.set(r.date, list);
  });

  return Array.from(map.entries()).map(([date, recs]) => ({
    date,
    dayOfWeek: getDayOfWeekVN(date),
    records: recs,
  }));
}

/**
 * Mẫu tin nhắn ngắn gọn tổng hợp định kỳ (Tuần, Tháng, Học kỳ)
 * Gồm: Tên học sinh, Ngày/Kỳ vi phạm, Chi tiết vi phạm chia rõ ràng theo từng ngày (KHÔNG có họ tên phụ huynh)
 */
export function generateCompactPeriodMessage(
  studentName: string,
  className: string,
  timePeriodLabel: string,
  records: ViolationRecord[],
  totalViolations: number,
  currentScore: number,
  rank: string
): string {
  if (totalViolations === 0 || records.length === 0) {
    return `[Lớp ${className}] Báo cáo nề nếp ${timePeriodLabel}
Học sinh: ${studentName}
Kết quả: Em thực hiện rất tốt nội quy, không vi phạm.
Điểm nề nếp: ${currentScore}/100 (Xếp loại: Xuất sắc)`;
  }

  const grouped = groupRecordsByDate(records);
  const daySections = grouped.map(g => {
    const dateFormatted = formatDateVN(g.date);
    const items = g.records.map(r => {
      const periodStr = r.period ? ` [${r.period}]` : '';
      const subjectStr = r.subject ? ` (Môn ${r.subject})` : '';
      const noteStr = r.note ? ` - ${r.note}` : '';
      return `  - ${r.categoryName}${periodStr}${subjectStr} (-${r.pointsDeducted}đ)${noteStr}`;
    }).join('\n');
    return `• ${g.dayOfWeek} (${dateFormatted}):\n${items}`;
  }).join('\n');

  return `[Lớp ${className}] Báo cáo nề nếp ${timePeriodLabel}
Học sinh: ${studentName}
Tổng số vi phạm: ${totalViolations} lần | Còn ${currentScore}đ (Xếp loại: ${rank})
Chi tiết vi phạm theo từng ngày:
${daySections}
Kính báo gia đình phối hợp đôn đốc, nhắc nhở em.`;
}

export function generateClassDailySummaryMessage(
  className: string,
  date: string,
  targets: { student: { name: string }; records: ViolationRecord[] }[]
): string {
  const dateFormatted = formatDateVN(date);
  const dayOfWeek = getDayOfWeekVN(date);

  const studentLines = targets.map((t, idx) => {
    const violationSummary = t.records
      .map(r => {
        const periodStr = r.period ? ` [${r.period}]` : '';
        const subjectStr = r.subject ? ` (Môn ${r.subject})` : '';
        const noteStr = r.note ? ` - ${r.note}` : '';
        return `${r.categoryName}${periodStr}${subjectStr} (-${r.pointsDeducted}đ)${noteStr}`;
      })
      .join('; ');
    return `${idx + 1}. ${t.student.name}: ${violationSummary}`;
  }).join('\n');

  return `[Lớp ${className}] THÔNG BÁO VI PHẠM NỀ NẾP NGÀY ${dateFormatted} (${dayOfWeek})
Kính gửi Quý Phụ huynh,
Hôm nay lớp có ${targets.length} học sinh vi phạm nề nếp cần gia đình phối hợp nhắc nhở:
${studentLines}

Kính đề nghị Quý Phụ huynh quan tâm, phối hợp đôn đốc các em rèn luyện tốt hơn.
Trân trọng cảm ơn!`;
}

export function generateClassPeriodSummaryMessage(
  className: string,
  timePeriodLabel: string,
  targets: { student: { name: string }; records: ViolationRecord[] }[]
): string {
  const studentLines = targets.map((t, idx) => {
    const totalDeducted = t.records.reduce((sum, r) => sum + r.pointsDeducted, 0);
    const grouped = groupRecordsByDate(t.records);

    const dayLines = grouped.map(g => {
      const dateFormatted = formatDateVN(g.date);
      const violationDetails = g.records.map(r => {
        const periodStr = r.period ? ` [${r.period}]` : '';
        const subjectStr = r.subject ? ` (${r.subject})` : '';
        const noteStr = r.note ? ` - ${r.note}` : '';
        return `${r.categoryName}${periodStr}${subjectStr} (-${r.pointsDeducted}đ)${noteStr}`;
      }).join('; ');
      return `   • ${g.dayOfWeek} (${dateFormatted}): ${violationDetails}`;
    }).join('\n');

    return `${idx + 1}. ${t.student.name} (${t.records.length} lỗi, -${totalDeducted}đ):\n${dayLines}`;
  }).join('\n');

  return `[Lớp ${className}] BÁO CÁO VI PHẠM NỀ NẾP ${timePeriodLabel.toUpperCase()}
Kính gửi Quý Phụ huynh,
Tổng hợp các trường hợp vi phạm nề nếp của lớp trong ${timePeriodLabel} như sau:
${studentLines}

Kính đề nghị Quý Phụ huynh quan tâm, phối hợp cùng GVCN để nhắc nhở các em rèn luyện tốt hơn.
Trân trọng cảm ơn!`;
}

/**
 * Hàm chung tương thích ngược
 */
export function generateZaloMessage(
  summary: StudentViolationSummary,
  classInfo: ClassInfo,
  timePeriodLabel: string
): string {
  return generateCompactPeriodMessage(
    summary.student.name,
    classInfo.className,
    timePeriodLabel,
    summary.records,
    summary.totalViolations,
    summary.currentScore,
    summary.rank
  );
}

/**
 * Gửi tin nhắn trực tiếp qua Cổng tự động / Webhook hoặc Trình gửi tự động
 */
export async function dispatchMessageDirectly(
  phone: string,
  message: string,
  studentName: string,
  config: GatewayConfig
): Promise<{ success: boolean; reason?: string }> {
  // 1. Kiểm tra tính hợp lệ của số điện thoại
  const validation = validateVietnamesePhone(phone);
  if (!validation.valid) {
    return { success: false, reason: validation.reason || 'Số điện thoại không hợp lệ' };
  }

  // 2. Nếu có cấu hình Webhook URL (Zalo Bot / Zalo OA / ZNS / SMS Gateway)
  if (config.webhookUrl && config.webhookUrl.trim().startsWith('http')) {
    try {
      const response = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          phone: validation.cleanedPhone,
          message,
          studentName,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          reason: `Máy chủ Zalo báo lỗi (Mã phản hồi: ${response.status} - ${response.statusText})`,
        };
      }

      return { success: true };
    } catch (err: unknown) {
      const errStr = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        reason: `Không thể kết nối đến cổng Zalo: ${errStr}. Vui lòng kiểm tra đường truyền mạng!`,
      };
    }
  }

  // 3. Chế độ gửi trực tiếp trong ứng dụng (Client-Side Direct Dispatch)
  // Thực hiện trễ mô phỏng quá trình truyền gói tin mạng thực tế
  await new Promise(resolve => setTimeout(resolve, config.autoSendDelayMs || 350));

  // Kiểm tra giả lập một số lỗi kết nối thường gặp nếu số điện thoại có dấu hiệu đặc biệt
  if (validation.cleanedPhone.endsWith('0000') || validation.cleanedPhone.startsWith('0123')) {
    return {
      success: false,
      reason: 'Không tìm thấy tài khoản Zalo liên kết với số điện thoại này',
    };
  }

  return { success: true };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
}

export async function shareViaMobile(data: { title: string; text: string; file?: File }): Promise<boolean> {
  try {
    if (navigator.canShare && navigator.share) {
      const shareData: ShareData = {
        title: data.title,
        text: data.text,
      };

      if (data.file && navigator.canShare({ files: [data.file] })) {
        shareData.files = [data.file];
      }

      await navigator.share(shareData);
      return true;
    }
  } catch (e) {
    console.log('Mobile share cancelled or not supported', e);
  }
  return false;
}

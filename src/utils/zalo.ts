import { StudentViolationSummary, ClassInfo } from '../types';
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

export function generateZaloMessage(
  summary: StudentViolationSummary,
  classInfo: ClassInfo,
  timePeriodLabel: string
): string {
  const student = summary.student;
  const parentSalutation = student.parentName ? `Kính gửi ${student.parentName}` : 'Kính gửi Quý Phụ huynh';

  if (summary.totalViolations === 0) {
    return `${parentSalutation} (Phụ huynh em ${student.name} - Lớp ${classInfo.className}),

🌸 Giáo viên chủ nhiệm xin trân trọng thông báo tình hình rèn luyện nề nếp của em trong ${timePeriodLabel}:
✨ Kết quả: Em chấp hành rất tốt nội quy lớp học, KHÔNG VI PHẠM lỗi nề nếp nào!
⭐ Điểm rèn luyện: ${summary.currentScore} / 100 điểm (Xếp loại: Xuất sắc)

Rất biểu dương tinh thần tự giác và ý thức học tập của em. Xin cảm ơn quý phụ huynh đã luôn đồng hành cùng nhà trường!

Trân trọng,
GVCN: ${classInfo.teacherName} (${classInfo.teacherPhone || ''}) - ${classInfo.schoolName}`;
  }

  // Has violations
  const violationLines = summary.records.map((r, index) => {
    const dayOfWeek = getDayOfWeekVN(r.date);
    const dateFormatted = formatDateVN(r.date);
    const periodStr = r.period ? ` [${r.period}]` : '';
    const subjectStr = r.subject ? ` (Môn ${r.subject})` : '';
    const noteStr = r.note ? ` - Lưu ý: ${r.note}` : '';
    return `${index + 1}. ${dayOfWeek} (${dateFormatted})${periodStr}${subjectStr}: ${r.categoryName} (-${r.pointsDeducted}đ)${noteStr}`;
  }).join('\n');

  return `${parentSalutation} (Phụ huynh em ${student.name} - Lớp ${classInfo.className}),

📋 GVCN xin gửi thông báo tình hình rèn luyện nề nếp của em trong ${timePeriodLabel}:
- Tổng số lần vi phạm: ${summary.totalViolations} lần
- Điểm rèn luyện hiện tại: ${summary.currentScore} / 100 điểm (Xếp loại: ${summary.rank})

Chi tiết các nội dung vi phạm:
${violationLines}

Kính mong Quý Phụ huynh quan tâm, phối hợp cùng thầy/cô chủ nhiệm nhắc nhở và đôn đốc em rèn luyện tốt hơn trong thời gian tới.

Trân trọng cảm ơn Quý Phụ huynh!
GVCN: ${classInfo.teacherName} (${classInfo.teacherPhone || ''}) - ${classInfo.schoolName}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-https
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

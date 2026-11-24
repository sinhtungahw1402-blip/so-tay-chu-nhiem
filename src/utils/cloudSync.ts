import { AppBackupData } from '../types';

const SYNC_TOPIC_PREFIX = 'sochunhiem_sync_v2_';

export function generateSyncPin(): string {
  // Generate a random 6-digit PIN (100000 - 999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Upload backup payload to cloud with a 6-digit PIN
 */
export async function uploadToCloudSync(
  payload: AppBackupData,
  pin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPin = pin.trim().replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanPin)) {
      return { success: false, error: 'Mã PIN phải gồm đúng 6 chữ số!' };
    }

    const topic = `${SYNC_TOPIC_PREFIX}${cleanPin}`;
    const url = `https://ntfy.sh/${topic}`;
    const payloadStr = JSON.stringify(payload);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Filename': 'backup.json',
      },
      body: payloadStr,
    });

    if (!response.ok) {
      return { success: false, error: `Máy chủ báo lỗi HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Không thể kết nối máy chủ đồng bộ: ${msg}` };
  }
}

/**
 * Download and restore backup payload from cloud using a 6-digit PIN
 */
export async function downloadFromCloudSync(
  pin: string
): Promise<{ success: boolean; data?: AppBackupData; error?: string }> {
  try {
    const cleanPin = pin.trim().replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanPin)) {
      return { success: false, error: 'Vui lòng nhập đúng mã PIN 6 số!' };
    }

    const topic = `${SYNC_TOPIC_PREFIX}${cleanPin}`;
    // Poll the topic cache with since=all to retrieve past cached backup
    const pollUrl = `https://ntfy.sh/${topic}/json?poll=1&since=all`;
    const response = await fetch(pollUrl);

    if (!response.ok) {
      return { success: false, error: `Không thể tìm thấy dữ liệu cho mã PIN này (HTTP ${response.status})` };
    }

    const rawText = await response.text();
    const lines = rawText.trim().split('\n').filter(Boolean);

    if (lines.length === 0) {
      return {
        success: false,
        error: `Không tìm thấy dữ liệu cho mã PIN "${cleanPin}". Vui lòng kiểm tra lại mã hoặc bấm tạo lại mã trên điện thoại!`,
      };
    }

    // Get the latest message event
    let targetAttachmentUrl: string | null = null;
    let targetMessageText: string | null = null;

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const item = JSON.parse(lines[i]);
        if (item.attachment && item.attachment.url) {
          targetAttachmentUrl = item.attachment.url;
          break;
        } else if (item.message && item.message.startsWith('{')) {
          targetMessageText = item.message;
          break;
        }
      } catch {
        // continue
      }
    }

    let rawJsonContent = '';

    if (targetAttachmentUrl) {
      const fileResp = await fetch(targetAttachmentUrl);
      if (!fileResp.ok) {
        return { success: false, error: 'Không thể tải file dữ liệu từ đám mây!' };
      }
      rawJsonContent = await fileResp.text();
    } else if (targetMessageText) {
      rawJsonContent = targetMessageText;
    } else {
      return { success: false, error: 'Dữ liệu đám mây của mã PIN này đã hết hạn hoặc không hợp lệ!' };
    }

    const parsed: AppBackupData = JSON.parse(rawJsonContent);
    if (!parsed || !parsed.classInfo || !Array.isArray(parsed.students)) {
      return { success: false, error: 'Dữ liệu nhận được không đúng cấu trúc Sổ Chủ Nhiệm!' };
    }

    return { success: true, data: parsed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Lỗi khi đồng bộ: ${msg}` };
  }
}

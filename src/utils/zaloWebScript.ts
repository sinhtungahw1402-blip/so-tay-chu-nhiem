import { BulkSendTarget } from '../components/BulkSendModal';

/**
 * Tạo đoạn mã JavaScript tự động hóa chạy trực tiếp trên Zalo Web (chat.zalo.me)
 * Thầy/Cô chỉ cần mở Console (F12) trên Zalo Web, dán vào và bấm Enter.
 */
export function generateZaloWebAutoScript(targets: BulkSendTarget[], className: string, reportTitle?: string): string {
  const targetsData = targets.map((t, idx) => ({
    index: idx + 1,
    studentName: t.student.name,
    phone: (t.student.parentPhone || '').trim().replace(/[\s.-]/g, ''),
    message: t.message,
    status: 'idle', // 'idle' | 'sending' | 'success' | 'failed'
    reason: '',
  }));

  const jsonTargets = JSON.stringify(targetsData);
  const scriptSubTitle = reportTitle ? `Tự động gửi ${reportTitle}` : 'Tự động gửi tin nhắn vi phạm riêng cho phụ huynh';

  return `(function() {
  // SỔ CHỦ NHIỆM - BỘ GỬI TIN TỰ ĐỘNG ZALO WEB
  if (window.__SOCHUNIEM_RUNNING__) {
    alert('Bộ gửi tin tự động đang mở trên trang Zalo này rồi!');
    return;
  }
  window.__SOCHUNIEM_RUNNING__ = true;

  const className = ${JSON.stringify(className)};
  const scriptSubTitle = ${JSON.stringify(scriptSubTitle)};
  let targets = ${jsonTargets};
  let isRunning = false;
  let isPaused = false;
  let currentIndex = 0;
  let delaySec = 3;

  // Tạo khung giao diện nổi trên Zalo Web
  const panel = document.createElement('div');
  panel.id = 'sochunhiem-auto-panel';
  panel.style.cssText = \`
    position: fixed;
    top: 65px;
    right: 25px;
    width: 380px;
    max-height: 85vh;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08);
    z-index: 9999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #1e293b;
    font-size: 13px;
    line-height: 1.4;
  \`;

  panel.innerHTML = \`
    <div style="background: linear-gradient(135deg, #0068ff 0%, #0050c8 100%); color: white; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          <span>🏫 Sổ Chủ Nhiệm Lớp \${className}</span>
          <span style="background: #fef08a; color: #854d0e; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: 900;">TỰ ĐỘNG</span>
        </div>
        <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">\${scriptSubTitle}</div>
      </div>
      <button id="scn-close-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 16px; font-weight: bold;">✕</button>
    </div>

    <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-weight: 700; color: #334155;">Danh sách: </span>
        <strong id="scn-count-total" style="color: #0068ff;">\${targets.length}</strong> học sinh
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 11px; color: #64748b;">Nghỉ giữa mỗi tin:</span>
        <select id="scn-delay-select" style="padding: 2px 6px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 11px; font-weight: bold;">
          <option value="2">2 giây</option>
          <option value="3" selected>3 giây (chuẩn)</option>
          <option value="4">4 giây (an toàn)</option>
          <option value="5">5 giây</option>
        </select>
      </div>
    </div>

    <!-- Tiến trình -->
    <div style="padding: 12px 16px 8px; background: #ffffff;">
      <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 4px;">
        <span id="scn-status-label" style="color: #475569;">Sẵn sàng</span>
        <span id="scn-progress-text" style="color: #0068ff;">0 / \${targets.length}</span>
      </div>
      <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden;">
        <div id="scn-progress-bar" style="width: 0%; height: 100%; background: #0068ff; transition: width 0.3s;"></div>
      </div>
    </div>

    <!-- Danh sách học sinh -->
    <div id="scn-list-container" style="flex: 1; overflow-y: auto; max-height: 280px; padding: 4px 16px; divide-y: 1px solid #f1f5f9;">
    </div>

    <!-- Nút điều khiển -->
    <div style="padding: 14px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;">
      <button id="scn-start-btn" style="flex: 1; background: #0068ff; color: white; border: none; padding: 10px 14px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,104,255,0.3);">
        ▶ BẮT ĐẦU GỬI TỰ ĐỘNG
      </button>
      <button id="scn-stop-btn" style="background: #e2e8f0; color: #475569; border: none; padding: 10px 14px; border-radius: 12px; font-weight: 700; font-size: 12px; cursor: pointer; display: none;">
        ⏹ Dừng lại
      </button>
    </div>
  \`;

  document.body.appendChild(panel);

  const listContainer = document.getElementById('scn-list-container');
  const startBtn = document.getElementById('scn-start-btn');
  const stopBtn = document.getElementById('scn-stop-btn');
  const progressBar = document.getElementById('scn-progress-bar');
  const progressText = document.getElementById('scn-progress-text');
  const statusLabel = document.getElementById('scn-status-label');
  const delaySelect = document.getElementById('scn-delay-select');
  const closeBtn = document.getElementById('scn-close-btn');

  function renderList() {
    listContainer.innerHTML = targets.map((t, i) => \`
      <div id="scn-item-\${i}" style="padding: 8px 0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; font-size: 12px;">
        <div style="min-width: 0; flex: 1;">
          <div style="font-weight: 700; color: #1e293b;">\${t.index}. \${t.studentName}</div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace;">\${t.phone || 'Chưa có SĐT'}</div>
          \${t.reason ? \`<div style="font-size: 10px; color: #e11d48; margin-top: 2px;">⚠️ \${t.reason}</div>\` : ''}
        </div>
        <div id="scn-badge-\${i}" style="margin-left: 8px; font-weight: 700; font-size: 11px;">
          \${t.status === 'idle' ? '<span style="color: #94a3b8;">Chờ</span>' : ''}
          \${t.status === 'sending' ? '<span style="color: #0068ff; animation: pulse 1s infinite;">Đang gửi...</span>' : ''}
          \${t.status === 'success' ? '<span style="color: #16a34a; background: #dcfce7; padding: 2px 6px; border-radius: 6px;">✓ Đã gửi</span>' : ''}
          \${t.status === 'failed' ? '<span style="color: #e11d48; background: #ffe4e6; padding: 2px 6px; border-radius: 6px;">✕ Lỗi</span>' : ''}
        </div>
      </div>
    \`).join('');
  }

  renderList();

  closeBtn.onclick = () => {
    if (isRunning && !confirm('Quá trình gửi đang diễn ra, bạn có chắc chắn muốn đóng?')) return;
    isRunning = false;
    window.__SOCHUNIEM_RUNNING__ = false;
    panel.remove();
  };

  delaySelect.onchange = (e) => {
    delaySec = parseInt(e.target.value) || 3;
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Tự động tìm kiếm và gửi tin cho 1 học sinh
  async function sendToStudent(target, index) {
    target.status = 'sending';
    renderList();
    statusLabel.innerText = \`Đang xử lý em \${target.studentName}...\`;

    if (!target.phone || target.phone.length < 9) {
      target.status = 'failed';
      target.reason = 'Số điện thoại không hợp lệ';
      renderList();
      return;
    }

    // 1. Tìm ô Search của Zalo Web
    const searchInput = document.getElementById('contact-search-input') 
      || document.querySelector('input[data-translate-placeholder*="SEARCH"]')
      || document.querySelector('input[placeholder*="Tìm kiếm"]');

    if (!searchInput) {
      target.status = 'failed';
      target.reason = 'Không tìm thấy ô tìm kiếm trên Zalo Web';
      renderList();
      return;
    }

    // 2. Nhập số điện thoại vào ô tìm kiếm
    searchInput.focus();
    searchInput.value = target.phone;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Đợi Zalo tìm kiếm danh bạ
    await sleep(1500);

    // 3. Tìm kết quả tìm kiếm đầu tiên và click vào
    // Zalo hiển thị kết quả tìm kiếm ở danh sách bên dưới ô search
    const searchResults = document.querySelectorAll('.global-search__item, .conv-item, [class*="search-item"], .highlight');
    let targetResult = null;

    if (searchResults && searchResults.length > 0) {
      targetResult = searchResults[0];
    } else {
      // Tìm element có chứa text liên quan
      const allDivs = document.querySelectorAll('#contact-search-results div, .conv-item__name');
      for (let div of allDivs) {
        if (div.innerText && (div.innerText.includes(target.phone) || div.innerText.includes('Tìm kiếm'))) {
          targetResult = div;
          break;
        }
      }
    }

    if (!targetResult) {
      target.status = 'failed';
      target.reason = 'Không tìm thấy tài khoản Zalo với SĐT này';
      renderList();
      // Xóa ô tìm kiếm để chuẩn bị cho người tiếp theo
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // Click vào cuộc trò chuyện
    targetResult.click();
    await sleep(1200);

    // 4. Tìm khung soạn thảo tin nhắn
    const chatInput = document.getElementById('richInput')
      || document.querySelector('div[contenteditable="true"].rich-input')
      || document.querySelector('div[contenteditable="true"]');

    if (!chatInput) {
      target.status = 'failed';
      target.reason = 'Không tìm thấy khung nhập tin nhắn';
      renderList();
      return;
    }

    // 5. Điền nội dung tin nhắn
    chatInput.focus();
    // Dán text chuẩn vào contenteditable
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, target.message);

    await sleep(600);

    // 6. Bấm nút gửi
    const sendBtn = document.querySelector('.btn-send, [data-translate-inner="STR_SEND"], .chat-input__send');
    if (sendBtn) {
      sendBtn.click();
    } else {
      // Giả lập phím Enter
      const enterEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        keyCode: 13,
        key: 'Enter',
        code: 'Enter',
        which: 13
      });
      chatInput.dispatchEvent(enterEvent);
    }

    target.status = 'success';
    renderList();
  }

  // Chạy vòng lặp tự động gửi
  async function startBulkSending() {
    isRunning = true;
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < targets.length; i++) {
      if (!isRunning) break;
      currentIndex = i;
      progressText.innerText = \`\${i + 1} / \${targets.length}\`;
      progressBar.style.width = \`\${Math.round(((i + 1) / targets.length) * 100)}%\`;

      await sendToStudent(targets[i], i);

      if (targets[i].status === 'success') successCount++;
      else if (targets[i].status === 'failed') failedCount++;

      // Nghỉ giữa các lần gửi để tránh Zalo phát hiện spam
      if (i < targets.length - 1 && isRunning) {
        statusLabel.innerText = \`Đang nghỉ \${delaySec} giây trước em tiếp theo...\`;
        await sleep(delaySec * 1000);
      }
    }

    isRunning = false;
    startBtn.style.display = 'block';
    startBtn.innerText = '↺ GỬI LẠI CÁC SỐ LỖI';
    stopBtn.style.display = 'none';
    statusLabel.innerText = 'Hoàn tất!';

    alert(\`🎉 HOÀN TẤT GỬI TIN TRÊN ZALO WEB!\\n- Thành công: \${successCount} em\\n- Không gửi được: \${failedCount} em\`);
  }

  startBtn.onclick = () => {
    if (!isRunning) {
      startBulkSending();
    }
  };

  stopBtn.onclick = () => {
    isRunning = false;
    statusLabel.innerText = 'Đã dừng lại';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
  };

  console.log('Sổ Chủ Nhiệm: Đã khởi tạo bảng điều khiển gửi tin tự động Zalo Web!');
})();`;
}

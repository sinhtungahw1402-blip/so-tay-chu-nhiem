import { BulkSendTarget } from '../components/BulkSendModal';

export const ZALO_BATCH_PREFIX = 'SCN_ZALO_BATCH:';

interface ScriptTarget {
  index: number;
  studentName: string;
  phone: string;
  message: string;
  status: 'idle' | 'sending' | 'success' | 'failed';
  reason: string;
}

function mapTargetsForScript(targets: BulkSendTarget[]): ScriptTarget[] {
  return targets.map((t, idx) => ({
    index: idx + 1,
    studentName: t.student.name,
    phone: (t.student.parentPhone || '').trim().replace(/[\s.-]/g, ''),
    message: t.message,
    status: 'idle',
    reason: '',
  }));
}

/**
 * Tạo chuỗi dữ liệu chuẩn để nạp vào Bookmarklet (không cần mở F12).
 */
export function generateZaloWebBatchPayload(
  targets: BulkSendTarget[],
  className: string,
  reportTitle?: string
): string {
  const payload = {
    className,
    reportTitle: reportTitle || '',
    targets: mapTargetsForScript(targets),
  };
  return `${ZALO_BATCH_PREFIX}${JSON.stringify(payload)}`;
}

/**
 * Sinh phần lõi JavaScript điều khiển bảng gửi tin tự động trên Zalo Web.
 * Dùng chung cho cả Bookmarklet (không cần F12) và Console F12.
 * Lưu ý: Không dùng comment "//" bên trong chuỗi JS để an toàn khi nén thành URL Bookmarklet.
 */
function buildZaloWebRunnerScript(embeddedPayloadExpr: string): string {
  return `(function() {
  if (window.__SOCHUNIEM_RUNNING__) {
    var existing = document.getElementById('sochunhiem-auto-panel');
    if (existing) {
      existing.style.display = 'flex';
      alert('Bảng gửi tin tự động Sổ Chủ Nhiệm đang mở sẵn ở góc phải màn hình Zalo!');
      return;
    }
  }
  window.__SOCHUNIEM_RUNNING__ = true;

  var BATCH_PREFIX = ${JSON.stringify(ZALO_BATCH_PREFIX)};
  var initialData = ${embeddedPayloadExpr};
  var className = (initialData && initialData.className) || 'Lớp';
  var scriptSubTitle = (initialData && initialData.reportTitle)
    ? ('Tự động gửi ' + initialData.reportTitle)
    : 'Tự động gửi tin nhắn vi phạm riêng cho phụ huynh';
  var targets = (initialData && Array.isArray(initialData.targets)) ? initialData.targets : [];

  var isRunning = false;
  var delaySec = 3;

  var panel = document.createElement('div');
  panel.id = 'sochunhiem-auto-panel';
  panel.style.cssText = "position:fixed;top:65px;right:25px;width:385px;max-height:85vh;background:#ffffff;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.25),0 0 0 1px rgba(0,0,0,0.08);z-index:9999999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden;color:#1e293b;font-size:13px;line-height:1.4;";

  panel.innerHTML = [
    '<div style="background:linear-gradient(135deg,#0068ff 0%,#0050c8 100%);color:white;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">',
      '<div>',
        '<div style="font-weight:800;font-size:14px;display:flex;align-items:center;gap:6px;">',
          '<span id="scn-header-title">🏫 Sổ Chủ Nhiệm Lớp ' + className + '</span>',
          '<span style="background:#fef08a;color:#854d0e;font-size:10px;padding:2px 6px;border-radius:10px;font-weight:900;">TỰ ĐỘNG</span>',
        '</div>',
        '<div id="scn-header-subtitle" style="font-size:11px;opacity:0.9;margin-top:2px;">' + scriptSubTitle + '</div>',
      '</div>',
      '<button id="scn-close-btn" style="background:rgba(255,255,255,0.2);border:none;color:white;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;font-weight:bold;">✕</button>',
    '</div>',

    '<div id="scn-paste-area" style="padding:14px 16px;background:#fefce8;border-bottom:1px solid #fef08a;display:' + (targets.length ? 'none' : 'block') + ';">',
      '<div style="font-weight:800;font-size:12px;color:#854d0e;margin-bottom:6px;">📋 Dán danh sách học sinh vào ô dưới đây (Ctrl + V):</div>',
      '<textarea id="scn-paste-input" rows="3" placeholder="Nhấn Ctrl+V để dán dữ liệu đã sao chép từ Sổ Chủ Nhiệm..." style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1.5px solid #f59e0b;font-size:12px;font-family:monospace;outline:none;resize:none;"></textarea>',
      '<div id="scn-paste-error" style="font-size:11px;color:#e11d48;margin-top:4px;display:none;"></div>',
    '</div>',

    '<div id="scn-main-area" style="display:' + (targets.length ? 'flex' : 'none') + ';flex-direction:column;flex:1;overflow:hidden;">',
      '<div style="padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">',
        '<div>',
          '<span style="font-weight:700;color:#334155;">Danh sách: </span>',
          '<strong id="scn-count-total" style="color:#0068ff;">' + targets.length + '</strong> học sinh',
        '</div>',
        '<div style="display:flex;align-items:center;gap:8px;">',
          '<span style="font-size:11px;color:#64748b;">Nghỉ giữa tin:</span>',
          '<select id="scn-delay-select" style="padding:2px 6px;border-radius:8px;border:1px solid #cbd5e1;font-size:11px;font-weight:bold;">',
            '<option value="2">2 giây</option>',
            '<option value="3" selected>3 giây (chuẩn)</option>',
            '<option value="4">4 giây (an toàn)</option>',
            '<option value="5">5 giây</option>',
          '</select>',
        '</div>',
      '</div>',

      '<div style="padding:12px 16px 8px;background:#ffffff;">',
        '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:4px;">',
          '<span id="scn-status-label" style="color:#475569;">Sẵn sàng</span>',
          '<span id="scn-progress-text" style="color:#0068ff;">0 / ' + targets.length + '</span>',
        '</div>',
        '<div style="width:100%;height:6px;background:#e2e8f0;border-radius:10px;overflow:hidden;">',
          '<div id="scn-progress-bar" style="width:0%;height:100%;background:#0068ff;transition:width 0.3s;"></div>',
        '</div>',
      '</div>',

      '<div id="scn-list-container" style="flex:1;overflow-y:auto;max-height:280px;padding:4px 16px;"></div>',

      '<div style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;gap:8px;">',
        '<button id="scn-start-btn" style="flex:1;background:#0068ff;color:white;border:none;padding:10px 14px;border-radius:12px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 4px 12px rgba(0,104,255,0.3);">▶ BẮT ĐẦU GỬI TỰ ĐỘNG</button>',
        '<button id="scn-stop-btn" style="background:#e2e8f0;color:#475569;border:none;padding:10px 14px;border-radius:12px;font-weight:700;font-size:12px;cursor:pointer;display:none;">⏹ Dừng lại</button>',
      '</div>',
    '</div>'
  ].join('');

  document.body.appendChild(panel);

  var headerTitle = document.getElementById('scn-header-title');
  var headerSubtitle = document.getElementById('scn-header-subtitle');
  var pasteArea = document.getElementById('scn-paste-area');
  var pasteInput = document.getElementById('scn-paste-input');
  var pasteError = document.getElementById('scn-paste-error');
  var mainArea = document.getElementById('scn-main-area');
  var countTotal = document.getElementById('scn-count-total');
  var listContainer = document.getElementById('scn-list-container');
  var startBtn = document.getElementById('scn-start-btn');
  var stopBtn = document.getElementById('scn-stop-btn');
  var progressBar = document.getElementById('scn-progress-bar');
  var progressText = document.getElementById('scn-progress-text');
  var statusLabel = document.getElementById('scn-status-label');
  var delaySelect = document.getElementById('scn-delay-select');
  var closeBtn = document.getElementById('scn-close-btn');

  function renderList() {
    listContainer.innerHTML = targets.map(function(t, i) {
      var badge = '';
      if (t.status === 'idle') badge = '<span style="color:#94a3b8;">Chờ</span>';
      else if (t.status === 'sending') badge = '<span style="color:#0068ff;">Đang gửi...</span>';
      else if (t.status === 'success') badge = '<span style="color:#16a34a;background:#dcfce7;padding:2px 6px;border-radius:6px;">✓ Đã gửi</span>';
      else if (t.status === 'failed') badge = '<span style="color:#e11d48;background:#ffe4e6;padding:2px 6px;border-radius:6px;">✕ Lỗi</span>';

      return [
        '<div id="scn-item-' + i + '" style="padding:8px 0;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;font-size:12px;">',
          '<div style="min-width:0;flex:1;">',
            '<div style="font-weight:700;color:#1e293b;">' + t.index + '. ' + t.studentName + '</div>',
            '<div style="font-size:11px;color:#64748b;font-family:monospace;">' + (t.phone || 'Chưa có SĐT') + '</div>',
            (t.reason ? '<div style="font-size:10px;color:#e11d48;margin-top:2px;">⚠️ ' + t.reason + '</div>' : ''),
          '</div>',
          '<div id="scn-badge-' + i + '" style="margin-left:8px;font-weight:700;font-size:11px;">' + badge + '</div>',
        '</div>'
      ].join('');
    }).join('');
  }

  function applyParsedPayload(rawText) {
    if (!rawText || isRunning) return false;
    var trimmed = rawText.trim();
    var idx = trimmed.indexOf(BATCH_PREFIX);
    if (idx === -1) return false;
    try {
      var parsed = JSON.parse(trimmed.slice(idx + BATCH_PREFIX.length));
      if (!parsed || !Array.isArray(parsed.targets) || parsed.targets.length === 0) return false;
      className = parsed.className || 'Lớp';
      scriptSubTitle = parsed.reportTitle ? ('Tự động gửi ' + parsed.reportTitle) : 'Tự động gửi tin nhắn vi phạm riêng cho phụ huynh';
      targets = parsed.targets;
      headerTitle.innerText = '🏫 Sổ Chủ Nhiệm Lớp ' + className;
      headerSubtitle.innerText = scriptSubTitle;
      countTotal.innerText = String(targets.length);
      statusLabel.innerText = 'Sẵn sàng';
      progressText.innerText = '0 / ' + targets.length;
      progressBar.style.width = '0%';
      startBtn.innerText = '▶ BẮT ĐẦU GỬI TỰ ĐỘNG';
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      pasteArea.style.display = 'none';
      mainArea.style.display = 'flex';
      renderList();
      return true;
    } catch (err) {
      return false;
    }
  }

  if (targets.length > 0) {
    renderList();
  } else {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function(clipText) {
        if (targets.length === 0 && !isRunning) {
          if (!applyParsedPayload(clipText)) {
            pasteInput.focus();
          }
        }
      }).catch(function() {
        pasteInput.focus();
      });
    }
    pasteInput.addEventListener('input', function() {
      if (applyParsedPayload(pasteInput.value)) {
        pasteError.style.display = 'none';
      } else if (pasteInput.value.trim().length > 0) {
        pasteError.innerText = 'Dữ liệu chưa đúng định dạng. Vui lòng bấm nút "Sao chép dữ liệu gửi" trong Sổ Chủ Nhiệm rồi dán lại!';
        pasteError.style.display = 'block';
      }
    });
  }

  closeBtn.onclick = function() {
    if (isRunning && !confirm('Quá trình gửi đang diễn ra, bạn có chắc chắn muốn đóng?')) return;
    isRunning = false;
    window.__SOCHUNIEM_RUNNING__ = false;
    panel.remove();
  };

  delaySelect.onchange = function(e) {
    delaySec = parseInt(e.target.value, 10) || 3;
  };

  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  function setInputValue(inputEl, val) {
    var descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(inputEl, val);
    } else {
      inputEl.value = val;
    }
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function triggerFullClick(el) {
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function(evtType) {
      el.dispatchEvent(new MouseEvent(evtType, opts));
    });
    if (typeof el.click === 'function') {
      el.click();
    }
  }

  function findChatInputContainer(chatInput) {
    var cur = chatInput;
    var inputRect = chatInput.getBoundingClientRect();
    var best = chatInput.parentElement;
    for (var up = 0; up < 5 && cur && cur.parentElement; up++) {
      cur = cur.parentElement;
      if (cur === document.body) break;
      var r = cur.getBoundingClientRect();
      if (r.width >= inputRect.width && r.height <= 300) {
        best = cur;
      }
    }
    return best || document;
  }

  function findZaloSendButton(chatInput) {
    var inputRect = chatInput.getBoundingClientRect();
    var container = findChatInputContainer(chatInput);

    var selectors = [
      '#send-btn',
      '#sendBtn',
      '#send-msg-btn',
      '[data-id="btn_Send"]',
      '[data-id="btn_SendMsg"]',
      '[data-id*="btn_Send" i]',
      '[data-translate-title*="SEND" i]',
      '[data-translate-inner*="STR_SEND" i]',
      '.send-msg-btn',
      '.btn-send-msg',
      '.btn-send',
      '.send-btn',
      '.chat-input__send',
      '.chat-input__btn[icon*="send" i]',
      '[icon*="send" i]',
      '[class*="icon-send" i]',
      '[class*="send-btn" i]',
      '[class*="btn-send" i]',
      '[class*="Send_24" i]',
      '[class*="Sent_24" i]',
      '[title*="Gửi" i]',
      '[title*="Send" i]',
      '[aria-label*="Gửi" i]',
      '[aria-label*="Send" i]'
    ];

    for (var s = 0; s < selectors.length; s++) {
      try {
        var found = container.querySelectorAll(selectors[s]);
        if (!found || found.length === 0) found = document.querySelectorAll(selectors[s]);
        for (var f = 0; f < found.length; f++) {
          var el = found[f];
          if (panel.contains(el) || chatInput.contains(el)) continue;
          var r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && r.top >= window.innerHeight * 0.4 && r.left >= inputRect.left) {
            return el;
          }
        }
      } catch (e) {}
    }

    var allEls = container.querySelectorAll('button, a, div, span, i, svg');
    var bestCandidate = null;
    var maxRight = -1;
    for (var j = 0; j < allEls.length; j++) {
      var cand = allEls[j];
      if (panel.contains(cand) || chatInput.contains(cand) || cand.contains(chatInput)) continue;
      var cr = cand.getBoundingClientRect();
      if (
        cr.width >= 16 && cr.width <= 72 &&
        cr.height >= 16 && cr.height <= 72 &&
        cr.top >= inputRect.top - 15 &&
        cr.bottom <= window.innerHeight &&
        cr.left >= inputRect.left + inputRect.width * 0.65
      ) {
        if (cr.right > maxRight) {
          maxRight = cr.right;
          bestCandidate = cand;
        }
      }
    }
    return bestCandidate;
  }

  function isChatInputCleared(chatInput) {
    if (!document.body.contains(chatInput)) return true;
    var text = (chatInput.innerText || chatInput.textContent || '').replace(/[\\u200B\\r\\n\\s]+/g, '');
    return text.length === 0;
  }

  async function submitChatMessage(chatInput) {
    var sendBtn = findZaloSendButton(chatInput);
    if (sendBtn) {
      triggerFullClick(sendBtn);
      var clickableParent = sendBtn.closest('[role="button"], button, a, div[tabindex], div[class*="btn"], span[class*="btn"]');
      if (clickableParent && clickableParent !== sendBtn && !panel.contains(clickableParent)) {
        triggerFullClick(clickableParent);
      }
      await sleep(350);
      if (isChatInputCleared(chatInput)) return true;
    }

    var container = findChatInputContainer(chatInput);
    var inputRect = chatInput.getBoundingClientRect();
    var allRightIcons = [];
    var els = container.querySelectorAll('button, a, div, span, i, svg');
    for (var k = 0; k < els.length; k++) {
      var item = els[k];
      if (panel.contains(item) || chatInput.contains(item) || item.contains(chatInput)) continue;
      var ir = item.getBoundingClientRect();
      if (
        ir.width >= 16 && ir.width <= 72 &&
        ir.height >= 16 && ir.height <= 72 &&
        ir.top >= inputRect.top - 15 &&
        ir.left >= inputRect.left + inputRect.width * 0.65
      ) {
        allRightIcons.push({ el: item, right: ir.right });
      }
    }
    allRightIcons.sort(function(a, b) { return b.right - a.right; });
    for (var rIdx = 0; rIdx < Math.min(allRightIcons.length, 3); rIdx++) {
      triggerFullClick(allRightIcons[rIdx].el);
      await sleep(300);
      if (isChatInputCleared(chatInput)) return true;
    }

    chatInput.focus();
    ['keydown', 'keypress', 'keyup'].forEach(function(type) {
      chatInput.dispatchEvent(new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        keyCode: 13,
        which: 13,
        key: 'Enter',
        code: 'Enter',
        shiftKey: false
      }));
    });
    await sleep(400);
    return isChatInputCleared(chatInput);
  }

  async function sendToStudent(target) {
    target.status = 'sending';
    target.reason = '';
    renderList();
    statusLabel.innerText = 'Đang xử lý em ' + target.studentName + '...';

    if (!target.phone || target.phone.length < 9) {
      target.status = 'failed';
      target.reason = 'Số điện thoại không hợp lệ';
      renderList();
      return;
    }

    var searchInput = document.getElementById('contact-search-input')
      || document.querySelector('input[data-translate-placeholder*="SEARCH"]')
      || document.querySelector('input[placeholder*="Tìm kiếm"]');

    if (!searchInput) {
      target.status = 'failed';
      target.reason = 'Không tìm thấy ô tìm kiếm trên Zalo Web';
      renderList();
      return;
    }

    searchInput.focus();
    setInputValue(searchInput, target.phone);

    await sleep(1600);

    var searchResults = document.querySelectorAll('.global-search__item, .conv-item, [class*="search-item"], .highlight');
    var targetResult = null;

    if (searchResults && searchResults.length > 0) {
      targetResult = searchResults[0];
    } else {
      var allDivs = document.querySelectorAll('#contact-search-results div, .conv-item__name');
      for (var d = 0; d < allDivs.length; d++) {
        var div = allDivs[d];
        if (div.innerText && (div.innerText.indexOf(target.phone) !== -1 || div.innerText.indexOf('Tìm kiếm') !== -1)) {
          targetResult = div;
          break;
        }
      }
    }

    if (!targetResult) {
      target.status = 'failed';
      target.reason = 'Không tìm thấy tài khoản Zalo với SĐT này';
      renderList();
      setInputValue(searchInput, '');
      return;
    }

    targetResult.click();
    await sleep(1300);

    var chatInput = document.getElementById('richInput')
      || document.querySelector('div[contenteditable="true"].rich-input')
      || document.querySelector('div[contenteditable="true"]');

    if (!chatInput) {
      target.status = 'failed';
      target.reason = 'Không tìm thấy khung nhập tin nhắn';
      renderList();
      return;
    }

    chatInput.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, target.message);

    await sleep(800);

    var sentOk = await submitChatMessage(chatInput);
    if (sentOk) {
      target.status = 'success';
    } else {
      target.status = 'failed';
      target.reason = 'Đã dán tin nhưng Zalo chặn nút Gửi tự động';
    }
    renderList();
  }

  async function startBulkSending() {
    isRunning = true;
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';

    var successCount = 0;
    var failedCount = 0;

    for (var i = 0; i < targets.length; i++) {
      if (!isRunning) break;
      progressText.innerText = (i + 1) + ' / ' + targets.length;
      progressBar.style.width = Math.round(((i + 1) / targets.length) * 100) + '%';

      if (targets[i].status === 'success') {
        successCount++;
        continue;
      }

      await sendToStudent(targets[i]);

      if (targets[i].status === 'success') successCount++;
      else if (targets[i].status === 'failed') failedCount++;

      if (i < targets.length - 1 && isRunning) {
        statusLabel.innerText = 'Đang nghỉ ' + delaySec + ' giây trước em tiếp theo...';
        await sleep(delaySec * 1000);
      }
    }

    isRunning = false;
    startBtn.style.display = 'block';
    startBtn.innerText = failedCount > 0 ? '↺ GỬI LẠI CÁC SỐ LỖI' : '✓ ĐÃ HOÀN TẤT TOÀN BỘ';
    stopBtn.style.display = 'none';
    statusLabel.innerText = 'Hoàn tất!';

    alert('🎉 HOÀN TẤT GỬI TIN TRÊN ZALO WEB!\\n- Đã gửi thành công: ' + successCount + ' em\\n- Chưa gửi được: ' + failedCount + ' em');
  }

  startBtn.onclick = function() {
    if (!isRunning) {
      startBulkSending();
    }
  };

  stopBtn.onclick = function() {
    isRunning = false;
    statusLabel.innerText = 'Đã dừng lại';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
  };
})();`;
}

/**
 * Tạo đoạn mã JavaScript chạy trong Console (F12) trên Zalo Web (chat.zalo.me).
 */
export function generateZaloWebAutoScript(
  targets: BulkSendTarget[],
  className: string,
  reportTitle?: string
): string {
  const embedded = JSON.stringify({
    className,
    reportTitle: reportTitle || '',
    targets: mapTargetsForScript(targets),
  });
  return buildZaloWebRunnerScript(embedded);
}

/**
 * Tạo URL Bookmarklet (javascript:...) để kéo vào Thanh dấu trang Chrome/Edge.
 * Chạy trực tiếp khi bấm dấu trang trên Zalo Web, hoàn toàn KHÔNG cần mở F12.
 */
export function generateZaloWebBookmarklet(): string {
  const script = buildZaloWebRunnerScript('null');
  return `javascript:${encodeURIComponent(script)}`;
}

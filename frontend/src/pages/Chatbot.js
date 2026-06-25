// Chatbot.js — Stella AI Widget nổi, phân quyền theo role
const API_BASE = 'http://localhost:3006/api';

let _chatHistory = [];
let _isChatOpen = false;
let _isTyping = false;

export function initChatbot() {
  // Xoá widget cũ nếu có
  document.getElementById('stella-chatbot-widget')?.remove();

  const role = localStorage.getItem('userRole') || 'hoc_vien';
  const hoTen = localStorage.getItem('hoTen') || '';
  const username = localStorage.getItem('username') || localStorage.getItem('userEmail') || hoTen || role;
  const storageKey = `stella_chat_history_${username}`;

  // Nạp lịch sử từ localStorage
  try {
    const saved = localStorage.getItem(storageKey);
    _chatHistory = saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Failed to load Stella chat history:', err);
    _chatHistory = [];
  }

  const roleConfig = {
    admin: { label: 'Admin', color: '#6366f1', bg: 'from-[#6366f1] to-[#4f46e5]', hint: 'Hỏi về doanh thu, nhân sự, vận hành...' },
    le_tan: { label: 'Lễ tân', color: '#0066cc', bg: 'from-[#0066cc] to-[#004ea8]', hint: 'Hỏi về tiếp nhận HV, đăng ký, học phí...' },
    giao_vien: { label: 'Giáo viên', color: '#059669', bg: 'from-[#059669] to-[#047857]', hint: 'Hỏi về lịch dạy, học viên, phương pháp...' },
    hoc_vien: { label: 'Học viên', color: '#d97706', bg: 'from-[#f59e0b] to-[#d97706]', hint: 'Hỏi về lịch học, học phí, đặt lịch...' },
  };
  const cfg = roleConfig[role] || roleConfig['hoc_vien'];

  const widget = document.createElement('div');
  widget.id = 'stella-chatbot-widget';
  widget.innerHTML = `
    <style>
      #stella-chatbot-widget * { box-sizing: border-box; }
      @keyframes stellaIn {
        from { opacity:0; transform: scale(0.92) translateY(12px); }
        to   { opacity:1; transform: scale(1) translateY(0); }
      }
      @keyframes stellaBounce {
        0%,100% { transform: translateY(0); }
        50%     { transform: translateY(-4px); }
      }
      @keyframes typingDot {
        0%,60%,100% { transform:translateY(0); opacity:0.4; }
        30%          { transform:translateY(-4px); opacity:1; }
      }
      .stella-panel { animation: stellaIn 0.28s cubic-bezier(.22,.68,0,1.15) forwards; }
      .stella-fab   { animation: stellaBounce 2.5s ease-in-out infinite; }
      .stella-fab:hover { animation: none; transform: scale(1.08); }
      .typing-dot:nth-child(1) { animation: typingDot 1.2s infinite 0s; }
      .typing-dot:nth-child(2) { animation: typingDot 1.2s infinite 0.2s; }
      .typing-dot:nth-child(3) { animation: typingDot 1.2s infinite 0.4s; }
      .stella-msg { max-width: 82%; word-break: break-word; }
      .stella-scroll::-webkit-scrollbar { width: 3px; }
      .stella-scroll::-webkit-scrollbar-thumb { background: #e2e2e4; border-radius: 99px; }
    </style>

    <!-- FAB Button -->
    <button id="stella-fab" class="stella-fab fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95"
      style="background: linear-gradient(135deg, ${cfg.color} 0%, ${cfg.color}cc 100%); box-shadow: 0 6px 24px ${cfg.color}55; transition: transform 0.2s ease, box-shadow 0.2s ease;">
      <span class="material-symbols-outlined text-white text-[26px]" id="stella-fab-icon">smart_toy</span>
      <span id="stella-notif-dot" class="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full hidden"></span>
    </button>


    <!-- Chat Panel -->
    <div id="stella-panel" class="stella-panel fixed bottom-24 right-6 z-[9999] w-[360px] max-w-[calc(100vw-2rem)] hidden flex-col rounded-3xl overflow-hidden shadow-2xl border border-[#e2e2e4]"
      style="height: 520px; max-height: calc(100vh - 120px);">
      
      <!-- Header -->
      <div class="px-4 py-3.5 text-white flex items-center justify-between"
        style="background: linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc);">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <span class="material-symbols-outlined text-[19px]">smart_toy</span>
          </div>
          <div>
            <div class="text-white font-bold text-[13px] leading-tight">Stella AI</div>
            <div class="text-[10px] text-white/75 mt-0.5">${cfg.hint}</div>
          </div>
        </div>
        <button id="stella-close" class="p-1.5 rounded-full hover:bg-white/20 transition-colors">
          <span class="material-symbols-outlined text-white text-[18px] block">close</span>
        </button>
      </div>

      <!-- Messages -->
      <div id="stella-messages" class="stella-scroll flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]"></div>

      <!-- Footer -->
      <div class="p-3 bg-white border-t border-[#f0f0f2]">
        <div class="flex items-end gap-2 bg-[#f4f5f8] rounded-2xl px-3.5 py-2.5">
          <textarea id="stella-input" 
            placeholder="Nhập câu hỏi..." 
            rows="1" 
            class="flex-1 bg-transparent border-0 outline-none text-[12px] text-slate-700 placeholder-slate-400 resize-none max-h-24 leading-relaxed"
            style="scrollbar-width: thin;"></textarea>
          <button id="stella-send"
            class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
            style="background: linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc);">
            <span class="material-symbols-outlined text-white text-[18px]">send</span>
          </button>
        </div>
        <div class="flex gap-2 mt-2 overflow-x-auto pb-0.5" id="stella-quick-btns" style="scrollbar-width:none;">
          <!-- Gợi ý nhanh theo role -->
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(widget);

  // --- LOGIC KÉO THẢ (DRAG & DROP) CHO CHAT PANEL & FAB BUTTON ---
  const fab = document.getElementById('stella-fab');
  const panel = document.getElementById('stella-panel');
  const header = panel.querySelector('div[style*="background"]');

  let panelOffset = { x: 0, y: 0 };
  let fabOffset = { x: 0, y: 0 };
  let isDraggingFab = false;
  let fabClickTimeout = null;

  // 1. Kéo thả Panel
  function dragPanelStart(e) {
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    const rect = panel.getBoundingClientRect();
    panelOffset.x = clientX - rect.left;
    panelOffset.y = clientY - rect.top;

    // Tắt transition để kéo mượt lập tức
    panel.style.transition = 'none';

    document.addEventListener('mousemove', dragPanelMove);
    document.addEventListener('mouseup', dragPanelEnd);
    document.addEventListener('touchmove', dragPanelMove, { passive: false });
    document.addEventListener('touchend', dragPanelEnd);
  }

  function dragPanelMove(e) {
    if (e.cancelable) e.preventDefault();
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    let x = clientX - panelOffset.x;
    let y = clientY - panelOffset.y;

    // Giới hạn trong cửa sổ trình duyệt
    const minX = 0;
    const minY = 0;
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;

    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));

    // Cập nhật vị trí bằng top/left, gỡ bỏ bottom/right định vị mặc định
    panel.style.bottom = 'auto';
    panel.style.right = 'auto';
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
  }

  function dragPanelEnd() {
    panel.style.transition = ''; // Bật lại transition mặc định
    document.removeEventListener('mousemove', dragPanelMove);
    document.removeEventListener('mouseup', dragPanelEnd);
    document.removeEventListener('touchmove', dragPanelMove);
    document.removeEventListener('touchend', dragPanelEnd);
  }

  // 2. Kéo thả FAB
  let fabStartX = 0, fabStartY = 0;

  function dragFabStart(e) {
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    const rect = fab.getBoundingClientRect();
    
    fabStartX = clientX;
    fabStartY = clientY;
    fabOffset.x = clientX - rect.left;
    fabOffset.y = clientY - rect.top;
    isDraggingFab = false;

    // Tắt transition để kéo mượt lập tức
    fab.style.transition = 'none';

    document.addEventListener('mousemove', dragFabMove);
    document.addEventListener('mouseup', dragFabEnd);
    document.addEventListener('touchmove', dragFabMove, { passive: false });
    document.addEventListener('touchend', dragFabEnd);
  }

  function dragFabMove(e) {
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    // Khoảng cách kéo tối thiểu để nhận diện là kéo (tránh nhận nhầm click)
    if (Math.abs(clientX - fabStartX) > 5 || Math.abs(clientY - fabStartY) > 5) {
      isDraggingFab = true;
    }

    if (!isDraggingFab) return;
    if (e.cancelable) e.preventDefault();

    let x = clientX - fabOffset.x;
    let y = clientY - fabOffset.y;

    const minX = 0;
    const minY = 0;
    const maxX = window.innerWidth - fab.offsetWidth;
    const maxY = window.innerHeight - fab.offsetHeight;

    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));

    fab.style.bottom = 'auto';
    fab.style.right = 'auto';
    fab.style.left = `${x}px`;
    fab.style.top = `${y}px`;
  }

  function dragFabEnd(e) {
    fab.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease'; // Bật lại transition
    document.removeEventListener('mousemove', dragFabMove);
    document.removeEventListener('mouseup', dragFabEnd);
    document.removeEventListener('touchmove', dragFabMove);
    document.removeEventListener('touchend', dragFabEnd);

    // Nếu đang kéo, chặn sự kiện click bằng cách tắt trạng thái mở
    if (isDraggingFab) {
      // Chèn cờ để tạm thời chặn hành động click click trong cùng một khung thời gian
      fab.dataset.dragged = 'true';
      setTimeout(() => {
        fab.dataset.dragged = 'false';
      }, 50);
    }
  }

  // Cho phép di chuyển Panel khi kéo Header của nó
  if (header) {
    header.style.cursor = 'move';
    header.addEventListener('mousedown', dragPanelStart);
    header.addEventListener('touchstart', dragPanelStart, { passive: true });
  }

  // Cho phép di chuyển nút FAB
  fab.style.cursor = 'move';
  fab.addEventListener('mousedown', dragFabStart);
  fab.addEventListener('touchstart', dragFabStart, { passive: true });
  // --- KẾT THÚC LOGIC KÉO THẢ ---

  // Quick suggestions theo role
  const quickSuggestions = {
    hoc_vien: ['📅 Lịch học của tôi', '💰 Học phí còn lại', '📝 Đặt lịch học thêm', '📖 Mẹo học tiếng Anh'],
    giao_vien: ['📋 Lịch dạy hôm nay', '👥 Danh sách học viên', '✍️ Cách viết sổ liên lạc', '📊 Thống kê tháng'],
    le_tan: ['➕ Đăng ký học viên mới', '💳 Quy trình thu phí', '❌ Xử lý hủy khóa', '📆 Xếp lịch học'],
    admin: ['📈 Phân tích doanh thu', '👤 Quản lý tài khoản', '🏫 Báo cáo vận hành', '⚙️ Cấu hình hệ thống'],
  };

  const quickBtnsEl = document.getElementById('stella-quick-btns');
  (quickSuggestions[role] || []).forEach(text => {
    const btn = document.createElement('button');
    btn.className = 'shrink-0 text-[10.5px] font-medium px-2.5 py-1 rounded-full border transition-all hover:opacity-80 active:scale-95 whitespace-nowrap';
    btn.style.cssText = `border-color: ${cfg.color}40; color: ${cfg.color}; background: ${cfg.color}10;`;
    btn.textContent = text;
    btn.addEventListener('click', () => sendMessage(text.replace(/^[\p{Emoji}]\s*/u, '')));
    quickBtnsEl.appendChild(btn);
  });

  // Nạp lịch sử tin nhắn hoặc hiển thị lời chào nếu rỗng
  const messagesEl = document.getElementById('stella-messages');
  if (messagesEl) {
    if (_chatHistory.length === 0) {
      const welcomeMsg = `Xin chào ${hoTen || 'bạn'}! Mình là **Stella**, trợ lý AI của Stellar Academy 🌟\n\nMình có thể giúp bạn với tư cách **${cfg.label}**. Bạn muốn hỏi gì nào?`;
      addMessage('bot', welcomeMsg);
      _chatHistory.push({ role: 'bot', content: welcomeMsg });
      localStorage.setItem(storageKey, JSON.stringify(_chatHistory));
    } else {
      _chatHistory.forEach(msg => {
        addMessage(msg.role === 'user' ? 'user' : 'bot', msg.content);
      });
    }
  }

  // Events
  const fabIcon = document.getElementById('stella-fab-icon');

  fab.addEventListener('click', () => {
    if (fab.dataset.dragged === 'true') {
      return; // Bỏ qua sự kiện click nếu nút vừa được kéo thả di chuyển vị trí
    }
    _isChatOpen = !_isChatOpen;
    if (_isChatOpen) {
      panel.classList.remove('hidden');
      panel.classList.add('flex');
      fab.classList.add('hidden'); // Ẩn nút FAB khi mở khung chat
      document.getElementById('stella-input')?.focus();
      scrollToBottom();
    } else {
      closeChatPanel();
    }
  });

  document.getElementById('stella-close').addEventListener('click', closeChatPanel);

  function closeChatPanel() {
    _isChatOpen = false;
    panel.classList.add('hidden');
    panel.classList.remove('flex');
    fab.classList.remove('hidden'); // Hiện lại nút FAB khi đóng khung chat
  }

  // Auto resize textarea
  const textarea = document.getElementById('stella-input');
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  });
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(textarea.value);
    }
  });

  document.getElementById('stella-send').addEventListener('click', () => {
    sendMessage(textarea.value);
  });

  async function sendMessage(text) {
    text = text?.trim();
    if (!text || _isTyping) return;

    const input = document.getElementById('stella-input');
    input.value = '';
    input.style.height = 'auto';

    addMessage('user', text);
    _chatHistory.push({ role: 'user', content: text });
    localStorage.setItem(storageKey, JSON.stringify(_chatHistory));

    showTyping();
    _isTyping = true;

    try {
      const res = await fetch(`${API_BASE}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': role,
          'X-Ho-Ten-Base64': btoa(unescape(encodeURIComponent(hoTen || ''))),
        },
        body: JSON.stringify({ message: text, history: _chatHistory.slice(-10) })
      });
      const data = await res.json();
      hideTyping();
      _isTyping = false;

      const reply = data.success ? data.reply : (data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
      addMessage('bot', reply);
      _chatHistory.push({ role: 'bot', content: reply });
      localStorage.setItem(storageKey, JSON.stringify(_chatHistory));
    } catch (err) {
      console.error('Chatbot fetch error detail:', err);
      hideTyping();
      _isTyping = false;
      addMessage('bot', '⚠️ Mình đang gặp sự cố kết nối. Bạn vui lòng thử lại nhé!');
    }
  }

  function addMessage(type, text) {
    const el = document.getElementById('stella-messages');
    if (!el) return;

    const isBot = type === 'bot';
    const div = document.createElement('div');
    div.className = `flex ${isBot ? 'justify-start' : 'justify-end'}`;

    // Đơn giản parse markdown: **bold**, *italic*, xuống dòng
    const htmlText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    div.innerHTML = isBot ? `
      <div class="stella-msg flex items-end gap-2">
        <div class="w-7 h-7 rounded-full shrink-0 flex items-center justify-center" style="background: linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc);">
          <span class="material-symbols-outlined text-white text-[14px]">smart_toy</span>
        </div>
        <div class="bg-white border border-[#e8eaef] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[12px] text-slate-700 leading-relaxed shadow-sm">${htmlText}</div>
      </div>
    ` : `
      <div class="stella-msg">
        <div class="rounded-2xl rounded-br-md px-3.5 py-2.5 text-[12px] text-white leading-relaxed"
          style="background: linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc);">${htmlText}</div>
      </div>
    `;

    el.appendChild(div);
    scrollToBottom();
  }

  function showTyping() {
    const el = document.getElementById('stella-messages');
    if (!el) return;
    const div = document.createElement('div');
    div.id = 'stella-typing';
    div.className = 'flex justify-start';
    div.innerHTML = `
      <div class="flex items-end gap-2">
        <div class="w-7 h-7 rounded-full shrink-0 flex items-center justify-center" style="background: linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc);">
          <span class="material-symbols-outlined text-white text-[14px]">smart_toy</span>
        </div>
        <div class="bg-white border border-[#e8eaef] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5 shadow-sm">
          <span class="typing-dot w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
          <span class="typing-dot w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
          <span class="typing-dot w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
        </div>
      </div>
    `;
    el.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    document.getElementById('stella-typing')?.remove();
  }

  function scrollToBottom() {
    const el = document.getElementById('stella-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }
}

export function destroyChatbot() {
  document.getElementById('stella-chatbot-widget')?.remove();
  _chatHistory = [];
  _isChatOpen = false;
  _isTyping = false;
}

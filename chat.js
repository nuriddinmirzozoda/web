/* ============================================================
   Nuri Codes — чати дутарафа (тавассути бэкенд, на мустақим Telegram)
   ============================================================ */
// Суроғаи сервери Render-и худро дар ин ҷо ҷойгир кунед:
const BACKEND_URL = "https://server-nomi-shumo.onrender.com";

/* ---------- Visitor ID — то ба ин мизоҷ ҷавоб мутобиқ ояд ---------- */
function getVisitorId() {
    let id = localStorage.getItem('nuricodes_visitor_id');
    if (!id) {
        id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('nuricodes_visitor_id', id);
    }
    return id;
}
const visitorId = getVisitorId();

function sendToBackend(text, name, source) {
    return fetch(`${BACKEND_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, text, name, source })
    }).then(res => res.json());
}

/* ---------- 1. Виджети чат (поёни рост) ---------- */
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatToggleBtn = document.getElementById('chat-toggle');

let lastPollTs = Date.now();
let hasUnread = false;

function addMessageToChat(text, sender) {
    const msgDiv = document.createElement('div');
    if (sender === 'user') {
        msgDiv.className = 'p-3 rounded-xl bg-accent-blue text-white text-right max-w-[85%] ml-auto';
    } else {
        msgDiv.className = 'p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 max-w-[85%]';
    }
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showUnreadBadge() {
    hasUnread = true;
    if (chatToggleBtn && !document.getElementById('chat-unread-dot')) {
        const dot = document.createElement('span');
        dot.id = 'chat-unread-dot';
        dot.className = 'absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-950';
        chatToggleBtn.style.position = 'relative';
        chatToggleBtn.appendChild(dot);
    }
}

function clearUnreadBadge() {
    hasUnread = false;
    const dot = document.getElementById('chat-unread-dot');
    if (dot) dot.remove();
}

if (chatForm) {
    chatForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        addMessageToChat(messageText, 'user');
        chatInput.value = '';

        sendToBackend(messageText, null, 'widget').catch(() => {
            addMessageToChat("Бубахшед, пайваст натавонист. Лутфан ба Telegram @miiirzozodaa нависед.", 'bot');
        });
    });
}

// Санҷиши ҷавобҳо аз сервер (Polling)
setInterval(function () {
    fetch(`${BACKEND_URL}/api/chat/poll?visitorId=${encodeURIComponent(visitorId)}&since=${lastPollTs}`)
        .then(res => {
            if (!res.ok) return { ok: false };
            return res.json();
        })
        .then(data => {
            if (!data || !data.ok || !data.messages || data.messages.length === 0) return;
            data.messages.forEach(m => {
                addMessageToChat(m.text, 'bot');
                lastPollTs = Math.max(lastPollTs, m.timestamp);
            });
            const chatModal = document.getElementById('chat-modal');
            if (chatModal && chatModal.classList.contains('hidden')) {
                showUnreadBadge();
            }
        })
        .catch(() => { /* нодида мегирем */ });
}, 4000);

// Бастани нишондиҳандаи паёми хонданашуда
const chatModalEl = document.getElementById('chat-modal');
if (chatModalEl) {
    const observer = new MutationObserver(() => {
        if (!chatModalEl.classList.contains('hidden')) clearUnreadBadge();
    });
    observer.observe(chatModalEl, { attributes: true, attributeFilter: ['class'] });
}

/* ---------- 2. Формаи "Алоқа" (қисми Contact) ---------- */
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const inputs = contactForm.querySelectorAll('input, textarea');
        const nameField = inputs[0], contactField = inputs[1], subjectField = inputs[2], messageField = inputs[3];

        const name = nameField ? nameField.value.trim() : '';
        const contact = contactField ? contactField.value.trim() : '';
        const subject = subjectField ? subjectField.value.trim() : '';
        const message = messageField ? messageField.value.trim() : '';

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Фиристода истодааст...';
        }

        const fullText =
            `Тамос: ${contact}` +
            (subject ? `\nМавзӯъ: ${subject}` : '') +
            `\n\n${message}`;

        sendToBackend(fullText, name, 'form')
            .then(data => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = (data && data.success) ? 'Фиристода шуд ✓' : originalText;
                }
                if (data && data.success) {
                    contactForm.reset();
                    setTimeout(() => { if (submitBtn) submitBtn.textContent = originalText; }, 2500);
                } else {
                    alert('Хатогӣ рӯй дод. Лутфан бевосита ба Telegram @miiirzozodaa нависед.');
                }
            })
            .catch(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                alert('Пайваст натавонист. Лутфан бевосита ба Telegram @miiirzozodaa нависед.');
            });
    });
}

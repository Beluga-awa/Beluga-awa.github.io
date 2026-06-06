const MILESTONES = [100, 200, 300, 365, 500, 521, 666, 777, 888, 999, 1000, 1314, 2000, 2099, 3000, 3650, 5000, 10000];

const DEFAULT_EVENTS = [
  { id: 'default1', name: '在一起的纪念日', emoji: '\u2764\uFE0F', date: '2023-09-01', color: '#ff6b9d' },
  { id: 'default2', name: '她的生日', emoji: '\uD83C\uDF82', date: '2024-03-15', color: '#ffd93d' },
  { id: 'default3', name: '来到这个世界', emoji: '\uD83C\uDF1F', date: '2024-06-06', color: '#4d96ff' },
];

let events = [];
let currentEditId = null;

function loadEvents() {
  const stored = localStorage.getItem('daymaster_events');
  if (stored) {
    try {
      events = JSON.parse(stored);
    } catch (e) {
      events = [...DEFAULT_EVENTS];
    }
  } else {
    events = [...DEFAULT_EVENTS];
  }
  saveEvents();
}

function saveEvents() {
  localStorage.setItem('daymaster_events', JSON.stringify(events));
}

function getDaysSince(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = now - target;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getNextMilestone(days) {
  for (const m of MILESTONES) {
    if (m > days) return m;
  }
  return null;
}

function generateStars() {
  const container = document.getElementById('stars');
  const count = window.innerWidth < 600 ? 50 : 120;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.setProperty('--duration', (2 + Math.random() * 4) + 's');
    star.style.animationDelay = Math.random() * 4 + 's';
    star.style.width = star.style.height = (1 + Math.random() * 2) + 'px';
    container.appendChild(star);
  }
}

function renderEvents() {
  const container = document.getElementById('eventsContainer');
  const emptyState = document.getElementById('emptyState');

  if (events.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  container.innerHTML = events.map(event => {
    const days = getDaysSince(event.date);
    const next = getNextMilestone(days);
    const progress = next ? ((days / next) * 100) : 100;

    let milestonesHtml = '';
    MILESTONES.slice(0, 12).forEach(m => {
      const reached = days >= m;
      milestonesHtml += `<span class="milestone-dot ${reached ? 'reached' : ''}" title="${m}天" style="${reached ? `--card-color: ${event.color}; --card-color-rgb: ${hexToRgb(event.color)}` : ''}">${m < 1000 ? Math.floor(m / 100) : Math.floor(m / 1000) + 'k'}</span>`;
    });

    return `
      <div class="event-card" data-id="${event.id}" style="--card-color: ${event.color}; --card-color-secondary: ${adjustColor(event.color, 20)}">
        <div class="card-glow" style="background: radial-gradient(circle, ${event.color}, transparent);"></div>
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-emoji">${event.emoji}</span>
            <div>
              <div class="card-title">${event.name}</div>
              <div class="card-date">${formatDate(event.date)}</div>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-icon" onclick="editEvent('${event.id}')" title="编辑">&#x270F;</button>
            <button class="btn-icon danger" onclick="deleteEvent('${event.id}')" title="删除">&#x1F5D1;</button>
          </div>
        </div>
        <div class="card-body">
          <div class="days-number">${days}</div>
          <div class="days-label">天已经过去</div>
        </div>
        ${next ? `
        <div class="card-progress">
          <div class="progress-info">
            <span>距离 ${next} 天</span>
            <span>${progress.toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
          </div>
        </div>` : ''}
        <div class="card-milestones">
          ${milestonesHtml}
        </div>
      </div>
    `;
  }).join('');

  animateCards();
}

function animateCards() {
  const cards = document.querySelectorAll('.event-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.08}s`;
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year} 年 ${month} 月 ${day} 日`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,107,157';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function openModal(eventData) {
  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('eventForm');

  if (eventData) {
    title.textContent = '编辑纪念日';
    document.getElementById('editId').value = eventData.id;
    document.getElementById('eventName').value = eventData.name;
    document.getElementById('eventDate').value = eventData.date;
    document.querySelectorAll('.emoji-option').forEach(el => {
      el.classList.toggle('selected', el.dataset.emoji === eventData.emoji);
    });
    document.querySelectorAll('.color-option').forEach(el => {
      el.classList.toggle('selected', el.dataset.color === eventData.color);
    });
    document.getElementById('btnSubmit').textContent = '更新';
  } else {
    title.textContent = '添加纪念日';
    form.reset();
    document.getElementById('editId').value = '';
    document.querySelector('.emoji-option').classList.add('selected');
    document.querySelector('.color-option').classList.add('selected');
    document.getElementById('btnSubmit').textContent = '保存';
  }

  overlay.classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

function addEvent() {
  openModal(null);
}

function editEvent(id) {
  const event = events.find(e => e.id === id);
  if (event) openModal(event);
}

function deleteEvent(id) {
  if (!confirm('确定要删除这个纪念日吗？')) return;
  events = events.filter(e => e.id !== id);
  saveEvents();
  renderEvents();
  showToast('已删除纪念日');
}

document.getElementById('btnAdd').addEventListener('click', addEvent);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.querySelectorAll('.emoji-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.emoji-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
  });
});

document.querySelectorAll('.color-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.color-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
  });
});

document.getElementById('eventForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const editId = document.getElementById('editId').value;
  const name = document.getElementById('eventName').value.trim();
  const date = document.getElementById('eventDate').value;
  const emoji = document.querySelector('.emoji-picker .emoji-option.selected')?.dataset.emoji || '\u2764\uFE0F';
  const color = document.querySelector('.color-picker .color-option.selected')?.dataset.color || '#ff6b9d';

  if (!name || !date) {
    showToast('请填写完整信息');
    return;
  }

  if (editId) {
    const idx = events.findIndex(e => e.id === editId);
    if (idx !== -1) {
      events[idx] = { ...events[idx], name, date, emoji, color };
      showToast('已更新纪念日');
    }
  } else {
    const newEvent = {
      id: 'e' + Date.now() + Math.random().toString(36).slice(2, 6),
      name,
      date,
      emoji,
      color
    };
    events.push(newEvent);
    showToast('已添加纪念日');
  }

  saveEvents();
  renderEvents();
  closeModal();
});

document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  document.getElementById('themeToggle').textContent = next === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
  localStorage.setItem('daymaster_theme', next);
});

function initTheme() {
  const saved = localStorage.getItem('daymaster_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeToggle').textContent = saved === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

loadEvents();
initTheme();
generateStars();
renderEvents();

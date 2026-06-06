const STORAGE_KEY = 'worry-journal-entries';

let worries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentFilter = 'all';

const form = document.getElementById('worry-form');
const input = document.getElementById('worry-input');
const charCount = document.getElementById('char-count');
const list = document.getElementById('worry-list');
const emptyMsg = document.getElementById('empty-msg');
const filterBtns = document.querySelectorAll('.filter-btn');

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(worries));
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function visibleWorries() {
  if (currentFilter === 'open') return worries.filter(w => !w.resolved);
  if (currentFilter === 'resolved') return worries.filter(w => w.resolved);
  return worries;
}

function render() {
  const items = visibleWorries();
  list.innerHTML = '';

  items.forEach(worry => {
    const li = document.createElement('li');
    li.className = 'worry-item' + (worry.resolved ? ' resolved' : '');
    li.dataset.id = worry.id;

    li.innerHTML = `
      <p class="worry-text">${escapeHtml(worry.text)}</p>
      <div class="worry-meta">
        <span>${formatDate(worry.createdAt)}</span>
        <div class="worry-actions">
          <button class="btn-resolve">${worry.resolved ? 'Reopen' : 'Resolve'}</button>
          <button class="btn-delete">Delete</button>
        </div>
      </div>
    `;

    li.querySelector('.btn-resolve').addEventListener('click', () => toggleResolve(worry.id));
    li.querySelector('.btn-delete').addEventListener('click', () => deleteWorry(worry.id));

    list.appendChild(li);
  });

  emptyMsg.classList.toggle('visible', items.length === 0);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function addWorry(text) {
  worries.unshift({ id: Date.now(), text, createdAt: new Date().toISOString(), resolved: false });
  save();
  render();
}

function toggleResolve(id) {
  const worry = worries.find(w => w.id === id);
  if (worry) {
    worry.resolved = !worry.resolved;
    save();
    render();
  }
}

function deleteWorry(id) {
  worries = worries.filter(w => w.id !== id);
  save();
  render();
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addWorry(text);
  input.value = '';
  charCount.textContent = '0 / 500';
});

input.addEventListener('input', () => {
  charCount.textContent = `${input.value.length} / 500`;
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

render();

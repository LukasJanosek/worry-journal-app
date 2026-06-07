const STORAGE_KEY = 'worry-journal-entries';

let worries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').map(w => {
  if (!w.status) w.status = w.resolved ? 'came_true' : 'open';
  return w;
});
let currentFilter = 'open';

const chartSection = document.getElementById('chart-section');
const chartContainer = document.getElementById('chart-container');
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
  return worries.filter(w => w.status === currentFilter);
}

function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function pieSlicePath(cx, cy, r, startDeg, endDeg) {
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

function renderChart() {
  const cameTrueCount = worries.filter(w => w.status === 'came_true').length;
  const didntHappenCount = worries.filter(w => w.status === 'didnt_happen').length;
  const total = cameTrueCount + didntHappenCount;

  if (total === 0) {
    chartSection.style.display = 'none';
    return;
  }

  chartSection.style.display = 'block';

  const cameTruePct = Math.round(cameTrueCount / total * 100);
  const didntHappenPct = 100 - cameTruePct;
  const cx = 80, cy = 80, r = 70;

  let slices;
  if (cameTrueCount === 0) {
    slices = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#5070a8"/>`;
  } else if (didntHappenCount === 0) {
    slices = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#c5d3ef"/>`;
  } else {
    const cameTrueDeg = (cameTrueCount / total) * 360;
    slices = `
      <path d="${pieSlicePath(cx, cy, r, 0, cameTrueDeg)}" fill="#c5d3ef"/>
      <path d="${pieSlicePath(cx, cy, r, cameTrueDeg, 360)}" fill="#1a3a6b"/>
    `;
  }

  chartContainer.innerHTML = `
    <svg width="160" height="160" viewBox="0 0 160 160">${slices}</svg>
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-dot" style="background:#1a3a6b"></span>
        <span>Didn't happen — ${didntHappenPct}%</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background:#c5d3ef"></span>
        <span>Came true — ${cameTruePct}%</span>
      </div>
    </div>
  `;
}

function updateCounts() {
  filterBtns.forEach(btn => {
    const count = worries.filter(w => w.status === btn.dataset.filter).length;
    btn.textContent = btn.dataset.label + ' (' + count + ')';
  });
}

function render() {
  renderChart();
  updateCounts();
  const items = visibleWorries();
  list.innerHTML = '';

  items.forEach(worry => {
    const li = document.createElement('li');
    li.className = 'worry-item' + (worry.status !== 'open' ? ' closed' : '');
    li.dataset.id = worry.id;

    const outcomeButtons = worry.status === 'open'
      ? `<button class="btn-outcome" data-status="came_true">Came true</button>
         <button class="btn-outcome" data-status="didnt_happen">Didn't happen</button>`
      : `<button class="btn-reopen">Reopen</button>`;

    li.innerHTML = `
      <p class="worry-text">${escapeHtml(worry.text)}</p>
      <div class="worry-meta">
        <span>${formatDate(worry.createdAt)}</span>
        <div class="worry-actions">
          ${outcomeButtons}
          <button class="btn-delete">Delete</button>
        </div>
      </div>
    `;

    li.querySelectorAll('.btn-outcome').forEach(btn => {
      btn.addEventListener('click', () => setStatus(worry.id, btn.dataset.status));
    });
    const reopenBtn = li.querySelector('.btn-reopen');
    if (reopenBtn) reopenBtn.addEventListener('click', () => setStatus(worry.id, 'open'));
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
  worries.unshift({ id: Date.now(), text, createdAt: new Date().toISOString(), status: 'open' });
  save();
  render();
}

function setStatus(id, status) {
  const worry = worries.find(w => w.id === id);
  if (worry) {
    worry.status = status;
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

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
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

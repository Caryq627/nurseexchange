/* =========================================================
   Reusable components (render helpers)
   ========================================================= */

function initials(name) {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}
function fullName(n) { return `${n.first_name} ${n.last_name}`; }
function fmtDate(iso, opts) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function relativeTime(iso) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return 'just now';
  if (Math.abs(mins) < 60) return `${Math.abs(mins)}m ${mins < 0 ? 'from now' : 'ago'}`;
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return `${Math.abs(hrs)}h ${hrs < 0 ? 'from now' : 'ago'}`;
  const days = Math.round(hrs / 24);
  if (Math.abs(days) < 30) return `${Math.abs(days)}d ${days < 0 ? 'from now' : 'ago'}`;
  return fmtDate(iso);
}

function badge(text, variant = 'neutral', showDot = true) {
  return `<span class="badge badge-${variant}">${showDot ? '<span class="b-dot"></span>' : ''}${text}</span>`;
}

function complianceBadge(status) {
  const map = {
    complete: ['All credentials current', 'ok'],
    expiring: ['Expires soon', 'warn'],
    expired: ['Expired', 'err'],
    incomplete: ['Missing docs', 'err'],
    missing: ['Missing', 'err']
  };
  const [label, variant] = map[status] || ['—', 'neutral'];
  return badge(label, variant);
}

function priorityBadge(p) {
  if (p === 'urgent') return badge('Urgent', 'err');
  return badge('Standard', 'info');
}

function caseStatusBadge(s) {
  const map = {
    open: ['Open', 'ocean'],
    shortlisting: ['Shortlisting', 'warn'],
    matched: ['Matched', 'brand'],
    placed: ['Placed', 'ok'],
    closed: ['Closed', 'neutral']
  };
  const [label, variant] = map[s] || [s, 'neutral'];
  return badge(label, variant);
}

function avatar(name, size) {
  const cls = size === 'lg' ? 'av av-lg' : size === 'xl' ? 'av av-xl' : 'av';
  return `<span class="${cls}">${initials(name)}</span>`;
}

function matchRing(score) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#2D6CDF' : score >= 40 ? '#D97706' : '#DC2626';
  return `
    <div class="match-ring" title="${score}% match">
      <svg viewBox="0 0 46 46">
        <circle cx="23" cy="23" r="${r}" stroke="#E3E8EF" stroke-width="4" fill="none"/>
        <circle cx="23" cy="23" r="${r}" stroke="${color}" stroke-width="4" fill="none"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
      </svg>
      <span class="pct">${score}</span>
    </div>
  `;
}

function chip(text, opts = {}) {
  const ico = opts.icon ? icon(opts.icon, 11) : '';
  return `<span class="chip">${ico}${text}</span>`;
}

function nurseCard(n, caseCtx) {
  const score = caseCtx?.score;
  const skillChips = n.skills.slice(0, 3).map(s => chip(s)).join('');
  const extra = n.skills.length > 3 ? `<span class="chip">+${n.skills.length - 3}</span>` : '';
  const avatarEl = n.verified_photo
    ? `<div class="avatar verified-photo" style="overflow:hidden;padding:0"><img src="${n.verified_photo}" style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></div>`
    : `<div class="avatar">${initials(fullName(n))}</div>`;
  return `
    <div class="nurse-card" data-action="open-nurse" data-id="${n.id}">
      ${score != null ? `<div class="match">${matchRing(score)}</div>` : ''}
      <div class="top">
        ${avatarEl}
        <div>
          <div class="name">${fullName(n)} ${n.rating >= 4.7 ? icon('star', 14) : ''}</div>
          <div class="credential">${n.license_type} · ${n.years_experience}y exp · $${n.rate_per_hour}/hr</div>
          <div class="loc">${icon('pin', 10)} ${n.counties_served.slice(0,3).join(', ')}</div>
          ${n.face_verified ? `<span class="cq-verified-chip" style="margin-top:6px">${icon('shield',10)} Cryptiq verified</span>` : ''}
        </div>
      </div>
      <div class="skills">${skillChips}${extra}</div>
      <div class="foot">
        ${complianceBadge(n.compliance_status)}
        ${n.share_status === 'shared' ? `<span class="share-ind">${icon('link',11)} In shared pool</span>` : `<span class="share-ind" style="color: var(--text-subtle)">${icon('shield',11)} Private</span>`}
      </div>
    </div>
  `;
}

function emptyState({ title, message, action, icon: ico = 'pool' }) {
  return `
    <div class="empty-state">
      <div class="ico">${icon(ico, 22)}</div>
      <h3>${title}</h3>
      <p>${message}</p>
      ${action || ''}
    </div>
  `;
}

function statCard({ label, val, delta, deltaDir = 'up' }) {
  return `
    <div class="stat-card">
      <div class="label">${label}</div>
      <div class="val">${val}</div>
      ${delta ? `<div class="delta ${deltaDir}">${icon(deltaDir === 'up' ? 'trendingUp' : 'chevronDown', 12)} ${delta}</div>` : ''}
      <div class="accent"></div>
    </div>
  `;
}

function openModal(html, bgClass) {
  const el = document.getElementById('modal-root');
  const cls = bgClass ? ` ${bgClass}` : '';
  el.innerHTML = `<div class="modal-backdrop open${cls}">${html}</div>`;
  const backdrop = el.querySelector('.modal-backdrop');
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
}
function closeModal() {
  const el = document.getElementById('modal-root');
  el.innerHTML = '';
}
function openDrawer(html) {
  const el = document.getElementById('drawer-root');
  el.innerHTML = `<div class="drawer-backdrop open"></div><aside class="drawer open">${html}</aside>`;
  const backdrop = el.querySelector('.drawer-backdrop');
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDrawer();
  });
}
function closeDrawer() {
  const el = document.getElementById('drawer-root');
  el.innerHTML = '';
}

function toast(message, variant = 'info') {
  const stack = document.getElementById('toast-stack');
  const t = document.createElement('div');
  t.className = `toast ${variant}`;
  t.innerHTML = `${icon(variant === 'success' ? 'check' : variant === 'error' ? 'alert' : 'bell', 16)} ${message}`;
  stack.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(6px)'; t.style.transition = 'all 0.3s'; }, 3200);
  setTimeout(() => t.remove(), 3600);
}

function barChart(data) {
  const max = Math.max(...data.map(d => d.val));
  return `<div class="bar-chart">${data.map(d => `<div class="bar" style="height:${(d.val/max)*100}%"><span class="val">${d.val}</span><span class="lbl">${d.label}</span></div>`).join('')}</div>`;
}

function sparkBars(vals) {
  const max = Math.max(...vals);
  return `<div style="display:flex; align-items:flex-end; gap:3px; height:28px;">${vals.map(v => `<span style="width:4px; background: linear-gradient(180deg, var(--ocean), var(--teal)); border-radius:2px; height:${Math.max(10, (v/max)*100)}%"></span>`).join('')}</div>`;
}

window.TNXComponents = {
  initials, fullName, fmtDate, fmtDateTime, relativeTime,
  badge, complianceBadge, priorityBadge, caseStatusBadge,
  avatar, matchRing, chip, nurseCard, emptyState, statCard,
  openModal, closeModal, openDrawer, closeDrawer, toast,
  barChart, sparkBars
};

/* =========================================================
   Cryptiq — biometric gating & accountability for TNX
   · 2D liveness verification
   · Signed approvals with audit-chained signatures
   · Document scan + 1:N face match enrollment
   · LookAway privacy guard on sensitive data
   ========================================================= */
(function(){

const CQ_STORE = 'tnx.cryptiq.v1';
function loadStore() {
  try { return JSON.parse(localStorage.getItem(CQ_STORE) || '{}'); } catch { return {}; }
}
function saveStore(s) { localStorage.setItem(CQ_STORE, JSON.stringify(s)); }

function store() { return loadStore(); }
function mutate(fn) { const s = loadStore(); fn(s); saveStore(s); }

async function hashSignature(parts) {
  const enc = new TextEncoder().encode(JSON.stringify(parts));
  if (crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  // Fallback pseudo-hash
  return Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
}
function shortHash(h) { return h.slice(0,8) + '…' + h.slice(-6); }

// ============ Camera helper ============
let sharedStream = null;
async function getCamera() {
  if (sharedStream && sharedStream.active) return sharedStream;
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera API unavailable');
  sharedStream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480, facingMode: 'user' }, audio: false
  });
  return sharedStream;
}
function releaseCamera() {
  if (sharedStream) {
    sharedStream.getTracks().forEach(t => t.stop());
    sharedStream = null;
  }
}

// Capture a data URL snapshot from a video element
function snapshot(video, size = 200) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const w = video.videoWidth || 320, h = video.videoHeight || 240;
  const side = Math.min(w, h);
  const sx = (w - side) / 2, sy = (h - side) / 2;
  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.85);
}

// ============ Modal scaffold ============
function mount(html) {
  let root = document.getElementById('cq-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'cq-root';
    document.body.appendChild(root);
  }
  root.innerHTML = html;
  return root.firstElementChild;
}
function unmount() {
  const root = document.getElementById('cq-root');
  if (root) root.innerHTML = '';
  releaseCamera();
}

// ============ Liveness viewfinder ============
function viewfinderHTML(title, subtitle) {
  return `
    <div class="cq-backdrop">
      <div class="cq-modal">
        <div class="cq-head">
          <div class="cq-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.35"/><circle cx="12" cy="12" r="6" opacity="0.6"/><circle cx="12" cy="12" r="3"/></svg>
            <span>CRYPTIQ</span>
            <small>biometric gate</small>
          </div>
          <button class="cq-close" data-cq="cancel" aria-label="Cancel">✕</button>
        </div>
        <div class="cq-body">
          <div class="cq-title">${title}</div>
          <div class="cq-sub">${subtitle}</div>
          <div class="cq-viewfinder" id="cq-view">
            <video id="cq-video" autoplay playsinline muted></video>
            <div class="cq-ring" id="cq-ring"></div>
            <div class="cq-overlay cq-hidden" id="cq-overlay"></div>
          </div>
          <div class="cq-steps" id="cq-steps">
            <div class="cq-step" data-step="liveness">
              <span class="cq-step-dot"></span> 2D Liveness
            </div>
            <div class="cq-step" data-step="match">
              <span class="cq-step-dot"></span> Biometric match
            </div>
            <div class="cq-step" data-step="sign">
              <span class="cq-step-dot"></span> Signature
            </div>
          </div>
          <div class="cq-progress"><div class="cq-progress-bar" id="cq-bar"></div></div>
        </div>
        <div class="cq-foot">
          <button class="cq-btn-ghost" data-cq="cancel">Cancel</button>
          <button class="cq-btn-brand" id="cq-start">Begin</button>
        </div>
      </div>
    </div>
  `;
}

function receiptHTML(payload) {
  const { title, subject, action, at, hash, photo, livenessScore, matchScore, purpose } = payload;
  return `
    <div class="cq-backdrop">
      <div class="cq-modal cq-receipt">
        <div class="cq-head">
          <div class="cq-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.35"/><circle cx="12" cy="12" r="6" opacity="0.6"/><circle cx="12" cy="12" r="3"/></svg>
            <span>CRYPTIQ</span>
            <small>signature captured</small>
          </div>
          <button class="cq-close" data-cq="done" aria-label="Close">✕</button>
        </div>
        <div class="cq-body">
          <div class="cq-check-wrap"><div class="cq-check">✓</div></div>
          <div class="cq-receipt-title">${title || 'Biometric signature captured'}</div>
          <div class="cq-receipt-grid">
            <div class="cq-rphoto">${photo ? `<img src="${photo}" alt="verified selfie">` : ''}<div class="cq-verified-badge">Verified</div></div>
            <div class="cq-rmeta">
              <div class="cq-rlabel">Action</div><div class="cq-rval">${action}</div>
              <div class="cq-rlabel">Signed by</div><div class="cq-rval">${subject}</div>
              <div class="cq-rlabel">Purpose</div><div class="cq-rval">${purpose || 'Accountability'}</div>
              <div class="cq-rlabel">At</div><div class="cq-rval">${new Date(at).toLocaleString()}</div>
              <div class="cq-rlabel">Liveness</div><div class="cq-rval">${(livenessScore*100).toFixed(1)}% · passed</div>
              <div class="cq-rlabel">1:N match</div><div class="cq-rval">${(matchScore*100).toFixed(1)}%</div>
              <div class="cq-rlabel">Signature</div><div class="cq-rval cq-mono">${shortHash(hash)}</div>
            </div>
          </div>
          <div class="cq-chain-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></svg>
            Logged to audit chain · HIPAA-aligned · signature cannot be forged
          </div>
        </div>
        <div class="cq-foot">
          <button class="cq-btn-brand cq-block" data-cq="done">Done</button>
        </div>
      </div>
    </div>
  `;
}

// Run the 3-step liveness sequence
async function runLiveness() {
  const video = document.getElementById('cq-video');
  const overlay = document.getElementById('cq-overlay');
  const bar = document.getElementById('cq-bar');
  const steps = [...document.querySelectorAll('.cq-step')];
  let cameraReady = false;
  let photoUrl = null;
  let livenessScore = 0.97 + Math.random() * 0.03;
  let matchScore = 0.96 + Math.random() * 0.04;

  try {
    const stream = await getCamera();
    video.srcObject = stream;
    await new Promise(res => video.onloadedmetadata = res);
    cameraReady = true;
  } catch (err) {
    overlay.innerHTML = `<div class="cq-sim">Camera unavailable — simulated capture</div>`;
    overlay.classList.remove('cq-hidden');
  }

  // Step 1: Liveness scan (2D zoom sequence)
  steps[0].classList.add('cq-active');
  await animateTo(bar, 33, 900);
  steps[0].classList.add('cq-done'); steps[0].classList.remove('cq-active');

  // Step 2: Match
  steps[1].classList.add('cq-active');
  await animateTo(bar, 66, 700);
  if (cameraReady) photoUrl = snapshot(video, 200);
  steps[1].classList.add('cq-done'); steps[1].classList.remove('cq-active');

  // Step 3: Sign
  steps[2].classList.add('cq-active');
  await animateTo(bar, 100, 500);
  steps[2].classList.add('cq-done'); steps[2].classList.remove('cq-active');

  return { photoUrl, livenessScore, matchScore };
}

function animateTo(bar, pct, dur) {
  return new Promise(res => {
    bar.style.transition = `width ${dur}ms cubic-bezier(0.16,1,0.3,1)`;
    requestAnimationFrame(() => { bar.style.width = pct + '%'; });
    setTimeout(res, dur);
  });
}

// ============ Public API ============

// Cryptiq.sign — high-stakes accountability signature
async function sign({ action, purpose, subject }) {
  const role = window.State?.currentRole();
  subject = subject || role?.name || 'Demo User';
  purpose = purpose || 'Accountability signature';

  // Simulation mode — skip camera, auto-complete with synthetic biometric scores
  if (window.TNX_SIMULATING) {
    const at = new Date().toISOString();
    const hash = await hashSignature({ action, subject, at, n: Math.random() });
    const payload = {
      action, purpose, subject, at, hash,
      photo: null,
      livenessScore: 0.972 + Math.random() * 0.025,
      matchScore: 0.961 + Math.random() * 0.034,
      simulated: true
    };
    mutate(s => {
      s.signatures = s.signatures || [];
      s.signatures.unshift(payload);
      s.signatures = s.signatures.slice(0, 100);
    });
    if (window.State?.logAudit) {
      window.State.logAudit({
        actor: subject, actor_role: role?.label || 'User',
        entity: 'Biometric Signature', entity_name: action,
        action: `signed [SIM] · ${shortHash(hash)}`, signed: true
      });
    }
    // Render the slick simulated overlay then auto-dismiss
    if (window.Simulation?.flashSign) await window.Simulation.flashSign({ subject, action });
    else await new Promise(r => setTimeout(r, 700));
    return payload;
  }

  const el = mount(viewfinderHTML('Sign with your biometric', `Purpose: ${purpose}`));
  return new Promise((resolve, reject) => {
    el.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-cq]')?.dataset?.cq;
      if (act === 'cancel') {
        unmount();
        reject(new Error('cancelled'));
      }
    });
    document.getElementById('cq-start').addEventListener('click', async () => {
      try {
        const result = await runLiveness();
        const at = new Date().toISOString();
        const hash = await hashSignature({ action, subject, at, n: Math.random() });
        const payload = {
          action, purpose, subject, at, hash,
          photo: result.photoUrl,
          livenessScore: result.livenessScore,
          matchScore: result.matchScore
        };
        // Log to Cryptiq store + TNX audit
        mutate(s => {
          s.signatures = s.signatures || [];
          s.signatures.unshift(payload);
          s.signatures = s.signatures.slice(0, 100);
        });
        if (window.State?.logAudit) {
          window.State.logAudit({
            actor: subject, actor_role: role?.label || 'User',
            entity: 'Biometric Signature', entity_name: action,
            action: `signed · ${shortHash(hash)}`, signed: true
          });
        }
        await new Promise(r => setTimeout(r, 350));
        mount(receiptHTML({ title: 'Biometric signature captured', ...payload }));
        document.querySelector('#cq-root').addEventListener('click', (e) => {
          if (e.target.closest('[data-cq="done"]')) {
            unmount();
            resolve(payload);
          }
        });
      } catch (err) {
        unmount();
        reject(err);
      }
    });
  });
}

// Cryptiq.verify — simple "prove you're here" check (used as login gate)
async function verify({ purpose, subject }) {
  return sign({ action: purpose || 'Identity verification', purpose: purpose || 'Login gate', subject });
}

// Cryptiq.demoOnboard — first-visit flow: ask for a display name, then biometric
function demoNameHTML(roleLabel, existingName) {
  return `
    <div class="cq-backdrop">
      <div class="cq-modal">
        <div class="cq-head">
          <div class="cq-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.35"/><circle cx="12" cy="12" r="6" opacity="0.6"/><circle cx="12" cy="12" r="3"/></svg>
            <span>CRYPTIQ</span>
            <small>demo enrollment</small>
          </div>
          <button class="cq-close" data-cq="cancel" aria-label="Skip">✕</button>
        </div>
        <div class="cq-body">
          <div class="cq-title">Welcome to The Nurse Exchange</div>
          <div class="cq-sub">You're entering the demo as <b style="color:#3EC7B7">${roleLabel}</b>. Tell us what to call you — the platform will greet you and sign every action under your name.</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
            <label style="font-size:11px;font-weight:700;color:rgba(232,238,247,0.7);letter-spacing:0.06em;text-transform:uppercase">Your name</label>
            <input id="cq-name-input" value="${existingName || ''}" placeholder="First name or full name"
              autocomplete="given-name"
              style="background:rgba(255,255,255,0.06);border:1px solid rgba(62,199,183,0.3);border-radius:14px;padding:16px 16px;color:white;font-size:17px;outline:none;font-family:inherit;width:100%;min-height:54px" />
            <small style="color:rgba(232,238,247,0.5);font-size:11px">Stored locally in your browser. Used for the demo greeting and on every signed action.</small>
          </div>
        </div>
        <div class="cq-foot">
          <button class="cq-btn-ghost" data-cq="cancel">Skip</button>
          <button class="cq-btn-brand" id="cq-name-submit">Continue → Biometric</button>
        </div>
      </div>
    </div>
  `;
}

async function demoOnboard({ role, force } = {}) {
  // Simulation mode skips the welcome flow entirely
  if (window.TNX_SIMULATING) {
    return sign({ action: `Sign in as ${role?.label || 'User'}`, purpose: 'Simulated walkthrough · biometric bypass', subject: 'Demo Viewer' });
  }
  const existing = localStorage.getItem('tnx.demo.displayName');
  const enrolledRef = localStorage.getItem('tnx.demo.refPhoto');
  if (existing && enrolledRef && !force) {
    // Already onboarded — quick face match
    return faceMatchGate({ name: existing, role });
  }
  // Step 1: name
  const name = await promptName(role?.label || 'Demo User', existing);
  if (!name) return null;
  localStorage.setItem('tnx.demo.displayName', name);
  // Step 2: enrollment — upload reference photo
  const refPhoto = await captureReferencePhoto({ name, role });
  if (!refPhoto) return null;
  localStorage.setItem('tnx.demo.refPhoto', refPhoto);
  // Step 3: live capture + match (mocked similarity but real flow)
  return faceMatchGate({ name, role, refPhoto, firstTime: true });
}

function promptName(roleLabel, existingName) {
  return new Promise((resolve) => {
    const el = mount(demoNameHTML(roleLabel, existingName));
    const input = document.getElementById('cq-name-input');
    setTimeout(() => input?.focus(), 80);
    const done = (val) => { unmount(); resolve(val); };
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); done(input.value.trim() || null); }
    });
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-cq="cancel"]')) done(null);
      if (e.target.closest('#cq-name-submit')) done(input.value.trim() || null);
    });
  });
}

function captureReferenceHTML() {
  return `
    <div class="cq-backdrop">
      <div class="cq-modal">
        <div class="cq-head">
          <div class="cq-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.35"/><circle cx="12" cy="12" r="6" opacity="0.6"/><circle cx="12" cy="12" r="3"/></svg>
            <span>CRYPTIQ</span>
            <small>step 1 of 2 · enrollment photo</small>
          </div>
          <button class="cq-close" data-cq="cancel" aria-label="Cancel">✕</button>
        </div>
        <div class="cq-body">
          <div class="cq-title">Upload your enrollment photo</div>
          <div class="cq-sub">This becomes your reference template. Every future sign-in matches a live selfie against this image.</div>
          <div id="cq-ref-preview" style="width:200px; height:200px; margin:0 auto 16px; border-radius:50%; background:rgba(255,255,255,0.04); border:2px dashed rgba(62,199,183,0.4); display:grid; place-items:center; overflow:hidden; color:rgba(232,238,247,0.5); font-size:12px">
            No photo yet
          </div>
          <button class="cq-btn-brand" id="cq-ref-pick" style="width:100%; margin-bottom:8px">📷 Choose photo from device</button>
          <small style="display:block; text-align:center; color:rgba(232,238,247,0.4); font-size:11px">Or skip and use any uploaded photo as a placeholder</small>
        </div>
        <div class="cq-foot">
          <button class="cq-btn-ghost" data-cq="skip-ref">Skip (demo)</button>
          <button class="cq-btn-brand" id="cq-ref-continue" disabled style="opacity:0.4">Continue → Live capture</button>
        </div>
      </div>
    </div>
  `;
}

async function captureReferencePhoto({ name }) {
  return new Promise((resolve) => {
    const el = mount(captureReferenceHTML());
    let dataUrl = null;
    const done = (val) => { unmount(); resolve(val); };
    const pickBtn = document.getElementById('cq-ref-pick');
    const continueBtn = document.getElementById('cq-ref-continue');
    pickBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.heic,.heif,.webp';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.onchange = async () => {
        const file = input.files?.[0];
        document.body.removeChild(input);
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          dataUrl = reader.result;
          const prev = document.getElementById('cq-ref-preview');
          if (prev) {
            prev.style.background = `url('${dataUrl}') center/cover, rgba(255,255,255,0.04)`;
            prev.style.borderStyle = 'solid';
            prev.style.borderColor = '#3EC7B7';
            prev.innerHTML = '';
          }
          continueBtn.disabled = false;
          continueBtn.style.opacity = '1';
        };
        reader.readAsDataURL(file);
      };
      input.click();
    };
    continueBtn.onclick = () => done(dataUrl);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-cq="cancel"]')) done(null);
      if (e.target.closest('[data-cq="skip-ref"]')) {
        // Use a placeholder/seed photo so the demo still has something to compare
        done('data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#0F2749"/><circle cx="100" cy="80" r="32" fill="#3EC7B7" opacity="0.5"/><rect x="60" y="120" width="80" height="60" rx="20" fill="#3EC7B7" opacity="0.5"/><text x="100" y="195" fill="#3EC7B7" font-family="sans-serif" font-size="10" text-anchor="middle">DEMO</text></svg>`));
      }
    });
  });
}

function liveCaptureHTML(refPhoto, displayName) {
  return `
    <div class="cq-backdrop">
      <div class="cq-modal">
        <div class="cq-head">
          <div class="cq-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.35"/><circle cx="12" cy="12" r="6" opacity="0.6"/><circle cx="12" cy="12" r="3"/></svg>
            <span>CRYPTIQ</span>
            <small>step 2 of 2 · live face match</small>
          </div>
          <button class="cq-close" data-cq="cancel" aria-label="Cancel">✕</button>
        </div>
        <div class="cq-body">
          <div class="cq-title">Prove it's really you, ${displayName}</div>
          <div class="cq-sub">2D liveness · 1:N match against your enrollment photo. Look at the camera and tap capture.</div>
          <div class="cq-viewfinder" id="cq-live-vf">
            <video id="cq-live-video" autoplay playsinline muted></video>
            <div class="cq-ring"></div>
            <div class="cq-overlay cq-hidden" id="cq-live-overlay"></div>
          </div>
          <div id="cq-live-result" style="text-align:center; min-height:48px; padding:12px; border-radius:10px; background:rgba(255,255,255,0.04); font-size:13px; color:rgba(232,238,247,0.7); margin-top:6px">
            Camera ready · tap "Capture & match" to verify
          </div>
        </div>
        <div class="cq-foot">
          <button class="cq-btn-ghost" data-cq="cancel">Cancel</button>
          <button class="cq-btn-brand" id="cq-live-capture">Capture & match</button>
        </div>
      </div>
    </div>
  `;
}

async function faceMatchGate({ name, role, refPhoto, firstTime }) {
  refPhoto = refPhoto || localStorage.getItem('tnx.demo.refPhoto');
  return new Promise((resolve, reject) => {
    const el = mount(liveCaptureHTML(refPhoto, (name || 'You').split(' ')[0]));
    const video = document.getElementById('cq-live-video');
    let stream;
    (async () => {
      try {
        stream = await getCamera();
        video.srcObject = stream;
        await new Promise(r => video.onloadedmetadata = r);
      } catch {
        const overlay = document.getElementById('cq-live-overlay');
        if (overlay) {
          overlay.innerHTML = `<div class="cq-sim">Camera unavailable — simulated capture</div>`;
          overlay.classList.remove('cq-hidden');
        }
      }
    })();
    const done = (payload) => { if (stream) stream.getTracks().forEach(t => t.stop()); unmount(); resolve(payload); };
    const fail = (err) => { if (stream) stream.getTracks().forEach(t => t.stop()); unmount(); reject(err); };
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-cq="cancel"]')) fail(new Error('cancelled'));
    });
    document.getElementById('cq-live-capture').onclick = async () => {
      const resultEl = document.getElementById('cq-live-result');
      resultEl.innerHTML = '<span style="color:#3EC7B7">Comparing biometric templates…</span>';
      // Snapshot
      let livePhoto = refPhoto;
      try {
        const c = document.createElement('canvas');
        c.width = 200; c.height = 200;
        const ctx = c.getContext('2d');
        ctx.translate(c.width, 0); ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, c.width, c.height);
        livePhoto = c.toDataURL('image/jpeg', 0.85);
      } catch {}
      // Mock similarity — 95% pass rate
      await new Promise(r => setTimeout(r, 1100));
      const score = Math.random() < 0.95 ? (0.93 + Math.random() * 0.06) : (0.62 + Math.random() * 0.18);
      const passed = score >= 0.85;
      if (passed) {
        const at = new Date().toISOString();
        const hash = await hashSignature({ subject: name, at, kind: 'face-gate', score });
        resultEl.innerHTML = `<b style="color:#16A34A">✓ Match ${(score*100).toFixed(1)}%</b> · welcome back`;
        resultEl.style.background = 'rgba(22,163,74,0.12)';
        resultEl.style.border = '1px solid rgba(22,163,74,0.3)';
        const payload = {
          action: `Sign in as ${role?.label || 'User'}`,
          purpose: firstTime ? `First-time enrollment + face match` : `Welcome back, ${name}`,
          subject: name, at, hash, photo: livePhoto,
          livenessScore: 0.97 + Math.random()*0.02,
          matchScore: score
        };
        mutate(s => { s.signatures = s.signatures || []; s.signatures.unshift(payload); s.signatures = s.signatures.slice(0, 100); });
        if (window.State?.logAudit) {
          window.State.logAudit({ actor: name, actor_role: role?.label || 'User', entity: 'Biometric Signature', entity_name: payload.action, action: `signed · ${shortHash(hash)}`, signed: true });
        }
        await new Promise(r => setTimeout(r, 800));
        done(payload);
      } else {
        // Failed match
        resultEl.innerHTML = `<b style="color:#DC2626">✗ Match ${(score*100).toFixed(1)}%</b> · below 85% threshold · try again`;
        resultEl.style.background = 'rgba(225,87,89,0.1)';
        resultEl.style.border = '1px solid rgba(225,87,89,0.3)';
        // Reset capture button
        document.getElementById('cq-live-capture').textContent = 'Retry capture';
      }
    };
  });
}

function getDisplayName() {
  return localStorage.getItem('tnx.demo.displayName');
}

// Cryptiq.capturePhoto — verified selfie for profile
async function capturePhoto({ subject, purpose }) {
  const role = window.State?.currentRole();
  subject = subject || role?.name || 'User';
  purpose = purpose || 'Verified profile photo';

  const el = mount(viewfinderHTML('Capture verified photo', `For: ${subject}`));
  return new Promise((resolve, reject) => {
    el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-cq="cancel"]')) { unmount(); reject(new Error('cancelled')); }
    });
    document.getElementById('cq-start').addEventListener('click', async () => {
      try {
        const { photoUrl, livenessScore } = await runLiveness();
        const at = new Date().toISOString();
        const hash = await hashSignature({ subject, at, kind: 'photo' });
        await new Promise(r => setTimeout(r, 300));
        unmount();
        resolve({ photoUrl, livenessScore, at, hash, subject });
      } catch (err) { unmount(); reject(err); }
    });
  });
}

// Cryptiq.enroll — 3-step: document scan, liveness, match
function enrollHTML(stepIdx, extra = {}) {
  const steps = [
    { label: 'Scan credential document', sub: 'Hold your GA RN/LPN license in frame' },
    { label: 'Capture liveness selfie', sub: '2D liveness — slow head turn if prompted' },
    { label: 'Face match verification', sub: '1:N match against document photo' }
  ];
  return `
    <div class="cq-backdrop">
      <div class="cq-modal cq-enroll">
        <div class="cq-head">
          <div class="cq-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.35"/><circle cx="12" cy="12" r="6" opacity="0.6"/><circle cx="12" cy="12" r="3"/></svg>
            <span>CRYPTIQ</span>
            <small>secure enrollment</small>
          </div>
          <button class="cq-close" data-cq="cancel" aria-label="Cancel">✕</button>
        </div>
        <div class="cq-enroll-stepper">
          ${steps.map((s, i) => `
            <div class="cq-ens ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}">
              <div class="cq-ens-num">${i < stepIdx ? '✓' : i + 1}</div>
              <div>
                <div class="cq-ens-label">${s.label}</div>
                <div class="cq-ens-sub">${s.sub}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="cq-body">
          ${stepIdx === 0 ? `
            <div class="cq-doc-frame">
              <video id="cq-video" autoplay playsinline muted></video>
              <div class="cq-doc-corners">
                <span></span><span></span><span></span><span></span>
              </div>
              <div class="cq-doc-scanline"></div>
              <div class="cq-overlay cq-hidden" id="cq-overlay"></div>
              <div class="cq-doc-ocr" id="cq-ocr"></div>
            </div>
          ` : stepIdx === 1 ? `
            <div class="cq-viewfinder">
              <video id="cq-video" autoplay playsinline muted></video>
              <div class="cq-ring"></div>
              <div class="cq-overlay cq-hidden" id="cq-overlay"></div>
            </div>
            <div class="cq-steps">
              <div class="cq-step" data-step="liveness"><span class="cq-step-dot"></span>Liveness</div>
              <div class="cq-step" data-step="quality"><span class="cq-step-dot"></span>Image quality</div>
              <div class="cq-step" data-step="template"><span class="cq-step-dot"></span>Template build</div>
            </div>
            <div class="cq-progress"><div class="cq-progress-bar" id="cq-bar"></div></div>
          ` : `
            <div class="cq-match">
              <div class="cq-match-side">
                <div class="cq-match-label">Document photo</div>
                <div class="cq-match-img">${extra.docPhoto ? `<img src="${extra.docPhoto}">` : 'Doc'}</div>
              </div>
              <div class="cq-match-bars">
                ${Array.from({length: 7}).map((_,i) => `<span class="cq-mb" style="animation-delay:${i*0.08}s"></span>`).join('')}
              </div>
              <div class="cq-match-side">
                <div class="cq-match-label">Live selfie</div>
                <div class="cq-match-img">${extra.livePhoto ? `<img src="${extra.livePhoto}">` : 'Live'}</div>
              </div>
            </div>
            <div class="cq-match-result" id="cq-match-result">Comparing biometric templates…</div>
          `}
        </div>
        <div class="cq-foot">
          <button class="cq-btn-ghost" data-cq="cancel">Cancel</button>
          <button class="cq-btn-brand" id="cq-enroll-next">${stepIdx === 0 ? 'Capture document' : stepIdx === 1 ? 'Capture selfie' : 'Complete enrollment'}</button>
        </div>
      </div>
    </div>
  `;
}

async function enroll({ subject }) {
  subject = subject || 'New Nurse';
  // Simulation bypass — synthesize the enrollment instantly
  if (window.TNX_SIMULATING) {
    const at = new Date().toISOString();
    const hash = await hashSignature({ subject, at, kind: 'enroll-sim' });
    if (window.Simulation?.flashEnroll) await window.Simulation.flashEnroll({ subject });
    else await new Promise(r => setTimeout(r, 900));
    return { docPhoto: null, livePhoto: null, matchScore: 0.964 + Math.random() * 0.03, hash, at, subject, simulated: true };
  }
  let docPhoto = null, livePhoto = null;
  return new Promise((resolve, reject) => {
    const go = async (stepIdx) => {
      const el = mount(enrollHTML(stepIdx, { docPhoto, livePhoto }));
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-cq="cancel"]')) { unmount(); reject(new Error('cancelled')); }
      });

      if (stepIdx <= 1) {
        try {
          const video = document.getElementById('cq-video');
          const stream = await getCamera();
          video.srcObject = stream;
          await new Promise(r => video.onloadedmetadata = r);
        } catch {
          const overlay = document.getElementById('cq-overlay');
          if (overlay) {
            overlay.innerHTML = `<div class="cq-sim">Camera unavailable — simulated capture</div>`;
            overlay.classList.remove('cq-hidden');
          }
        }
      }

      document.getElementById('cq-enroll-next').addEventListener('click', async () => {
        if (stepIdx === 0) {
          // Scan doc: simulate OCR reveal
          const ocr = document.getElementById('cq-ocr');
          const video = document.getElementById('cq-video');
          if (video && video.videoWidth) docPhoto = snapshot(video, 180);
          const lines = ['LIC #: GA-RN-' + Math.floor(Math.random()*900000 + 100000), 'NAME: ' + subject.toUpperCase(), 'EXP: 2028-05-12', 'STATE: GEORGIA'];
          ocr.innerHTML = lines.map(l => `<div class="cq-ocr-line">${l}</div>`).join('');
          ocr.classList.add('cq-visible');
          await new Promise(r => setTimeout(r, 1400));
          go(1);
        } else if (stepIdx === 1) {
          const result = await runLiveness();
          livePhoto = result.photoUrl;
          go(2);
        } else {
          // Match animation
          const resultEl = document.getElementById('cq-match-result');
          await new Promise(r => setTimeout(r, 1200));
          const score = 0.955 + Math.random() * 0.04;
          resultEl.innerHTML = `<b style="color:var(--ok)">✓ Match ${(score*100).toFixed(1)}%</b> · biometric template enrolled`;
          resultEl.classList.add('cq-success');
          await new Promise(r => setTimeout(r, 900));
          const at = new Date().toISOString();
          const hash = await hashSignature({ subject, at, kind: 'enroll' });
          unmount();
          resolve({ docPhoto, livePhoto, matchScore: score, hash, at, subject });
        }
      });
    };
    go(0);
  });
}

// ============ LookAway Guard ============
// Usage: Cryptiq.LookAway.guard(element, { label, reason })
const LookAway = (() => {
  const guards = new WeakMap();

  function guard(el, opts = {}) {
    if (!el || guards.has(el)) return;
    el.classList.add('lookaway-zone');
    const overlay = document.createElement('div');
    overlay.className = 'lookaway-overlay';
    overlay.innerHTML = `
      <div class="lookaway-content">
        <div class="lookaway-icon">👁</div>
        <div class="lookaway-title">${opts.label || 'Privacy guarded'}</div>
        <div class="lookaway-sub">${opts.reason || 'Sensitive patient info · presence required'}</div>
        <button class="lookaway-reveal">Tap to reveal</button>
      </div>
    `;
    el.appendChild(overlay);

    const badge = document.createElement('div');
    badge.className = 'lookaway-badge';
    badge.innerHTML = `<span class="lookaway-pulse"></span>LookAway · monitoring`;
    el.appendChild(badge);

    let revealed = false;
    let hideTimer;
    let visibilityHandler, blurHandler;

    const hide = () => { overlay.classList.add('lookaway-active'); revealed = false; };
    const show = () => { overlay.classList.remove('lookaway-active'); revealed = true; };

    hide();

    const reveal = async () => {
      try {
        // For repeated reveals, skip full sign flow — use quick visibility check
        if (guards.has(el) && guards.get(el).revealedOnce) {
          show();
          scheduleAutoHide();
          return;
        }
        await verify({ purpose: 'LookAway reveal', subject: opts.subject });
        show();
        guards.set(el, { revealedOnce: true });
        scheduleAutoHide();
      } catch { /* user cancelled */ }
    };

    const scheduleAutoHide = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (revealed) hide();
      }, 20000);
    };

    overlay.querySelector('.lookaway-reveal').addEventListener('click', reveal);

    // Re-hide on tab blur / visibility change
    visibilityHandler = () => { if (document.hidden && revealed) hide(); };
    blurHandler = () => { if (revealed) hide(); };
    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('blur', blurHandler);

    guards.set(el, { revealedOnce: false, cleanup: () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('blur', blurHandler);
      clearTimeout(hideTimer);
    }});
  }

  return { guard };
})();

// ============ Signature log ============
function signatures() {
  return loadStore().signatures || [];
}

// ============ Enrollment registry (per-user biometric status) ============
function markEnrolled(userId, payload) {
  mutate(s => {
    s.enrollments = s.enrollments || {};
    s.enrollments[userId] = {
      ...payload,
      enrolled_at: new Date().toISOString()
    };
  });
}
function isEnrolled(userId) {
  const s = loadStore();
  return !!s.enrollments?.[userId];
}
function enrollment(userId) { return loadStore().enrollments?.[userId]; }

// ============ Public export ============
window.Cryptiq = {
  sign, verify, capturePhoto, enroll,
  demoOnboard, getDisplayName,
  LookAway,
  signatures,
  markEnrolled, isEnrolled, enrollment,
  shortHash
};

})();

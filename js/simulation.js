/* ============================================================
   The Nurse Exchange — Demo Simulation
   Walks through the full multi-stakeholder workflow:
   Super Admin → Agency Admin → Parent → Nurse → audit recap
   Biometric checks are simulated (Cryptiq.sign sees TNX_SIMULATING).
   ============================================================ */
(function () {
  const Sim = {};
  let stepIdx = 0;
  let paused = false;
  let aborted = false;
  let stepResolve = null;
  const ROLE_AVATARS = {
    super_admin: { label: 'Platform Admin',  initials: 'PA', color: '#7C3AED' },
    agency_admin:{ label: 'Sandra Mitchell', initials: 'SM', color: '#2D6CDF' },
    recruiter:   { label: 'Jerome Phillips', initials: 'JP', color: '#0EA5E9' },
    parent:      { label: 'Danielle Carter', initials: 'DC', color: '#F59E0B' },
    nurse:       { label: 'Tiana Johnson',   initials: 'TJ', color: '#16A34A' }
  };

  // --------- Narrator UI ---------
  function ensureNarrator() {
    if (document.getElementById('tnx-narrator')) return;
    const n = document.createElement('div');
    n.id = 'tnx-narrator';
    n.className = 'tnx-narrator';
    n.innerHTML = `
      <div class="tnx-narrator-progress"><div class="tnx-narrator-bar" id="tnx-narrator-bar"></div></div>
      <div class="tnx-narrator-row">
        <div class="tnx-narrator-persona" id="tnx-narrator-persona">
          <div class="tnx-narrator-avatar" id="tnx-narrator-avatar">DV</div>
          <div class="tnx-narrator-meta">
            <div class="tnx-narrator-role" id="tnx-narrator-role">Demo viewer</div>
            <div class="tnx-narrator-step" id="tnx-narrator-step">Step 0 / 0</div>
          </div>
        </div>
        <div class="tnx-narrator-text">
          <div class="tnx-narrator-title" id="tnx-narrator-title">Loading…</div>
          <div class="tnx-narrator-desc" id="tnx-narrator-desc"></div>
        </div>
        <div class="tnx-narrator-controls">
          <button class="tnx-narrator-btn" id="tnx-narrator-pause" title="Pause / Resume">⏸</button>
          <button class="tnx-narrator-btn" id="tnx-narrator-skip" title="Skip step">⏭</button>
          <button class="tnx-narrator-btn tnx-narrator-exit" id="tnx-narrator-exit" title="Exit demo">✕</button>
        </div>
      </div>
    `;
    document.body.appendChild(n);
    document.getElementById('tnx-narrator-pause').onclick = togglePause;
    document.getElementById('tnx-narrator-skip').onclick = skipStep;
    document.getElementById('tnx-narrator-exit').onclick = exit;
  }

  function setNarrator({ role, title, desc, idx, total }) {
    ensureNarrator();
    const p = ROLE_AVATARS[role] || { label: 'Demo viewer', initials: 'DV', color: '#64748B' };
    const av = document.getElementById('tnx-narrator-avatar');
    av.textContent = p.initials;
    av.style.background = p.color;
    document.getElementById('tnx-narrator-role').textContent = p.label;
    document.getElementById('tnx-narrator-step').textContent = `Step ${idx} / ${total}`;
    document.getElementById('tnx-narrator-title').textContent = title;
    document.getElementById('tnx-narrator-desc').textContent = desc || '';
    const pct = total ? Math.round((idx / total) * 100) : 0;
    document.getElementById('tnx-narrator-bar').style.width = pct + '%';
  }

  function removeNarrator() {
    document.getElementById('tnx-narrator')?.remove();
    document.getElementById('tnx-sim-shield')?.remove();
  }

  // --------- Click shield (so the user can't click around mid-sim) ---------
  function ensureShield() {
    if (document.getElementById('tnx-sim-shield')) return;
    const s = document.createElement('div');
    s.id = 'tnx-sim-shield';
    s.className = 'tnx-sim-shield';
    document.body.appendChild(s);
  }

  // --------- Spotlight (briefly highlights the element being acted on) ---------
  async function spotlight(selector, ms = 900) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('tnx-sim-spot');
    await wait(ms);
    el.classList.remove('tnx-sim-spot');
  }

  // --------- Helpers ---------
  const wait = (ms) => new Promise((res) => {
    const tick = () => { if (aborted) return res(); if (paused) return setTimeout(tick, 120); res(); };
    setTimeout(tick, ms);
  });
  const setRole = (id) => {
    State.setRole(id);
    const home = window.TNX.ROLES.find(r => r.id === id)?.home || '#/dashboard';
    location.hash = home;
  };
  const goto = (hash) => {
    if (location.hash !== hash) location.hash = hash;
    return wait(450);
  };
  const fillInput = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const click = (selector) => {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    el?.click();
  };

  // --------- Biometric flash overlay (visual feedback for simulated sign) ---------
  Sim.flashSign = function ({ subject, action }) {
    return new Promise((resolve) => {
      const f = document.createElement('div');
      f.className = 'tnx-sim-flash';
      f.innerHTML = `
        <div class="tnx-sim-flash-card">
          <div class="tnx-sim-flash-spinner"></div>
          <div class="tnx-sim-flash-title">Cryptiq biometric check</div>
          <div class="tnx-sim-flash-sub">${escapeHtml(subject || 'Demo')} · ${escapeHtml(action || '')}</div>
          <div class="tnx-sim-flash-bar"><div class="tnx-sim-flash-bar-inner"></div></div>
          <div class="tnx-sim-flash-hint">Simulated · skipping camera</div>
        </div>
      `;
      document.body.appendChild(f);
      setTimeout(() => {
        const titleEl = f.querySelector('.tnx-sim-flash-title');
        const sub = f.querySelector('.tnx-sim-flash-sub');
        if (titleEl) titleEl.innerHTML = '✓ Signed';
        if (sub) sub.innerHTML = `Liveness ${(96 + Math.random()*3).toFixed(1)}% · 1:N match ${(95 + Math.random()*4).toFixed(1)}%`;
        f.classList.add('done');
        setTimeout(() => { f.remove(); resolve(); }, 600);
      }, 1100);
    });
  };
  Sim.flashEnroll = Sim.flashSign;

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function togglePause() {
    paused = !paused;
    document.getElementById('tnx-narrator-pause').textContent = paused ? '▶' : '⏸';
  }
  function skipStep() { if (stepResolve) { stepResolve('skip'); } }
  function exit() {
    aborted = true;
    if (stepResolve) stepResolve('abort');
    window.TNX_SIMULATING = false;
    removeNarrator();
    if (window.TNXComponents?.toast) window.TNXComponents.toast('Demo simulation ended', 'info');
  }

  // --------- Step list ---------
  function buildSteps() {
    return [
      {
        role: 'super_admin',
        title: 'Demo viewer signs in (simulated)',
        desc: 'Cryptiq biometric gate · liveness + 1:N face match · skipped here for the walkthrough.',
        run: async () => {
          setRole('super_admin');
          await wait(700);
          // Fake a mini sign flash even outside Cryptiq.sign for narrative clarity
          await Sim.flashSign({ subject: 'Demo Viewer', action: 'Sign in to The Nurse Exchange' });
          await goto('#/admin');
          await wait(800);
        }
      },
      {
        role: 'super_admin',
        title: 'Platform admin reviews verified agencies',
        desc: 'Georgia instance — agencies, nurse pool, audit chain. All high-trust actions cryptographically signed.',
        run: async () => {
          await goto('#/admin');
          await spotlight('.stat-grid', 1100);
          await spotlight('.card-header', 800);
          await wait(900);
        }
      },
      {
        role: 'agency_admin',
        title: 'Agency admin posts a new pediatric case',
        desc: 'Sandra Mitchell at Peach State Pediatric posts a GAPP case for a new child. Auth + Medicaid eligibility required.',
        run: async () => {
          setRole('agency_admin');
          await goto('#/cases');
          await wait(700);
          // Simulated biometric sign for the case post
          await Sim.flashSign({ subject: 'Sandra Mitchell', action: 'Post GAPP case: Child J' });
          // Direct state mutation (skip form fiddling — simulation is about the story)
          const role = State.currentRole();
          const newCase = {
            id: 'cs-sim-' + Date.now().toString().slice(-4),
            agency_id: role.agency_id, child_alias: 'Child J',
            county: 'Fulton', age_band: '0-2 years',
            required_skills: ['Tracheostomy Care','G-Tube Feeding','Medication Administration','Suctioning'],
            requested_hours: 40, shift_type: 'Day',
            authorization_status: 'Prior Auth Approved',
            payer_program: 'Georgia GAPP (Medicaid)',
            start_date: new Date(Date.now() + 7*86400000).toISOString(),
            case_status: 'open', priority: 'urgent',
            notes: 'Newly authorized GAPP case. Family prefers RN with tracheostomy + g-tube experience.',
            parent_id: null,
            created_at: new Date().toISOString(),
            signed_by: 'Sandra Mitchell'
          };
          State.addCase(newCase);
          // Compute matches for the new case
          const matches = State.getNurses().map(n => {
            let score = 40;
            if (n.counties_served.includes(newCase.county)) score += 20;
            const overlap = newCase.required_skills.filter(s => n.skills.includes(s)).length;
            score += (overlap / newCase.required_skills.length) * 30;
            if (n.primary_agency_id === role.agency_id) score += 6;
            score = Math.max(12, Math.min(98, Math.round(score)));
            return { nurse_id: n.id, case_id: newCase.id, score, status: 'suggested' };
          }).sort((a,b) => b.score - a.score);
          State.setMatches(newCase.id, matches);
          State.logAudit({ actor: 'Sandra Mitchell', actor_role: 'Agency Admin', entity: 'Case', entity_name: 'Child J', action: 'created · biometric-signed [SIM]' });
          location.hash = '#/case/' + newCase.id;
          window._simNewCaseId = newCase.id;
          window._simTopMatchId = matches[0]?.nurse_id;
          await wait(900);
        }
      },
      {
        role: 'agency_admin',
        title: 'Match algorithm finds qualified nurses',
        desc: 'Score weights skills, county, shift preference, agency network, and compliance status.',
        run: async () => {
          // Already on case detail. Show the matches.
          await spotlight('.app-main', 1000);
          await spotlight('.match-ring, .nurse-card, [data-action="shortlist-nurse"]', 900);
          await wait(800);
        }
      },
      {
        role: 'agency_admin',
        title: 'Shortlist a top match',
        desc: 'Shortlisting a nurse for a parent is a clinical staffing decision — biometrically signed by the agency admin.',
        run: async () => {
          const caseId = window._simNewCaseId;
          const nurseId = window._simTopMatchId;
          if (!caseId || !nurseId) { await wait(900); return; }
          await spotlight('.match-ring, .nurse-card', 700);
          await Sim.flashSign({ subject: 'Sandra Mitchell', action: 'Shortlist nurse for Child J' });
          State.updateMatchStatus(caseId, nurseId, 'shortlisted');
          State.updateCase(caseId, { case_status: 'shortlisting' });
          const n = State.getNurse(nurseId);
          const fname = (n?.first_name || '') + ' ' + (n?.last_name || '');
          State.logAudit({ actor: 'Sandra Mitchell', actor_role: 'Agency Admin', entity: 'Nurse', entity_name: fname.trim(), action: 'shortlisted for Child J · biometric-signed [SIM]' });
          // Also assign a parent so parentHome will see this case
          State.updateCase(caseId, { parent_id: 'pa-01' });
          await wait(900);
        }
      },
      {
        role: 'parent',
        title: 'Parent reviews the shortlist',
        desc: 'Danielle Carter (Child A\'s guardian) sees Cryptiq-verified nurse profiles and books a meet & greet.',
        run: async () => {
          setRole('parent');
          await goto('#/parent-home');
          await wait(700);
          await spotlight('.nurse-card', 900);
          await wait(800);
        }
      },
      {
        role: 'parent',
        title: 'Parent books a meet & greet',
        desc: 'Picks a date and time. The booking is biometrically signed — auditable evidence the parent consented.',
        run: async () => {
          const caseId = window._simNewCaseId;
          const nurseId = window._simTopMatchId;
          if (!caseId || !nurseId) { await wait(900); return; }
          await spotlight('.nurse-card', 700);
          await Sim.flashSign({ subject: 'Danielle Carter', action: 'Book meet & greet' });
          const n = State.getNurse(nurseId);
          const fname = (n?.first_name || '') + ' ' + (n?.last_name || '');
          const meet = {
            id: 'mg-sim-' + Date.now().toString().slice(-4),
            case_id: caseId, nurse_id: nurseId, parent_id: 'pa-01',
            scheduled_at: new Date(Date.now() + 2*86400000).toISOString(),
            mode: 'Virtual (Zoom)', status: 'scheduled',
            parent_feedback: null, agency_feedback: null
          };
          State.addMeet(meet);
          State.logAudit({ actor: 'Danielle Carter', actor_role: 'Parent / Guardian', entity: 'Meet & Greet', entity_name: `${fname.trim()} ↔ Child J`, action: 'scheduled · biometric-signed [SIM]' });
          await wait(900);
        }
      },
      {
        role: 'nurse',
        title: 'Nurse sees the new opportunity',
        desc: 'Tiana Johnson, RN — opens her dashboard and sees matched cases ranked by skill + location fit.',
        run: async () => {
          setRole('nurse');
          await goto('#/nurse-home');
          await wait(700);
          await spotlight('.match-ring, .stat-card', 900);
          await wait(800);
        }
      },
      {
        role: 'nurse',
        title: 'Nurse accepts the assignment',
        desc: 'Acceptance is a binding clinical commitment — biometrically signed by the nurse, logged to the audit chain.',
        run: async () => {
          const caseId = window._simNewCaseId;
          const nurseId = window._simTopMatchId;
          if (!caseId || !nurseId) { await wait(900); return; }
          await spotlight('.stat-card', 700);
          await Sim.flashSign({ subject: 'Tiana Johnson', action: 'Accept Child J assignment' });
          State.updateMatchStatus(caseId, nurseId, 'accepted');
          const n = State.getNurse(nurseId);
          const fname = (n?.first_name || '') + ' ' + (n?.last_name || '');
          State.logAudit({ actor: fname.trim(), actor_role: 'Nurse', entity: 'Opportunity', entity_name: 'Child J', action: 'accepted · biometric-signed [SIM]' });
          await wait(900);
        }
      },
      {
        role: 'super_admin',
        title: 'Audit chain shows every signed action',
        desc: 'Each action is hashed and chained — agencies can prove who decided what, and when, to GAPP auditors.',
        run: async () => {
          setRole('super_admin');
          await goto('#/audit');
          await wait(800);
          await spotlight('.tbl, .stat-grid, .card', 1500);
          await wait(1000);
        }
      },
      {
        role: 'super_admin',
        title: 'Walkthrough complete',
        desc: 'Every step you just saw was cryptographically signed and stored locally. Try the platform yourself with any of the personas.',
        run: async () => {
          await goto('#/admin');
          await wait(800);
        }
      }
    ];
  }

  // --------- Run loop ---------
  async function start({ resetState = true } = {}) {
    if (window.TNX_SIMULATING) return;
    aborted = false;
    paused = false;
    stepIdx = 0;
    if (resetState) {
      try { State.reset(); } catch {}
      try { localStorage.removeItem('tnx.cryptiq.v1'); } catch {}
      try { localStorage.removeItem('tnx.demo.displayName'); } catch {}
      try { sessionStorage.setItem('tnx.cq.gatePassed', '1'); } catch {}
    }
    window.TNX_SIMULATING = true;
    ensureShield();
    ensureNarrator();
    const steps = buildSteps();
    for (let i = 0; i < steps.length; i++) {
      if (aborted) break;
      const s = steps[i];
      setNarrator({ role: s.role, title: s.title, desc: s.desc, idx: i + 1, total: steps.length });
      // Per-step race: real run vs. skip
      let skipFn;
      const skipP = new Promise((res) => { skipFn = res; });
      stepResolve = (reason) => { skipFn(reason); };
      try {
        await Promise.race([
          s.run(),
          skipP
        ]);
      } catch (e) { console.warn('sim step error', e); }
      stepResolve = null;
      await wait(900); // breathing room between steps
    }
    if (!aborted) {
      // Final overlay
      const f = document.createElement('div');
      f.className = 'tnx-sim-final';
      f.innerHTML = `
        <div class="tnx-sim-final-card">
          <div class="tnx-sim-final-check">✓</div>
          <h2>Walkthrough complete</h2>
          <p>You just watched a 4-stakeholder workflow with 6 cryptographically-signed actions. Every signature is in the audit chain.</p>
          <div class="tnx-sim-final-actions">
            <button class="btn btn-secondary" id="tnx-sim-restart">Replay</button>
            <button class="btn btn-brand" id="tnx-sim-explore">Explore the platform</button>
          </div>
        </div>
      `;
      document.body.appendChild(f);
      document.getElementById('tnx-sim-restart').onclick = () => { f.remove(); start(); };
      document.getElementById('tnx-sim-explore').onclick = () => { f.remove(); exit(); };
    }
    window.TNX_SIMULATING = false;
  }

  Sim.start = start;
  Sim.exit = exit;
  Sim.isRunning = () => !!window.TNX_SIMULATING;

  window.Simulation = Sim;
})();

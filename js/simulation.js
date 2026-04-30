/* ============================================================
   The Nurse Exchange — Guided Demo Walkthrough
   - Intro storyboard
   - One step at a time, user clicks Next
   - Per-step callouts: feature / efficiency / security
   - Biometric checks simulated as a quick flash
   ============================================================ */
(function () {
  const Sim = {};
  let stepIdx = 0;
  let aborted = false;
  let currentSteps = [];
  let nextResolve = null;

  const ROLE = {
    super_admin:  { label: 'Platform Admin',  initials: 'PA', color: '#7C3AED' },
    agency_admin: { label: 'Sandra Mitchell', initials: 'SM', color: '#2D6CDF', sub: 'Agency Admin · Peach State Pediatric' },
    recruiter:    { label: 'Jerome Phillips', initials: 'JP', color: '#0EA5E9', sub: 'Recruiter / Scheduler' },
    parent:       { label: 'Danielle Carter', initials: 'DC', color: '#F59E0B', sub: 'Parent · Child A' },
    nurse:        { label: 'Tiana Johnson',   initials: 'TJ', color: '#16A34A', sub: 'RN · GAPP-trained' }
  };

  // -----------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------
  const wait = (ms) => new Promise((res) => setTimeout(() => { if (!aborted) res(); else res(); }, ms));
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function setRole(id) {
    State.setRole(id);
    const home = (window.TNX.ROLES.find(r => r.id === id) || {}).home || '#/dashboard';
    location.hash = home;
  }
  async function goto(hash) {
    if (location.hash !== hash) location.hash = hash;
    await wait(420);
  }

  async function spotlight(selector, ms = 900) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('tnx-sim-spot');
    await wait(ms);
    el.classList.remove('tnx-sim-spot');
  }

  // -----------------------------------------------------------
  // Biometric flash overlay — opens real camera, captures, animates match
  // -----------------------------------------------------------
  Sim.flashSign = async function ({ subject, action }) {
    const f = document.createElement('div');
    f.className = 'tnx-sim-flash tnx-sim-flash-camera';
    f.innerHTML = `
      <div class="tnx-sim-flash-card">
        <div class="tnx-sim-flash-vf" id="sim-flash-vf">
          <video id="sim-flash-video" autoplay playsinline muted></video>
          <div class="tnx-sim-flash-ring"></div>
          <div class="tnx-sim-flash-overlay" id="sim-flash-cam-msg">Starting camera…</div>
        </div>
        <div class="tnx-sim-flash-title">Biometric check</div>
        <div class="tnx-sim-flash-sub">${escapeHtml(subject || 'Demo')} · ${escapeHtml(action || '')}</div>
        <div class="tnx-sim-flash-bar"><div class="tnx-sim-flash-bar-inner"></div></div>
        <div class="tnx-sim-flash-hint" id="sim-flash-hint">Capturing live frame…</div>
      </div>
    `;
    document.body.appendChild(f);

    let stream = null;
    const stop = () => { try { stream?.getTracks().forEach(t => t.stop()); } catch {} stream = null; };

    // Try to start the camera; if it fails or takes too long, just animate
    try {
      stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' }, audio: false }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('cam-timeout')), 1500))
      ]);
      const v = document.getElementById('sim-flash-video');
      if (v && stream) {
        v.srcObject = stream;
        await new Promise(r => { v.onloadedmetadata = r; setTimeout(r, 800); });
        await v.play().catch(() => {});
        const overlay = document.getElementById('sim-flash-cam-msg');
        if (overlay) overlay.style.display = 'none';
      }
    } catch {
      const overlay = document.getElementById('sim-flash-cam-msg');
      if (overlay) overlay.textContent = 'Simulated capture (no camera access)';
    }

    // Brief "scanning" pause
    await new Promise(r => setTimeout(r, 1200));

    // Take a snapshot if we have a live stream
    const v = document.getElementById('sim-flash-video');
    let captured = null;
    if (v && v.videoWidth) {
      try {
        const c = document.createElement('canvas');
        c.width = 240; c.height = 240;
        const ctx = c.getContext('2d');
        ctx.translate(c.width, 0); ctx.scale(-1, 1);
        ctx.drawImage(v, 0, 0, c.width, c.height);
        captured = c.toDataURL('image/jpeg', 0.85);
      } catch {}
    }
    stop();

    // Replace video with captured snapshot (or keep video paused on last frame)
    const vf = document.getElementById('sim-flash-vf');
    if (vf && captured) {
      vf.innerHTML = `<img src="${captured}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    }

    // Show success state
    const titleEl = f.querySelector('.tnx-sim-flash-title');
    const sub = f.querySelector('.tnx-sim-flash-sub');
    const hint = document.getElementById('sim-flash-hint');
    if (titleEl) titleEl.innerHTML = '✓ Signed';
    if (sub) sub.innerHTML = `Liveness ${(96 + Math.random()*3).toFixed(1)}% · 1:N match ${(95 + Math.random()*4).toFixed(1)}%`;
    if (hint) hint.textContent = captured ? 'Real capture · synthetic comparison' : 'Simulated capture · synthetic comparison';
    f.classList.add('done');
    await new Promise(r => setTimeout(r, 900));
    f.remove();
  };
  Sim.flashEnroll = Sim.flashSign;

  // Failed match flash — used to demonstrate the "wrong face" scenario
  Sim.flashSignFail = function ({ subject, action }) {
    return new Promise((resolve) => {
      const f = document.createElement('div');
      f.className = 'tnx-sim-flash tnx-sim-flash-fail';
      f.innerHTML = `
        <div class="tnx-sim-flash-card">
          <div class="tnx-sim-flash-spinner"></div>
          <div class="tnx-sim-flash-title">Biometric check</div>
          <div class="tnx-sim-flash-sub">${escapeHtml(subject || 'Unknown')} · ${escapeHtml(action || '')}</div>
          <div class="tnx-sim-flash-bar"><div class="tnx-sim-flash-bar-inner"></div></div>
          <div class="tnx-sim-flash-hint">Simulated · skipping camera</div>
        </div>
      `;
      document.body.appendChild(f);
      setTimeout(() => {
        const titleEl = f.querySelector('.tnx-sim-flash-title');
        const sub = f.querySelector('.tnx-sim-flash-sub');
        if (titleEl) titleEl.innerHTML = '✗ Match failed · access blocked';
        if (sub) sub.innerHTML = `Liveness ${(96 + Math.random()*2).toFixed(1)}% · 1:N match <b style="color:#FFB4B6">${(48 + Math.random()*16).toFixed(1)}%</b> (below 85% threshold)`;
        f.classList.add('failed');
        setTimeout(() => { f.remove(); resolve(); }, 1100);
      }, 1100);
    });
  };

  // -----------------------------------------------------------
  // Step library — each step has on-screen action + callouts
  // -----------------------------------------------------------
  function buildSteps() {
    return [
      {
        role: 'super_admin',
        title: 'One biometric gate. Many use cases.',
        narrative: 'Every user — admin, agency, nurse, parent — passes a quick biometric check on sign-in. The same proven-identity stamp is reused everywhere a real-world action needs to be defensible.',
        callouts: [
          { kind: 'security',   text: 'Authorize treatments — only credentialed, identity-verified clinicians can sign off.' },
          { kind: 'security',   text: 'Confirm on-site presence — nurse arrival is biometrically logged with timestamp.' },
          { kind: 'security',   text: 'Prevent substitutions — the face on the badge has to match the face on the license.' },
          { kind: 'capability', text: 'Reused across every role — no second login, no separate audit tooling.' }
        ],
        run: async () => {
          setRole('super_admin');
          await wait(400);
          await Sim.flashSign({ subject: 'Platform Admin', action: 'Sign in to The Nurse Exchange' });
          await goto('#/admin');
          await wait(300);
        }
      },
      {
        role: 'super_admin',
        title: 'Verified agencies, by the numbers',
        narrative: 'The platform admin sees every agency on the network, their compliance posture, and pending verifications.',
        callouts: [
          { kind: 'capability', text: 'Pending agencies require platform-admin biometric approval before they can post cases.' },
          { kind: 'capability', text: 'GA Home Care License + Medicaid Provider ID enforced before activation.' },
          { kind: 'efficiency', text: 'Cross-agency nurse pool shows real-time supply across the whole network.' }
        ],
        run: async () => {
          await goto('#/admin');
          await wait(500);
          await spotlight('.stat-grid', 800);
        }
      },
      {
        role: 'agency_admin',
        title: 'Sandra posts a new pediatric case',
        narrative: 'Agency admin posts a GAPP case for a child needing nursing care. Authorization and Medicaid eligibility are required up front.',
        callouts: [
          { kind: 'capability', text: 'Required skills, county, hours, payer program — captured at intake.' },
          { kind: 'security',   text: 'Posting is biometrically signed by the admin — non-repudiable record.' },
          { kind: 'efficiency', text: 'Match algorithm runs immediately; shortlist-ready candidates appear in seconds.' }
        ],
        run: async () => {
          setRole('agency_admin');
          await goto('#/cases');
          await wait(500);
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
            parent_id: 'pa-01',
            created_at: new Date().toISOString(),
            signed_by: 'Sandra Mitchell'
          };
          State.addCase(newCase);
          const matches = State.getNurses().map(n => {
            let score = 40;
            if (n.counties_served.includes(newCase.county)) score += 20;
            const overlap = newCase.required_skills.filter(s => n.skills.includes(s)).length;
            score += (overlap / newCase.required_skills.length) * 30;
            if (n.primary_agency_id === role.agency_id) score += 6;
            if (n.compliance_status === 'complete') score += 4;
            score = Math.max(12, Math.min(98, Math.round(score)));
            return { nurse_id: n.id, case_id: newCase.id, score, status: 'suggested' };
          }).sort((a,b) => b.score - a.score);
          State.setMatches(newCase.id, matches);
          State.logAudit({ actor: 'Sandra Mitchell', actor_role: 'Agency Admin', entity: 'Case', entity_name: 'Child J', action: 'created · signed (re-uses sign-in identity stamp) [SIM]' });
          window._simNewCaseId = newCase.id;
          window._simTopMatchId = matches[0]?.nurse_id;
          location.hash = '#/case/' + newCase.id;
          await wait(700);
        }
      },
      {
        role: 'agency_admin',
        title: 'Match algorithm finds qualified nurses',
        narrative: 'Score weights skills overlap, county proximity, shift preference, agency network, and compliance status. Top matches surface within seconds of posting.',
        callouts: [
          { kind: 'efficiency', text: 'Average time-to-fill drops from ~14 days to ~3.8 days with cross-agency pool.' },
          { kind: 'capability', text: 'Skill-overlap score distinguishes "qualified" from "perfect-fit" instantly.' },
          { kind: 'capability', text: 'Cross-agency partners surface here too — supply scales across the network.' }
        ],
        run: async () => {
          await spotlight('.match-ring, .nurse-card', 900);
        }
      },
      {
        role: 'agency_admin',
        title: 'Sandra shortlists the top match',
        narrative: 'Shortlisting is a clinical staffing decision — surfaces the nurse to the family and signals consent for them to review the profile.',
        callouts: [
          { kind: 'security',   text: 'Shortlisting is biometrically signed — auditable evidence the agency vetted this candidate.' },
          { kind: 'capability', text: 'Parents only see nurses the agency has explicitly approved for their child.' },
          { kind: 'efficiency', text: 'No back-channel emails, no spreadsheets — the audit chain is the record of truth.' }
        ],
        run: async () => {
          const caseId = window._simNewCaseId, nurseId = window._simTopMatchId;
          if (!caseId || !nurseId) return;
          State.updateMatchStatus(caseId, nurseId, 'shortlisted');
          State.updateCase(caseId, { case_status: 'shortlisting' });
          const n = State.getNurse(nurseId);
          const fname = ((n?.first_name || '') + ' ' + (n?.last_name || '')).trim();
          State.logAudit({ actor: 'Sandra Mitchell', actor_role: 'Agency Admin', entity: 'Nurse', entity_name: fname, action: 'shortlisted for Child J · biometric-signed [SIM]' });
          await wait(500);
        }
      },
      {
        role: 'parent',
        title: 'Danielle reviews the shortlist',
        narrative: 'The family logs in and sees only nurses the agency has shortlisted for them — verified profiles, real reviews, real face on file.',
        callouts: [
          { kind: 'security',   text: 'Every shortlisted nurse has a face matched to their license photo. The face the parent sees is the face that shows up.' },
          { kind: 'capability', text: 'Privacy guards keep clinical notes hidden until parent-presence is confirmed.' },
          { kind: 'efficiency', text: 'Parents make decisions in days, not weeks — they can book directly from the shortlist.' }
        ],
        run: async () => {
          setRole('parent');
          await goto('#/parent-home');
          await wait(550);
          await spotlight('.nurse-card', 900);
        }
      },
      {
        role: 'parent',
        title: 'Danielle books a meet & greet',
        narrative: 'The family picks a date and time. The booking is biometrically signed — auditable evidence the parent consented to this nurse.',
        callouts: [
          { kind: 'security',   text: 'Parent consent is signed and chained — defensible record for state audits.' },
          { kind: 'capability', text: 'Virtual or in-person, agency-recorded for compliance.' },
          { kind: 'efficiency', text: 'No phone tag — agency, parent, and nurse calendars sync in one flow.' }
        ],
        run: async () => {
          const caseId = window._simNewCaseId, nurseId = window._simTopMatchId;
          if (!caseId || !nurseId) return;
          const meet = {
            id: 'mg-sim-' + Date.now().toString().slice(-4),
            case_id: caseId, nurse_id: nurseId, parent_id: 'pa-01',
            scheduled_at: new Date(Date.now() + 2*86400000).toISOString(),
            mode: 'Virtual (Zoom)', status: 'scheduled',
            parent_feedback: null, agency_feedback: null
          };
          State.addMeet(meet);
          const n = State.getNurse(nurseId);
          const fname = ((n?.first_name || '') + ' ' + (n?.last_name || '')).trim();
          State.logAudit({ actor: 'Danielle Carter', actor_role: 'Parent / Guardian', entity: 'Meet & Greet', entity_name: `${fname} ↔ Child J`, action: 'scheduled · biometric-signed [SIM]' });
          await wait(500);
        }
      },
      {
        role: 'nurse',
        title: 'Tiana sees the new opportunity',
        narrative: 'Nurse opens her app and sees the assignment matched by skills + location, with parent + child context.',
        callouts: [
          { kind: 'capability', text: 'Nurses see opportunities ranked by match score, not arbitrary lists.' },
          { kind: 'efficiency', text: 'No application back-and-forth — accept or decline in one tap.' },
          { kind: 'security',   text: 'Availability calendar is biometrically signed — real commitment.' }
        ],
        run: async () => {
          setRole('nurse');
          await goto('#/nurse-home');
          await wait(550);
          await spotlight('.stat-card, .match-ring', 900);
        }
      },
      {
        role: 'nurse',
        title: 'Tiana accepts the assignment',
        narrative: 'Acceptance is a binding clinical commitment. Biometrically signed, logged to the audit chain, visible to agency + parent.',
        callouts: [
          { kind: 'security',   text: 'Acceptance is non-repudiable — the nurse can\'t later claim the assignment was assigned without consent.' },
          { kind: 'capability', text: 'Sandra and Danielle are notified instantly with the signed receipt.' },
          { kind: 'efficiency', text: 'Onboarding paperwork pre-filled from the verified license + enrollment data.' }
        ],
        run: async () => {
          const caseId = window._simNewCaseId, nurseId = window._simTopMatchId;
          if (!caseId || !nurseId) return;
          State.updateMatchStatus(caseId, nurseId, 'accepted');
          const n = State.getNurse(nurseId);
          const fname = ((n?.first_name || '') + ' ' + (n?.last_name || '')).trim();
          State.logAudit({ actor: fname, actor_role: 'Nurse', entity: 'Opportunity', entity_name: 'Child J', action: 'accepted · biometric-signed [SIM]' });
          await wait(500);
        }
      },
      {
        role: 'super_admin',
        title: 'What if the wrong person tries to sign in?',
        narrative: 'Imagine someone other than Tiana tries to use her credentials. The biometric gate sees the live face doesn\'t match the enrolled template — and blocks the action before any state change.',
        callouts: [
          { kind: 'security',   text: 'No match → no signature → no action. Period.' },
          { kind: 'security',   text: 'Failed attempts are logged with timestamp + score. Repeat failures escalate to admin.' },
          { kind: 'capability', text: 'Same gate prevents nurse-substitution at shift start, parent-impersonation at booking, and unauthorized treatment authorizations.' }
        ],
        run: async () => {
          await Sim.flashSignFail({ subject: 'Unknown user', action: 'Attempted sign-in as Tiana Johnson' });
          State.logAudit({ actor: 'Unknown', actor_role: 'Anonymous', entity: 'Biometric gate', entity_name: 'Failed match', action: 'access blocked · 1:N below threshold [SIM]', signed: false });
        }
      },
      {
        role: 'super_admin',
        title: 'Audit chain shows every signed action',
        narrative: 'Each action is hashed and chained. State auditors get the proof; agencies get a defensible record without spreadsheets.',
        callouts: [
          { kind: 'security',   text: 'SHA-256 hashed signatures with timestamp, actor, action, and biometric scores.' },
          { kind: 'capability', text: 'Compliance export pulls the entire chain to JSON in one click.' },
          { kind: 'efficiency', text: 'Audit prep that took weeks now takes minutes.' }
        ],
        run: async () => {
          setRole('super_admin');
          await goto('#/audit');
          await wait(700);
          await spotlight('.tbl, .stat-grid', 1200);
        }
      },
      {
        role: 'super_admin',
        title: 'Walkthrough complete',
        narrative: 'You just watched 4 stakeholders, 6 biometrically-signed actions, all chained in audit. Try the platform yourself with any persona.',
        callouts: [
          { kind: 'capability', text: 'Reset to seed any time from Platform Settings → Remove demo additions.' },
          { kind: 'capability', text: 'Add real nurses via Pool → Add nurse (license-upload invite, full enrollment, or quick-demo bypass).' },
          { kind: 'efficiency', text: 'Switch personas any time using "Demo role" in the topbar.' }
        ],
        run: async () => {
          await goto('#/admin');
          await wait(450);
        }
      }
    ];
  }

  // -----------------------------------------------------------
  // Intro storyboard — shown before step 1
  // -----------------------------------------------------------
  function showIntro() {
    return new Promise((resolve, reject) => {
      const overlay = document.createElement('div');
      overlay.className = 'tnx-sim-intro';
      overlay.innerHTML = `
        <div class="tnx-sim-intro-card">
          <div class="tnx-sim-intro-eyebrow">
            <span class="pulse"></span> GUIDED WALKTHROUGH · ~3 minutes
          </div>
          <h1>How The Nurse Exchange works — end to end</h1>
          <p>You'll watch a real placement happen across 4 stakeholders, with every high-stakes action biometrically signed and audit-chained. The camera is skipped (this is a simulation), but every other action is real and persists in the demo.</p>

          <div class="tnx-sim-intro-flow">
            <div class="flow-node"><div class="dot" style="background:#7C3AED">PA</div><div class="lbl">Platform Admin</div></div>
            <div class="flow-arrow">→</div>
            <div class="flow-node"><div class="dot" style="background:#2D6CDF">SM</div><div class="lbl">Agency Admin</div></div>
            <div class="flow-arrow">→</div>
            <div class="flow-node"><div class="dot" style="background:#F59E0B">DC</div><div class="lbl">Parent</div></div>
            <div class="flow-arrow">→</div>
            <div class="flow-node"><div class="dot" style="background:#16A34A">TJ</div><div class="lbl">Nurse</div></div>
            <div class="flow-arrow">→</div>
            <div class="flow-node"><div class="dot" style="background:#7C3AED">PA</div><div class="lbl">Audit recap</div></div>
          </div>

          <div class="tnx-sim-intro-pillars">
            <div class="pillar"><div class="pillar-ico" style="color:#16A34A">●</div><div><b>Security</b><div>Liveness + 1:N face match · SHA-256 signatures · audit chain</div></div></div>
            <div class="pillar"><div class="pillar-ico" style="color:#2D6CDF">●</div><div><b>Capability</b><div>Cross-agency nurse pool · skill-aware match · privacy guards</div></div></div>
            <div class="pillar"><div class="pillar-ico" style="color:#F59E0B">●</div><div><b>Efficiency</b><div>~3.8 days time-to-fill · in-flow scheduling · audit-ready exports</div></div></div>
          </div>

          <div class="tnx-sim-intro-actions">
            <button class="btn btn-ghost" id="tnx-sim-cancel">Cancel</button>
            <button class="btn btn-secondary" id="tnx-sim-soft-reset" title="Removes any demo additions before starting">↺ Reset to seed first</button>
            <button class="btn btn-brand" id="tnx-sim-begin">Begin walkthrough →</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      let resetFirst = false;
      document.getElementById('tnx-sim-cancel').onclick = () => { overlay.remove(); reject(new Error('cancelled')); };
      document.getElementById('tnx-sim-begin').onclick = () => { overlay.remove(); resolve({ resetFirst }); };
      const resetBtn = document.getElementById('tnx-sim-soft-reset');
      resetBtn.onclick = () => {
        resetFirst = !resetFirst;
        resetBtn.classList.toggle('btn-brand', resetFirst);
        resetBtn.classList.toggle('btn-secondary', !resetFirst);
        resetBtn.textContent = resetFirst ? '✓ Will reset to seed' : '↺ Reset to seed first';
      };
    });
  }

  // -----------------------------------------------------------
  // Narrator (per-step UI)
  // -----------------------------------------------------------
  function ensureNarrator() {
    if (document.getElementById('tnx-narrator')) return;
    const n = document.createElement('div');
    n.id = 'tnx-narrator';
    n.className = 'tnx-narrator tnx-narrator-guided';
    // Initial collapsed state on small screens, expanded on wide
    if (window.innerWidth < 720) n.classList.add('tnx-narrator-mini');
    n.innerHTML = `
      <div class="tnx-narrator-progress"><div class="tnx-narrator-bar" id="tnx-narrator-bar"></div></div>
      <div class="tnx-narrator-body">
        <div class="tnx-narrator-head">
          <div class="tnx-narrator-persona">
            <div class="tnx-narrator-avatar" id="tnx-narrator-avatar">PA</div>
            <div class="tnx-narrator-meta">
              <div class="tnx-narrator-role" id="tnx-narrator-role">—</div>
              <div class="tnx-narrator-substep">
                <span id="tnx-narrator-rolesub" class="tnx-narrator-rolesub"></span>
                <span class="tnx-narrator-step" id="tnx-narrator-step">Step 0 / 0</span>
              </div>
            </div>
          </div>
          <div class="tnx-narrator-controls">
            <button class="tnx-narrator-btn" id="tnx-narrator-toggle" title="Show / hide details">▾</button>
            <button class="tnx-narrator-btn tnx-narrator-exit" id="tnx-narrator-exit" title="Exit walkthrough">✕</button>
          </div>
        </div>
        <div class="tnx-narrator-detail">
          <div class="tnx-narrator-title" id="tnx-narrator-title">Loading…</div>
          <div class="tnx-narrator-desc" id="tnx-narrator-desc"></div>
          <div class="tnx-narrator-callouts" id="tnx-narrator-callouts"></div>
        </div>
        <div class="tnx-narrator-foot">
          <button class="btn btn-ghost btn-sm" id="tnx-narrator-prev">← Prev</button>
          <span class="tnx-narrator-running" id="tnx-narrator-running" style="display:none">Running…</span>
          <button class="btn btn-brand btn-sm" id="tnx-narrator-next" disabled>Next →</button>
        </div>
      </div>
    `;
    document.body.appendChild(n);
    document.getElementById('tnx-narrator-exit').onclick = exit;
    document.getElementById('tnx-narrator-prev').onclick = () => { goPrev(); };
    document.getElementById('tnx-narrator-next').onclick = () => { goNext(); };
    document.getElementById('tnx-narrator-toggle').onclick = () => {
      n.classList.toggle('tnx-narrator-mini');
      const tog = document.getElementById('tnx-narrator-toggle');
      tog.textContent = n.classList.contains('tnx-narrator-mini') ? '▴' : '▾';
    };
  }

  function setNarrator({ role, title, desc, callouts, idx, total }) {
    ensureNarrator();
    const p = ROLE[role] || { label: 'Demo viewer', initials: 'DV', color: '#64748B', sub: '' };
    const av = document.getElementById('tnx-narrator-avatar');
    av.textContent = p.initials;
    av.style.background = p.color;
    document.getElementById('tnx-narrator-role').textContent = p.label;
    document.getElementById('tnx-narrator-rolesub').textContent = p.sub || '';
    document.getElementById('tnx-narrator-step').textContent = `Step ${idx} of ${total}`;
    document.getElementById('tnx-narrator-title').textContent = title;
    document.getElementById('tnx-narrator-desc').textContent = desc || '';
    document.getElementById('tnx-narrator-callouts').innerHTML = (callouts || []).map(c => {
      const tone = c.kind === 'security' ? 'sec' : c.kind === 'efficiency' ? 'eff' : 'cap';
      const label = c.kind === 'security' ? 'Security' : c.kind === 'efficiency' ? 'Efficiency' : 'Capability';
      return `<div class="callout callout-${tone}"><span class="callout-tag">${label}</span> ${escapeHtml(c.text)}</div>`;
    }).join('');
    const pct = total ? Math.round((idx / total) * 100) : 0;
    document.getElementById('tnx-narrator-bar').style.width = pct + '%';
    // Prev disabled on first step
    document.getElementById('tnx-narrator-prev').disabled = idx <= 1;
    document.getElementById('tnx-narrator-next').textContent = idx >= total ? 'Finish ✓' : 'Next →';
  }

  function setRunning(running) {
    document.getElementById('tnx-narrator-running').style.display = running ? '' : 'none';
    document.getElementById('tnx-narrator-next').disabled = running;
  }

  function removeNarrator() {
    document.getElementById('tnx-narrator')?.remove();
  }

  function goNext() { if (nextResolve) { const r = nextResolve; nextResolve = null; r('next'); } }
  function goPrev() { if (nextResolve) { const r = nextResolve; nextResolve = null; r('prev'); } }
  function exit() {
    aborted = true;
    if (nextResolve) { const r = nextResolve; nextResolve = null; r('abort'); }
    window.TNX_SIMULATING = false;
    removeNarrator();
    document.querySelector('.tnx-sim-final')?.remove();
    document.querySelector('.tnx-sim-intro')?.remove();
    if (window.TNXComponents?.toast) window.TNXComponents.toast('Walkthrough exited', 'info');
  }

  function waitForNext() {
    return new Promise(res => { nextResolve = res; });
  }

  // -----------------------------------------------------------
  // Driver
  // -----------------------------------------------------------
  async function start({ resetState = false } = {}) {
    if (window.TNX_SIMULATING) return;
    aborted = false;
    let intro;
    try {
      intro = await showIntro();
    } catch { return; }
    if (intro?.resetFirst) {
      try { State.purgeDemoAdditions(); } catch {}
    }
    if (resetState) {
      try { State.reset(); } catch {}
    }
    sessionStorage.setItem('tnx.cq.gatePassed', '1');
    window.TNX_SIMULATING = true;
    ensureNarrator();
    currentSteps = buildSteps();
    stepIdx = 0;
    while (stepIdx < currentSteps.length && !aborted) {
      const s = currentSteps[stepIdx];
      setNarrator({ role: s.role, title: s.title, desc: s.narrative, callouts: s.callouts, idx: stepIdx + 1, total: currentSteps.length });
      setRunning(true);
      try { await s.run(); } catch (e) { console.warn('sim step error', e); }
      setRunning(false);
      const choice = await waitForNext();
      if (choice === 'abort') break;
      if (choice === 'prev' && stepIdx > 0) stepIdx--;
      else stepIdx++;
    }
    if (!aborted) {
      const f = document.createElement('div');
      f.className = 'tnx-sim-final';
      f.innerHTML = `
        <div class="tnx-sim-final-card">
          <div class="tnx-sim-final-check">✓</div>
          <h2>Walkthrough complete</h2>
          <p>You watched 4 stakeholders complete a placement with 6 biometrically-signed, audit-chained actions. Switch personas any time from "Demo role" in the topbar to explore on your own.</p>
          <div class="tnx-sim-final-actions">
            <button class="btn btn-secondary" id="tnx-sim-restart">Replay walkthrough</button>
            <button class="btn btn-brand" id="tnx-sim-explore">Explore as Platform Admin →</button>
          </div>
        </div>
      `;
      document.body.appendChild(f);
      document.getElementById('tnx-sim-restart').onclick = () => { f.remove(); removeNarrator(); window.TNX_SIMULATING = false; start({ resetState: false }); };
      document.getElementById('tnx-sim-explore').onclick = () => { f.remove(); removeNarrator(); window.TNX_SIMULATING = false; setRole('super_admin'); };
    }
    window.TNX_SIMULATING = false;
    removeNarrator();
  }

  Sim.start = start;
  Sim.exit = exit;
  Sim.isRunning = () => !!window.TNX_SIMULATING;

  window.Simulation = Sim;
})();

/* =========================================================
   App shell, router, action dispatch
   ========================================================= */
(function(){
const { initials, fullName, fmtDate, fmtDateTime, relativeTime,
        badge, complianceBadge, priorityBadge, caseStatusBadge,
        avatar, matchRing, chip, nurseCard, emptyState, statCard,
        openModal, closeModal, openDrawer, closeDrawer, toast } = window.TNXComponents;
const Views = window.Views;

// ------------- Nav items per role -------------
function navFor(role) {
  if (role.id === 'super_admin') {
    return [
      { group: 'Platform', items: [
        { label: 'Overview', icon: 'dash', href: '#/admin' },
        { label: 'Agencies', icon: 'briefcase', href: '#/admin-agencies' },
        { label: 'Nurses', icon: 'users', href: '#/admin-nurses' },
        { label: 'Audit log', icon: 'shield', href: '#/audit' }
      ]},
      { group: 'System', items: [
        { label: 'Settings', icon: 'settings', href: '#/settings' }
      ]}
    ];
  }
  if (role.id === 'nurse') {
    return [
      { group: 'Nursing', items: [
        { label: 'My home', icon: 'home', href: '#/nurse-home' },
        { label: 'Opportunities', icon: 'briefcase', href: '#/nurse-opps' },
        { label: 'My schedule', icon: 'calendar', href: '#/nurse-schedule' },
        { label: 'My credentials', icon: 'shield', href: '#/nurse-creds' },
        { label: 'Messages', icon: 'message', href: '#/messages' }
      ]}
    ];
  }
  if (role.id === 'parent') {
    return [
      { group: 'My child\'s care', items: [
        { label: 'Home', icon: 'home', href: '#/parent-home' },
        { label: 'Nurse profiles', icon: 'users', href: '#/parent-home' },
        { label: 'Meet & greets', icon: 'calendar', href: '#/parent-home' },
        { label: 'Messages', icon: 'message', href: '#/messages' }
      ]}
    ];
  }
  if (role.id === 'recruiter') {
    return [
      { group: 'Recruiting', items: [
        { label: 'Dashboard', icon: 'dash', href: '#/dashboard' },
        { label: 'The Pool', icon: 'pool', href: '#/pool', badge: State.getNurses().filter(n => {
            const r = State.currentRole(); return n.primary_agency_id === r.agency_id || n.shared_with.includes(r.agency_id);
          }).length },
        { label: 'Cases', icon: 'briefcase', href: '#/cases', badge: State.getCases().filter(c => {
            const r = State.currentRole(); return c.agency_id === r.agency_id && ['open','shortlisting'].includes(c.case_status);
          }).length },
        { label: 'Meet & greets', icon: 'calendar', href: '#/meets' },
        { label: 'Messages', icon: 'message', href: '#/messages' }
      ]}
    ];
  }
  // agency_admin (default)
  return [
    { group: 'Workspace', items: [
      { label: 'Dashboard', icon: 'dash', href: '#/dashboard' },
      { label: 'The Pool', icon: 'pool', href: '#/pool', badge: State.getNurses().filter(n => {
          const r = State.currentRole(); return n.primary_agency_id === r.agency_id || n.shared_with.includes(r.agency_id);
        }).length },
      { label: 'Cases', icon: 'briefcase', href: '#/cases', badge: State.getCases().filter(c => {
          const r = State.currentRole(); return c.agency_id === r.agency_id && ['open','shortlisting'].includes(c.case_status);
        }).length },
      { label: 'Meet & greets', icon: 'calendar', href: '#/meets' },
      { label: 'Messages', icon: 'message', href: '#/messages' }
    ]},
    { group: 'Operations', items: [
      { label: 'Compliance', icon: 'shield', href: '#/compliance' },
      { label: 'Reporting', icon: 'chart', href: '#/reporting' },
      { label: 'Audit log', icon: 'shield', href: '#/audit' }
    ]},
    { group: 'Agency', items: [
      { label: 'Settings', icon: 'settings', href: '#/settings' }
    ]}
  ];
}

// Permission helper — agency-level edits restricted to agency_admin & super_admin
function canEditAgency() {
  const id = State.currentRole().id;
  return id === 'agency_admin' || id === 'super_admin';
}
function canApproveAgency() {
  return State.currentRole().id === 'super_admin';
}
window.canEditAgency = canEditAgency;
window.canApproveAgency = canApproveAgency;

function renderSidebar(currentRoute) {
  const role = State.currentRole();
  const groups = navFor(role);
  return `
    ${groups.map(g => `
      <div class="nav-group-label">${g.group}</div>
      ${g.items.map(i => {
        const itemPath = i.href.replace(/^#/, '');
        let active = currentRoute === itemPath || currentRoute.startsWith(itemPath + '/');
        if (itemPath === '/cases' && currentRoute.startsWith('/case/')) active = true;
        if (itemPath === '/pool' && currentRoute.startsWith('/nurse/')) active = true;
        return `
        <a class="nav-item ${active ? 'active' : ''}" href="${i.href}">
          ${icon(i.icon, 16)}
          <span>${i.label}</span>
          ${i.badge ? `<span class="badge-count">${i.badge}</span>` : ''}
        </a>`;
      }).join('')}
    `).join('')}
    <div class="sidebar-foot">
      ${sidebarWidget(role)}
    </div>
  `;
}

function sidebarWidget(role) {
  if (role.id === 'parent') {
    return `<div class="compliance-card">
      <h4>Need help?</h4>
      <p>Your care coordinator at ${State.getAgency(role.agency_id)?.name || 'your agency'} is here to help 24/7.</p>
      <button class="btn btn-brand btn-sm btn-block">${icon('phone',12)} Call agency</button>
    </div>`;
  }
  if (role.id === 'nurse') {
    return `<div class="compliance-card">
      <h4>Your compliance</h4>
      <p>All credentials current. Next renewal: PALS in 22 days.</p>
      <button class="btn btn-brand btn-sm btn-block">${icon('shield',12)} View details</button>
    </div>`;
  }
  if (role.id === 'super_admin') {
    return `<div class="compliance-card">
      <h4>Georgia instance</h4>
      <p>${State.getAgencies().filter(a=>a.status==='verified').length} verified agencies, ${State.getAgencies().filter(a=>a.status==='pending').length} pending review.</p>
      <button class="btn btn-brand btn-sm btn-block">${icon('shield',12)} Run health check</button>
    </div>`;
  }
  return `<div class="compliance-card">
    <h4>Your network</h4>
    <p>${State.getAgency(role.agency_id)?.share_partners.length || 0} partner agencies sharing nurses.</p>
    <button class="btn btn-brand btn-sm btn-block">${icon('link',12)} Manage partners</button>
  </div>`;
}

function renderTopbar() {
  const role = State.currentRole();
  return `
    <div class="topbar-left">
      <button class="mobile-menu-btn" data-action="toggle-sidebar" aria-label="Menu">${icon('menu',20)}</button>
      <a href="index.html" class="topbar-brand" title="Back to landing page">${icon('pool',22)} <span>The Nurse Exchange</span></a>
      <div class="topbar-search" style="position:relative">
        ${icon('search',14)}
        <input id="global-search" placeholder="Search nurses, cases, skills…" autocomplete="off" />
        <div id="global-search-results" class="global-search-results"></div>
      </div>
    </div>
    <div class="topbar-right">
      <button class="try-demo-cta topbar-try-demo" data-action="start-simulation" title="Watch a guided walkthrough">
        <span class="pulse"></span>${icon('video',12)} <span class="try-demo-label">Try demo</span>
      </button>
      <button class="role-switch" data-action="toggle-role-menu">
        ${icon('users',14)} <span class="role-switch-label">Demo role:</span> <b>${role.label}</b> ${icon('chevronDown',12)}
      </button>
      <button class="icon-btn" data-action="open-notifications" title="Notifications">${icon('bell',18)}<span class="dot-alert"></span></button>
      <button class="icon-btn icon-btn-msg" data-action="open-assistant" title="AI assistant">${icon('message',18)}</button>
      <div class="user-menu">
        <div class="avatar">${initials(window.Cryptiq?.getDisplayName() || role.name)}</div>
        <div class="meta">
          <div class="name">${window.Cryptiq?.getDisplayName() || role.name}</div>
          <div class="sub">${role.label}</div>
        </div>
      </div>
    </div>
  `;
}

function renderFooter() {
  const v = window.TNX_VERSION || '0.0.0';
  const build = window.TNX_BUILD || '';
  return `
    <div class="app-footer-inner">
      <span class="cq-secured-badge" title="All actions biometrically signed">
        <span class="cq-dot"></span> Verified · biometric-secured
      </span>
      <span class="app-footer-meta">All actions biometrically signed · LookAway privacy guards active</span>
      <span class="build-tag" title="Build version">v${v}${build ? ' · ' + build : ''}</span>
    </div>
  `;
}

function roleMenu() {
  return `
    <div class="modal" style="max-width:640px">
      <div class="modal-head">
        <h3>Switch demo persona</h3>
        <button class="modal-close" data-action="close-modal">${icon('x',16)}</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:18px">Jump between user roles to experience each side of the platform. State persists across sessions via localStorage — reset from any page.</p>
        <div class="role-grid-mobile" style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px">
          ${window.TNX.ROLES.map(r => `
            <button class="role-card" data-action="switch-role" data-id="${r.id}">
              <div class="badge-ico">${icon(r.id==='super_admin'?'shield':r.id==='nurse'?'nurse':r.id==='parent'?'home':'briefcase', 18)}</div>
              <div class="role-card-text">
                <h4>${r.label}</h4>
                <div class="persona">${r.persona}</div>
              </div>
              <div class="enter">Enter →</div>
            </button>
          `).join('')}
        </div>
        <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border); text-align:right">
          <button class="btn btn-ghost btn-sm" data-action="reset-demo">${icon('logout',12)} Reset demo data</button>
        </div>
      </div>
    </div>
  `;
}

// ------------- Router -------------
const routes = {
  '/dashboard': () => Views.dashboard(),
  '/pool': () => Views.pool(),
  '/cases': () => Views.cases(),
  '/meets': () => Views.meets(),
  '/compliance': () => Views.compliance(),
  '/messages': () => Views.messages(),
  '/reporting': () => Views.reporting(),
  '/audit': () => Views.audit(),
  '/settings': () => Views.settings(),
  '/admin': () => Views.admin(),
  '/admin-agencies': () => Views.admin(),
  '/admin-nurses': () => Views.pool(),
  '/nurse-home': () => Views.nurseHome(),
  '/nurse-opps': () => Views.nurseOpps(),
  '/nurse-schedule': () => Views.nurseSchedule(),
  '/nurse-creds': () => Views.nurseCreds(),
  '/parent-home': () => Views.parentHome()
};

function render() {
  const app = document.getElementById('app');
  const role = State.currentRole();
  if (!location.hash || location.hash === '#' || location.hash === '#/') {
    location.hash = role.home;
    return;
  }
  const hash = location.hash;
  const path = hash.slice(1);

  // Preserve focus across re-renders for text inputs
  const prev = document.activeElement;
  const focusId = prev && prev.id ? prev.id : null;
  const selStart = focusId ? prev.selectionStart : null;
  const selEnd = focusId ? prev.selectionEnd : null;

  let content;
  if (path.startsWith('/nurse/')) content = Views.nurseDetail(path.split('/')[2]);
  else if (path.startsWith('/case/')) content = Views.caseDetail(path.split('/')[2]);
  else if (routes[path]) content = routes[path]();
  else {
    location.hash = role.home;
    return;
  }

  app.innerHTML = `
    <div class="app-shell" id="app-shell">
      <header class="app-topbar">${renderTopbar()}</header>
      <div class="mobile-sidebar-backdrop" data-action="close-sidebar"></div>
      <aside class="app-sidebar">${renderSidebar(path)}</aside>
      <main class="app-main">${content}</main>
      <footer class="app-footer">${renderFooter()}</footer>
    </div>
  `;

  if (focusId) {
    const next = document.getElementById(focusId);
    if (next) {
      next.focus();
      try { if (selStart != null) next.setSelectionRange(selStart, selEnd); } catch {}
    }
  }
  const body = document.getElementById('chat-body');
  if (body) body.scrollTop = body.scrollHeight;
  // Activate LookAway on sensitive targets in the freshly rendered DOM
  document.querySelectorAll('.lookaway-target').forEach(el => {
    if (el.dataset.laBound) return;
    el.dataset.laBound = '1';
    Cryptiq.LookAway.guard(el, {
      label: el.dataset.lookawayLabel || 'Privacy guarded',
      reason: el.dataset.lookawayReason || 'Sensitive info · presence required'
    });
  });
}

window.addEventListener('hashchange', () => {
  document.getElementById('app-shell')?.classList.remove('sidebar-open');
  render();
});

// ------------- Action dispatch -------------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;

  switch (action) {
    case 'nav': location.hash = el.dataset.href; break;
    case 'close-modal': closeModal(); break;
    case 'close-drawer': closeDrawer(); break;
    case 'toggle-sidebar': document.getElementById('app-shell')?.classList.toggle('sidebar-open'); break;
    case 'close-sidebar': document.getElementById('app-shell')?.classList.remove('sidebar-open'); break;
    case 'toggle-role-menu': openModal(roleMenu(), 'role-sheet'); break;
    case 'start-simulation':
      closeModal();
      window.Simulation?.start({ resetState: false });
      break;
    case 'open-notifications': openNotifications(); break;
    case 'open-assistant': openAssistant(); break;
    case 'assistant-send': sendAssistantMessage(); break;
    case 'assistant-quick': quickAssistant(el.dataset.q); break;
    case 'switch-role':
      State.setRole(id);
      closeModal();
      const r = window.TNX.ROLES.find(x => x.id === id);
      toast(`Switched to ${r.label}`, 'success');
      location.hash = r.home;
      setTimeout(render, 50);
      break;
    case 'reset-demo':
      State.reset();
      closeModal();
      toast('Demo data reset', 'info');
      setTimeout(() => location.reload(), 400);
      break;
    case 'open-nurse': location.hash = `#/nurse/${id}`; Views.nurseTab = 'overview'; break;
    case 'open-case': location.hash = `#/case/${id}`; break;
    case 'nurse-tab': Views.nurseTab = el.dataset.tab; render(); break;
    case 'case-view': Views.caseView = el.dataset.v; render(); break;
    case 'shortlist-nurse': handleShortlist(id); break;
    case 'msg-nurse': handleMessageNurse(id); break;
    case 'msg-parent': handleMessageParent(id); break;
    case 'new-case': openModal(newCaseModal()); break;
    case 'submit-new-case': submitNewCase(); break;
    case 'invite-nurse': openModal(inviteNurseModal()); break;
    case 'add-nurse': openModal(addNurseModal()); break;
    case 'add-nurse-mode': _addNurseMode = el.dataset.mode; refreshAddNurseModal(); break;
    case 'and-pick-photo': pickAddNurseDemoPhoto(); break;
    case 'submit-add-nurse-demo': submitAddNurseDemo(); break;
    case 'ani-pick-doc': pickAddNurseInviteDoc(); break;
    case 'submit-add-nurse-doc-invite': submitAddNurseDocInvite(); break;
    case 'submit-add-nurse': submitAddNurse(); break;
    case 'schedule-meet': openModal(scheduleMeetModal(el.dataset.case, el.dataset.nurse)); break;
    case 'pick-meet-day': pickMeetDay(el.dataset.date); break;
    case 'pick-meet-slot': pickMeetSlot(el.dataset.time); break;
    case 'submit-meet': submitMeet(); break;
    case 'open-meet': openDrawer(meetDrawer(id)); break;
    case 'open-thread': Views.activeThread = id; render(); break;
    case 'send-msg': sendMsg(el.dataset.thread); break;
    case 'verify-agency':
      if (!canApproveAgency()) { toast('Only the platform admin can verify agencies', 'info'); return; }
      verifyAgency(id); break;
    case 'request-pool': requestFromPool(id); break;
    case 'accept-opp': acceptOpp(el.dataset.case); break;
    case 'update-availability': openModal(availabilityModal()); break;
    case 'cycle-avail-day': cycleAvailDay(el.dataset.date); break;
    case 'save-availability': saveAvailability(); break;
    case 'upload-doc': triggerDocUpload(el.dataset.id || el.dataset.docKey); break;
    case 'remove-doc': removeDoc(el.dataset.id || el.dataset.docKey); break;
    case 'admin-purge':
      if (State.currentRole().id !== 'super_admin') { toast('Only platform admin can reset data', 'info'); return; }
      openModal(adminPurgeModal()); break;
    case 'admin-purge-soft': adminPurgeSoft(); break;
    case 'admin-purge-full':
      closeModal();
      setTimeout(() => openModal(adminPurgeFullConfirmModal()), 220);
      break;
    case 'admin-purge-confirm': adminPurgeConfirm(); break;
    case 'parent-book': openModal(parentBookModal(el.dataset.nurse, el.dataset.case)); break;
    case 'parent-feedback': handleParentFeedback(el.dataset.meet, el.dataset.fb); break;
    case 'msg-parent-agency': handleMsgParentAgency(); break;
    case 'invite-parent': openModal(inviteParentModal(el.dataset.case)); break;
    case 'submit-invite-parent': submitInviteParent(el.dataset.case); break;
    case 'bulk-upload-docs':
      if (!canEditAgency()) { toast('Bulk upload requires agency admin role', 'info'); return; }
      triggerBulkUpload(); break;
    case 'send-renewal-reminders': sendRenewalReminders(); break;
    case 'new-message': openModal(newMessageModal()); break;
    case 'send-new-message': submitNewMessage(); break;
    case 'add-partner-agency':
      if (!canEditAgency()) { toast('Only agency admin can add partners', 'info'); return; }
      openModal(addPartnerModal()); break;
    case 'confirm-add-partner': confirmAddPartner(el.dataset.id); break;
    case 'invite-team':
      if (!canEditAgency()) { toast('Only agency admin can invite team members', 'info'); return; }
      openModal(inviteTeamModal()); break;
    case 'submit-invite-team': submitInviteTeam(); break;
    case 'add-agency':
      if (State.currentRole().id !== 'super_admin') { toast('Only platform admin can add agencies', 'info'); return; }
      openModal(addAgencyModal()); break;
    case 'submit-add-agency': submitAddAgency(); break;
    case 'compliance-export': handleComplianceExport(); break;
  }
});

// Filter live-update on pool
document.addEventListener('input', (e) => {
  if (e.target.id === 'global-search') { runGlobalSearch(e.target.value); }
  if (e.target.id === 'pool-search') { Views.poolFilters.search = e.target.value; throttleRender(); }
  if (e.target.id === 'f-county')  { Views.poolFilters.county = e.target.value; render(); }
  if (e.target.id === 'f-skill')   { Views.poolFilters.skill = e.target.value; render(); }
  if (e.target.id === 'f-comp')    { Views.poolFilters.compliance = e.target.value; render(); }
  if (e.target.id === 'f-sort')    { Views.poolFilters.sort = e.target.value; render(); }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'f-share') { Views.poolFilters.shareOnly = e.target.checked; render(); }
  const mf = e.target.dataset?.meetField;
  if (mf) {
    meetCtx[mf] = e.target.value || null;
    // Re-render modal only if case changes (nurse list depends on case)
    if (mf === 'caseId') { meetCtx.nurseId = null; refreshMeetModal(); }
  }
});

// Enter-to-send on message composer
document.addEventListener('keydown', (e) => {
  if (e.target.id === 'msg-input' && e.key === 'Enter') {
    const thread = document.querySelector('[data-action="send-msg"]')?.dataset.thread;
    if (thread) sendMsg(thread);
  }
});

let _rt;
function throttleRender() { clearTimeout(_rt); _rt = setTimeout(render, 120); }

// ------------- Action handlers -------------
function handleShortlist(nurseId) {
  const role = State.currentRole();
  const openCases = State.getCases().filter(c => c.agency_id === role.agency_id && ['open','shortlisting'].includes(c.case_status));
  if (!openCases.length) { toast('No open cases to shortlist for', 'info'); return; }
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Shortlist ${fullName(State.getNurse(nurseId))}</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px">Choose the case to shortlist this nurse for. The parent will then be able to view this profile and book a meet & greet.</p>
        ${openCases.map(c => `
          <div style="display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--border); border-radius:var(--r-sm); margin-bottom:8px; cursor:pointer" data-action="confirm-shortlist" data-nurse="${nurseId}" data-case="${c.id}">
            <div style="width:40px;height:40px;border-radius:10px;background:var(--ocean-50);color:var(--ocean);display:grid;place-items:center">${icon('briefcase',16)}</div>
            <div style="flex:1">
              <div style="font-weight:600; color:var(--navy)">${c.child_alias}</div>
              <div style="font-size:12px; color:var(--text-muted)">${c.county} · ${c.shift_type} · ${c.requested_hours}h/wk</div>
            </div>
            ${priorityBadge(c.priority)}
          </div>
        `).join('')}
      </div>
    </div>
  `);
}

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action="confirm-shortlist"]');
  if (!el) return;
  const nurseId = el.dataset.nurse;
  const caseId = el.dataset.case;
  const n = State.getNurse(nurseId);
  const c = State.getCase(caseId);
  closeModal();
  try {
    await Cryptiq.sign({
      action: `Shortlist ${fullName(n)} for ${c.child_alias}`,
      purpose: 'Parent will see this nurse · clinical staffing decision'
    });
  } catch { toast('Shortlist cancelled — signature required', 'info'); return; }
  State.updateMatchStatus(caseId, nurseId, 'shortlisted');
  State.updateCase(caseId, { case_status: 'shortlisting' });
  State.logAudit({ actor: State.currentRole().name, actor_role: State.currentRole().label, entity: 'Nurse', entity_name: fullName(n), action: `shortlisted for ${c.child_alias} · biometric-signed` });
  toast(`${fullName(n)} shortlisted for ${c.child_alias}`, 'success');
  render();
});

function handleMessageNurse(nurseId) {
  const n = State.getNurse(nurseId);
  toast(`Opened conversation with ${fullName(n)}`, 'info');
  Views.activeThread = State.getThreads()[0]?.id;
  location.hash = '#/messages';
}
function handleMessageParent(parentId) {
  toast('Parent message thread opened', 'info');
  location.hash = '#/messages';
}

function newCaseModal() {
  const role = State.currentRole();
  return `
    <div class="modal" style="max-width:780px">
      <div class="modal-head">
        <h3>Post a new case</h3>
        <button class="modal-close" data-action="close-modal">${icon('x',16)}</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--ocean-50); border-left:3px solid var(--ocean); padding:12px 14px; border-radius:var(--r-sm); margin-bottom:16px; font-size:13px; color:var(--navy)">
          ${icon('shield',14)} Authorization must be verified before placement. GAPP requires prior auth + Medicaid eligibility.
        </div>
        <div class="form-row">
          <div class="field"><label>Child alias</label><input class="input" id="nc-alias" value="Child I" placeholder="e.g. Child I"></div>
          <div class="field"><label>County</label>
            <select class="select" id="nc-county">
              ${window.TNX.GA_COUNTIES.map(c => `<option>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row-3">
          <div class="field"><label>Age band</label>
            <select class="select" id="nc-age">
              <option>0-2 years</option><option>3-5 years</option><option selected>6-7 years</option>
              <option>8-10 years</option><option>11-15 years</option><option>16-20 years</option>
            </select>
          </div>
          <div class="field"><label>Shift type</label>
            <select class="select" id="nc-shift"><option>Day</option><option>Night</option><option>Overnight</option><option>Weekend</option></select>
          </div>
          <div class="field"><label>Hours / week</label><input class="input" id="nc-hours" type="number" value="40"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Start date</label><input class="input" id="nc-start" type="date"></div>
          <div class="field"><label>Priority</label>
            <select class="select" id="nc-priority"><option>standard</option><option>urgent</option></select>
          </div>
        </div>
        <div class="field">
          <label>Required skills</label>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-top:6px">
            ${window.TNX.PED_SKILLS.slice(0,12).map(s => `
              <label style="display:flex;align-items:center;gap:6px;font-size:12px;padding:6px 8px;border:1px solid var(--border);border-radius:var(--r-sm);cursor:pointer">
                <input type="checkbox" class="nc-skill" value="${s}"> ${s}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="field"><label>Case notes</label><textarea class="textarea" id="nc-notes" placeholder="Medical context, family preferences, special considerations…"></textarea></div>
        <div class="form-row">
          <div class="field"><label>Authorization status</label>
            <select class="select" id="nc-auth"><option>Prior Auth Approved</option><option>Pending Submission</option><option>Pending Renewal</option></select>
          </div>
          <div class="field"><label>Payer</label>
            <select class="select" id="nc-payer"><option>Georgia GAPP (Medicaid)</option><option>Medicaid CMO (Amerigroup)</option><option>Medicaid CMO (CareSource)</option><option>Private Pay</option></select>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        <button class="btn btn-brand" data-action="submit-new-case">${icon('plus',14)} Post case</button>
      </div>
    </div>
  `;
}

async function submitNewCase() {
  const role = State.currentRole();
  const alias = document.getElementById('nc-alias').value || 'New Case';
  // Gather values BEFORE Cryptiq modal (which replaces DOM)
  const skills = [...document.querySelectorAll('.nc-skill:checked')].map(x => x.value);
  const county = document.getElementById('nc-county').value;
  const age = document.getElementById('nc-age').value;
  const shift = document.getElementById('nc-shift').value;
  const hours = parseInt(document.getElementById('nc-hours').value || '40', 10);
  const priority = document.getElementById('nc-priority').value;
  const auth = document.getElementById('nc-auth').value;
  const payer = document.getElementById('nc-payer').value;
  const notes = document.getElementById('nc-notes').value || '';
  const startRaw = document.getElementById('nc-start').value;
  const start = startRaw ? new Date(startRaw).toISOString() : new Date(Date.now() + 7*86400000).toISOString();

  // Close the form modal first
  closeModal();

  // Require biometric signature
  let signature;
  try {
    signature = await Cryptiq.sign({
      action: `Post GAPP case: ${alias}`,
      purpose: 'Case authorization · GAPP accountability',
      subject: role.name
    });
  } catch { toast('Case posting cancelled — signature required', 'info'); return; }

  const c = {
    id: 'cs-' + (Date.now().toString().slice(-4)),
    agency_id: role.agency_id,
    child_alias: alias,
    county,
    age_band: age,
    required_skills: skills.length ? skills : ['Medication Administration'],
    requested_hours: hours,
    shift_type: shift,
    authorization_status: auth,
    payer_program: payer,
    start_date: start,
    case_status: 'open',
    priority,
    notes,
    parent_id: null,
    created_at: new Date().toISOString(),
    signed_by: signature.subject,
    signature_hash: signature.hash
  };
  State.addCase(c);

  // Compute matches for new case
  const matches = State.getNurses().map(n => {
    let score = 40;
    if (n.counties_served.includes(c.county)) score += 20; else score -= 10;
    const overlap = c.required_skills.filter(s => n.skills.includes(s)).length;
    score += (overlap / c.required_skills.length) * 30;
    if (n.shift_preferences.some(sp => c.shift_type.toLowerCase().includes(sp.toLowerCase()))) score += 8;
    if (n.primary_agency_id === c.agency_id) score += 6;
    else if (n.shared_with.includes(c.agency_id)) score += 3;
    else score -= 20;
    if (n.compliance_status === 'complete') score += 6;
    score = Math.max(12, Math.min(98, Math.round(score)));
    return { nurse_id: n.id, case_id: c.id, score, status: 'suggested' };
  }).sort((a,b) => b.score - a.score);
  State.setMatches(c.id, matches);

  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Case', entity_name: c.child_alias, action: 'created' });
  closeModal();
  toast(`Case posted — ${matches.filter(m => m.score >= 60).length} likely matches found`, 'success');
  location.hash = `#/case/${c.id}`;
}

function inviteNurseModal() {
  return `
    <div class="modal">
      <div class="modal-head"><h3>Invite a nurse to your pool</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px">They'll receive an email with a secure onboarding link. Credentials must be uploaded before they appear in the pool.</p>
        <div class="field"><label>Email</label><input class="input" placeholder="nurse@example.com"></div>
        <div class="form-row">
          <div class="field"><label>License type</label><select class="select"><option>RN</option><option>LPN</option></select></div>
          <div class="field"><label>Share with network?</label><select class="select"><option>Private to agency</option><option>Shared with partners</option></select></div>
        </div>
        <div class="field"><label>Personal note (optional)</label><textarea class="textarea" placeholder="Hi! We'd love to add you to our pediatric nurse pool…"></textarea></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        <button class="btn btn-brand" onclick="TNXComponents.closeModal(); TNXComponents.toast('Invitation sent', 'success');">${icon('mail',14)} Send invite</button>
      </div>
    </div>
  `;
}

// Add-nurse mode: 'choose' | 'demo' | 'doc-invite' | 'full'
let _addNurseMode = 'choose';
let _addNurseDemoPhoto = null;

function addNurseModal() {
  _addNurseMode = 'choose';
  _addNurseDemoPhoto = null;
  return renderAddNurseModal();
}

function renderAddNurseModal() {
  if (_addNurseMode === 'choose') return addNurseChooseHTML();
  if (_addNurseMode === 'demo') return addNurseDemoHTML();
  if (_addNurseMode === 'doc-invite') return addNurseDocInviteHTML();
  if (_addNurseMode === 'full') return addNurseFullHTML();
  return addNurseChooseHTML();
}

function addNurseChooseHTML() {
  return `
    <div class="modal" style="max-width:680px">
      <div class="modal-head"><h3>Add nurse to your pool</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:18px">Pick how you'd like to onboard this nurse.</p>
        <div style="display:grid; grid-template-columns:1fr; gap:10px">
          <button class="role-card" style="text-align:left; flex-direction:row; align-items:center; gap:14px; padding:16px" data-action="add-nurse-mode" data-mode="doc-invite">
            <div class="badge-ico">${icon('mail',18)}</div>
            <div style="flex:1; min-width:0">
              <h4 style="margin-bottom:2px">Doc upload + invite link <span class="cq-verified-chip" style="margin-left:6px">recommended</span></h4>
              <div class="persona">Upload their license, send them a secure link. They scan their face on phone, the system verifies it matches the doc photo.</div>
            </div>
            ${icon('chevronRight',16)}
          </button>
          <button class="role-card" style="text-align:left; flex-direction:row; align-items:center; gap:14px; padding:16px" data-action="add-nurse-mode" data-mode="full">
            <div class="badge-ico">${icon('shield',18)}</div>
            <div style="flex:1; min-width:0">
              <h4 style="margin-bottom:2px">Full biometric enrollment</h4>
              <div class="persona">3-step in-person flow: scan their license, capture liveness selfie, biometric 1:N match against the doc photo.</div>
            </div>
            ${icon('chevronRight',16)}
          </button>
          <button class="role-card" style="text-align:left; flex-direction:row; align-items:center; gap:14px; padding:16px; border-style:dashed" data-action="add-nurse-mode" data-mode="demo">
            <div class="badge-ico" style="background:linear-gradient(135deg,var(--text-muted),var(--text-subtle))">${icon('users',18)}</div>
            <div style="flex:1; min-width:0">
              <h4 style="margin-bottom:2px">Quick demo bypass</h4>
              <div class="persona">Skip biometric. Just enter a name and upload (or pick) a photo. Useful for showing the rest of the platform without going through enrollment.</div>
            </div>
            ${icon('chevronRight',16)}
          </button>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
      </div>
    </div>
  `;
}

function addNurseDemoHTML() {
  return `
    <div class="modal" style="max-width:560px">
      <div class="modal-head"><h3>${icon('users',14)} Demo nurse · quick add</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <div style="background:rgba(245,158,11,0.08); border-left:3px solid var(--warn); padding:10px 14px; border-radius:8px; margin-bottom:16px; font-size:12px; color:var(--navy)">
          <b>Demo mode.</b> Skips biometric. The nurse will appear in the pool but won't show the Verified chip until real enrollment.
        </div>
        <div class="form-row">
          <div class="field"><label>First name</label><input class="input" id="and-first" placeholder="Tiana"></div>
          <div class="field"><label>Last name</label><input class="input" id="and-last" placeholder="Johnson"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>License type</label><select class="select" id="and-lt"><option>RN</option><option>LPN</option></select></div>
          <div class="field"><label>Years experience</label><input class="input" id="and-yrs" type="number" value="3"></div>
        </div>
        <div class="field">
          <label>Profile photo</label>
          <div style="display:flex; gap:14px; align-items:center; padding:12px; background:var(--surface-alt); border:1px dashed var(--border-strong); border-radius:10px">
            <div id="and-photo-preview" style="width:72px; height:72px; border-radius:14px; background:var(--navy-50); color:var(--text-muted); display:grid; place-items:center; overflow:hidden; flex-shrink:0; ${_addNurseDemoPhoto ? `background-image:url('${_addNurseDemoPhoto}'); background-size:cover; background-position:center` : ''}">
              ${_addNurseDemoPhoto ? '' : icon('users',24)}
            </div>
            <div style="flex:1; min-width:0">
              <div style="font-size:13px; font-weight:600; color:var(--navy); margin-bottom:2px">${_addNurseDemoPhoto ? 'Photo selected' : 'Upload a face photo'}</div>
              <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px">JPG, PNG, HEIC, WEBP · 5 MB max</div>
              <button class="btn btn-secondary btn-sm" data-action="and-pick-photo">${icon('upload',12)} ${_addNurseDemoPhoto ? 'Replace' : 'Choose photo'}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="add-nurse-mode" data-mode="choose">← Back</button>
        <button class="btn btn-brand" data-action="submit-add-nurse-demo">${icon('plus',14)} Add to pool</button>
      </div>
    </div>
  `;
}

function addNurseDocInviteHTML() {
  return `
    <div class="modal" style="max-width:600px">
      <div class="modal-head"><h3>${icon('mail',14)} Invite by license upload</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px">Upload their RN/LPN license. We'll generate a tokenized verification link and email it to them — they scan their face on their phone, the system 1:N matches it against the document photo, and the nurse appears verified in your pool.</p>
        <div class="form-row">
          <div class="field"><label>First name</label><input class="input" id="ani-first"></div>
          <div class="field"><label>Last name</label><input class="input" id="ani-last"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Email</label><input class="input" type="email" id="ani-email" placeholder="nurse@example.com"></div>
          <div class="field"><label>License type</label><select class="select" id="ani-lt"><option>RN</option><option>LPN</option></select></div>
        </div>
        <div class="field">
          <label>License document (front, photo visible)</label>
          <div style="display:flex; gap:14px; align-items:center; padding:14px; background:var(--surface-alt); border:1px dashed var(--border-strong); border-radius:10px">
            <div id="ani-doc-preview" style="width:90px; height:60px; border-radius:8px; background:var(--navy-50); color:var(--text-muted); display:grid; place-items:center; overflow:hidden; flex-shrink:0; ${window._aniDocPhoto ? `background-image:url('${window._aniDocPhoto}'); background-size:cover; background-position:center` : ''}">
              ${window._aniDocPhoto ? '' : icon('file',22)}
            </div>
            <div style="flex:1; min-width:0">
              <div style="font-size:13px; font-weight:600; color:var(--navy); margin-bottom:2px">${window._aniDocPhoto ? 'License uploaded' : 'Upload license image'}</div>
              <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px">PDF, JPG, PNG, HEIC · 8 MB max</div>
              <button class="btn btn-secondary btn-sm" data-action="ani-pick-doc">${icon('upload',12)} ${window._aniDocPhoto ? 'Replace' : 'Choose file'}</button>
            </div>
          </div>
        </div>
        <div style="background:var(--ocean-50); border-radius:10px; padding:12px 14px; font-size:12px; color:var(--navy); margin-top:8px">
          ${icon('shield',12)} <b>Privacy:</b> Document photo is only used to compute a face template for matching — never shared, never displayed to the parent.
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="add-nurse-mode" data-mode="choose">← Back</button>
        <button class="btn btn-brand" data-action="submit-add-nurse-doc-invite">${icon('mail',14)} Send invite link</button>
      </div>
    </div>
  `;
}

function addNurseFullHTML() {
  return `
    <div class="modal" style="max-width:720px">
      <div class="modal-head"><h3>${icon('shield',14)} Full biometric enrollment</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="field"><label>First name</label><input class="input" id="an-first"></div>
          <div class="field"><label>Last name</label><input class="input" id="an-last"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Email</label><input class="input" id="an-email"></div>
          <div class="field"><label>Phone</label><input class="input" id="an-phone"></div>
        </div>
        <div class="form-row-3">
          <div class="field"><label>License type</label><select class="select" id="an-lt"><option>RN</option><option>LPN</option></select></div>
          <div class="field"><label>License #</label><input class="input" id="an-ln"></div>
          <div class="field"><label>Years experience</label><input class="input" id="an-yrs" type="number" value="3"></div>
        </div>
        <div class="field">
          <label>Counties served</label>
          <div style="display:flex; flex-wrap:wrap; gap:4px">
            ${window.TNX.GA_COUNTIES.slice(0,10).map(c => `<label class="chip"><input type="checkbox" class="an-county" value="${c}" style="margin-right:4px">${c}</label>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Pediatric skills</label>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:4px">
            ${window.TNX.PED_SKILLS.slice(0,9).map(s => `<label class="chip"><input type="checkbox" class="an-skill" value="${s}" style="margin-right:4px">${s}</label>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="add-nurse-mode" data-mode="choose">← Back</button>
        <button class="btn btn-brand" data-action="submit-add-nurse">${icon('shield',14)} Start biometric enrollment</button>
      </div>
    </div>
  `;
}

function refreshAddNurseModal() {
  document.getElementById('modal-root').innerHTML = '';
  openModal(renderAddNurseModal());
}

function pickAddNurseDemoPhoto() {
  // Capture form values BEFORE we re-render
  const first = document.getElementById('and-first')?.value || '';
  const last = document.getElementById('and-last')?.value || '';
  const lt = document.getElementById('and-lt')?.value;
  const yrs = document.getElementById('and-yrs')?.value;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,.heic,.heif,.webp';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    document.body.removeChild(input);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Photo too large — 5 MB max', 'info'); return; }
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej;
      r.readAsDataURL(file);
    });
    _addNurseDemoPhoto = dataUrl;
    refreshAddNurseModal();
    // Restore form values after re-render
    setTimeout(() => {
      if (first) document.getElementById('and-first').value = first;
      if (last) document.getElementById('and-last').value = last;
      if (lt) document.getElementById('and-lt').value = lt;
      if (yrs) document.getElementById('and-yrs').value = yrs;
    }, 0);
  });
  input.click();
}

function submitAddNurseDemo() {
  const role = State.currentRole();
  const first = (document.getElementById('and-first')?.value || '').trim();
  const last = (document.getElementById('and-last')?.value || '').trim();
  const lt = document.getElementById('and-lt')?.value || 'RN';
  const yrs = parseInt(document.getElementById('and-yrs')?.value || '3', 10);
  if (!first || !last) { toast('First and last name required', 'info'); return; }
  closeModal();
  const n = {
    id: 'nr-' + Date.now().toString().slice(-4),
    first_name: first, last_name: last,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    phone: '(xxx) xxx-xxxx',
    license_type: lt,
    license_number: 'GA-DEMO-' + Math.floor(Math.random()*900000+100000),
    license_state: 'GA',
    bio: 'Added via demo bypass — biometric enrollment pending.',
    counties_served: ['Fulton'], languages: ['English'],
    years_experience: yrs, pediatrics_experience: Math.max(0, yrs - 1),
    status: 'active',
    skills: ['Medication Administration'],
    rate_per_hour: 38, shift_preferences: ['Day'],
    employment_type: 'W-2 Employee',
    primary_agency_id: role.agency_id,
    share_status: 'private', shared_with: [],
    compliance_status: 'incomplete',
    documents: window.TNX.DOC_TYPES.map(dt => ({ key: dt.key, label: dt.label, status: dt.required ? 'missing' : 'complete', expires: null, required: dt.required })),
    onboarded_on: new Date().toISOString(),
    last_active: new Date().toISOString(),
    rating: '5.0', completed_shifts: 0,
    verified_photo: _addNurseDemoPhoto || null,
    face_verified: false,
    face_match_score: null,
    enrollment_hash: null,
    demo_added: true
  };
  State.addNurse(n);
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Nurse', entity_name: fullName(n), action: 'demo-added · biometric pending' });
  _addNurseDemoPhoto = null;
  toast(`${fullName(n)} added (demo). Biometric enrollment pending.`, 'success');
  render();
}

function pickAddNurseInviteDoc() {
  // Capture form fields before re-render
  const first = document.getElementById('ani-first')?.value || '';
  const last = document.getElementById('ani-last')?.value || '';
  const email = document.getElementById('ani-email')?.value || '';
  const lt = document.getElementById('ani-lt')?.value;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,.heic,.heif,.webp,application/pdf';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    document.body.removeChild(input);
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast('File too large — 8 MB max', 'info'); return; }
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej;
      r.readAsDataURL(file);
    });
    window._aniDocPhoto = dataUrl;
    window._aniDocFile = { name: file.name, size: file.size, type: file.type };
    refreshAddNurseModal();
    setTimeout(() => {
      if (first) document.getElementById('ani-first').value = first;
      if (last) document.getElementById('ani-last').value = last;
      if (email) document.getElementById('ani-email').value = email;
      if (lt) document.getElementById('ani-lt').value = lt;
    }, 0);
  });
  input.click();
}

async function submitAddNurseDocInvite() {
  const role = State.currentRole();
  const first = (document.getElementById('ani-first')?.value || '').trim();
  const last = (document.getElementById('ani-last')?.value || '').trim();
  const email = (document.getElementById('ani-email')?.value || '').trim();
  const lt = document.getElementById('ani-lt')?.value || 'RN';
  if (!first || !last || !email) { toast('Name and email required', 'info'); return; }
  if (!window._aniDocPhoto) { toast('Upload the license document first', 'info'); return; }
  closeModal();
  let signature;
  try {
    signature = await Cryptiq.sign({
      action: `Invite ${first} ${last} via license upload`,
      purpose: 'Tokenized Cryptiq face-match link issued',
      subject: role.name
    });
  } catch { toast('Invite cancelled — signature required', 'info'); return; }
  // Generate the invite token + link
  const token = (crypto.getRandomValues(new Uint8Array(16))).reduce((s,b) => s + b.toString(16).padStart(2,'0'), '');
  const inviteLink = `${location.origin}${location.pathname.replace(/[^/]+$/, '')}invite.html#${token}`;
  // Stash the doc photo + invite metadata for the demo
  const pending = JSON.parse(localStorage.getItem('tnx.pending_invites') || '{}');
  pending[token] = {
    first, last, email, license_type: lt,
    doc_photo: window._aniDocPhoto,
    agency_id: role.agency_id,
    issued_by: role.name,
    issued_at: new Date().toISOString(),
    signature_hash: signature.hash
  };
  localStorage.setItem('tnx.pending_invites', JSON.stringify(pending));
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Nurse invite', entity_name: `${first} ${last}`, action: `tokenized link sent to ${email} · doc-only · biometric-signed · ${Cryptiq.shortHash(signature.hash)}` });
  window._aniDocPhoto = null;
  window._aniDocFile = null;
  // Show the invite-link confirmation modal so the demo viewer can copy/open it
  openModal(`
    <div class="modal" style="max-width:520px">
      <div class="modal-head"><h3>${icon('check',14)} Invite link issued</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <div style="background:rgba(22,163,74,0.08); border-left:3px solid var(--ok); padding:12px 14px; border-radius:8px; margin-bottom:14px; font-size:13px; color:var(--navy)">
          Email queued to <b>${email}</b>. They'll click the link, scan their face, and the system will 1:N match it to the document photo.
        </div>
        <div class="field">
          <label>Demo link (for testing)</label>
          <div style="display:flex; gap:6px">
            <input class="input" value="${inviteLink}" readonly id="invite-link-out" style="font-family:ui-monospace,monospace; font-size:11px">
            <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('invite-link-out').value); TNXComponents.toast('Link copied','success')">${icon('link',12)}</button>
          </div>
          <small style="display:block; margin-top:8px; color:var(--text-muted)">Open this link in a private window to act as the nurse and complete the face match.</small>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Done</button>
        <a class="btn btn-brand" href="${inviteLink}" target="_blank" rel="noopener">${icon('arrowRight',14)} Open as nurse</a>
      </div>
    </div>
  `);
}

async function submitAddNurse() {
  const role = State.currentRole();
  const first = document.getElementById('an-first').value || 'New';
  const last = document.getElementById('an-last').value || 'Nurse';
  const email = document.getElementById('an-email').value;
  const phone = document.getElementById('an-phone').value;
  const lt = document.getElementById('an-lt').value;
  const ln = document.getElementById('an-ln').value;
  const yrs = parseInt(document.getElementById('an-yrs').value || '3', 10);
  const counties = [...document.querySelectorAll('.an-county:checked')].map(x => x.value);
  const skills = [...document.querySelectorAll('.an-skill:checked')].map(x => x.value);

  // Close form and start Cryptiq secure enrollment
  closeModal();
  let enrollment;
  try {
    enrollment = await Cryptiq.enroll({ subject: `${first} ${last}` });
  } catch { toast('Enrollment cancelled — nurse not added', 'info'); return; }

  const n = {
    id: 'nr-' + Date.now().toString().slice(-4),
    first_name: first, last_name: last,
    email: email || `${first.toLowerCase()}@example.com`,
    phone: phone || '(xxx) xxx-xxxx',
    license_type: lt,
    license_number: ln || 'GA-NEW-000000',
    license_state: 'GA',
    bio: 'New to the platform — Identity-verified with verified face + document match.',
    counties_served: counties.length ? counties : ['Fulton'],
    languages: ['English'],
    years_experience: yrs,
    pediatrics_experience: 1,
    status: 'active',
    skills: skills.length ? skills : ['Medication Administration'],
    rate_per_hour: 38,
    shift_preferences: ['Day'],
    employment_type: 'W-2 Employee',
    primary_agency_id: role.agency_id,
    share_status: 'private',
    shared_with: [],
    compliance_status: 'incomplete',
    documents: window.TNX.DOC_TYPES.map(dt => ({ key: dt.key, label: dt.label, status: dt.required ? 'missing' : 'complete', expires: null, required: dt.required })),
    onboarded_on: new Date().toISOString(),
    last_active: new Date().toISOString(),
    rating: '5.0',
    completed_shifts: 0,
    verified_photo: enrollment.livePhoto,
    face_verified: true,
    face_match_score: enrollment.matchScore,
    enrollment_hash: enrollment.hash
  };
  State.addNurse(n);
  Cryptiq.markEnrolled(n.id, {
    photo: enrollment.livePhoto,
    doc_photo: enrollment.docPhoto,
    match_score: enrollment.matchScore,
    hash: enrollment.hash
  });
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Nurse', entity_name: fullName(n), action: `Identity-verified · face match ${(enrollment.matchScore*100).toFixed(1)}% · ${Cryptiq.shortHash(enrollment.hash)}` });
  toast(`${fullName(n)} enrolled with verified biometric. Upload remaining credentials to activate.`, 'success');
  render();
}

// Meet & greet scheduling state (mutated in place — never reassigned)
const meetCtx = { caseId: null, nurseId: null, date: null, time: null, mode: 'Virtual (Zoom)' };
function resetMeetCtx(caseId, nurseId) {
  meetCtx.caseId = caseId || null;
  meetCtx.nurseId = nurseId || null;
  meetCtx.date = null;
  meetCtx.time = null;
  meetCtx.mode = 'Virtual (Zoom)';
}
function scheduleMeetModal(caseId, nurseId) {
  resetMeetCtx(caseId, nurseId);
  return renderMeetModal();
}
function renderMeetModal() {
  const today = new Date(); today.setHours(0,0,0,0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthDays = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  const startWeekday = monthStart.getDay();
  const days = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= monthDays; d++) days.push(d);

  const role = State.currentRole();
  const cases = role.id === 'parent'
    ? State.getCases().filter(c => c.parent_id === role.user_id)
    : State.getCases().filter(c => c.agency_id === role.agency_id);
  const selCase = meetCtx.caseId ? State.getCase(meetCtx.caseId) : null;
  const shortlisted = selCase ? State.getMatches(selCase.id).filter(m => ['shortlisted','suggested'].includes(m.status)).slice(0, 8) : [];

  const slots = ['9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:30 PM'];
  const ready = meetCtx.caseId && meetCtx.nurseId && meetCtx.date && meetCtx.time;

  return `
    <div class="modal" style="max-width:760px">
      <div class="modal-head"><h3>Schedule meet & greet</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="field"><label>Case</label>
            <select class="select" data-meet-field="caseId">
              <option value="">Select a case…</option>
              ${cases.map(c => `<option value="${c.id}" ${meetCtx.caseId===c.id?'selected':''}>${c.child_alias} · ${c.county}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Nurse</label>
            <select class="select" data-meet-field="nurseId" ${!selCase?'disabled':''}>
              <option value="">${selCase ? 'Select a nurse…' : 'Pick a case first'}</option>
              ${shortlisted.map(m => { const n = State.getNurse(m.nurse_id); return `<option value="${n.id}" ${meetCtx.nurseId===n.id?'selected':''}>${fullName(n)} (${m.score}% match)</option>`; }).join('')}
            </select>
          </div>
        </div>
        <div class="field"><label>Mode</label>
          <select class="select" data-meet-field="mode">
            <option ${meetCtx.mode==='Virtual (Zoom)'?'selected':''}>Virtual (Zoom)</option>
            <option ${meetCtx.mode==='In-person'?'selected':''}>In-person</option>
            <option ${meetCtx.mode==='Phone'?'selected':''}>Phone</option>
          </select>
        </div>
        <div class="cal" style="background:var(--surface-alt)">
          <div class="month-head"><b>${today.toLocaleString('en-US',{month:'long',year:'numeric'})}</b> <small style="color:var(--text-muted)">Select an available day</small></div>
          <div class="cal-grid">
            ${['S','M','T','W','T','F','S'].map(d => `<div class="cal-day-label">${d}</div>`).join('')}
            ${days.map(d => {
              if (!d) return `<div></div>`;
              const date = new Date(today.getFullYear(), today.getMonth(), d);
              const iso = date.toISOString().slice(0,10);
              const isToday = d === today.getDate();
              const past = date < today;
              const selected = meetCtx.date === iso;
              return `<div class="cal-day ${isToday?'today':''} ${past?'muted':''} ${selected?'selected':''}" ${past?'':`data-action="pick-meet-day" data-date="${iso}"`}>${d}</div>`;
            }).join('')}
          </div>
        </div>
        <div class="timeslot-grid">
          ${slots.map(s => `<div class="timeslot ${meetCtx.time===s?'selected':''} ${!meetCtx.date?'booked':''}" ${meetCtx.date ? `data-action="pick-meet-slot" data-time="${s}"` : ''}>${s}</div>`).join('')}
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        <button class="btn btn-brand ${ready?'':'disabled'}" data-action="submit-meet">${icon('calendar',14)} Confirm meeting</button>
      </div>
    </div>
  `;
}
function refreshMeetModal() {
  document.getElementById('modal-root').innerHTML = '';
  openModal(renderMeetModal());
}
function pickMeetDay(date) { meetCtx.date = date; refreshMeetModal(); }
function pickMeetSlot(time) { meetCtx.time = time; refreshMeetModal(); }
function submitMeet() {
  if (!meetCtx.caseId || !meetCtx.nurseId || !meetCtx.date || !meetCtx.time) return;
  const c = State.getCase(meetCtx.caseId);
  const n = State.getNurse(meetCtx.nurseId);
  const [h, mm] = (() => {
    const [hm, ap] = meetCtx.time.split(' ');
    let [hh, m] = hm.split(':').map(Number);
    if (ap === 'PM' && hh < 12) hh += 12;
    if (ap === 'AM' && hh === 12) hh = 0;
    return [hh, m];
  })();
  const [yy, mo, dd] = meetCtx.date.split('-').map(Number);
  const dt = new Date(yy, mo - 1, dd, h, mm, 0, 0);
  const meet = {
    id: 'mg-' + Date.now().toString().slice(-4),
    case_id: c.id, nurse_id: n.id, parent_id: c.parent_id,
    scheduled_at: dt.toISOString(),
    mode: meetCtx.mode, status: 'scheduled',
    parent_feedback: null, agency_feedback: null
  };
  State.addMeet(meet);
  State.updateMatchStatus(c.id, n.id, 'shortlisted');
  State.logAudit({ actor: State.currentRole().name, actor_role: State.currentRole().label, entity: 'Meet & Greet', entity_name: `${fullName(n)} ↔ ${c.child_alias}`, action: 'scheduled' });
  closeModal();
  toast(`Meet & greet scheduled for ${fmtDateTime(meet.scheduled_at)}`, 'success');
  render();
}

function meetDrawer(id) {
  const m = State.getMeets().find(x => x.id === id);
  if (!m) return '';
  const n = State.getNurse(m.nurse_id);
  const c = State.getCase(m.case_id);
  const p = State.getParent(m.parent_id);
  return `
    <div class="drawer-head"><h3>Meet & greet</h3><button class="modal-close" data-action="close-drawer">${icon('x',16)}</button></div>
    <div class="drawer-body">
      <div style="display:flex; gap:14px; margin-bottom:20px">
        <div class="av av-lg">${initials(fullName(n))}</div>
        <div>
          <div style="font-weight:700; color:var(--navy); font-size:16px">${fullName(n)} ↔ ${c.child_alias}</div>
          <div style="font-size:13px; color:var(--text-muted)">${fmtDateTime(m.scheduled_at)} · ${m.mode}</div>
          <div style="margin-top:6px">${m.status==='scheduled'?badge('Scheduled','info'):badge('Completed','ok')}</div>
        </div>
      </div>
      <div class="card"><h3 style="margin-bottom:8px">Participants</h3>
        <div style="display:flex; flex-direction:column; gap:8px">
          <div class="row"><div class="av">${initials(fullName(n))}</div><div><b>${fullName(n)}</b><div style="font-size:11px; color:var(--text-muted)">${n.license_type} · ${n.years_experience}y exp</div></div></div>
          <div class="row"><div class="av">${p ? initials(p.name) : 'P'}</div><div><b>${p?.name || 'Parent'}</b><div style="font-size:11px; color:var(--text-muted)">${p?.email || '—'}</div></div></div>
          <div class="row"><div class="av">${initials(State.currentRole().name)}</div><div><b>${State.currentRole().name}</b><div style="font-size:11px; color:var(--text-muted)">${State.currentRole().label}</div></div></div>
        </div>
      </div>
      <div class="divider"></div>
      <h3 style="margin-bottom:10px">Meeting link</h3>
      <div class="card-sm" style="border:1px dashed var(--border-strong); text-align:center; padding:20px">
        ${icon('video',22)}
        <div style="margin-top:8px; font-size:13px; font-weight:600; color:var(--navy)">meet.tnx.example/${m.id}</div>
        <small>Secure, HIPAA-conscious video. Agency-recorded for compliance.</small>
      </div>
    </div>
    <div class="drawer-foot">
      <button class="btn btn-ghost" data-action="close-drawer">Close</button>
      <button class="btn btn-brand">${icon('video',14)} Join meeting</button>
    </div>
  `;
}

function sendMsg(threadId) {
  const input = document.getElementById('msg-input');
  if (!input || !input.value.trim()) return;
  State.addMessageToThread(threadId, { from: 'me', from_name: State.currentRole().name, body: input.value.trim(), at: new Date().toISOString(), mine: true });
  input.value = '';
  render();
  setTimeout(() => {
    // Simulate reply for demo feel
    const replies = ['Got it, thanks!', 'Sounds good — I\'ll follow up.', 'Yes, we can make that work.', 'Confirmed.'];
    State.addMessageToThread(threadId, { from: 'them', from_name: 'Tiana Johnson', body: replies[Math.floor(Math.random()*replies.length)], at: new Date().toISOString(), mine: false });
    render();
  }, 1400);
}

async function verifyAgency(id) {
  const a = State.getAgency(id);
  try {
    await Cryptiq.sign({
      action: `Verify agency: ${a.name}`,
      purpose: 'Platform onboarding · grants GAPP network access'
    });
  } catch { toast('Approval cancelled', 'info'); return; }
  State.updateAgency(id, { status: 'verified' });
  State.logAudit({ actor: 'Platform Admin', actor_role: 'Super Admin', entity: 'Agency', entity_name: a.name, action: 'approved · biometric-signed' });
  toast(`${a.name} approved`, 'success');
  render();
}

function requestFromPool(caseId) {
  toast('Request broadcast to 3 partner agencies — alerts sent.', 'success');
  State.logAudit({ actor: State.currentRole().name, actor_role: State.currentRole().label, entity: 'Cross-agency Request', entity_name: State.getCase(caseId).child_alias, action: 'broadcast to partner network' });
}

async function acceptOpp(caseId) {
  const role = State.currentRole();
  const n = State.getNurse(role.user_id);
  const c = State.getCase(caseId);
  try {
    await Cryptiq.sign({
      action: `Accept assignment: ${c.child_alias}`,
      purpose: 'Binding clinical commitment · agency supervision applies',
      subject: fullName(n)
    });
  } catch { toast('Acceptance cancelled', 'info'); return; }
  State.updateMatchStatus(caseId, n.id, 'accepted');
  State.logAudit({ actor: fullName(n), actor_role: 'Nurse', entity: 'Opportunity', entity_name: c.child_alias, action: 'accepted · biometric-signed' });
  toast('Opportunity accepted. Agency will confirm next steps.', 'success');
  render();
}

function parentBookModal(nurseId, caseId) {
  resetMeetCtx(caseId, nurseId);
  return renderMeetModal();
}

async function handleParentFeedback(meetId, fb) {
  const m = State.getMeets().find(x => x.id === meetId);
  if (!m) return;
  const n = State.getNurse(m.nurse_id);
  const c = State.getCase(m.case_id);
  const fbLabel = fb === 'good_fit' ? 'Good fit' : fb === 'maybe' ? 'Maybe' : 'Not a fit';
  try {
    await Cryptiq.sign({
      action: `Meet feedback: ${fbLabel} for ${fullName(n)}`,
      purpose: `Parent decision · ${c.child_alias}`,
      subject: State.currentRole().name
    });
  } catch { toast('Feedback cancelled — signature required', 'info'); return; }
  State.updateMeet(meetId, { parent_feedback: fb });
  if (fb === 'good_fit') {
    State.updateMatchStatus(c.id, n.id, 'accepted');
  }
  State.logAudit({ actor: State.currentRole().name, actor_role: State.currentRole().label, entity: 'Meet & Greet', entity_name: `${fullName(n)} ↔ ${c.child_alias}`, action: `parent feedback: ${fbLabel} · biometric-signed` });
  toast(`Feedback saved: ${fbLabel}`, 'success');
  render();
}

function handleMsgParentAgency() {
  const role = State.currentRole();
  const parent = State.getParent(role.user_id);
  toast(`Opening conversation with ${State.getAgency(parent.agency_id).name}`, 'info');
  Views.activeThread = State.getThreads()[0]?.id;
  location.hash = '#/messages';
}

// =========================================================
// Availability editor — 14-day grid with Day / Night / Off cycle
// =========================================================
const _availCtx = { days: {}, nurseId: null };
const AVAIL_CYCLE = ['off', 'day', 'night', 'either'];
const AVAIL_LABEL = { off: 'Off', day: 'Day', night: 'Night', either: 'Any' };

function availabilityModal() {
  const role = State.currentRole();
  const n = State.getNurse(role.user_id);
  _availCtx.nurseId = n?.id || null;
  _availCtx.days = { ...(n?.availability || {}) };
  return renderAvailabilityModal();
}

function renderAvailabilityModal() {
  const today = new Date(); today.setHours(0,0,0,0);
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0,10);
    days.push({ iso, d, label: d.toLocaleDateString('en-US', { weekday: 'short' }), num: d.getDate() });
  }
  const set = Object.values(_availCtx.days).filter(v => v && v !== 'off').length;
  return `
    <div class="modal" style="max-width:560px">
      <div class="modal-head">
        <h3>${icon('calendar',14)} Update availability</h3>
        <button class="modal-close" data-action="close-modal">${icon('x',16)}</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px">
          Tap each day to cycle: <b>Off → Day → Night → Any → Off</b>. Agencies match you against open shifts using this calendar — biometric-signed when you save.
        </p>
        <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:6px; margin-bottom:14px">
          ${days.map(x => {
            const v = _availCtx.days[x.iso] || 'off';
            const colorMap = { off: 'background:var(--surface-alt); color:var(--text-muted)', day: 'background:var(--ocean-50); color:var(--ocean-600); border-color:var(--ocean)', night: 'background:#1F2D4F; color:#A4D6FF; border-color:#3D5BAB', either: 'background:linear-gradient(135deg,var(--teal-50),var(--ocean-50)); color:var(--navy); border-color:var(--teal)' };
            return `
              <button class="avail-day" data-action="cycle-avail-day" data-date="${x.iso}"
                style="padding:10px 4px; border:1.5px solid var(--border); border-radius:10px; cursor:pointer; text-align:center; ${colorMap[v]}; min-height:64px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px">
                <div style="font-size:10px; font-weight:600; opacity:0.7">${x.label}</div>
                <div style="font-size:16px; font-weight:800">${x.num}</div>
                <div style="font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase">${AVAIL_LABEL[v]}</div>
              </button>
            `;
          }).join('')}
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; font-size:11px; color:var(--text-muted)">
          <span style="display:inline-flex; align-items:center; gap:6px"><span style="width:10px; height:10px; border-radius:3px; background:var(--ocean-50); border:1px solid var(--ocean)"></span> Day</span>
          <span style="display:inline-flex; align-items:center; gap:6px"><span style="width:10px; height:10px; border-radius:3px; background:#1F2D4F; border:1px solid #3D5BAB"></span> Night</span>
          <span style="display:inline-flex; align-items:center; gap:6px"><span style="width:10px; height:10px; border-radius:3px; background:linear-gradient(135deg,var(--teal-50),var(--ocean-50)); border:1px solid var(--teal)"></span> Any</span>
          <span style="display:inline-flex; align-items:center; gap:6px"><span style="width:10px; height:10px; border-radius:3px; background:var(--surface-alt); border:1px solid var(--border)"></span> Off</span>
        </div>
      </div>
      <div class="modal-foot">
        <span style="margin-right:auto; font-size:12px; color:var(--text-muted)">${set} of 14 days set</span>
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        <button class="btn btn-brand" data-action="save-availability">${icon('check',14)} Save & sign</button>
      </div>
    </div>
  `;
}

function cycleAvailDay(date) {
  const cur = _availCtx.days[date] || 'off';
  const idx = AVAIL_CYCLE.indexOf(cur);
  _availCtx.days[date] = AVAIL_CYCLE[(idx + 1) % AVAIL_CYCLE.length];
  document.getElementById('modal-root').innerHTML = '';
  openModal(renderAvailabilityModal());
}

async function saveAvailability() {
  const role = State.currentRole();
  const n = State.getNurse(_availCtx.nurseId);
  closeModal();
  let signature;
  try {
    signature = await Cryptiq.sign({
      action: 'Update availability calendar',
      purpose: 'Binding 14-day availability commitment',
      subject: fullName(n)
    });
  } catch { toast('Save cancelled — signature required', 'info'); return; }
  State.updateNurse(n.id, { availability: _availCtx.days, availability_signed_hash: signature.hash, availability_signed_at: signature.at });
  const setCount = Object.values(_availCtx.days).filter(v => v && v !== 'off').length;
  State.logAudit({ actor: fullName(n), actor_role: 'Nurse', entity: 'Availability', entity_name: `${setCount} days set`, action: `availability updated · biometric-signed · ${Cryptiq.shortHash(signature.hash)}` });
  toast('Availability saved & signed', 'success');
  render();
}

// =========================================================
// Credential uploader — real file picker, base64 store, multi-format
// =========================================================
const ACCEPTED_DOC_TYPES = '.pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,.docx,.doc,.tif,.tiff,application/pdf,image/*,.gif';

function triggerDocUpload(docKey) {
  const role = State.currentRole();
  if (role.id !== 'nurse') { toast('Only nurses can upload their own credentials', 'info'); return; }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = ACCEPTED_DOC_TYPES;
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    document.body.removeChild(input);
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast('File too large — 8 MB max for demo', 'info'); return; }
    await handleDocUpload(file, docKey);
  });
  input.click();
}

async function handleDocUpload(file, docKey) {
  const role = State.currentRole();
  const n = State.getNurse(role.user_id);
  if (!n) { toast('Nurse profile not found', 'info'); return; }
  // Read file
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  // Hash for audit
  const arr = await file.arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', arr);
  const hashHex = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2,'0')).join('');

  // Biometric sign the upload
  let signature;
  try {
    signature = await Cryptiq.sign({
      action: `Upload credential: ${docKey || file.name}`,
      purpose: 'Compliance attestation · GAPP credential record',
      subject: fullName(n)
    });
  } catch { toast('Upload cancelled — signature required', 'info'); return; }

  // Update doc in nurse's documents array
  const existing = (n.documents || []).slice();
  const docTypeMeta = (window.TNX.DOC_TYPES || []).find(d => d.key === docKey);
  const expiresIn = docTypeMeta?.required ? 365 : 730;
  const expires = new Date(Date.now() + expiresIn * 86400000).toISOString();
  const newDoc = {
    key: docKey || ('upload-' + Date.now()),
    label: docTypeMeta?.label || file.name,
    status: 'complete',
    expires,
    required: docTypeMeta?.required || false,
    file_name: file.name,
    file_type: file.type || 'application/octet-stream',
    file_size: file.size,
    file_hash: hashHex,
    file_data: dataUrl,
    uploaded_at: new Date().toISOString(),
    signature_hash: signature.hash
  };
  const idx = existing.findIndex(d => d.key === newDoc.key);
  if (idx >= 0) existing[idx] = newDoc; else existing.push(newDoc);

  // Recompute compliance status
  const required = existing.filter(d => d.required);
  const incomplete = required.some(d => d.status !== 'complete');
  const expiringSoon = existing.some(d => {
    if (!d.expires) return false;
    return (new Date(d.expires) - Date.now()) < 30 * 86400000;
  });
  const status = incomplete ? 'incomplete' : expiringSoon ? 'expiring' : 'complete';
  State.updateNurse(n.id, { documents: existing, compliance_status: status });
  State.logAudit({ actor: fullName(n), actor_role: 'Nurse', entity: 'Credential', entity_name: newDoc.label, action: `uploaded ${(file.size/1024).toFixed(0)}KB · sha256:${hashHex.slice(0,12)} · biometric-signed` });
  toast(`${newDoc.label} uploaded & signed`, 'success');
  render();
}

function removeDoc(docKey) {
  const role = State.currentRole();
  const n = State.getNurse(role.user_id);
  if (!n) return;
  const existing = (n.documents || []).map(d => {
    if (d.key !== docKey) return d;
    const cleared = { ...d, status: 'missing', file_data: null, file_name: null, file_size: null, expires: null };
    return cleared;
  });
  State.updateNurse(n.id, { documents: existing, compliance_status: 'incomplete' });
  State.logAudit({ actor: fullName(n), actor_role: 'Nurse', entity: 'Credential', entity_name: docKey, action: 'removed' });
  toast('Credential removed', 'info');
  render();
}

// =========================================================
// Admin purge — hard wipe of demo state with biometric confirm
// =========================================================
function adminPurgeModal() {
  return `
    <div class="modal" style="max-width:560px">
      <div class="modal-head"><h3>${icon('alert',14)} Reset demo data</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px">Choose how much to reset. Both require a biometric signature.</p>
        <div style="display:grid; grid-template-columns:1fr; gap:10px">
          <button class="role-card" style="text-align:left; flex-direction:row; align-items:center; gap:14px; padding:16px" data-action="admin-purge-soft">
            <div class="badge-ico" style="background:linear-gradient(135deg,var(--ocean),var(--teal))">${icon('ripple',18)}</div>
            <div style="flex:1; min-width:0">
              <h4 style="margin-bottom:2px">Remove demo additions only</h4>
              <div class="persona">Keeps the seed (8 cases, 48 nurses, original meets). Removes anything you or the simulation added — extra cases, demo nurses, simulated meets, uploaded files, signatures.</div>
            </div>
            ${icon('chevronRight',16)}
          </button>
          <button class="role-card" style="text-align:left; flex-direction:row; align-items:center; gap:14px; padding:16px; border-color:rgba(225,87,89,0.4)" data-action="admin-purge-full">
            <div class="badge-ico" style="background:linear-gradient(135deg,#e15759,#a31e1f)">${icon('alert',18)}</div>
            <div style="flex:1; min-width:0">
              <h4 style="margin-bottom:2px; color:var(--err)">Wipe everything</h4>
              <div class="persona">Full reset — clears all overlay state, signatures, enrollments, uploaded credentials, and the display name. The page will reload back to the original seed data.</div>
            </div>
            ${icon('chevronRight',16)}
          </button>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
      </div>
    </div>
  `;
}

function adminPurgeFullConfirmModal() {
  return `
    <div class="modal" style="max-width:480px">
      <div class="modal-head"><h3>${icon('alert',14)} Wipe everything</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <div style="background:rgba(225,87,89,0.08); border-left:3px solid var(--err); padding:12px 14px; border-radius:8px; color:#7a1e1e; font-size:13px; margin-bottom:14px">
          <b>Destructive.</b> Page will reload back to seed.
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:8px">Type <code style="background:var(--surface-alt); padding:2px 6px; border-radius:4px">PURGE</code> to confirm.</p>
        <input class="input" id="purge-confirm-input" placeholder="PURGE" style="text-transform:uppercase; letter-spacing:0.1em; font-weight:700">
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        <button class="btn btn-danger" data-action="admin-purge-confirm">${icon('alert',14)} Wipe & sign</button>
      </div>
    </div>
  `;
}

async function adminPurgeSoft() {
  const role = State.currentRole();
  if (role.id !== 'super_admin') { toast('Only platform admin can purge', 'info'); return; }
  closeModal();
  try {
    await Cryptiq.sign({
      action: 'Remove demo additions',
      purpose: 'Soft reset — preserves seed, drops user-added entities',
      subject: role.name
    });
  } catch { toast('Reset cancelled — signature required', 'info'); return; }
  const before = { nurses: State.getNurses().length, cases: State.getCases().length, meets: State.getMeets().length };
  State.purgeDemoAdditions();
  const after = { nurses: State.getNurses().length, cases: State.getCases().length, meets: State.getMeets().length };
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Demo reset', entity_name: 'soft', action: `removed ${before.nurses - after.nurses} nurses, ${before.cases - after.cases} cases, ${before.meets - after.meets} meets` });
  toast(`Restored to seed · removed ${(before.nurses - after.nurses) + (before.cases - after.cases) + (before.meets - after.meets)} demo additions`, 'success');
  render();
}

async function adminPurgeConfirm() {
  const role = State.currentRole();
  if (role.id !== 'super_admin') { toast('Only the platform admin can purge', 'info'); return; }
  const v = (document.getElementById('purge-confirm-input')?.value || '').trim().toUpperCase();
  if (v !== 'PURGE') { toast('Type PURGE to confirm', 'info'); return; }
  closeModal();
  try {
    await Cryptiq.sign({
      action: 'Purge all demo data',
      purpose: 'Platform-admin destructive action · cannot be undone',
      subject: role.name
    });
  } catch { toast('Purge cancelled — signature required', 'info'); return; }
  State.reset();
  // Wipe Cryptiq stores too
  try { localStorage.removeItem('tnx.cryptiq.v1'); } catch {}
  try { localStorage.removeItem('tnx.demo.displayName'); } catch {}
  try { sessionStorage.removeItem('tnx.cq.gatePassed'); } catch {}
  toast('All demo data purged. Reloading…', 'success');
  setTimeout(() => location.reload(), 700);
}

// =========================================================
// Stub-buttons → real handlers
// =========================================================
function inviteParentModal(caseId) {
  const c = State.getCase(caseId);
  return `
    <div class="modal" style="max-width:520px">
      <div class="modal-head"><h3>Invite parent for ${c.child_alias}</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px">They'll receive a secure onboarding link to view shortlisted nurses, book meet & greets, and approve placement.</p>
        <div class="field"><label>Parent / Guardian name</label><input class="input" id="ip-name" placeholder="Jane Carter"></div>
        <div class="form-row">
          <div class="field"><label>Email</label><input class="input" id="ip-email" type="email" placeholder="parent@example.com"></div>
          <div class="field"><label>Phone</label><input class="input" id="ip-phone" placeholder="(404) 555-0000"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        <button class="btn btn-brand" data-action="submit-invite-parent" data-case="${caseId}">${icon('mail',14)} Send invite</button>
      </div>
    </div>
  `;
}
async function submitInviteParent(caseId) {
  const role = State.currentRole();
  const name = document.getElementById('ip-name')?.value?.trim();
  const email = document.getElementById('ip-email')?.value?.trim();
  const phone = document.getElementById('ip-phone')?.value?.trim();
  if (!name || !email) { toast('Name and email required', 'info'); return; }
  closeModal();
  let signature;
  try {
    signature = await Cryptiq.sign({
      action: `Invite parent: ${name}`,
      purpose: `${State.getCase(caseId).child_alias} placement onboarding`,
      subject: role.name
    });
  } catch { toast('Invite cancelled — signature required', 'info'); return; }
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Parent invite', entity_name: name, action: `invited to ${State.getCase(caseId).child_alias} · ${email} · biometric-signed · ${Cryptiq.shortHash(signature.hash)}` });
  toast(`Invite sent to ${name} (${email})`, 'success');
}

function triggerBulkUpload() {
  const role = State.currentRole();
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,.docx,.tif,.tiff,application/pdf,image/*';
  input.multiple = true;
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', async () => {
    const files = Array.from(input.files || []);
    document.body.removeChild(input);
    if (!files.length) return;
    let signature;
    try {
      signature = await Cryptiq.sign({
        action: `Bulk upload ${files.length} compliance documents`,
        purpose: 'Agency compliance batch · GAPP audit record',
        subject: role.name
      });
    } catch { toast('Bulk upload cancelled', 'info'); return; }
    State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Compliance batch', entity_name: `${files.length} files`, action: `bulk uploaded · ${(files.reduce((a,f)=>a+f.size,0)/1024/1024).toFixed(1)}MB · biometric-signed · ${Cryptiq.shortHash(signature.hash)}` });
    toast(`${files.length} document${files.length===1?'':'s'} uploaded & signed`, 'success');
  });
  input.click();
}

async function sendRenewalReminders() {
  const role = State.currentRole();
  const expiring = State.getNurses()
    .filter(n => n.primary_agency_id === role.agency_id || (n.shared_with || []).includes(role.agency_id))
    .filter(n => n.documents.some(d => d.status === 'expiring' || (d.expires && (new Date(d.expires) - Date.now()) < 30 * 86400000)));
  if (!expiring.length) { toast('No nurses with expiring credentials', 'info'); return; }
  let signature;
  try {
    signature = await Cryptiq.sign({
      action: `Send renewal reminders to ${expiring.length} nurses`,
      purpose: 'Compliance outreach · GAPP renewal cadence',
      subject: role.name
    });
  } catch { toast('Send cancelled', 'info'); return; }
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Renewal outreach', entity_name: `${expiring.length} nurses`, action: `email reminders sent · biometric-signed · ${Cryptiq.shortHash(signature.hash)}` });
  toast(`Reminders queued for ${expiring.length} nurses`, 'success');
}

function newMessageModal() {
  const role = State.currentRole();
  const recipients = role.id === 'parent'
    ? [{ id: 'agency', label: 'My agency care coordinator' }]
    : role.id === 'nurse'
      ? [{ id: 'agency', label: 'My agency' }]
      : State.getNurses().filter(n => n.primary_agency_id === role.agency_id || (n.shared_with || []).includes(role.agency_id)).slice(0, 12).map(n => ({ id: n.id, label: fullName(n) + ' · ' + n.license_type }));
  return `
    <div class="modal" style="max-width:520px">
      <div class="modal-head"><h3>New message</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <div class="field"><label>To</label>
          <select class="select" id="nm-to">
            ${recipients.map(r => `<option value="${r.id}">${r.label}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Message</label><textarea class="textarea" id="nm-body" rows="5" placeholder="Type your message…"></textarea></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        <button class="btn btn-brand" data-action="send-new-message">${icon('send',14)} Send</button>
      </div>
    </div>
  `;
}
function submitNewMessage() {
  const role = State.currentRole();
  const to = document.getElementById('nm-to')?.value;
  const body = document.getElementById('nm-body')?.value?.trim();
  if (!body) { toast('Message body is empty', 'info'); return; }
  closeModal();
  const thread = State.getThreads()[0];
  if (thread) {
    State.addMessageToThread(thread.id, { from: 'me', from_name: role.name, body, at: new Date().toISOString(), mine: true });
    Views.activeThread = thread.id;
  }
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Message', entity_name: 'New thread', action: `sent to ${to}` });
  toast('Message sent', 'success');
  location.hash = '#/messages';
}

function addPartnerModal() {
  const role = State.currentRole();
  const myId = role.agency_id;
  const me = State.getAgency(myId);
  const others = State.getAgencies().filter(a => a.id !== myId && !me.share_partners.includes(a.id));
  return `
    <div class="modal" style="max-width:520px">
      <div class="modal-head"><h3>Add partner agency</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px">Partner agencies share their nurse pool with you. Cross-agency placement is logged + biometrically signed by both parties.</p>
        ${others.length === 0 ? '<small style="color:var(--text-muted)">No agencies available to partner with.</small>' :
          others.map(a => `
            <div style="display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--border); border-radius:8px; margin-bottom:8px; cursor:pointer" data-action="confirm-add-partner" data-id="${a.id}">
              <div class="av">${initials(a.name)}</div>
              <div style="flex:1">
                <div style="font-weight:600; color:var(--navy); font-size:13px">${a.name}</div>
                <div style="font-size:11px; color:var(--text-muted)">${a.counties.slice(0,3).join(', ')} · ${a.status}</div>
              </div>
              ${icon('chevronRight',14)}
            </div>
          `).join('')}
      </div>
    </div>
  `;
}
async function confirmAddPartner(partnerId) {
  const role = State.currentRole();
  const me = State.getAgency(role.agency_id);
  const partner = State.getAgency(partnerId);
  closeModal();
  try {
    await Cryptiq.sign({
      action: `Partner with ${partner.name}`,
      purpose: 'Cross-agency nurse pool sharing agreement',
      subject: role.name
    });
  } catch { toast('Partnership cancelled', 'info'); return; }
  const partners = [...(me.share_partners || []), partnerId];
  State.updateAgency(role.agency_id, { share_partners: partners });
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Partner agency', entity_name: partner.name, action: 'added · cross-agency sharing enabled · biometric-signed' });
  toast(`${partner.name} added as partner`, 'success');
  render();
}

function inviteTeamModal() {
  return `
    <div class="modal" style="max-width:520px">
      <div class="modal-head"><h3>Invite team member</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="field"><label>Name</label><input class="input" id="it-name" placeholder="Full name"></div>
          <div class="field"><label>Email</label><input class="input" id="it-email" type="email"></div>
        </div>
        <div class="field"><label>Role</label>
          <select class="select" id="it-role">
            <option value="agency_admin">Agency Admin</option>
            <option value="recruiter">Recruiter / Scheduler</option>
            <option value="compliance">Compliance Lead</option>
          </select>
        </div>
        <p style="color:var(--text-muted); font-size:12px">They'll receive a Cryptiq enrollment link. Their first sign-in captures biometric + ID match before any actions.</p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        <button class="btn btn-brand" data-action="submit-invite-team">${icon('mail',14)} Send invite</button>
      </div>
    </div>
  `;
}
async function submitInviteTeam() {
  const role = State.currentRole();
  const name = document.getElementById('it-name')?.value?.trim();
  const email = document.getElementById('it-email')?.value?.trim();
  const r = document.getElementById('it-role')?.value;
  if (!name || !email) { toast('Name and email required', 'info'); return; }
  closeModal();
  let signature;
  try {
    signature = await Cryptiq.sign({
      action: `Invite ${name} as ${r}`,
      purpose: 'Team onboarding · grants agency-scoped access',
      subject: role.name
    });
  } catch { toast('Invite cancelled', 'info'); return; }
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Team invite', entity_name: name, action: `${r} invited · ${email} · biometric-signed · ${Cryptiq.shortHash(signature.hash)}` });
  toast(`${name} invited as ${r}`, 'success');
}

function addAgencyModal() {
  return `
    <div class="modal" style="max-width:560px">
      <div class="modal-head"><h3>Add new agency</h3><button class="modal-close" data-action="close-modal">${icon('x',16)}</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="field"><label>Agency name</label><input class="input" id="aa-name" placeholder="Peach State Pediatric"></div>
          <div class="field"><label>Status</label>
            <select class="select" id="aa-status"><option value="pending">Pending verification</option><option value="verified">Verified</option></select>
          </div>
        </div>
        <div class="form-row">
          <div class="field"><label>GA Home Care License</label><input class="input" id="aa-license" placeholder="GA-HCS-XXXXX"></div>
          <div class="field"><label>Medicaid Provider ID</label><input class="input" id="aa-medicaid" placeholder="GA-MCD-XXXXXXX"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        <button class="btn btn-brand" data-action="submit-add-agency">${icon('plus',14)} Add agency</button>
      </div>
    </div>
  `;
}
async function submitAddAgency() {
  const role = State.currentRole();
  const name = document.getElementById('aa-name')?.value?.trim();
  const status = document.getElementById('aa-status')?.value;
  const license = document.getElementById('aa-license')?.value?.trim();
  const medicaid = document.getElementById('aa-medicaid')?.value?.trim();
  if (!name) { toast('Agency name required', 'info'); return; }
  closeModal();
  let signature;
  try {
    signature = await Cryptiq.sign({
      action: `Add agency: ${name}`,
      purpose: 'Platform-admin agency onboarding',
      subject: role.name
    });
  } catch { toast('Add cancelled', 'info'); return; }
  const a = {
    id: 'ag-' + Date.now().toString().slice(-4),
    name,
    legal_name: name,
    status: status || 'pending',
    license_number: license || 'GA-HCS-NEW',
    medicaid_id: medicaid || 'GA-MCD-NEW',
    counties: [], share_partners: [],
    nurse_count: 0
  };
  State.addAgency(a);
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Agency', entity_name: name, action: `added · ${status} · biometric-signed · ${Cryptiq.shortHash(signature.hash)}` });
  toast(`${name} added`, 'success');
  render();
}

function handleComplianceExport() {
  const role = State.currentRole();
  const nurses = State.getNurses();
  const audit = State.getAudit();
  const payload = {
    exported_at: new Date().toISOString(),
    exported_by: role.name,
    role: role.label,
    nurses_count: nurses.length,
    audit_entries: audit.length,
    nurses: nurses.map(n => ({
      id: n.id, name: fullName(n), license: `${n.license_type} ${n.license_number}`,
      compliance: n.compliance_status, agency: n.primary_agency_id,
      face_verified: !!n.face_verified, match_score: n.face_match_score,
      docs: (n.documents || []).map(d => ({ key: d.key, label: d.label, status: d.status, expires: d.expires, hash: d.file_hash || null }))
    })),
    audit
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tnx-compliance-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  State.logAudit({ actor: role.name, actor_role: role.label, entity: 'Compliance export', entity_name: `${nurses.length} nurses`, action: 'JSON export downloaded' });
  toast('Compliance export downloaded', 'success');
}

// =========================================================
// Notifications
// =========================================================
function buildNotifications() {
  const role = State.currentRole();
  const items = [];
  // Compliance alerts (agency-scoped)
  if (['agency_admin','recruiter','super_admin'].includes(role.id)) {
    State.getNurses()
      .filter(n => !role.agency_id || n.primary_agency_id === role.agency_id || (n.shared_with || []).includes(role.agency_id))
      .forEach(n => {
        (n.documents || []).forEach(d => {
          if (d.expires) {
            const days = Math.round((new Date(d.expires) - Date.now()) / 86400000);
            if (days >= 0 && days <= 30) items.push({
              type: 'compliance', icon: 'alert', tone: days < 14 ? 'err' : 'warn',
              title: `${d.label} expires in ${days}d`,
              sub: `${n.first_name} ${n.last_name}`,
              hash: `#/nurse/${n.id}`, ts: new Date(d.expires).getTime()
            });
          }
        });
      });
  }
  // Upcoming meets
  const upcoming = State.getMeets()
    .filter(m => m.status === 'scheduled' && new Date(m.scheduled_at) > Date.now() - 86400000)
    .filter(m => {
      if (role.id === 'parent') return m.parent_id === role.user_id;
      if (role.id === 'nurse') return m.nurse_id === role.user_id;
      if (role.agency_id) {
        const c = State.getCase(m.case_id);
        return c?.agency_id === role.agency_id;
      }
      return true;
    })
    .slice(0, 3);
  upcoming.forEach(m => {
    const n = State.getNurse(m.nurse_id);
    const c = State.getCase(m.case_id);
    items.push({
      type: 'meet', icon: 'calendar', tone: 'info',
      title: `${n ? n.first_name + ' ' + n.last_name : 'Nurse'} ↔ ${c?.child_alias || 'Case'}`,
      sub: fmtDateTime(m.scheduled_at),
      hash: `#/meets`, ts: new Date(m.scheduled_at).getTime()
    });
  });
  // Recent audit (admin/agency)
  if (['agency_admin','recruiter','super_admin'].includes(role.id)) {
    State.getAudit().slice(0, 3).forEach(a => {
      items.push({
        type: 'audit', icon: 'shield', tone: 'ok',
        title: `${a.actor || 'Someone'} · ${a.action.split('·')[0].trim()}`,
        sub: `${a.entity || ''} ${a.entity_name || ''}`.trim(),
        hash: '#/audit', ts: Date.now()
      });
    });
  }
  return items.sort((a,b) => a.ts - b.ts).slice(0, 10);
}

function openNotifications() {
  closePopovers();
  const items = buildNotifications();
  const html = `
    <div class="tnx-popover" id="tnx-notifs">
      <div class="tnx-popover-head">
        <h3>${icon('bell',14)} Notifications</h3>
        <small>${items.length} active</small>
      </div>
      <div class="tnx-popover-body">
        ${items.length === 0 ? '<div class="tnx-empty">All clear — no pending alerts.</div>' :
          items.map(it => `
            <a class="notif-row tone-${it.tone}" href="${it.hash}" data-popover-link>
              <div class="notif-ico">${icon(it.icon, 14)}</div>
              <div class="notif-text">
                <div class="notif-title">${it.title}</div>
                <div class="notif-sub">${it.sub}</div>
              </div>
            </a>
          `).join('')}
      </div>
    </div>
  `;
  showPopover(html);
}

// =========================================================
// AI Assistant — keyword/regex command parser
// =========================================================
const _assistantHistory = [];
function openAssistant() {
  closePopovers();
  if (_assistantHistory.length === 0) {
    const role = State.currentRole();
    const greeting = role.id === 'parent'
      ? "Hi! I can help you find nurses, view shortlists, or book a meet & greet. Try: \"Show my shortlist\" or \"Book a meet with [nurse name]\"."
      : role.id === 'nurse'
      ? "Hi! I can pull up opportunities, your schedule, or your credentials. Try: \"Show my opportunities\" or \"Update my availability\"."
      : "Hi! I can search nurses or cases, post new cases, schedule meets, and pull reports. Try: \"Show open cases\", \"Find nurses with trach experience\", or \"Schedule a meet with [nurse] for Friday\".";
    _assistantHistory.push({ from: 'bot', text: greeting });
  }
  renderAssistant();
}

function renderAssistant() {
  const role = State.currentRole();
  const role_quicks = role.id === 'parent' ? [
    'Show my shortlist',
    'Show upcoming meets',
    'Message my agency'
  ] : role.id === 'nurse' ? [
    'Show my opportunities',
    'Show my schedule',
    'Update my availability'
  ] : [
    'Show open cases',
    'Find nurses with trach experience',
    'Show audit log',
    'Add a new case'
  ];
  const html = `
    <div class="tnx-popover tnx-assistant" id="tnx-assistant">
      <div class="tnx-popover-head">
        <h3>${icon('message',14)} Assistant</h3>
        <small>Type or pick a command</small>
      </div>
      <div class="tnx-popover-body" id="assistant-thread">
        ${_assistantHistory.map(m => `
          <div class="assistant-msg ${m.from === 'me' ? 'me' : 'bot'}">${escapeAssistant(m.text)}</div>
        `).join('')}
      </div>
      <div class="assistant-quicks">
        ${role_quicks.map(q => `<button class="quick-chip" data-action="assistant-quick" data-q="${q}">${q}</button>`).join('')}
      </div>
      <div class="assistant-input">
        <input id="assistant-input" placeholder="Ask anything…" autocomplete="off"/>
        <button class="btn btn-brand btn-sm" data-action="assistant-send">${icon('send',14)}</button>
      </div>
    </div>
  `;
  showPopover(html);
  setTimeout(() => {
    const inp = document.getElementById('assistant-input');
    if (inp) inp.focus();
    const thread = document.getElementById('assistant-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
    inp?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); sendAssistantMessage(); }
    });
  }, 50);
}

function escapeAssistant(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])).replace(/\n/g, '<br>');
}

function quickAssistant(q) {
  const inp = document.getElementById('assistant-input');
  if (inp) inp.value = q;
  sendAssistantMessage();
}

function sendAssistantMessage() {
  const inp = document.getElementById('assistant-input');
  const text = (inp?.value || '').trim();
  if (!text) return;
  _assistantHistory.push({ from: 'me', text });
  inp.value = '';
  const reply = handleAssistant(text);
  _assistantHistory.push({ from: 'bot', text: reply });
  renderAssistant();
}

function handleAssistant(text) {
  const role = State.currentRole();
  const t = text.toLowerCase();
  // Navigation intents
  if (/(show|open|view|see).*(open|all)?.*case/i.test(t) || /open cases/i.test(t)) {
    location.hash = '#/cases'; closePopovers();
    return `Opening cases. There are ${State.getCases().filter(c => ['open','shortlisting'].includes(c.case_status)).length} that need attention.`;
  }
  if (/(show|open|view|see|my).*shortlist/i.test(t)) {
    location.hash = role.id === 'parent' ? '#/parent-home' : '#/cases'; closePopovers();
    return 'Pulling up your shortlist.';
  }
  if (/(show|open|view).*(meet|schedule)/i.test(t)) {
    location.hash = role.id === 'nurse' ? '#/nurse-schedule' : role.id === 'parent' ? '#/parent-home' : '#/meets';
    closePopovers();
    return 'Opening your schedule.';
  }
  if (/(show|view|see|my).*(opportunit|opp|jobs?|cases? for me)/i.test(t)) {
    if (role.id === 'nurse') { location.hash = '#/nurse-opps'; closePopovers(); return 'Opening your opportunities.'; }
  }
  if (/(show|view|see|my).*(credential|license|cert)/i.test(t)) {
    if (role.id === 'nurse') { location.hash = '#/nurse-creds'; closePopovers(); return 'Opening your credentials.'; }
  }
  if (/(show|view|see|open).*(audit|log|history)/i.test(t)) {
    location.hash = '#/audit'; closePopovers(); return 'Opening the audit log.';
  }
  if (/(show|view|see|open).*(report|metric)/i.test(t)) {
    location.hash = '#/reporting'; closePopovers(); return 'Opening reporting.';
  }
  if (/message.*agency/i.test(t)) {
    if (role.id === 'parent') { handleMsgParentAgency(); closePopovers(); return 'Opening your conversation with the agency.'; }
  }
  // Search nurses
  let m;
  if ((m = t.match(/(?:find|search|show).*(?:nurse|nurses).*(?:with|for|in|named)\s+(.+)$/))) {
    const term = m[1].replace(/\s+experience$/, '').trim();
    const matches = State.getNurses().filter(n => {
      const blob = `${n.first_name} ${n.last_name} ${(n.skills||[]).join(' ')} ${(n.counties_served||[]).join(' ')}`.toLowerCase();
      return blob.includes(term);
    }).slice(0, 5);
    if (matches.length === 0) return `No nurses match "${term}".`;
    location.hash = '#/pool'; closePopovers();
    return `Found ${matches.length} nurses for "${term}":\n` + matches.map(n => `• ${n.first_name} ${n.last_name} — ${n.license_type}`).join('\n');
  }
  // Update availability
  if (/update.*availability|edit.*availability|change.*availability/i.test(t)) {
    if (role.id === 'nurse') {
      closePopovers();
      setTimeout(() => openModal(availabilityModal()), 100);
      return 'Opening your availability editor.';
    }
  }
  // Add case
  if (/(add|post|create|new).*(case|child|patient)/i.test(t)) {
    if (['agency_admin','recruiter'].includes(role.id)) {
      closePopovers();
      setTimeout(() => openModal(newCaseModal()), 100);
      return 'Opening the new case form. Fill in the child info and I\'ll match nurses for you.';
    }
  }
  // Schedule a meet
  if ((m = t.match(/(?:book|schedule).*?meet.*?(?:with\s+)?([a-z][a-z\s]+?)(?:\s+(?:for|on)\s+(.+))?$/))) {
    const namePart = (m[1] || '').trim();
    const nurses = State.getNurses();
    const found = nurses.find(n => `${n.first_name} ${n.last_name}`.toLowerCase().includes(namePart));
    if (!found) return `Couldn't find a nurse named "${namePart}". Try the full first or last name.`;
    if (role.id === 'parent') {
      const parent = State.getParent(role.user_id);
      const c = State.getCase(parent.case_id);
      closePopovers();
      setTimeout(() => openModal(parentBookModal(found.id, c.id)), 100);
      return `Opening the booking form for ${found.first_name} ${found.last_name}.`;
    }
    closePopovers();
    setTimeout(() => openModal(scheduleMeetModal(null, found.id)), 100);
    return `Opening the meet & greet form for ${found.first_name} ${found.last_name}.`;
  }
  // Switch role
  if ((m = t.match(/(?:switch|change|act|view).*(?:as|to)\s+(super.?admin|admin|agency|recruiter|nurse|parent|guardian)/))) {
    const map = { 'admin': 'super_admin', 'super admin': 'super_admin', 'super-admin': 'super_admin', 'super_admin': 'super_admin', 'agency': 'agency_admin', 'recruiter': 'recruiter', 'nurse': 'nurse', 'parent': 'parent', 'guardian': 'parent' };
    const id = map[m[1]];
    if (id) {
      State.setRole(id);
      const r = window.TNX.ROLES.find(x => x.id === id);
      location.hash = r.home;
      closePopovers();
      return `Switched to ${r.label}.`;
    }
  }
  if (/help|what can|commands/i.test(t)) {
    return 'I can:\n• Show open cases / shortlist / audit / reporting\n• Find nurses ("nurses with trach experience")\n• Book a meet ("schedule meet with Tiana")\n• Add a case / update availability\n• Switch persona ("act as nurse")';
  }
  return `I'm not sure how to help with "${text}" yet. Try "help" to see what I can do.`;
}

// =========================================================
// Popover plumbing (used by notifications + assistant)
// =========================================================
function closePopovers() {
  document.querySelectorAll('.tnx-popover').forEach(el => el.remove());
  document.getElementById('tnx-popover-backdrop')?.remove();
}
function showPopover(html) {
  closePopovers();
  const back = document.createElement('div');
  back.id = 'tnx-popover-backdrop';
  back.className = 'tnx-popover-backdrop';
  back.onclick = (e) => { if (e.target === back) closePopovers(); };
  back.innerHTML = html;
  document.body.appendChild(back);
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-popover-link]')) closePopovers();
});

// =========================================================
// Global search
// =========================================================
function runGlobalSearch(q) {
  const out = document.getElementById('global-search-results');
  if (!out) return;
  const query = (q || '').trim().toLowerCase();
  if (!query || query.length < 2) { out.classList.remove('open'); out.innerHTML = ''; return; }
  const role = State.currentRole();
  const myAg = role.agency_id;
  const nurses = State.getNurses().filter(n => n.primary_agency_id === myAg || (n.shared_with || []).includes(myAg)).filter(n => {
    const blob = `${n.first_name} ${n.last_name} ${n.license_type} ${(n.skills||[]).join(' ')} ${(n.counties_served||[]).join(' ')}`.toLowerCase();
    return blob.includes(query);
  }).slice(0, 6);
  const cases = State.getCases().filter(c => !myAg || c.agency_id === myAg).filter(c => {
    const blob = `${c.child_alias} ${c.county} ${c.shift_type} ${(c.required_skills||[]).join(' ')}`.toLowerCase();
    return blob.includes(query);
  }).slice(0, 5);
  const agencies = role.id === 'super_admin' ? State.getAgencies().filter(a => a.name.toLowerCase().includes(query)).slice(0, 4) : [];
  const items = [
    ...nurses.map(n => ({ kind: 'Nurse', label: `${n.first_name} ${n.last_name}`, sub: `${n.license_type} · ${(n.counties_served||[]).slice(0,2).join(', ')}`, hash: `#/nurse/${n.id}` })),
    ...cases.map(c => ({ kind: 'Case', label: c.child_alias, sub: `${c.county} · ${c.shift_type} · ${c.requested_hours}hr/wk`, hash: `#/case/${c.id}` })),
    ...agencies.map(a => ({ kind: 'Agency', label: a.name, sub: a.status, hash: '#/admin-agencies' }))
  ];
  if (!items.length) {
    out.innerHTML = `<div class="search-empty">No matches for "${query}"</div>`;
    out.classList.add('open');
    return;
  }
  out.innerHTML = items.map(it => `
    <a class="search-result" href="${it.hash}" data-search-hit>
      <span class="search-kind">${it.kind}</span>
      <span class="search-text"><b>${it.label}</b><small>${it.sub}</small></span>
    </a>
  `).join('');
  out.classList.add('open');
}

document.addEventListener('click', (e) => {
  const out = document.getElementById('global-search-results');
  if (!out) return;
  if (e.target.closest('[data-search-hit]')) {
    out.classList.remove('open');
    const inp = document.getElementById('global-search');
    if (inp) inp.value = '';
  } else if (!e.target.closest('.topbar-search')) {
    out.classList.remove('open');
  }
});

// Boot
if (!document.getElementById('modal-root')) {
  const mr = document.createElement('div'); mr.id = 'modal-root'; document.body.appendChild(mr);
  const dr = document.createElement('div'); dr.id = 'drawer-root'; document.body.appendChild(dr);
  const ts = document.createElement('div'); ts.id = 'toast-stack'; ts.className = 'toast-stack'; document.body.appendChild(ts);
}

async function boot() {
  render();
  // Auto-start simulation if landed via ?sim=1
  if (new URLSearchParams(location.search).get('sim') === '1') {
    sessionStorage.setItem('tnx.cq.gatePassed', '1');
    setTimeout(() => window.Simulation?.start({ resetState: true }), 250);
    return;
  }
  if (!sessionStorage.getItem('tnx.cq.gatePassed')) {
    const role = State.currentRole();
    try {
      await Cryptiq.demoOnboard({ role });
      sessionStorage.setItem('tnx.cq.gatePassed', '1');
      const name = Cryptiq.getDisplayName();
      toast(name ? `Welcome, ${name.split(' ')[0]} — biometric session active` : 'Biometric session active', 'success');
      render(); // re-render so topbar + welcome greeting pick up the name
    } catch {
      toast('Running in demo mode — some actions still require signature', 'info');
    }
  }
}

boot();
})();

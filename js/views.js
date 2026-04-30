/* =========================================================
   Views — all route-rendered pages
   ========================================================= */
(function(){
const { initials, fullName, fmtDate, fmtDateTime, relativeTime,
        badge, complianceBadge, priorityBadge, caseStatusBadge,
        avatar, matchRing, chip, nurseCard, emptyState, statCard,
        openModal, closeModal, openDrawer, closeDrawer, toast,
        barChart, sparkBars } = window.TNXComponents;

const Views = {};

// ============ DASHBOARD (Agency Admin / Recruiter) ============
Views.dashboard = () => {
  const role = State.currentRole();
  const agency = State.getAgency(role.agency_id);
  const nurses = State.getNurses().filter(n => n.primary_agency_id === role.agency_id);
  const cases = State.getCases().filter(c => c.agency_id === role.agency_id);
  const openCases = cases.filter(c => ['open','shortlisting'].includes(c.case_status));
  const urgent = openCases.filter(c => c.priority === 'urgent');
  const meets = State.getMeets().filter(m => m.status === 'scheduled' &&
    cases.find(c => c.id === m.case_id));
  const expiring = nurses.filter(n => n.compliance_status === 'expiring');
  const audit = State.getAudit().slice(0, 7);

  const weekly = [
    { label: 'Mon', val: 3 }, { label: 'Tue', val: 5 }, { label: 'Wed', val: 4 },
    { label: 'Thu', val: 7 }, { label: 'Fri', val: 6 }, { label: 'Sat', val: 2 }, { label: 'Sun', val: 1 }
  ];

  const displayName = (window.Cryptiq?.getDisplayName() || role.name).split(' ')[0];
  return `
    <div class="page-head">
      <div class="titles">
        <h1>Welcome back, ${displayName}</h1>
        <p>${agency.name} · ${agency.counties.join(', ')}</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" data-action="nav" data-href="#/pool">${icon('users',14)} Browse pool</button>
        <button class="btn btn-brand" data-action="new-case">${icon('plus',14)} New case</button>
      </div>
    </div>

    <div class="stat-grid">
      ${statCard({ label: 'Nurses in your pool', val: nurses.length, delta: '+3 this month' })}
      ${statCard({ label: 'Open cases', val: openCases.length, delta: `${urgent.length} urgent`, deltaDir: urgent.length ? 'down' : 'up' })}
      ${statCard({ label: 'Meet & greets this week', val: meets.length, delta: 'on track' })}
      ${statCard({ label: 'Expiring credentials', val: expiring.length, delta: 'review needed', deltaDir: expiring.length ? 'down' : 'up' })}
    </div>

    <div class="grid-2">
      <div class="stack">
        <div class="card">
          <div class="card-header">
            <h3>Open cases needing attention</h3>
            <a href="#/cases" class="btn btn-ghost btn-sm">View all ${icon('arrowRight',12)}</a>
          </div>
          ${openCases.length === 0 ? emptyState({ title: 'All cases covered', message: 'Nothing urgent on the board right now.', icon: 'check' }) :
            `<div class="stack" style="gap:10px">
              ${openCases.slice(0,5).map(c => `
                <div class="card-sm dash-case-row" data-action="open-case" data-id="${c.id}">
                  <div class="dash-case-ico" style="background:${c.priority==='urgent'?'var(--err-bg)':'var(--ocean-50)'};color:${c.priority==='urgent'?'var(--err)':'var(--ocean)'}">${icon('briefcase',18)}</div>
                  <div class="dash-case-body">
                    <div class="dash-case-title">
                      <b>${c.child_alias}</b>
                      ${priorityBadge(c.priority)} ${caseStatusBadge(c.case_status)}
                    </div>
                    <div class="dash-case-sub">${c.county} · ${c.shift_type} · ${c.requested_hours}hr/wk · ${fmtDate(c.start_date)}</div>
                  </div>
                  <div class="dash-case-meta">
                    <div>${State.getMatches(c.id).filter(m=>m.status==='suggested').length} matches</div>
                    <div style="color:var(--ocean);font-weight:600">${State.getMatches(c.id).filter(m=>m.status==='shortlisted').length} shortlisted</div>
                  </div>
                </div>
              `).join('')}
            </div>`
          }
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Upcoming meet & greets</h3>
            <a href="#/meets" class="btn btn-ghost btn-sm">All schedule ${icon('arrowRight',12)}</a>
          </div>
          ${meets.length === 0 ? emptyState({ title: 'No scheduled meet & greets', message: 'Shortlist nurses from a case to invite parents to meet.', icon: 'calendar' }) :
            `<div class="stack" style="gap:10px">
              ${meets.slice(0,4).map(m => {
                const n = State.getNurse(m.nurse_id);
                const c = State.getCase(m.case_id);
                return `
                  <div class="card-sm" style="display:flex; align-items:center; gap:14px; border:1px solid var(--border); cursor:pointer" data-action="open-meet" data-id="${m.id}">
                    <div style="width:40px;height:40px;border-radius:10px;background:var(--teal-50);color:var(--teal-600);display:grid;place-items:center;flex-shrink:0;">${icon(m.mode.includes('Virtual')?'video':'handshake',18)}</div>
                    <div style="flex:1">
                      <div style="font-weight:600; color:var(--navy); font-size:13px;">${n ? fullName(n) : 'Nurse'} ↔ ${c ? c.child_alias : 'Case'}</div>
                      <div style="font-size:12px; color:var(--text-muted)">${fmtDateTime(m.scheduled_at)} · ${m.mode}</div>
                    </div>
                    <span class="badge badge-info"><span class="b-dot"></span>Scheduled</span>
                  </div>
                `;
              }).join('')}
            </div>`
          }
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <h3 style="margin-bottom:14px">Placements this week</h3>
          <div style="padding-top: 28px">${barChart(weekly)}</div>
          <div style="display:flex; justify-content:space-between; padding-top:22px; border-top:1px solid var(--border); margin-top:18px">
            <div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em">Total</div><div style="font-size:20px;font-weight:800;color:var(--navy)">28</div></div>
            <div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em">Fill rate</div><div style="font-size:20px;font-weight:800;color:var(--teal-600)">87%</div></div>
            <div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em">Avg time</div><div style="font-size:20px;font-weight:800;color:var(--ocean)">3.8d</div></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Compliance alerts</h3></div>
          ${expiring.length === 0 ? emptyState({ title: 'All current', message: 'No credentials expiring in the next 30 days.', icon: 'shield' }) :
            expiring.slice(0,4).map(n => {
              const worst = n.documents.filter(d => d.status === 'expiring').sort((a,b)=>new Date(a.expires)-new Date(b.expires))[0];
              return `
                <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border)">
                  <div class="av">${initials(fullName(n))}</div>
                  <div style="flex:1">
                    <div style="font-size:13px; font-weight:600; color:var(--navy)">${fullName(n)}</div>
                    <div style="font-size:11px; color:var(--warn)">${worst?.label || '—'} · expires ${worst?.expires ? fmtDate(worst.expires) : '—'}</div>
                  </div>
                  <button class="btn btn-ghost btn-sm" data-action="open-nurse" data-id="${n.id}">View</button>
                </div>
              `;
            }).join('')
          }
        </div>

        <div class="card">
          <div class="card-header"><h3>Recent activity</h3></div>
          <div class="timeline">
            ${audit.map(a => `
              <div class="timeline-item">
                <div class="tl-dot">${icon(a.action.includes('confirmed')||a.action.includes('accepted')?'check':a.action.includes('expir')?'alert':'pool', 14)}</div>
                <div class="tl-body">
                  <div class="tl-text"><b>${a.actor}</b> ${a.action} <b>${a.entity_name}</b></div>
                  <div class="tl-time">${relativeTime(a.at)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
};

// ============ NURSE POOL ============
Views.pool = () => {
  const role = State.currentRole();
  const f = Views.poolFilters = Views.poolFilters || { search:'', county:'', skill:'', compliance:'', shareOnly: false, sort: 'match' };

  const all = State.getNurses();
  const visible = all.filter(n => {
    if (n.primary_agency_id !== role.agency_id && !n.shared_with.includes(role.agency_id)) return false;
    if (f.shareOnly && n.share_status !== 'shared') return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!fullName(n).toLowerCase().includes(q) && !n.skills.some(s => s.toLowerCase().includes(q)) && !n.counties_served.some(c => c.toLowerCase().includes(q))) return false;
    }
    if (f.county && !n.counties_served.includes(f.county)) return false;
    if (f.skill && !n.skills.includes(f.skill)) return false;
    if (f.compliance && n.compliance_status !== f.compliance) return false;
    return true;
  });

  visible.sort((a,b) => {
    if (f.sort === 'exp') return b.years_experience - a.years_experience;
    if (f.sort === 'rate') return a.rate_per_hour - b.rate_per_hour;
    if (f.sort === 'rating') return parseFloat(b.rating) - parseFloat(a.rating);
    return parseFloat(b.rating) - parseFloat(a.rating); // default
  });

  return `
    <div class="page-head">
      <div class="titles">
        <h1>The Nurse Pool</h1>
        <p>${visible.length} nurse${visible.length===1?'':'s'} visible to you · ${all.filter(n => n.primary_agency_id === role.agency_id).length} on your roster · ${all.filter(n => n.share_status === 'shared' && n.primary_agency_id !== role.agency_id).length} from partner agencies</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" data-action="invite-nurse">${icon('mail',14)} Invite nurse</button>
        <button class="btn btn-brand" data-action="add-nurse">${icon('plus',14)} Add nurse</button>
      </div>
    </div>

    <div class="filter-bar" id="pool-filter-bar">
      <div class="search-bar" style="flex:1 1 280px;">
        ${icon('search',14)}
        <input id="pool-search" value="${f.search}" placeholder="Search by name, skill, or county…" />
      </div>
      <select class="select" id="f-county" style="max-width:160px">
        <option value="">All counties</option>
        ${window.TNX.GA_COUNTIES.map(c => `<option ${f.county===c?'selected':''}>${c}</option>`).join('')}
      </select>
      <select class="select" id="f-skill" style="max-width:200px">
        <option value="">All skills</option>
        ${window.TNX.PED_SKILLS.map(s => `<option ${f.skill===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <select class="select" id="f-comp" style="max-width:160px">
        <option value="">Any compliance</option>
        <option value="complete" ${f.compliance==='complete'?'selected':''}>Complete</option>
        <option value="expiring" ${f.compliance==='expiring'?'selected':''}>Expiring</option>
        <option value="expired" ${f.compliance==='expired'?'selected':''}>Expired</option>
        <option value="incomplete" ${f.compliance==='incomplete'?'selected':''}>Incomplete</option>
      </select>
      <label class="filter-pill ${f.shareOnly?'active':''}" style="cursor:pointer">
        <input type="checkbox" id="f-share" ${f.shareOnly?'checked':''} style="display:none" />
        ${icon('link',12)} Shared only
      </label>
      <select class="select" id="f-sort" style="max-width:160px">
        <option value="match" ${f.sort==='match'?'selected':''}>Top rated</option>
        <option value="exp" ${f.sort==='exp'?'selected':''}>Most experienced</option>
        <option value="rate" ${f.sort==='rate'?'selected':''}>Lowest rate</option>
      </select>
    </div>

    ${visible.length === 0
      ? emptyState({ title: 'No nurses match', message: 'Try clearing filters or broadening your county/skill selection.', icon: 'search' })
      : `<div class="grid-3" style="gap:16px">${visible.map(n => nurseCard(n)).join('')}</div>`
    }
  `;
};

// ============ NURSE DETAIL ============
Views.nurseDetail = (id) => {
  const n = State.getNurse(id);
  if (!n) return emptyState({ title: 'Nurse not found', message: 'This profile may have been removed.' });
  const tab = Views.nurseTab || 'overview';
  const agency = State.getAgency(n.primary_agency_id);

  return `
    <div class="breadcrumb"><a href="#/pool">The Pool</a> ${icon('chevronRight',12)} <span>${fullName(n)}</span></div>

    <div class="profile-head">
      <div class="av-xl">${initials(fullName(n))}</div>
      <div class="info">
        <h1>${fullName(n)}</h1>
        <div class="subline">
          <span>${icon('award',14)} ${n.license_type} · ${n.license_number}</span>
          <span>${icon('pin',14)} ${n.counties_served.join(' · ')}</span>
          <span>${icon('star',14)} ${n.rating} · ${n.completed_shifts} shifts</span>
          <span>${icon('clock',14)} ${n.years_experience}y experience</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" data-action="msg-nurse" data-id="${n.id}">${icon('message',14)} Message</button>
        <button class="btn btn-brand" data-action="shortlist-nurse" data-id="${n.id}">${icon('plus',14)} Shortlist</button>
      </div>
    </div>

    <div class="tab-row">
      ${['overview','credentials','availability','history'].map(t => `<div class="tab ${t===tab?'active':''}" data-action="nurse-tab" data-tab="${t}">${t[0].toUpperCase()+t.slice(1)}</div>`).join('')}
    </div>

    ${tab === 'overview' ? `
      <div class="grid-2">
        <div class="stack">
          <div class="card">
            <h3>About</h3>
            <p style="color:var(--text-muted); font-size:14px; line-height:1.6">${n.bio}</p>
          </div>
          <div class="card">
            <h3>Pediatric skills & competencies</h3>
            <div class="row" style="flex-wrap:wrap; gap:6px; margin-top:10px">
              ${n.skills.map(s => chip(s, { icon: 'check' })).join('')}
            </div>
          </div>
          <div class="card">
            <h3>Languages</h3>
            <div class="row" style="flex-wrap:wrap; gap:6px; margin-top:10px">
              ${n.languages.map(l => chip(l)).join('')}
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="card">
            <h3 style="margin-bottom:12px">Compliance summary</h3>
            ${complianceBadge(n.compliance_status)}
            <div class="progress" style="margin:16px 0 6px">
              <div class="bar" style="width:${Math.round(100 * n.documents.filter(d=>d.status==='complete').length / n.documents.length)}%"></div>
            </div>
            <small>${n.documents.filter(d=>d.status==='complete').length} of ${n.documents.length} documents current</small>
          </div>
          <div class="card">
            <h3 style="margin-bottom:10px">Agency & sharing</h3>
            <div style="font-size:13px;line-height:1.8">
              <div><b>Primary:</b> ${agency.name}</div>
              <div><b>Employment:</b> ${n.employment_type}</div>
              <div><b>Pay rate:</b> $${n.rate_per_hour}/hr</div>
              <div><b>Shifts:</b> ${n.shift_preferences.join(', ')}</div>
              <div><b>Pool status:</b> ${n.share_status === 'shared' ? badge('Shared with partners','brand') : badge('Private','neutral')}</div>
              ${n.share_status === 'shared' ? `<div><b>Shared with:</b> ${n.shared_with.map(id => State.getAgency(id)?.name).filter(Boolean).join(', ') || '—'}</div>` : ''}
            </div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:10px">Contact</h3>
            <div style="font-size:13px; color:var(--text-muted); display:flex; flex-direction:column; gap:6px">
              <div>${icon('mail',13)} ${n.email}</div>
              <div>${icon('phone',13)} ${n.phone}</div>
            </div>
          </div>
        </div>
      </div>
    ` : tab === 'credentials' ? `
      <div class="card" style="margin-bottom:16px; background:linear-gradient(135deg, var(--ocean-50), var(--teal-50)); border-color:transparent">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
          <div style="width:36px; height:36px; border-radius:10px; background:white; color:var(--ocean); display:grid; place-items:center; flex-shrink:0">${icon('shield',16)}</div>
          <div style="flex:1; min-width:200px">
            <div style="font-weight:700; color:var(--navy); font-size:14px">Upload accepted formats</div>
            <div style="font-size:12px; color:var(--text-muted)">PDF, JPG, PNG, HEIC, WEBP, DOCX, TIFF · 8 MB max · biometric-signed at upload</div>
          </div>
        </div>
      </div>
      <div class="stack">
        ${n.documents.map(d => {
          const hasFile = !!d.file_data;
          return `
          <div class="doc-row">
            <div class="doc-ico" style="${hasFile ? 'background:var(--teal-50); color:var(--teal-600)' : ''}">${icon(hasFile ? 'check' : 'file',16)}</div>
            <div class="meta" style="flex:1; min-width:0">
              <div class="name">${d.label}</div>
              <div class="sub">
                ${hasFile ? `${d.file_name} · ${(d.file_size/1024).toFixed(0)} KB · ${d.expires ? 'Expires ' + fmtDate(d.expires) : 'No expiration'}` : (d.expires ? 'Expires ' + fmtDate(d.expires) : 'Not uploaded')}
              </div>
              ${hasFile ? `<div class="sub" style="font-family:ui-monospace,monospace; font-size:10px; opacity:0.7">sha256:${(d.file_hash||'').slice(0,18)}…</div>` : ''}
            </div>
            ${d.status === 'complete' ? badge('Current','ok')
              : d.status === 'expiring' ? badge('Expiring soon','warn')
              : d.status === 'expired' ? badge('Expired','err')
              : badge('Missing','err')}
            <div style="display:flex; gap:6px; flex-shrink:0">
              ${hasFile ? `<a class="btn btn-ghost btn-sm" href="${d.file_data}" download="${d.file_name}" style="text-decoration:none">${icon('file',12)} View</a>` : ''}
              <button class="btn btn-secondary btn-sm" data-action="upload-doc" data-id="${d.key}">${icon('upload',12)} ${hasFile ? 'Replace' : 'Upload'}</button>
              ${hasFile ? `<button class="btn btn-ghost btn-sm" data-action="remove-doc" data-id="${d.key}">${icon('x',12)}</button>` : ''}
            </div>
          </div>
        `;}).join('')}
      </div>
    ` : tab === 'availability' ? `
      <div class="card">
        <h3 style="margin-bottom:14px">Weekly availability</h3>
        <div style="display:grid;grid-template-columns:80px repeat(7,1fr);gap:4px;font-size:11px;color:var(--text-muted)">
          <div></div>
          ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div style="text-align:center;font-weight:600">${d}</div>`).join('')}
          ${['7-3','3-11','11-7'].map(shift => `
            <div style="padding:8px 0;font-weight:600">${shift}</div>
            ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((_,i) => {
              const avail = n.shift_preferences.includes('Day') && shift === '7-3' && i < 5 ||
                            n.shift_preferences.includes('Night') && shift === '11-7' ||
                            n.shift_preferences.includes('Overnight') && shift === '11-7' ||
                            n.shift_preferences.includes('Weekend') && (i >= 5);
              return `<div style="background:${avail?'var(--teal-50)':'var(--surface-alt)'};border:1px solid ${avail?'var(--teal)':'var(--border)'};border-radius:6px;padding:10px 0;text-align:center;font-size:11px;color:${avail?'var(--teal-600)':'var(--text-subtle)'};font-weight:600">${avail?'Open':'—'}</div>`;
            }).join('')}
          `).join('')}
        </div>
        <div style="margin-top:16px; font-size:12px; color:var(--text-muted)">Preferred shifts: <b style="color:var(--navy)">${n.shift_preferences.join(', ')}</b></div>
      </div>
    ` : `
      <div class="card">
        <h3>Placement history</h3>
        <table class="tbl" style="margin-top:10px">
          <thead><tr><th>Case</th><th>Agency</th><th>Duration</th><th>Outcome</th></tr></thead>
          <tbody>
            <tr><td>Child H (Cobb)</td><td>Peach State</td><td>Aug 2025 – present</td><td>${badge('Active','ok')}</td></tr>
            <tr><td>Child L (Fulton)</td><td>Peach State</td><td>Mar 2024 – Jul 2025</td><td>${badge('Completed','neutral')}</td></tr>
            <tr><td>Child M (DeKalb)</td><td>Atlanta Children\'s (shared)</td><td>Oct 2023 – Feb 2024</td><td>${badge('Completed','neutral')}</td></tr>
          </tbody>
        </table>
      </div>
    `}
  `;
};

// ============ CASES (list + board) ============
Views.cases = () => {
  const role = State.currentRole();
  const view = Views.caseView || 'board';
  const cases = State.getCases().filter(c => c.agency_id === role.agency_id);
  const cols = [
    { key: 'open', label: 'Open' },
    { key: 'shortlisting', label: 'Shortlisting' },
    { key: 'matched', label: 'Matched' },
    { key: 'placed', label: 'Placed' }
  ];
  return `
    <div class="page-head">
      <div class="titles">
        <h1>Cases</h1>
        <p>${cases.length} total cases · ${cases.filter(c=>['open','shortlisting'].includes(c.case_status)).length} active</p>
      </div>
      <div class="actions">
        <div style="display:flex; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-pill); padding:3px">
          <button class="btn btn-sm ${view==='board'?'btn-primary':'btn-ghost'}" data-action="case-view" data-v="board">Board</button>
          <button class="btn btn-sm ${view==='list'?'btn-primary':'btn-ghost'}" data-action="case-view" data-v="list">List</button>
        </div>
        <button class="btn btn-brand" data-action="new-case">${icon('plus',14)} New case</button>
      </div>
    </div>

    ${view === 'board' ? `
      <div class="kanban">
        ${cols.map(col => {
          const list = cases.filter(c => c.case_status === col.key);
          return `
            <div class="kanban-col">
              <h4>${col.label} <span class="ct">${list.length}</span></h4>
              ${list.map(c => `
                <div class="kanban-card" data-action="open-case" data-id="${c.id}">
                  <div class="title">${c.child_alias}</div>
                  <div class="meta">
                    <span>${icon('pin',10)} ${c.county}</span>
                    <span>${icon('clock',10)} ${c.shift_type}</span>
                    <span>${c.requested_hours}h/wk</span>
                  </div>
                  <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center">
                    ${priorityBadge(c.priority)}
                    <small style="color:var(--text-subtle)">${fmtDate(c.start_date)}</small>
                  </div>
                </div>
              `).join('') || `<div style="padding:20px;text-align:center;color:var(--text-subtle);font-size:12px">— empty —</div>`}
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Case</th><th>County</th><th>Shift</th><th>Hours</th><th>Start</th><th>Priority</th><th>Status</th><th>Matches</th><th></th></tr></thead>
          <tbody>
            ${cases.map(c => `
              <tr>
                <td><b>${c.child_alias}</b><div style="font-size:11px;color:var(--text-muted)">${c.age_band}</div></td>
                <td>${c.county}</td>
                <td>${c.shift_type}</td>
                <td>${c.requested_hours}/wk</td>
                <td>${fmtDate(c.start_date)}</td>
                <td>${priorityBadge(c.priority)}</td>
                <td>${caseStatusBadge(c.case_status)}</td>
                <td>${State.getMatches(c.id).filter(m=>m.status!=='suggested').length || '—'}</td>
                <td><button class="btn btn-secondary btn-sm" data-action="open-case" data-id="${c.id}">Open</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
};

// ============ CASE DETAIL ============
Views.caseDetail = (id) => {
  const c = State.getCase(id);
  if (!c) return emptyState({ title: 'Case not found', message: 'This case may have been closed or removed.' });
  const matches = State.getMatches(id);
  const nurses = State.getNurses();
  const top = matches.slice(0, 12).map(m => ({ ...m, nurse: nurses.find(n => n.id === m.nurse_id) })).filter(x => x.nurse);
  const shortlisted = top.filter(m => ['shortlisted','accepted','placed'].includes(m.status));
  const pending = top.filter(m => m.status === 'suggested');
  const parent = c.parent_id ? State.getParent(c.parent_id) : null;
  const meets = State.getMeets().filter(m => m.case_id === id);

  return `
    <div class="breadcrumb"><a href="#/cases">Cases</a> ${icon('chevronRight',12)} <span>${c.child_alias}</span></div>

    <div class="page-head">
      <div class="titles">
        <h1>${c.child_alias}</h1>
        <p>${c.county} County · ${c.age_band} · ${c.shift_type} shift · ${c.requested_hours}hr/wk · starts ${fmtDate(c.start_date)}</p>
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap">
          ${priorityBadge(c.priority)} ${caseStatusBadge(c.case_status)}
          ${c.authorization_status === 'Prior Auth Approved' ? badge(c.authorization_status, 'ok') : badge(c.authorization_status, 'warn')}
          ${badge(c.payer_program, 'ocean', false)}
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" data-action="request-pool" data-id="${c.id}">${icon('link',14)} Request from network</button>
        <button class="btn btn-brand" data-action="schedule-meet" data-case="${c.id}">${icon('calendar',14)} Schedule meet & greet</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="stack">
        <div class="card">
          <div class="card-header">
            <h3>Shortlist (${shortlisted.length})</h3>
            <small>Parent will see these nurses only</small>
          </div>
          ${shortlisted.length === 0
            ? emptyState({ title: 'Nothing shortlisted yet', message: 'Select candidates below to add them to the parent-facing shortlist.', icon: 'users' })
            : `<div class="grid-3" style="gap:12px">${shortlisted.map(m => nurseCard(m.nurse, { score: m.score })).join('')}</div>`
          }
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Suggested matches (${pending.length})</h3>
            <small>Ranked by skill, county, availability, network fit</small>
          </div>
          <div class="grid-3" style="gap:12px">
            ${pending.slice(0,9).map(m => nurseCard(m.nurse, { score: m.score })).join('')}
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-header" style="margin-bottom:10px">
            <h3>Case details</h3>
            ${c.signature_hash ? `<span class="cq-verified-chip">${icon('shield',10)} Signed ${c.signature_hash.slice(0,6)}</span>` : ''}
          </div>
          <div style="font-size:13px; line-height:1.8">
            <div><b>Authorization:</b> ${c.authorization_status}</div>
            <div><b>Program:</b> ${c.payer_program}</div>
            <div><b>Start:</b> ${fmtDate(c.start_date)}</div>
            <div><b>Hours:</b> ${c.requested_hours}/week (${c.shift_type})</div>
            <div><b>Required skills:</b></div>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px">
              ${c.required_skills.map(s => chip(s, { icon: 'check' })).join('')}
            </div>
          </div>
          <div class="divider"></div>
          <div class="lookaway-target" data-lookaway-label="Clinical notes" data-lookaway-reason="PHI-adjacent · presence required" style="min-height:80px;padding:14px;background:var(--surface-alt);border-radius:var(--r-sm)">
            <div style="font-size:10px; color:var(--text-subtle); text-transform:uppercase; letter-spacing:0.08em; font-weight:700; margin-bottom:6px">Clinical notes</div>
            <div style="font-size:13px; color:var(--text); line-height:1.6">${c.notes}</div>
          </div>
        </div>

        ${parent ? `
          <div class="card">
            <h3 style="margin-bottom:10px">Parent / Guardian</h3>
            <div class="row" style="gap:12px">
              <div class="av av-lg">${initials(parent.name)}</div>
              <div>
                <div style="font-weight:700; color:var(--navy)">${parent.name}</div>
                <div style="font-size:12px; color:var(--text-muted)">${parent.email}</div>
                <div style="font-size:12px; color:var(--text-muted)">${parent.phone}</div>
              </div>
            </div>
            <button class="btn btn-secondary btn-block btn-sm" style="margin-top:12px" data-action="msg-parent" data-id="${parent.id}">${icon('message',12)} Message parent</button>
          </div>
        ` : `
          <div class="card">
            <h3 style="margin-bottom:8px">Parent / Guardian</h3>
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:10px">No parent invited yet. Send an invite so they can view the shortlist.</p>
            <button class="btn btn-secondary btn-block btn-sm" data-action="invite-parent" data-case="${c.id}">${icon('mail',12)} Invite parent</button>
          </div>
        `}

        <div class="card">
          <h3 style="margin-bottom:10px">Meet & greets (${meets.length})</h3>
          ${meets.length === 0 ? `<small style="color:var(--text-muted)">None scheduled yet</small>` :
            meets.map(m => {
              const n = State.getNurse(m.nurse_id);
              return `
                <div style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--border)">
                  <div class="av">${initials(fullName(n))}</div>
                  <div style="flex:1; min-width:0">
                    <div style="font-size:13px; font-weight:600; color:var(--navy)">${fullName(n)}</div>
                    <div style="font-size:11px; color:var(--text-muted)">${fmtDateTime(m.scheduled_at)} · ${m.mode}</div>
                  </div>
                  ${m.status==='scheduled'?badge('Scheduled','info'):m.parent_feedback==='good_fit'?badge('Good fit','ok'):m.parent_feedback==='maybe'?badge('Maybe','warn'):badge('Not a fit','err')}
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    </div>
  `;
};

// ============ MEET & GREETS ============
Views.meets = () => {
  const role = State.currentRole();
  const myCases = new Set(State.getCases().filter(c => c.agency_id === role.agency_id).map(c => c.id));
  const meets = State.getMeets().filter(m => myCases.has(m.case_id))
    .sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const upcoming = meets.filter(m => m.status === 'scheduled');
  const past = meets.filter(m => m.status === 'completed');

  return `
    <div class="page-head">
      <div class="titles">
        <h1>Meet & greets</h1>
        <p>${upcoming.length} upcoming · ${past.length} completed</p>
      </div>
      <div class="actions">
        <button class="btn btn-brand" data-action="schedule-meet">${icon('plus',14)} Schedule new</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>Upcoming</h3></div>
        ${upcoming.length === 0 ? emptyState({ title: 'Nothing scheduled', message: 'Invite parents to meet shortlisted nurses.', icon: 'calendar' }) :
          upcoming.map(m => {
            const n = State.getNurse(m.nurse_id);
            const c = State.getCase(m.case_id);
            const p = State.getParent(m.parent_id);
            return `
              <div style="display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid var(--border)">
                <div style="width:48px; height:48px; border-radius:10px; background:var(--teal-50); color:var(--teal-600); display:grid; place-items:center; flex-shrink:0">${icon(m.mode.includes('Virtual')?'video':'handshake', 22)}</div>
                <div style="flex:1">
                  <div style="font-weight:700; color:var(--navy); font-size:14px">${fullName(n)} ↔ ${c.child_alias}</div>
                  <div style="font-size:12px; color:var(--text-muted); margin-top:2px">With ${p?.name || 'Parent'} · ${m.mode}</div>
                  <div style="font-size:12px; color:var(--ocean); font-weight:600; margin-top:2px">${fmtDateTime(m.scheduled_at)}</div>
                </div>
                <button class="btn btn-secondary btn-sm">Manage</button>
              </div>
            `;
          }).join('')
        }
      </div>

      <div class="card">
        <div class="card-header"><h3>Recent outcomes</h3></div>
        ${past.length === 0 ? emptyState({ title: 'No completed meets yet', message: 'Outcomes will show here after meetings happen.', icon: 'clock' }) :
          past.map(m => {
            const n = State.getNurse(m.nurse_id);
            const c = State.getCase(m.case_id);
            const fb = m.parent_feedback;
            const b = fb === 'good_fit' ? badge('Good fit','ok') : fb === 'maybe' ? badge('Maybe','warn') : fb ? badge('Not a fit','err') : badge('Awaiting','neutral');
            return `
              <div style="display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid var(--border)">
                <div class="av av-lg">${initials(fullName(n))}</div>
                <div style="flex:1">
                  <div style="font-weight:700; color:var(--navy); font-size:14px">${fullName(n)} ↔ ${c.child_alias}</div>
                  <div style="font-size:12px; color:var(--text-muted)">${fmtDateTime(m.scheduled_at)}</div>
                </div>
                ${b}
              </div>
            `;
          }).join('')
        }
      </div>
    </div>
  `;
};

// ============ COMPLIANCE ============
Views.compliance = () => {
  const role = State.currentRole();
  const nurses = State.getNurses().filter(n => n.primary_agency_id === role.agency_id);
  const byStatus = {
    complete: nurses.filter(n => n.compliance_status === 'complete'),
    expiring: nurses.filter(n => n.compliance_status === 'expiring'),
    expired: nurses.filter(n => n.compliance_status === 'expired'),
    incomplete: nurses.filter(n => n.compliance_status === 'incomplete')
  };
  const docsExpiring = [];
  nurses.forEach(n => n.documents.forEach(d => {
    if (d.status === 'expiring' || d.status === 'expired' || d.status === 'missing') {
      docsExpiring.push({ nurse: n, doc: d });
    }
  }));
  docsExpiring.sort((a,b) => {
    if (a.doc.status === 'expired' && b.doc.status !== 'expired') return -1;
    if (b.doc.status === 'expired' && a.doc.status !== 'expired') return 1;
    return (new Date(a.doc.expires||0) - new Date(b.doc.expires||0));
  });

  return `
    <div class="page-head">
      <div class="titles">
        <h1>Compliance</h1>
        <p>Live credential status across your nurse roster</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" data-action="bulk-upload-docs">${icon('upload',14)} Bulk upload docs</button>
        <button class="btn btn-brand" data-action="send-renewal-reminders">${icon('mail',14)} Send renewal reminders</button>
      </div>
    </div>

    <div class="stat-grid">
      ${statCard({ label: 'All credentials current', val: byStatus.complete.length })}
      ${statCard({ label: 'Expiring <30 days', val: byStatus.expiring.length, delta: 'action needed', deltaDir: byStatus.expiring.length ? 'down' : 'up' })}
      ${statCard({ label: 'Expired', val: byStatus.expired.length, delta: 'immediate', deltaDir: 'down' })}
      ${statCard({ label: 'Missing required', val: byStatus.incomplete.length })}
    </div>

    <div class="card">
      <div class="card-header"><h3>Credentials requiring attention</h3><small>${docsExpiring.length} items</small></div>
      <div class="table-wrap" style="border:0">
        <table class="tbl">
          <thead><tr><th>Nurse</th><th>Document</th><th>Status</th><th>Expires</th><th></th></tr></thead>
          <tbody>
            ${docsExpiring.slice(0, 20).map(({nurse,doc}) => `
              <tr>
                <td><span class="mini-av">${initials(fullName(nurse))}</span><b>${fullName(nurse)}</b><div style="font-size:11px;color:var(--text-muted)">${nurse.license_type}</div></td>
                <td>${doc.label}</td>
                <td>${doc.status==='expired'?badge('Expired','err'):doc.status==='expiring'?badge('Expiring','warn'):badge('Missing','err')}</td>
                <td>${doc.expires ? fmtDate(doc.expires) : '—'}</td>
                <td><button class="btn btn-secondary btn-sm" data-action="open-nurse" data-id="${nurse.id}">Review</button></td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--text-subtle)">All credentials current. Nothing to show.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

// ============ MESSAGING ============
Views.messages = () => {
  const threads = State.getThreads();
  const active = Views.activeThread || threads[0]?.id;
  const thread = threads.find(t => t.id === active) || threads[0];
  return `
    <div class="page-head">
      <div class="titles">
        <h1>Messages</h1>
        <p>Internal & cross-agency communication</p>
      </div>
      <div class="actions"><button class="btn btn-brand" data-action="new-message">${icon('plus',14)} New message</button></div>
    </div>
    <div class="chat-shell">
      <div class="chat-list">
        <div class="head"><div class="search-bar" style="padding:6px 12px">${icon('search',12)}<input placeholder="Search conversations" /></div></div>
        <div class="items">
          ${threads.map(t => `
            <div class="chat-item ${t.id===active?'active':''}" data-action="open-thread" data-id="${t.id}">
              <div class="av">${initials(t.subject)}</div>
              <div class="meta">
                <div class="name">${t.subject}</div>
                <div class="preview">${t.messages[t.messages.length-1]?.body || ''}</div>
                <div class="time">${relativeTime(t.messages[t.messages.length-1]?.at)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="chat-panel">
        ${thread ? `
          <div class="head">
            <div>
              <div style="font-weight:700; color:var(--navy)">${thread.subject}</div>
              <small>${thread.participants.length} participants</small>
            </div>
            <button class="icon-btn">${icon('phone',16)}</button>
          </div>
          <div class="body" id="chat-body">
            ${thread.messages.map(m => `
              <div class="msg ${m.mine?'me':'them'}">
                ${!m.mine ? `<div style="font-size:10px; opacity:0.7; margin-bottom:2px">${m.from_name}</div>` : ''}
                ${m.body}
                <span class="t">${relativeTime(m.at)}</span>
              </div>
            `).join('')}
          </div>
          <div class="composer">
            <input class="input" id="msg-input" placeholder="Write a message…" style="flex:1" />
            <button class="btn btn-brand" data-action="send-msg" data-thread="${thread.id}">${icon('send',14)} Send</button>
          </div>
        ` : emptyState({ title: 'Select a conversation', message: 'Pick a thread to view messages.' })}
      </div>
    </div>
  `;
};

// ============ AUDIT ============
Views.audit = () => {
  const logs = State.getAudit();
  return `
    <div class="page-head">
      <div class="titles">
        <h1>Audit log</h1>
        <p>All profile, document, and placement changes — full chain of custody</p>
      </div>
      <div class="actions"><button class="btn btn-secondary">${icon('file',14)} Export CSV</button></div>
    </div>
    <div class="table-wrap">
      <table class="tbl">
        <thead><tr><th>When</th><th>Actor</th><th>Role</th><th>Entity</th><th>Action</th></tr></thead>
        <tbody>
          ${logs.map(a => `
            <tr>
              <td style="white-space:nowrap">${fmtDateTime(a.at)}</td>
              <td><b>${a.actor}</b></td>
              <td>${badge(a.actor_role, 'neutral')}</td>
              <td>${a.entity}: <b>${a.entity_name}</b></td>
              <td>${a.action}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// ============ REPORTING ============
Views.reporting = () => {
  const role = State.currentRole();
  const cases = State.getCases().filter(c => c.agency_id === role.agency_id);
  const nurses = State.getNurses().filter(n => n.primary_agency_id === role.agency_id);
  const monthly = [
    { label: 'Nov', val: 18 }, { label: 'Dec', val: 22 }, { label: 'Jan', val: 25 },
    { label: 'Feb', val: 20 }, { label: 'Mar', val: 28 }, { label: 'Apr', val: 32 }
  ];
  const skillDemand = [
    { label: 'Trach', val: 28 }, { label: 'Vent', val: 24 }, { label: 'G-tube', val: 22 },
    { label: 'Seizure', val: 19 }, { label: 'Apnea', val: 12 }, { label: 'CP', val: 9 }
  ];
  return `
    <div class="page-head">
      <div class="titles">
        <h1>Reporting</h1>
        <p>Fill rates, time-to-fill, workforce health</p>
      </div>
      <div class="actions">
        <select class="select" style="max-width:180px"><option>Last 6 months</option><option>Last 12 months</option><option>All time</option></select>
      </div>
    </div>
    <div class="stat-grid">
      ${statCard({ label: 'Placements', val: 145, delta: '+12%' })}
      ${statCard({ label: 'Fill rate', val: '87%', delta: '+4pp' })}
      ${statCard({ label: 'Avg time to fill', val: '3.8 days', delta: '-0.6d' })}
      ${statCard({ label: 'Active nurses', val: nurses.filter(n => n.compliance_status!=='incomplete').length, delta: '+2' })}
    </div>
    <div class="grid-2">
      <div class="card">
        <h3 style="margin-bottom:14px">Placements — last 6 months</h3>
        <div style="padding-top:28px">${barChart(monthly)}</div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:14px">Top requested skills</h3>
        <div style="padding-top:28px">${barChart(skillDemand)}</div>
      </div>
    </div>
  `;
};

// ============ TEAM / AGENCY SETTINGS ============
Views.settings = () => {
  const role = State.currentRole();
  const agency = State.getAgency(role.agency_id);
  const team = window.TNX.AGENCY_TEAM[role.agency_id] || [];
  const canEdit = window.canEditAgency ? window.canEditAgency() : true;
  const isAdmin = role.id === 'super_admin';
  if (role.id === 'recruiter') {
    return `
      <div class="page-head">
        <div class="titles">
          <h1>Settings</h1>
          <p>Recruiters have read-only access — agency admins manage organization settings.</p>
        </div>
      </div>
      <div class="card" style="text-align:center; padding:48px 24px">
        ${icon('shield', 48)}
        <h3 style="margin:14px 0 6px">Limited access</h3>
        <p style="color:var(--text-muted); font-size:13px; max-width:480px; margin:0 auto">Your recruiter role lets you build the pool and run scheduling. Agency profile, billing, partner agreements, and team management are restricted to your agency admin.</p>
      </div>
    `;
  }
  return `
    <div class="page-head">
      <div class="titles">
        <h1>${isAdmin ? 'Platform' : 'Agency'} settings</h1>
        <p>${isAdmin ? 'Super-admin controls' : agency.name}</p>
      </div>
      ${isAdmin ? `<div class="actions">
        <button class="btn btn-danger" data-action="admin-purge">${icon('alert',14)} Purge demo data</button>
      </div>` : ''}
    </div>
    ${isAdmin ? `
      <div class="card" style="margin-bottom:18px; background:linear-gradient(135deg,rgba(225,87,89,0.08),rgba(225,87,89,0.02)); border-color:rgba(225,87,89,0.2)">
        <div style="display:flex; gap:14px; align-items:flex-start; flex-wrap:wrap">
          <div style="width:44px; height:44px; border-radius:12px; background:white; color:var(--err); display:grid; place-items:center; flex-shrink:0">${icon('alert',20)}</div>
          <div style="flex:1; min-width:200px">
            <h3 style="margin-bottom:4px">Destructive zone</h3>
            <p style="color:var(--text-muted); font-size:13px; line-height:1.5">Use the Purge button above to wipe all locally-stored cases, nurses, meets, messages, audit logs, signatures, and uploaded credentials. Requires biometric signature.</p>
          </div>
        </div>
      </div>
    ` : ''}
    <div class="grid-2">
      <div class="stack">
        <div class="card">
          <h3 style="margin-bottom:14px">Agency profile</h3>
          <div class="form-row">
            <div class="field"><label>Legal name</label><input class="input" value="${agency.legal_name}" ${canEdit ? '' : 'disabled'}></div>
            <div class="field"><label>Status</label><div>${agency.status==='verified'?badge('Verified','ok'):badge('Pending verification','warn')}</div></div>
            <div class="field"><label>GA Home Care License</label><input class="input" value="${agency.license_number}" ${canEdit ? '' : 'disabled'}></div>
            <div class="field"><label>Medicaid Provider ID</label><input class="input" value="${agency.medicaid_id}" ${canEdit ? '' : 'disabled'}></div>
          </div>
          <div class="field"><label>Counties served</label>
            <div style="display:flex;flex-wrap:wrap;gap:6px">${agency.counties.map(c => chip(c)).join('')}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Partner agencies (shared pool)</h3><small>${agency.share_partners.length} active agreements</small></div>
          ${agency.share_partners.map(id => {
            const a = State.getAgency(id);
            return `
              <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border)">
                <div class="av">${initials(a.name)}</div>
                <div style="flex:1">
                  <div style="font-weight:600; color:var(--navy); font-size:13px">${a.name}</div>
                  <div style="font-size:11px; color:var(--text-muted)">${a.counties.slice(0,3).join(', ')}</div>
                </div>
                ${badge('Active','ok')}
              </div>
            `;
          }).join('')}
          <button class="btn btn-secondary btn-block btn-sm" style="margin-top:12px" data-action="add-partner-agency" ${canEdit ? '' : 'disabled'}>${icon('plus',12)} Add partner agency</button>
        </div>
      </div>
      <div class="stack">
        <div class="card">
          <div class="card-header"><h3>Team</h3><button class="btn btn-brand btn-sm" data-action="invite-team" ${canEdit ? '' : 'disabled'}>${icon('plus',12)} Invite</button></div>
          ${team.map(t => `
            <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border)">
              <div class="av">${initials(t.name)}</div>
              <div style="flex:1">
                <div style="font-weight:600; color:var(--navy); font-size:13px">${t.name}</div>
                <div style="font-size:11px; color:var(--text-muted)">${t.email}</div>
              </div>
              ${badge(t.role, 'neutral')}
            </div>
          `).join('')}
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px">Billing</h3>
          <div style="display:flex; justify-content:space-between; padding:8px 0; font-size:13px"><span>Plan</span><b>Growth — $499/mo</b></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0; font-size:13px; border-top:1px solid var(--border)"><span>Nurses</span><b>${State.getNurses().filter(n => n.primary_agency_id === role.agency_id).length} of 200 seats</b></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0; font-size:13px; border-top:1px solid var(--border)"><span>Placement fee</span><b>$49 / successful placement</b></div>
        </div>
      </div>
    </div>
  `;
};

// ============ SUPER ADMIN ============
Views.admin = () => {
  const agencies = State.getAgencies();
  const pending = agencies.filter(a => a.status === 'pending');
  const verified = agencies.filter(a => a.status === 'verified');
  const all = State.getNurses();
  return `
    <div class="page-head">
      <div class="titles">
        <h1>Platform overview</h1>
        <p>The Nurse Exchange · Georgia instance</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" data-action="compliance-export">${icon('file',14)} Compliance export</button>
        <button class="btn btn-brand" data-action="add-agency">${icon('plus',14)} Add agency</button>
        <button class="btn btn-danger" data-action="admin-purge">${icon('alert',14)} Purge data</button>
      </div>
    </div>
    <div class="stat-grid">
      ${statCard({ label: 'Agencies verified', val: verified.length, delta: `${pending.length} pending` })}
      ${statCard({ label: 'Nurses in network', val: all.length, delta: '+7 this week' })}
      ${statCard({ label: 'Open cases', val: State.getCases().filter(c => ['open','shortlisting'].includes(c.case_status)).length })}
      ${statCard({ label: 'Fill rate (platform)', val: '87%', delta: '+3pp' })}
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>Verification queue</h3><small>${pending.length} pending</small></div>
        ${pending.length === 0 ? emptyState({ title: 'Queue clear', message: 'No agencies awaiting verification.', icon: 'check' }) :
          pending.map(a => `
            <div style="display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid var(--border)">
              <div class="av av-lg">${initials(a.name)}</div>
              <div style="flex:1">
                <div style="font-weight:700; color:var(--navy)">${a.name}</div>
                <div style="font-size:12px; color:var(--text-muted)">${a.size} · ${a.counties.slice(0,3).join(', ')}</div>
                <div style="font-size:11px; color:var(--text-subtle); margin-top:2px">License ${a.license_number} · Medicaid ${a.medicaid_id}</div>
              </div>
              <button class="btn btn-secondary btn-sm">Review</button>
              <button class="btn btn-brand btn-sm" data-action="verify-agency" data-id="${a.id}">Approve</button>
            </div>
          `).join('')
        }
      </div>
      <div class="card">
        <div class="card-header"><h3>Verified agencies</h3><small>${verified.length} active</small></div>
        ${verified.map(a => `
          <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border)">
            <div class="av">${initials(a.name)}</div>
            <div style="flex:1; min-width:0">
              <div style="font-weight:600; color:var(--navy); font-size:13px">${a.name}</div>
              <div style="font-size:11px; color:var(--text-muted)">${a.size} · ${a.counties.slice(0,3).join(', ')}</div>
            </div>
            ${badge('Verified','ok')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

// ============ NURSE SCHEDULE (dedicated view) ============
Views.nurseSchedule = () => {
  const role = State.currentRole();
  const n = State.getNurse(role.user_id);
  if (!n) return emptyState({ title: 'Profile not found', message: '' });
  const meets = State.getMeets().filter(m => m.nurse_id === n.id);
  const today = new Date(); today.setHours(0,0,0,0);
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const v = (n.availability || {})[iso] || 'off';
    days.push({ iso, d, v, num: d.getDate(), label: d.toLocaleDateString('en-US', { weekday: 'short' }), meets: meets.filter(m => m.scheduled_at.slice(0, 10) === iso) });
  }
  const upcomingMeets = meets.filter(m => m.status === 'scheduled').sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  return `
    <div class="page-head">
      <div class="titles"><h1>My schedule</h1><p>14-day availability + upcoming meets</p></div>
      <div class="actions">
        <button class="btn btn-brand" data-action="update-availability">${icon('calendar',14)} Edit availability</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <div class="card-header">
        <h3>Next 14 days</h3>
        <small>Tap "Edit availability" to set day/night/any</small>
      </div>
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:6px">
        ${days.map(x => {
          const colorMap = { off: 'background:var(--surface-alt); color:var(--text-muted)', day: 'background:var(--ocean-50); color:var(--ocean-600); border-color:var(--ocean)', night: 'background:#1F2D4F; color:#A4D6FF; border-color:#3D5BAB', either: 'background:linear-gradient(135deg,var(--teal-50),var(--ocean-50)); color:var(--navy); border-color:var(--teal)' };
          const lbl = { off: 'Off', day: 'Day', night: 'Night', either: 'Any' };
          return `
            <div style="padding:10px 4px; border:1.5px solid var(--border); border-radius:10px; text-align:center; ${colorMap[x.v]}; min-height:74px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; position:relative">
              <div style="font-size:10px; font-weight:600; opacity:0.7">${x.label}</div>
              <div style="font-size:16px; font-weight:800">${x.num}</div>
              <div style="font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase">${lbl[x.v]}</div>
              ${x.meets.length ? `<div style="position:absolute; top:4px; right:4px; width:7px; height:7px; border-radius:50%; background:var(--err)"></div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <h2 style="margin:24px 0 12px">Upcoming meet & greets</h2>
    ${upcomingMeets.length === 0 ? emptyState({ title: 'Nothing scheduled', message: 'You\'ll see meet & greets here once an agency books one with you.', icon: 'calendar' }) :
      `<div class="stack">${upcomingMeets.map(m => {
        const c = State.getCase(m.case_id);
        return `
          <div class="card" style="display:flex; align-items:center; gap:14px; flex-wrap:wrap">
            <div style="width:46px;height:46px;border-radius:12px;background:var(--teal-50);color:var(--teal-600);display:grid;place-items:center;flex-shrink:0">${icon(m.mode.includes('Virtual')?'video':'handshake',20)}</div>
            <div style="flex:1; min-width:160px">
              <div style="font-weight:700; color:var(--navy)">${c?.child_alias || 'Case'} · ${c?.county || ''}</div>
              <div style="font-size:12px; color:var(--text-muted)">${fmtDateTime(m.scheduled_at)} · ${m.mode}</div>
            </div>
            ${badge('Scheduled','info')}
            <button class="btn btn-secondary btn-sm" data-action="open-meet" data-id="${m.id}">Details</button>
          </div>
        `;
      }).join('')}</div>`
    }
  `;
};

// ============ NURSE CREDENTIALS (dedicated view) ============
Views.nurseCreds = () => {
  const role = State.currentRole();
  const n = State.getNurse(role.user_id);
  if (!n) return emptyState({ title: 'Profile not found', message: '' });
  const total = (n.documents || []).length;
  const complete = (n.documents || []).filter(d => d.status === 'complete').length;
  const expiring = (n.documents || []).filter(d => d.status === 'expiring' || (d.expires && (new Date(d.expires) - Date.now()) < 30 * 86400000 && (new Date(d.expires) - Date.now()) > 0)).length;
  return `
    <div class="page-head">
      <div class="titles"><h1>My credentials</h1><p>License, certifications, and required GAPP documents</p></div>
    </div>
    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      ${statCard({ label: 'Documents on file', val: `${complete} / ${total}` })}
      ${statCard({ label: 'Expiring <30 days', val: expiring })}
      ${statCard({ label: 'Compliance status', val: n.compliance_status === 'complete' ? '100%' : n.compliance_status === 'expiring' ? 'Action needed' : 'Review' })}
    </div>
    <div class="card" style="margin-bottom:16px; background:linear-gradient(135deg, var(--ocean-50), var(--teal-50)); border-color:transparent">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
        <div style="width:36px; height:36px; border-radius:10px; background:white; color:var(--ocean); display:grid; place-items:center; flex-shrink:0">${icon('shield',16)}</div>
        <div style="flex:1; min-width:200px">
          <div style="font-weight:700; color:var(--navy); font-size:14px">Upload accepted formats</div>
          <div style="font-size:12px; color:var(--text-muted)">PDF, JPG, PNG, HEIC, WEBP, DOCX, TIFF · 8 MB max · biometric-signed at upload</div>
        </div>
      </div>
    </div>
    <div class="stack">
      ${(n.documents || []).map(d => {
        const hasFile = !!d.file_data;
        return `
          <div class="doc-row">
            <div class="doc-ico" style="${hasFile ? 'background:var(--teal-50); color:var(--teal-600)' : ''}">${icon(hasFile ? 'check' : 'file',16)}</div>
            <div class="meta" style="flex:1; min-width:0">
              <div class="name">${d.label}</div>
              <div class="sub">
                ${hasFile ? `${d.file_name} · ${(d.file_size/1024).toFixed(0)} KB · ${d.expires ? 'Expires ' + fmtDate(d.expires) : 'No expiration'}` : (d.expires ? 'Expires ' + fmtDate(d.expires) : 'Not uploaded')}
              </div>
              ${hasFile ? `<div class="sub" style="font-family:ui-monospace,monospace; font-size:10px; opacity:0.7">sha256:${(d.file_hash||'').slice(0,18)}…</div>` : ''}
            </div>
            ${d.status === 'complete' ? badge('Current','ok')
              : d.status === 'expiring' ? badge('Expiring soon','warn')
              : d.status === 'expired' ? badge('Expired','err')
              : badge('Missing','err')}
            <div style="display:flex; gap:6px; flex-shrink:0; flex-wrap:wrap">
              ${hasFile ? `<a class="btn btn-ghost btn-sm" href="${d.file_data}" download="${d.file_name}" style="text-decoration:none">${icon('file',12)} View</a>` : ''}
              <button class="btn btn-secondary btn-sm" data-action="upload-doc" data-id="${d.key}">${icon('upload',12)} ${hasFile ? 'Replace' : 'Upload'}</button>
              ${hasFile ? `<button class="btn btn-ghost btn-sm" data-action="remove-doc" data-id="${d.key}">${icon('x',12)}</button>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

// ============ NURSE OPPORTUNITIES (dedicated view) ============
Views.nurseOpps = () => {
  const role = State.currentRole();
  const n = State.getNurse(role.user_id);
  if (!n) return emptyState({ title: 'Profile not found', message: '' });
  const opps = [];
  State.getCases().filter(c => ['open','shortlisting'].includes(c.case_status)).forEach(c => {
    const m = State.getMatches(c.id).find(x => x.nurse_id === n.id);
    if (m && m.score >= 50) opps.push({ ...m, case: c });
  });
  opps.sort((a,b) => b.score - a.score);
  return `
    <div class="page-head">
      <div class="titles"><h1>Opportunities</h1><p>Open cases matched by your skills, county, and shift preference</p></div>
    </div>
    ${opps.length === 0 ? emptyState({ title: 'No active matches', message: 'New cases will appear here automatically.', icon: 'briefcase' }) :
      `<div class="stack">${opps.map(m => `
        <div class="card" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap">
          ${matchRing(m.score)}
          <div style="flex:1; min-width:200px">
            <div style="font-weight:700; color:var(--navy); font-size:15px">${m.case.child_alias} · ${m.case.county}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px">${m.case.shift_type} · ${m.case.requested_hours}hr/wk · starts ${fmtDate(m.case.start_date)}</div>
            <div style="display:flex; gap:4px; flex-wrap:wrap">${m.case.required_skills.slice(0,4).map(s => chip(s, {icon:'check'})).join('')}</div>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px">
            <button class="btn btn-brand btn-sm" data-action="accept-opp" data-case="${m.case.id}">Accept</button>
            <button class="btn btn-ghost btn-sm">Decline</button>
          </div>
        </div>
      `).join('')}</div>`
    }
  `;
};

// ============ NURSE HOME ============
Views.nurseHome = () => {
  const role = State.currentRole();
  const n = State.getNurse(role.user_id);
  if (!n) return emptyState({ title: 'Profile not found', message: '' });

  const myAgency = State.getAgency(n.primary_agency_id);
  const openOpps = [];
  State.getCases().filter(c => ['open','shortlisting'].includes(c.case_status)).forEach(c => {
    const m = State.getMatches(c.id).find(x => x.nurse_id === n.id);
    if (m && m.score >= 55) openOpps.push({ ...m, case: c });
  });
  openOpps.sort((a,b) => b.score - a.score);

  const upcoming = State.getMeets().filter(m => m.nurse_id === n.id && m.status === 'scheduled');

  const displayName = (window.Cryptiq?.getDisplayName() || n.first_name).split(' ')[0];
  return `
    <div class="page-head">
      <div class="titles">
        <h1>Hi, ${displayName}</h1>
        <p>${myAgency.name} · ${n.license_type} · ${n.rating} ★ · ${n.completed_shifts} shifts completed</p>
      </div>
      <div class="actions"><button class="btn btn-brand" data-action="update-availability">${icon('calendar',14)} Update availability</button></div>
    </div>

    <div class="stat-grid">
      ${statCard({ label: 'Matching opportunities', val: openOpps.length })}
      ${statCard({ label: 'Upcoming meets', val: upcoming.length })}
      ${statCard({ label: 'Compliance', val: n.compliance_status === 'complete' ? '100%' : n.compliance_status === 'expiring' ? 'Action needed' : 'Review' })}
      ${statCard({ label: 'Shifts completed', val: n.completed_shifts })}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>Opportunities for you</h3><small>Matched by your skills, location & availability</small></div>
        ${openOpps.length === 0 ? emptyState({ title: 'No active matches', message: 'New cases will appear here automatically.', icon: 'briefcase' }) :
          openOpps.slice(0,5).map(m => `
            <div style="display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid var(--border)">
              ${matchRing(m.score)}
              <div style="flex:1">
                <div style="font-weight:700; color:var(--navy)">${m.case.child_alias}</div>
                <div style="font-size:12px; color:var(--text-muted)">${m.case.county} · ${m.case.shift_type} · ${m.case.requested_hours}hr/wk · starts ${fmtDate(m.case.start_date)}</div>
                <div style="display:flex; gap:4px; margin-top:6px; flex-wrap:wrap">${m.case.required_skills.slice(0,3).map(s => chip(s, {icon:'check'})).join('')}</div>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px">
                <button class="btn btn-brand btn-sm" data-action="accept-opp" data-case="${m.case.id}">Accept</button>
                <button class="btn btn-ghost btn-sm">Decline</button>
              </div>
            </div>
          `).join('')
        }
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-header"><h3>Compliance status</h3>${complianceBadge(n.compliance_status)}</div>
          ${n.documents.slice(0,6).map(d => `
            <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border); font-size:13px">
              <div style="flex:1">${d.label}</div>
              ${d.status === 'complete' ? badge('Current','ok') : d.status === 'expiring' ? badge('Expiring','warn') : badge('Update','err')}
            </div>
          `).join('')}
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px">Upcoming meets</h3>
          ${upcoming.length === 0 ? `<small style="color:var(--text-muted)">No upcoming meetings</small>` :
            upcoming.map(m => {
              const c = State.getCase(m.case_id);
              return `
                <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border)">
                  <div style="width:36px;height:36px;border-radius:10px;background:var(--teal-50);color:var(--teal-600);display:grid;place-items:center;flex-shrink:0">${icon('video',16)}</div>
                  <div style="flex:1">
                    <div style="font-size:13px; font-weight:600; color:var(--navy)">${c.child_alias} · ${c.county}</div>
                    <div style="font-size:11px; color:var(--text-muted)">${fmtDateTime(m.scheduled_at)} · ${m.mode}</div>
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    </div>
  `;
};

// ============ PARENT HOME ============
Views.parentHome = () => {
  const role = State.currentRole();
  const parent = State.getParent(role.user_id);
  const c = State.getCase(parent.case_id);
  if (!c) return emptyState({ title: 'No active case', message: 'Your agency will set this up when onboarding begins.' });
  const matches = State.getMatches(c.id).filter(m => ['shortlisted','accepted','placed'].includes(m.status));
  const meets = State.getMeets().filter(m => m.parent_id === parent.id);

  const displayName = (window.Cryptiq?.getDisplayName() || parent.name).split(' ')[0];
  const agency = State.getAgency(c.agency_id);
  return `
    <div class="page-head">
      <div class="titles">
        <h1>Welcome, ${displayName}</h1>
        <p>Care for ${c.child_alias} · ${c.county} County · ${agency.name}</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" data-action="msg-parent-agency">${icon('message',14)} Message agency</button>
      </div>
    </div>

    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      ${statCard({ label: 'Shortlisted nurses', val: matches.length })}
      ${statCard({ label: 'Meets scheduled', val: meets.filter(m => m.status==='scheduled').length })}
      ${statCard({ label: 'Care priority', val: c.priority === 'urgent' ? 'Urgent' : 'Standard' })}
    </div>

    <div class="card" style="background:linear-gradient(135deg, var(--ocean-50), var(--teal-50)); border-color:transparent; margin-bottom:18px">
      <div style="display:flex; gap:14px; align-items:flex-start; flex-wrap:wrap">
        <div style="width:44px; height:44px; border-radius:12px; background:white; color:var(--ocean); display:grid; place-items:center; flex-shrink:0">${icon('shield',20)}</div>
        <div style="flex:1; min-width:200px">
          <h3 style="margin-bottom:6px">${c.child_alias}'s care plan</h3>
          <p style="color:var(--text-muted); font-size:13px; line-height:1.5; margin-bottom:8px">${c.requested_hours}hr/week · ${c.shift_type} shift · starts ${fmtDate(c.start_date)} · ${c.payer_program}</p>
          <div style="display:flex; gap:6px; flex-wrap:wrap">${c.required_skills.map(s => chip(s, {icon:'check'})).join('')}</div>
        </div>
      </div>
    </div>

    <h2 style="margin:24px 0 14px">Shortlisted nurses for ${c.child_alias}</h2>
    ${matches.length === 0 ? emptyState({ title: 'Shortlist coming soon', message: 'Your agency is reviewing candidates and will share profiles shortly.', icon: 'users' }) :
      `<div class="grid-3" style="gap:16px">
        ${matches.map(m => {
          const n = State.getNurse(m.nurse_id);
          const already = meets.find(x => x.nurse_id === n.id);
          return `
            <div class="nurse-card">
              <div class="top">
                ${n.verified_photo ? `<div class="avatar verified-photo" style="background-image:url('${n.verified_photo}'); background-size:cover; background-position:center; color:transparent">_</div>` : `<div class="avatar">${initials(fullName(n))}</div>`}
                <div>
                  <div class="name">${fullName(n)}</div>
                  <div class="credential">${n.license_type} · ${n.years_experience}y experience</div>
                  <div class="loc">${icon('star',10)} ${n.rating} · ${n.completed_shifts} shifts</div>
                  ${n.face_verified ? `<span class="cq-verified-chip" style="margin-top:4px">${icon('shield',9)} Verified</span>` : ''}
                </div>
              </div>
              <p style="font-size:12px; color:var(--text-muted); line-height:1.5">${n.bio}</p>
              <div class="skills">${n.skills.slice(0,3).map(s => chip(s)).join('')}</div>
              <div class="foot">
                ${already ? badge('Meet scheduled','ok') : `<button class="btn btn-ghost btn-sm" data-action="open-nurse" data-id="${n.id}">View profile</button>`}
                <button class="btn btn-brand btn-sm" data-action="parent-book" data-nurse="${n.id}" data-case="${c.id}">${icon('calendar',12)} ${already?'Reschedule':'Book meet'}</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>`
    }

    <h2 style="margin:32px 0 14px">Your meet & greets</h2>
    ${meets.length === 0 ? emptyState({ title: 'Nothing scheduled', message: 'Book a meet & greet above to get started.', icon: 'calendar' }) :
      `<div class="stack">${meets.map(m => {
        const n = State.getNurse(m.nurse_id);
        return `
          <div class="card" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap">
            <div style="width:48px;height:48px;border-radius:10px;background:var(--teal-50);color:var(--teal-600);display:grid;place-items:center;flex-shrink:0">${icon(m.mode.includes('Virtual')?'video':'handshake',22)}</div>
            <div style="flex:1; min-width:160px">
              <div style="font-weight:700; color:var(--navy)">${fullName(n)}</div>
              <div style="font-size:12px; color:var(--text-muted)">${fmtDateTime(m.scheduled_at)} · ${m.mode}</div>
            </div>
            ${m.status==='completed'
              ? (m.parent_feedback ? (m.parent_feedback==='good_fit' ? badge('You: Good fit','ok') : m.parent_feedback==='maybe' ? badge('You: Maybe','warn') : badge('You: Not a fit','err'))
                : `<div style="display:flex; gap:6px; flex-wrap:wrap">
                    <button class="btn btn-secondary btn-sm" data-action="parent-feedback" data-meet="${m.id}" data-fb="good_fit">${icon('check',12)} Good fit</button>
                    <button class="btn btn-ghost btn-sm" data-action="parent-feedback" data-meet="${m.id}" data-fb="maybe">Maybe</button>
                    <button class="btn btn-ghost btn-sm" data-action="parent-feedback" data-meet="${m.id}" data-fb="not_fit">Not a fit</button>
                  </div>`)
              : badge('Scheduled','info')}
            ${m.status==='scheduled' ? `<button class="btn btn-secondary btn-sm" data-action="open-meet" data-id="${m.id}">Details</button>` : ''}
          </div>
        `;
      }).join('')}</div>`
    }
  `;
};

window.Views = Views;
})();

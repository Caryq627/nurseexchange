/* =========================================================
   State management — localStorage with in-memory layer.
   ========================================================= */

const STORAGE_KEY = 'tnx.state.v1';

const State = (() => {
  // Load any persisted state overlay (user edits). Base data comes from window.TNX.
  function loadOverlay() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
  let overlay = loadOverlay();

  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay)); }

  function reset() { overlay = {}; localStorage.removeItem(STORAGE_KEY); }

  // Snapshot seed IDs at module load so we can detect demo additions later
  const SEED_IDS = {
    NURSES: new Set((window.TNX?.NURSES || []).map(n => n.id)),
    CASES: new Set((window.TNX?.CASES || []).map(c => c.id)),
    MEET_AND_GREETS: new Set((window.TNX?.MEET_AND_GREETS || []).map(m => m.id)),
    AGENCIES: new Set((window.TNX?.AGENCIES || []).map(a => a.id))
  };
  function purgeDemoAdditions() {
    // Remove anything not in the seed snapshot from each collection
    ['NURSES','CASES','MEET_AND_GREETS','AGENCIES'].forEach(key => {
      const cur = get(key);
      const filtered = cur.filter(item => SEED_IDS[key].has(item.id));
      set(key, filtered);
    });
    // Reset audit log to seed (drop any signature/audit additions)
    set('AUDIT_LOGS', (window.TNX.AUDIT_LOGS || []).slice());
    // Reset matches to seed
    set('CASE_MATCHES', { ...(window.TNX.CASE_MATCHES || {}) });
    // Reset message threads to seed
    set('MESSAGE_THREADS', (window.TNX.MESSAGE_THREADS || []).slice());
    // Wipe pending invites + cryptiq signatures + uploaded credential blobs
    try { localStorage.removeItem('tnx.pending_invites'); } catch {}
    try { localStorage.removeItem('tnx.cryptiq.v1'); } catch {}
  }

  // Returns a merged copy — deep-clone for safety.
  function get(key) {
    if (overlay[key]) return JSON.parse(JSON.stringify(overlay[key]));
    return JSON.parse(JSON.stringify(window.TNX[key]));
  }

  function set(key, value) {
    overlay[key] = value;
    persist();
  }

  // ============ Role / session ============
  function currentRole() {
    const rid = localStorage.getItem('tnx.role') || 'agency_admin';
    return window.TNX.ROLES.find(r => r.id === rid) || window.TNX.ROLES[1];
  }
  function setRole(id) {
    localStorage.setItem('tnx.role', id);
  }

  // ============ Domain helpers ============
  function getNurses() { return get('NURSES'); }
  function getNurse(id) { return getNurses().find(n => n.id === id); }
  function updateNurse(id, patch) {
    const all = getNurses();
    const idx = all.findIndex(n => n.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; set('NURSES', all); }
  }

  function getCases() { return get('CASES'); }
  function getCase(id) { return getCases().find(c => c.id === id); }
  function addCase(c) {
    const all = getCases();
    all.unshift(c);
    set('CASES', all);
  }
  function updateCase(id, patch) {
    const all = getCases();
    const idx = all.findIndex(c => c.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; set('CASES', all); }
  }

  function getMatches(caseId) {
    const all = get('CASE_MATCHES');
    return all[caseId] || [];
  }
  function setMatches(caseId, list) {
    const all = get('CASE_MATCHES');
    all[caseId] = list;
    set('CASE_MATCHES', all);
  }
  function updateMatchStatus(caseId, nurseId, status) {
    const all = get('CASE_MATCHES');
    if (!all[caseId]) return;
    const m = all[caseId].find(x => x.nurse_id === nurseId);
    if (m) { m.status = status; set('CASE_MATCHES', all); }
  }

  function addNurse(n) {
    const all = getNurses();
    all.unshift(n);
    set('NURSES', all);
  }

  function getMeets() { return get('MEET_AND_GREETS'); }
  function addMeet(m) {
    const all = getMeets();
    all.push(m);
    set('MEET_AND_GREETS', all);
  }
  function updateMeet(id, patch) {
    const all = getMeets();
    const idx = all.findIndex(m => m.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; set('MEET_AND_GREETS', all); }
  }

  function getThreads() { return get('MESSAGE_THREADS'); }
  function addMessageToThread(threadId, msg) {
    const all = getThreads();
    const t = all.find(x => x.id === threadId);
    if (t) { t.messages.push(msg); set('MESSAGE_THREADS', all); }
  }

  function getAudit() { return get('AUDIT_LOGS'); }
  function logAudit(entry) {
    const all = getAudit();
    all.unshift({ id: 'au-' + Date.now(), at: new Date().toISOString(), ...entry });
    set('AUDIT_LOGS', all.slice(0, 100));
  }

  function getAgencies() { return get('AGENCIES'); }
  function getAgency(id) { return getAgencies().find(a => a.id === id); }
  function updateAgency(id, patch) {
    const all = getAgencies();
    const idx = all.findIndex(a => a.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; set('AGENCIES', all); }
  }
  function addAgency(a) {
    const all = getAgencies();
    all.push(a);
    set('AGENCIES', all);
  }

  function getParent(id) { return window.TNX.PARENTS.find(p => p.id === id); }

  return {
    reset, purgeDemoAdditions, currentRole, setRole,
    getNurses, getNurse, updateNurse, addNurse,
    getCases, getCase, addCase, updateCase,
    getMatches, setMatches, updateMatchStatus,
    getMeets, addMeet, updateMeet,
    getThreads, addMessageToThread,
    getAudit, logAudit,
    getAgencies, getAgency, updateAgency, addAgency,
    getParent
  };
})();

window.State = State;

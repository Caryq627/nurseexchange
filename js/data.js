/* =========================================================
   The Nurse Exchange — Seed Data
   Realistic Georgia GAPP pediatric home care dataset
   ========================================================= */

const GA_COUNTIES = [
  'Fulton', 'DeKalb', 'Cobb', 'Gwinnett', 'Clayton', 'Henry',
  'Cherokee', 'Forsyth', 'Douglas', 'Rockdale', 'Fayette',
  'Chatham', 'Richmond', 'Muscogee', 'Bibb', 'Clarke', 'Hall'
];

const PED_SKILLS = [
  'Tracheostomy Care', 'Ventilator Management', 'G-Tube Feeding', 'J-Tube Feeding',
  'Seizure Management', 'Oxygen Therapy', 'CPAP/BiPAP', 'Suctioning',
  'Central Line Care', 'Wound Care', 'Medication Administration', 'Apnea Monitoring',
  'Pulse Oximetry', 'IV Therapy', 'Catheter Care', 'Autism Support',
  'Down Syndrome Support', 'Cerebral Palsy Care', 'Muscular Dystrophy'
];

const DOC_TYPES = [
  { key: 'rn_license', label: 'GA RN License', required: true },
  { key: 'lpn_license', label: 'GA LPN License', required: false },
  { key: 'cpr_bls', label: 'CPR / BLS Certification', required: true },
  { key: 'pals', label: 'PALS Certification', required: true },
  { key: 'tb_screen', label: 'TB Screening', required: true },
  { key: 'background', label: 'GCIC Background Check', required: true },
  { key: 'physical', label: 'Physical Exam', required: true },
  { key: 'immunizations', label: 'Immunization Record', required: true },
  { key: 'drivers', label: 'Driver\'s License', required: true },
  { key: 'w9', label: 'W-9 / Employment Form', required: true },
  { key: 'gapp_training', label: 'GAPP Orientation', required: true },
  { key: 'hipaa', label: 'HIPAA Training', required: true }
];

const AGENCIES = [
  { id: 'ag-01', name: 'Peach State Pediatric Home Health', legal_name: 'Peach State Pediatric Home Health LLC', license_number: 'GA-PHC-44218', medicaid_id: 'GA-MED-998231', status: 'verified', counties: ['Fulton','DeKalb','Cobb','Gwinnett','Clayton'], insurance_verified: true, founded: '2014', size: '120 nurses', share_partners: ['ag-02','ag-03','ag-05'] },
  { id: 'ag-02', name: 'BrightPath Pediatric Care', legal_name: 'BrightPath Pediatric Care Inc.', license_number: 'GA-PHC-51107', medicaid_id: 'GA-MED-872104', status: 'verified', counties: ['Gwinnett','Forsyth','Hall','Cherokee'], insurance_verified: true, founded: '2018', size: '68 nurses', share_partners: ['ag-01','ag-04'] },
  { id: 'ag-03', name: 'Atlanta Children\'s Home Nursing', legal_name: 'Atlanta Children\'s Home Nursing LLC', license_number: 'GA-PHC-38902', medicaid_id: 'GA-MED-501872', status: 'verified', counties: ['Fulton','DeKalb','Clayton','Henry','Fayette'], insurance_verified: true, founded: '2011', size: '205 nurses', share_partners: ['ag-01','ag-05','ag-06'] },
  { id: 'ag-04', name: 'Magnolia Kids Home Care', legal_name: 'Magnolia Kids Home Care LLC', license_number: 'GA-PHC-60231', medicaid_id: 'GA-MED-714399', status: 'verified', counties: ['Cobb','Douglas','Paulding','Cherokee'], insurance_verified: true, founded: '2020', size: '42 nurses', share_partners: ['ag-02','ag-07'] },
  { id: 'ag-05', name: 'Savannah Coastal Pediatrics', legal_name: 'Savannah Coastal Pediatrics LLC', license_number: 'GA-PHC-29745', medicaid_id: 'GA-MED-331228', status: 'verified', counties: ['Chatham','Bryan','Effingham'], insurance_verified: true, founded: '2016', size: '55 nurses', share_partners: ['ag-01','ag-03'] },
  { id: 'ag-06', name: 'Augusta Care Partners', legal_name: 'Augusta Care Partners LLC', license_number: 'GA-PHC-47512', medicaid_id: 'GA-MED-602187', status: 'verified', counties: ['Richmond','Columbia','McDuffie'], insurance_verified: true, founded: '2015', size: '38 nurses', share_partners: ['ag-03'] },
  { id: 'ag-07', name: 'Piedmont Pediatric Partners', legal_name: 'Piedmont Pediatric Partners Inc.', license_number: 'GA-PHC-PROV-2026-118', medicaid_id: 'pending', status: 'pending', counties: ['Fulton','DeKalb'], insurance_verified: false, founded: '2025', size: '12 nurses', share_partners: [] },
  { id: 'ag-08', name: 'North Georgia Pediatric Nursing', legal_name: 'North Georgia Pediatric Nursing LLC', license_number: 'GA-PHC-PROV-2026-132', medicaid_id: 'pending', status: 'pending', counties: ['Hall','Forsyth','White','Lumpkin'], insurance_verified: true, founded: '2025', size: '8 nurses', share_partners: [] }
];

const FIRST_NAMES_F = ['Tiana','Marissa','Keisha','Patricia','Angela','Brittany','Shameka','Danielle','Crystal','LaToya','Jasmine','Olivia','Emily','Hannah','Rachel','Morgan','Ashley','Taylor','Sierra','Destiny','Aaliyah','Brianna','Chelsea','Courtney','Alyssa','Imani','Amara','Nia','Jada','Maya','Sofia','Isabella','Gabriela'];
const FIRST_NAMES_M = ['Marcus','Terrell','Andre','Jamal','Derek','Christopher','Michael','Kevin','Brandon','Jordan','Tyler','Daniel','Jonathan','Justin','Deshawn','Malik','Elijah','Noah','Lucas','Diego','Ethan'];
const LAST_NAMES = ['Johnson','Williams','Brown','Davis','Wilson','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez','Robinson','Clark','Rodriguez','Lewis','Walker','Hall','Allen','Young','Hernandez','King','Wright','Lopez','Hill','Scott','Green','Adams','Baker','Gonzalez','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart','Sanchez','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey','Rivera','Cooper','Richardson','Cox','Howard','Ward','Torres','Peterson','Gray','Ramirez'];

// Deterministic pseudo-random
function prng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; }; }
const rand = prng(9172026);
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function pickMany(arr, n) { const copy = [...arr]; const out = []; for (let i = 0; i < n && copy.length; i++) { out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]); } return out; }
function daysFromNow(d) { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString(); }

const STOCK_BIOS = [
  'Pediatric RN with 8+ years of trach/vent experience. Passionate about supporting medically fragile children and building trust with families.',
  'LPN specializing in G-tube feeding and seizure management. Cared for GAPP children across three agencies, always on time, always prepared.',
  'Former PICU nurse transitioning into home-based pediatric care. Strong assessment skills and calm presence under pressure.',
  'Bilingual (English/Spanish) pediatric LPN with a warm bedside manner and extensive experience with autism spectrum children.',
  'NICU-trained RN comfortable with ventilator-dependent infants and central line care. Nights preferred.',
  'Compassionate LPN who has worked with the same GAPP family for 5 years. Available for additional shifts in metro Atlanta.',
  'Experienced pediatric nurse, mom of 3, understands what families are going through. Flexible schedule.',
  'Specialty in muscular dystrophy and long-term ventilator care. Comfortable with complex medication regimens.',
  'Pediatric home health nurse — trach, vent, g-tube, oxygen. Detail-oriented charting, strong parent communication.'
];

function genNurse(i, agencyId, overrides = {}) {
  const isFemale = rand() < 0.86;
  const first = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
  const last = pick(LAST_NAMES);
  const isRN = rand() < 0.45;
  const counties = pickMany(GA_COUNTIES, 2 + Math.floor(rand() * 3));
  const skills = pickMany(PED_SKILLS, 3 + Math.floor(rand() * 5));
  const yrs = 1 + Math.floor(rand() * 18);
  const rate = isRN ? 45 + Math.floor(rand() * 18) : 32 + Math.floor(rand() * 12);

  const docs = DOC_TYPES.map(dt => {
    const applicable = dt.key !== (isRN ? 'lpn_license' : 'rn_license');
    if (!applicable) return null;
    const expired = rand() < 0.05;
    const expiring = rand() < 0.12;
    const missing = rand() < 0.07;
    let status = 'complete';
    let expires = daysFromNow(180 + Math.floor(rand() * 400));
    if (expired) { status = 'expired'; expires = daysFromNow(-20 - Math.floor(rand() * 60)); }
    else if (expiring) { status = 'expiring'; expires = daysFromNow(5 + Math.floor(rand() * 25)); }
    else if (missing) { status = 'missing'; expires = null; }
    return { key: dt.key, label: dt.label, status, expires, required: dt.required };
  }).filter(Boolean);

  const missingOrExpired = docs.filter(d => d.required && (d.status === 'missing' || d.status === 'expired')).length;
  const expiringSoon = docs.filter(d => d.status === 'expiring').length;
  let compliance = 'complete';
  if (missingOrExpired > 0) compliance = missingOrExpired > 1 ? 'incomplete' : 'expired';
  else if (expiringSoon > 0) compliance = 'expiring';

  const shareStatus = rand() < 0.55 ? 'shared' : 'private';

  return {
    id: `nr-${String(i).padStart(3,'0')}`,
    first_name: first, last_name: last,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    phone: `(770) 555-${String(1000 + Math.floor(rand() * 8999)).slice(-4)}`,
    license_type: isRN ? 'RN' : 'LPN',
    license_number: `GA${isRN ? 'RN' : 'LPN'}${String(100000 + Math.floor(rand() * 800000))}`,
    license_state: 'GA',
    bio: pick(STOCK_BIOS),
    counties_served: counties,
    languages: rand() < 0.25 ? ['English','Spanish'] : ['English'],
    years_experience: yrs,
    pediatrics_experience: Math.max(1, yrs - Math.floor(rand() * 3)),
    status: 'active',
    skills,
    rate_per_hour: rate,
    shift_preferences: pickMany(['Day','Night','Weekend','Overnight'], 1 + Math.floor(rand() * 3)),
    employment_type: pick(['W-2 Employee','1099 Contractor','PRN']),
    primary_agency_id: agencyId,
    share_status: shareStatus,
    shared_with: shareStatus === 'shared' ? AGENCIES.find(a => a.id === agencyId).share_partners.slice() : [],
    compliance_status: compliance,
    documents: docs,
    onboarded_on: daysFromNow(-30 - Math.floor(rand() * 900)),
    last_active: daysFromNow(-Math.floor(rand() * 6)),
    rating: (4.2 + rand() * 0.8).toFixed(1),
    completed_shifts: 20 + Math.floor(rand() * 380),
    ...overrides
  };
}

const NURSES = [];
for (let i = 1; i <= 48; i++) {
  const agency = AGENCIES[Math.floor(rand() * 6)]; // first 6 verified agencies
  NURSES.push(genNurse(i, agency.id));
}
// Ensure a few high-quality, top-match nurses for demos
NURSES[0] = { ...NURSES[0], first_name: 'Tiana', last_name: 'Johnson', license_type: 'RN', compliance_status: 'complete', skills: ['Tracheostomy Care','Ventilator Management','G-Tube Feeding','Seizure Management','Pulse Oximetry','Suctioning','Medication Administration'], counties_served: ['Fulton','DeKalb','Cobb'], years_experience: 12, pediatrics_experience: 10, rating: '4.9', completed_shifts: 412, bio: 'Pediatric RN, 12 years experience. Trach/vent expert, former PICU. Mother of 2, bilingual (English/Spanish). Weekends + overnights available.', languages: ['English','Spanish'], primary_agency_id: 'ag-01', share_status: 'shared', shared_with: ['ag-02','ag-03','ag-05'], shift_preferences: ['Day','Night','Overnight','Weekend'], face_verified: true, face_match_score: 0.992, documents: NURSES[0].documents.map(d => ({ ...d, status: d.status === 'missing' || d.status === 'expired' ? 'complete' : d.status, expires: d.expires || daysFromNow(200 + Math.floor(rand()*300)) })) };
NURSES[1] = { ...NURSES[1], first_name: 'Marcus', last_name: 'Williams', license_type: 'LPN', compliance_status: 'complete', skills: ['G-Tube Feeding','Seizure Management','Autism Support','Medication Administration','Pulse Oximetry'], counties_served: ['Gwinnett','DeKalb','Fulton'], years_experience: 7, rating: '4.8', completed_shifts: 286, primary_agency_id: 'ag-01', share_status: 'shared', shared_with: ['ag-02','ag-03','ag-05'], face_verified: true, face_match_score: 0.988, documents: NURSES[1].documents.map(d => ({ ...d, status: d.status === 'missing' || d.status === 'expired' ? 'complete' : d.status, expires: d.expires || daysFromNow(200 + Math.floor(rand()*300)) })) };
// Mark ~60% of remaining nurses as face_verified with realistic match scores
for (let i = 2; i < NURSES.length; i++) {
  if (rand() < 0.62) {
    NURSES[i].face_verified = true;
    NURSES[i].face_match_score = 0.94 + rand() * 0.06;
  }
}

const PARENTS = [
  { id: 'pa-01', agency_id: 'ag-01', name: 'Danielle Carter', email: 'danielle.c@example.com', phone: '(404) 555-2198', case_id: 'cs-01' },
  { id: 'pa-02', agency_id: 'ag-01', name: 'Michael & Rebecca Lee', email: 'mrl.family@example.com', phone: '(678) 555-8842', case_id: 'cs-02' },
  { id: 'pa-03', agency_id: 'ag-02', name: 'Angela Hayes', email: 'angela.hayes@example.com', phone: '(770) 555-3351', case_id: 'cs-03' },
  { id: 'pa-04', agency_id: 'ag-03', name: 'Jasmine & David Patel', email: 'patel.family@example.com', phone: '(470) 555-7112', case_id: 'cs-04' },
  { id: 'pa-05', agency_id: 'ag-03', name: 'Sarah Thompson', email: 'sarah.t@example.com', phone: '(404) 555-4461', case_id: 'cs-05' }
];

const CASES = [
  {
    id: 'cs-01', agency_id: 'ag-01', child_alias: 'Child A',
    county: 'Fulton', age_band: '3-5 years',
    required_skills: ['Tracheostomy Care','Ventilator Management','Suctioning','Pulse Oximetry'],
    requested_hours: 56, shift_type: 'Night',
    authorization_status: 'Prior Auth Approved', payer_program: 'Georgia GAPP (Medicaid)',
    start_date: daysFromNow(4), case_status: 'open', priority: 'urgent',
    notes: 'Family requests consistency — preferring 2 primary nurses who can rotate. Trach since age 2, stable but requires overnight vigilance.',
    parent_id: 'pa-01', created_at: daysFromNow(-5)
  },
  {
    id: 'cs-02', agency_id: 'ag-01', child_alias: 'Child B',
    county: 'DeKalb', age_band: '8-10 years',
    required_skills: ['G-Tube Feeding','Seizure Management','Medication Administration','Autism Support'],
    requested_hours: 40, shift_type: 'Day',
    authorization_status: 'Prior Auth Approved', payer_program: 'Georgia GAPP (Medicaid)',
    start_date: daysFromNow(10), case_status: 'shortlisting', priority: 'standard',
    notes: 'School-age child with complex seizure disorder. Prefers female nurse. Parents both work — nurse attends school mornings with child.',
    parent_id: 'pa-02', created_at: daysFromNow(-8)
  },
  {
    id: 'cs-03', agency_id: 'ag-02', child_alias: 'Child C',
    county: 'Gwinnett', age_band: '0-2 years',
    required_skills: ['Apnea Monitoring','CPAP/BiPAP','G-Tube Feeding','Oxygen Therapy'],
    requested_hours: 84, shift_type: 'Overnight',
    authorization_status: 'Prior Auth Approved', payer_program: 'Georgia GAPP (Medicaid)',
    start_date: daysFromNow(2), case_status: 'matched', priority: 'urgent',
    notes: 'NICU discharge with home oxygen + BiPAP. Needs 12hr overnight coverage 7 nights/week. Nurse with NICU background strongly preferred.',
    parent_id: 'pa-03', created_at: daysFromNow(-3)
  },
  {
    id: 'cs-04', agency_id: 'ag-03', child_alias: 'Child D',
    county: 'Clayton', age_band: '11-15 years',
    required_skills: ['Ventilator Management','Tracheostomy Care','Central Line Care','Muscular Dystrophy'],
    requested_hours: 70, shift_type: 'Day',
    authorization_status: 'Prior Auth Approved', payer_program: 'Georgia GAPP (Medicaid)',
    start_date: daysFromNow(14), case_status: 'shortlisting', priority: 'standard',
    notes: 'Teen with Duchenne MD, vent-dependent, stable. Loves video games — looking for nurse who can engage. Central line for meds.',
    parent_id: 'pa-04', created_at: daysFromNow(-12)
  },
  {
    id: 'cs-05', agency_id: 'ag-03', child_alias: 'Child E',
    county: 'Henry', age_band: '6-7 years',
    required_skills: ['Seizure Management','Autism Support','Medication Administration'],
    requested_hours: 30, shift_type: 'Day',
    authorization_status: 'Pending Renewal', payer_program: 'Georgia GAPP (Medicaid)',
    start_date: daysFromNow(21), case_status: 'open', priority: 'standard',
    notes: 'Autism + seizure disorder. After-school coverage Mon-Fri 2pm-8pm. Bilingual nurse a plus.',
    parent_id: 'pa-05', created_at: daysFromNow(-2)
  },
  {
    id: 'cs-06', agency_id: 'ag-02', child_alias: 'Child F',
    county: 'Forsyth', age_band: '3-5 years',
    required_skills: ['Cerebral Palsy Care','G-Tube Feeding','Suctioning'],
    requested_hours: 48, shift_type: 'Day',
    authorization_status: 'Prior Auth Approved', payer_program: 'Georgia GAPP (Medicaid)',
    start_date: daysFromNow(7), case_status: 'open', priority: 'standard',
    notes: 'CP with significant GI involvement. Parent works from home, nurse works alongside during school-prep therapy.',
    parent_id: null, created_at: daysFromNow(-1)
  },
  {
    id: 'cs-07', agency_id: 'ag-05', child_alias: 'Child G',
    county: 'Chatham', age_band: '8-10 years',
    required_skills: ['Down Syndrome Support','Medication Administration','G-Tube Feeding'],
    requested_hours: 35, shift_type: 'Day',
    authorization_status: 'Prior Auth Approved', payer_program: 'Georgia GAPP (Medicaid)',
    start_date: daysFromNow(5), case_status: 'open', priority: 'urgent',
    notes: 'Savannah area. Down syndrome with cardiac history, stable on meds. School pickup + home coverage.',
    parent_id: null, created_at: daysFromNow(-4)
  },
  {
    id: 'cs-08', agency_id: 'ag-01', child_alias: 'Child H',
    county: 'Cobb', age_band: '0-2 years',
    required_skills: ['Apnea Monitoring','Oxygen Therapy','Medication Administration'],
    requested_hours: 40, shift_type: 'Night',
    authorization_status: 'Prior Auth Approved', payer_program: 'Georgia GAPP (Medicaid)',
    start_date: daysFromNow(9), case_status: 'placed', priority: 'standard',
    notes: 'Infant with BPD, home oxygen. Placement confirmed with two primary nurses rotating overnight.',
    parent_id: null, created_at: daysFromNow(-20)
  }
];

// Precompute match scores for each open case
function computeMatches() {
  const matches = {};
  CASES.forEach(c => {
    const candidates = NURSES
      .filter(n => n.compliance_status !== 'incomplete')
      .map(n => {
        let score = 40;
        const countyMatch = n.counties_served.includes(c.county);
        const skillOverlap = c.required_skills.filter(s => n.skills.includes(s)).length;
        const skillPct = skillOverlap / c.required_skills.length;
        const shiftMatch = n.shift_preferences.some(sp => c.shift_type.toLowerCase().includes(sp.toLowerCase()));
        const sameAgency = n.primary_agency_id === c.agency_id;
        const sharedHere = n.shared_with.includes(c.agency_id);
        score += countyMatch ? 20 : -10;
        score += skillPct * 30;
        score += shiftMatch ? 8 : 0;
        score += sameAgency ? 6 : (sharedHere ? 3 : -20);
        if (n.compliance_status === 'complete') score += 6;
        if (n.compliance_status === 'expiring') score += 1;
        score = Math.max(12, Math.min(98, Math.round(score)));
        return { nurse_id: n.id, case_id: c.id, score, status: 'suggested' };
      })
      .sort((a,b) => b.score - a.score);
    matches[c.id] = candidates;
  });
  return matches;
}
const CASE_MATCHES = computeMatches();

// Shortlist some for cases-in-progress
CASE_MATCHES['cs-01'].slice(0,3).forEach(m => m.status = 'shortlisted');
CASE_MATCHES['cs-02'].slice(0,4).forEach(m => m.status = 'shortlisted');
CASE_MATCHES['cs-03'].slice(0,2).forEach(m => m.status = 'accepted');
CASE_MATCHES['cs-04'].slice(0,3).forEach(m => m.status = 'shortlisted');
CASE_MATCHES['cs-08'].slice(0,2).forEach(m => { m.status = 'placed'; });

const MEET_AND_GREETS = [
  { id: 'mg-01', case_id: 'cs-02', nurse_id: CASE_MATCHES['cs-02'][0].nurse_id, parent_id: 'pa-02', scheduled_at: daysFromNow(2), mode: 'Virtual (Zoom)', status: 'scheduled', parent_feedback: null, agency_feedback: null },
  { id: 'mg-02', case_id: 'cs-02', nurse_id: CASE_MATCHES['cs-02'][1].nurse_id, parent_id: 'pa-02', scheduled_at: daysFromNow(3), mode: 'In-person', status: 'scheduled', parent_feedback: null, agency_feedback: null },
  { id: 'mg-03', case_id: 'cs-01', nurse_id: CASE_MATCHES['cs-01'][0].nurse_id, parent_id: 'pa-01', scheduled_at: daysFromNow(-2), mode: 'In-person', status: 'completed', parent_feedback: 'good_fit', agency_feedback: 'good_fit' },
  { id: 'mg-04', case_id: 'cs-04', nurse_id: CASE_MATCHES['cs-04'][0].nurse_id, parent_id: 'pa-04', scheduled_at: daysFromNow(5), mode: 'Virtual (Zoom)', status: 'scheduled', parent_feedback: null, agency_feedback: null },
  { id: 'mg-05', case_id: 'cs-04', nurse_id: CASE_MATCHES['cs-04'][1].nurse_id, parent_id: 'pa-04', scheduled_at: daysFromNow(-5), mode: 'In-person', status: 'completed', parent_feedback: 'maybe', agency_feedback: 'good_fit' }
];

const MESSAGE_THREADS = [
  {
    id: 'th-01', subject: 'Child A — Night Coverage', participants: ['ag-01','nr-001'],
    messages: [
      { from: 'ag-01', from_name: 'Sandra (Peach State)', body: 'Hi Tiana — we have a new overnight Fulton case starting next week that matches your skills. Interested?', at: daysFromNow(-2), mine: false },
      { from: 'nr-001', from_name: 'Tiana Johnson', body: 'Yes! Can you send more details? Trach/vent right?', at: daysFromNow(-2), mine: true },
      { from: 'ag-01', from_name: 'Sandra (Peach State)', body: 'Correct. 12hr overnight, 4 nights/week, Fulton. Auth approved. Meet & greet scheduled for Thursday.', at: daysFromNow(-1), mine: false },
      { from: 'nr-001', from_name: 'Tiana Johnson', body: 'Perfect. I\'ll confirm Thursday.', at: daysFromNow(-1), mine: true }
    ]
  },
  {
    id: 'th-02', subject: 'Child B — Meet & Greet Follow-up', participants: ['pa-02','ag-01'],
    messages: [
      { from: 'pa-02', from_name: 'Michael Lee', body: 'We really liked Marcus from the intro call yesterday. How do we move forward?', at: daysFromNow(-1), mine: false },
      { from: 'ag-01', from_name: 'Sandra (Peach State)', body: 'Wonderful! I\'ll confirm with Marcus and send the start paperwork today.', at: daysFromNow(-1), mine: true }
    ]
  },
  {
    id: 'th-03', subject: 'Cross-agency request — Child D', participants: ['ag-03','ag-01'],
    messages: [
      { from: 'ag-03', from_name: 'Robert (Atlanta Children\'s)', body: 'Any chance you have a vent-certified RN available for Clayton County? We\'re stretched thin.', at: daysFromNow(-3), mine: false },
      { from: 'ag-01', from_name: 'Sandra (Peach State)', body: 'Let me check the shared pool — I have 2 that could work. Sending profiles shortly.', at: daysFromNow(-3), mine: true }
    ]
  }
];

const AUDIT_LOGS = [
  { id: 'au-01', actor: 'Sandra Mitchell', actor_role: 'Agency Admin', entity: 'Case', entity_name: 'Child A — Fulton Overnight', action: 'created', at: daysFromNow(-5) },
  { id: 'au-02', actor: 'Sandra Mitchell', actor_role: 'Agency Admin', entity: 'Nurse', entity_name: 'Tiana Johnson', action: 'shortlisted for Child A', at: daysFromNow(-4) },
  { id: 'au-03', actor: 'Tiana Johnson', actor_role: 'Nurse', entity: 'Document', entity_name: 'CPR/BLS Certification', action: 'uploaded', at: daysFromNow(-4) },
  { id: 'au-04', actor: 'Danielle Carter', actor_role: 'Parent', entity: 'Meet & Greet', entity_name: 'with Tiana Johnson', action: 'confirmed', at: daysFromNow(-3) },
  { id: 'au-05', actor: 'System', actor_role: 'System', entity: 'Credential', entity_name: 'Ashley Brown — PALS', action: 'expiring alert (14 days)', at: daysFromNow(-3) },
  { id: 'au-06', actor: 'Robert Hayes', actor_role: 'Agency Admin', entity: 'Cross-agency Request', entity_name: 'Peach State → Atlanta Children\'s', action: 'sent for Child D', at: daysFromNow(-3) },
  { id: 'au-07', actor: 'Marcus Williams', actor_role: 'Nurse', entity: 'Opportunity', entity_name: 'Child B — Day Shift', action: 'accepted', at: daysFromNow(-2) },
  { id: 'au-08', actor: 'Michael Lee', actor_role: 'Parent', entity: 'Meet & Greet', entity_name: 'with Marcus Williams', action: 'rated "Good Fit"', at: daysFromNow(-1) },
  { id: 'au-09', actor: 'Sandra Mitchell', actor_role: 'Agency Admin', entity: 'Placement', entity_name: 'Marcus Williams → Child B', action: 'confirmed', at: daysFromNow(-1) },
  { id: 'au-10', actor: 'Super Admin', actor_role: 'Super Admin', entity: 'Agency', entity_name: 'Piedmont Pediatric Partners', action: 'requested verification', at: daysFromNow(0) }
];

const AGENCY_TEAM = {
  'ag-01': [
    { id: 'u-01', name: 'Sandra Mitchell', email: 'sandra@peachstate.example', role: 'Agency Admin', phone: '(404) 555-1001' },
    { id: 'u-02', name: 'Jerome Phillips', email: 'jerome@peachstate.example', role: 'Recruiter', phone: '(404) 555-1002' },
    { id: 'u-03', name: 'Tamika Reyes', email: 'tamika@peachstate.example', role: 'Scheduler', phone: '(404) 555-1003' },
    { id: 'u-04', name: 'Christine Yang, RN', email: 'christine@peachstate.example', role: 'Clinical Supervisor', phone: '(404) 555-1004' }
  ]
};

const ROLES = [
  { id: 'super_admin', label: 'Super Admin', persona: 'Platform oversight & agency approvals', home: '#/admin', agency_id: null, user_id: 'sa-01', name: 'Platform Admin' },
  { id: 'agency_admin', label: 'Agency Admin', persona: 'Peach State Pediatric — manage nurses & cases', home: '#/dashboard', agency_id: 'ag-01', user_id: 'u-01', name: 'Sandra Mitchell' },
  { id: 'recruiter', label: 'Recruiter / Scheduler', persona: 'Peach State — onboard & schedule', home: '#/dashboard', agency_id: 'ag-01', user_id: 'u-02', name: 'Jerome Phillips' },
  { id: 'nurse', label: 'Nurse', persona: 'Tiana Johnson, RN — opportunities & schedule', home: '#/nurse-home', agency_id: 'ag-01', user_id: 'nr-001', name: 'Tiana Johnson' },
  { id: 'parent', label: 'Parent / Guardian', persona: 'Danielle Carter — Child A', home: '#/parent-home', agency_id: 'ag-01', user_id: 'pa-01', name: 'Danielle Carter' }
];

const PLATFORM_STATS = {
  total_nurses: NURSES.length,
  total_agencies: AGENCIES.filter(a => a.status === 'verified').length,
  pending_agencies: AGENCIES.filter(a => a.status === 'pending').length,
  open_cases: CASES.filter(c => c.case_status === 'open' || c.case_status === 'shortlisting').length,
  placements_this_month: 14,
  avg_time_to_fill_days: 3.8,
  fill_rate: 0.87,
  expiring_creds: NURSES.filter(n => n.compliance_status === 'expiring').length
};

// Expose on window so scripts in any order can read
window.TNX = {
  GA_COUNTIES, PED_SKILLS, DOC_TYPES,
  AGENCIES, NURSES, PARENTS, CASES, CASE_MATCHES,
  MEET_AND_GREETS, MESSAGE_THREADS, AUDIT_LOGS,
  AGENCY_TEAM, ROLES, PLATFORM_STATS
};

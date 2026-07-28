/* =========================================================================
   Kundeonboarding — klikbar mockup
   Rent frontend (ingen backend). Al "CVR-opslag", ERP-integration, KYC-
   tredjepartsproces mv. er simuleret med mock-data, jf. MVP-afgrænsningen
   beskrevet i README.md.
   ========================================================================= */

/* ---------------------------------------------------------------------- */
/* Utils                                                                   */
/* ---------------------------------------------------------------------- */

function el(id) { return document.getElementById(id); }

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function kr(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('da-DK', { maximumFractionDigits: 0 }) + ' kr.';
}

function uid() { return Math.random().toString(36).slice(2, 9); }

function setPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
  cur[keys[keys.length - 1]] = value;
}

/* ---------------------------------------------------------------------- */
/* Mock data                                                               */
/* ---------------------------------------------------------------------- */

const MOCK_CVR_DB = {
  '15807776': {
    virksomhedsnavn: 'Partner Revision statsautoriseret revisionsaktieselskab',
    virksomhedsform: 'Aktieselskab (A/S)',
    status: 'Normal (aktiv)',
    startdato: '6. december 1991',
    branchekode: '692000 – Bogføring og revision; skatterådgivning',
    antalAnsatte: 217,
    aarsafslutning: '31. december',
    adresse: { gade: 'Industrivej Nord 15', postnr: '7400', by: 'Herning' },
    moderselskab: 'Partner Revision Holding af 1/10 2024 statsautoriseret revisionsaktieselskab',
    datterselskaber: [],
    reelleEjere: [
      { navn: 'Lars Fruergaard Jørgensen', andel: '25-50%', andelPct: 40 },
      { navn: 'Novo Holdings A/S', andel: 'Over 50%', andelPct: 60 },
    ],
    kontaktpersonForslag: [
      { navn: 'Lars Fruergaard Jørgensen', rolle: '', reelEjer: true },
      { navn: 'Novo Holdings A/S (repr.)', rolle: '', reelEjer: true },
    ],
    partnerForslag: [
      { type: 'Bank', virksomhed: 'Jyske Bank', kontaktnavn: 'Mette Holm', rolle: '', telefon: '', mail: '' },
    ],
  },
};

const SR_LIST = [
  { navn: 'Peter Vinderslev', afdeling: 'Herning' },
  { navn: 'Anna Byrn (demo: flere afdelinger)', afdeling: null },
];

const DEPARTMENTS = ['Herning', 'Brande', 'Aarhus', 'Silkeborg'];
const EMPLOYEES = ['Peter Vinderslev', 'Line Thomsen', 'Anne Dorte', 'Ketil Lemming', 'Mette Holm'];
const ACCESS_LEVELS = ['Ejer', 'Kan redigere', 'Kan se'];
const TEAM_ROLES = ['SR', 'LR', 'Teammedlem'];
const STANDARD_SR = 'Peter Vinderslev'; // ANTAGELSE — se README (ikke fastlagt i specifikationen)

const TABS = [
  { id: 'stamdata', label: 'Stamdata' },
  { id: 'udvidet', label: 'Udvidet stamdata' },
  { id: 'team', label: 'Team' },
  { id: 'kyc', label: 'Hvidvask (KYC)' },
  { id: 'service', label: 'Service' },
  { id: 'dokumenter', label: 'Dokumenter' },
];

const MOMS_INTERVALLER = ['Kvartal', 'Månedligt', 'Halvårligt', 'Årligt'];
const MONTHS_IN_INTERVAL = { Kvartal: 3, Månedligt: 1, Halvårligt: 6, Årligt: 12 };
const INTERVAL_UNIT_LABEL = { Kvartal: 'kvartal', Månedligt: 'måned', Halvårligt: 'halvår', Årligt: 'år' };

// Lønperioder pr. år pr. løntype — fra specifikationens edge case.
const LOENPERIODER = { funktionaer: 12, fjortenDage: 26, timelonnet: 12, elev: 12 };
const LOEN_LABELS = { funktionaer: 'Funktionær', fjortenDage: '14-dages lønnede', timelonnet: 'Timelønnede', elev: 'Elev' };

/* ---------------------------------------------------------------------- */
/* State                                                                   */
/* ---------------------------------------------------------------------- */

let state = {
  screen: 'start',           // 'start' | 'app' | 'done'
  currentTab: 'stamdata',
  savedTabs: new Set(),
  start: { cvr: '15807776', sr: SR_LIST[0].navn, noCvr: false, type: '', cpr: '', cvrError: '' },
  customer: null,
};

function newCustomerFromStart(start) {
  const cvrData = !start.noCvr ? MOCK_CVR_DB[start.cvr] : null;
  const contacts = (cvrData?.kontaktpersonForslag || []).map((c, i) => ({
    id: uid(), primary: i === 0, navn: c.navn, rolle: c.rolle, telefon: '', mail: '',
    underskriver: false, reelEjer: c.reelEjer, portalAdgang: false,
  }));
  const partners = (cvrData?.partnerForslag || []).map((p) => ({ id: uid(), ...p }));
  const srInfo = SR_LIST.find((s) => s.navn === start.sr);

  return {
    cvr: start.cvr,
    noCvr: start.noCvr,
    type: start.type,
    cpr: start.cpr,
    sr: start.sr,
    internName: cvrData ? cvrData.virksomhedsnavn : (start.type === 'Person' ? '' : ''),
    companyPhone: '', companyMail: '',
    afdeling: srInfo && srInfo.afdeling ? srInfo.afdeling : '',
    cvrData: cvrData ? { ...cvrData } : {
      virksomhedsnavn: '', virksomhedsform: start.type === 'Person' ? 'Personligt ejet' : '', status: '',
      startdato: '', branchekode: '', antalAnsatte: '', aarsafslutning: '',
      adresse: { gade: '', postnr: '', by: '' }, moderselskab: '', datterselskaber: [],
      reelleEjere: start.type === 'Person' ? [{ navn: '(personen selv)', andel: '100%', andelPct: 100 }] : [],
    },
    contacts,
    partners,
    team: [
      { id: uid(), navn: start.sr, rolle: 'SR', adgang: 'Ejer' },
      { id: uid(), navn: 'Line Thomsen', rolle: 'LR', adgang: 'Kan redigere' },
      { id: uid(), navn: 'Anne Dorte', rolle: 'Teammedlem', adgang: 'Kan redigere' },
      { id: uid(), navn: 'Ketil Lemming', rolle: 'Teammedlem', adgang: 'Kan se' },
    ],
    kyc: { status: 'Ikke startet', pep: 'Ikke tjekket', sidstOpdateret: null, docs: [] },
    service: {
      faktureringsmail: '',
      revision: {
        active: true, erklaeringstype: 'Revision', tilgangDato: '', tilgangAarsag: 'Netværk',
        selvangivelse: 'Fra kontaktpersoner', assistancepris: '', timepris: '',
      },
      bogforing: {
        active: true, assistancetype: 'Bogføring og momsindberetning', momsinterval: 'Kvartal',
        forhold: { projekter: false, afdelinger: false, lager: false, kreditor: false, udlaeg: false, rykker: false, webshop: false },
        assistancepris: '', posteringer: '',
        team: [{ id: uid(), rolle: 'Ansvarlig', timepris: 650, timer: 9 }, { id: uid(), rolle: 'Assistent', timepris: 450, timer: 15 }],
      },
      lon: {
        active: true,
        typer: { funktionaer: true, fjortenDage: true, timelonnet: false, elev: true },
        antal: { funktionaer: 14, fjortenDage: 6, timelonnet: 0, elev: 2 },
        pris: { funktionaer: 185, fjortenDage: 140, timelonnet: 0, elev: 150 },
        overenskomster: { industri: false, funktionaer: true, byg: false, ingen: false },
        timeprisRaadgivning: 750, timerRaadgivning: 3,
      },
      raadgivning: [{ id: uid(), service: 'Digitalisering', timer: 6, timepris: 1100, fastpris: '', medarbejder: 'Line Thomsen' }],
    },
  };
}

/* ---------------------------------------------------------------------- */
/* Validation helpers                                                     */
/* ---------------------------------------------------------------------- */

function teamHasLR(customer) {
  return customer.team.some((t) => t.rolle === 'LR');
}

function serviceHasAny(service) {
  return service.revision.active || service.bogforing.active || service.lon.active || service.raadgivning.length > 0;
}

function tabStatus(tabId, customer) {
  if (!customer) return 'pending';
  switch (tabId) {
    case 'stamdata':
      return customer.internName ? 'done' : 'pending';
    case 'udvidet':
      return customer.contacts.length > 0 ? 'done' : 'pending';
    case 'team':
      return teamHasLR(customer) ? 'done' : 'warn';
    case 'kyc':
      return customer.kyc.status === 'Godkendt' ? 'done' : 'pending';
    case 'service':
      return serviceHasAny(customer.service) && customer.service.faktureringsmail ? 'done' : 'warn';
    case 'dokumenter':
      return 'pending';
    default:
      return 'pending';
  }
}

/* ---------------------------------------------------------------------- */
/* Render: root                                                           */
/* ---------------------------------------------------------------------- */

function render() {
  const root = el('app');
  if (state.screen === 'start') {
    root.innerHTML = renderStart();
  } else if (state.screen === 'done') {
    root.innerHTML = renderDone();
  } else {
    root.innerHTML = renderShell();
  }
}

/* ---------------------------------------------------------------------- */
/* Start screen                                                           */
/* ---------------------------------------------------------------------- */

function renderStart() {
  const s = state.start;
  return `
  <div class="centerwrap">
    <div class="pagehead">
      <h1 class="doctitle">Kundeonboarding</h1>
      <p class="subtitle">Klikbar mockup — Partner Revision</p>
      <p class="meta">Ingen data gemmes på server. Alt er lokalt i browseren til demoformål.</p>
    </div>
    <div class="startbox panel" style="max-width:none;margin:0;">
      <div class="card-title">Opret kunde</div>
      <div class="grid2">
        <div class="field">
          <label>CVR-nummer</label>
          <input data-bind="start.cvr" value="${esc(s.cvr)}" ${s.noCvr ? 'disabled' : ''}>
        </div>
        <div class="field">
          <label>Statsautoriseret revisor (SR)</label>
          <select data-bind="start.sr" data-recalc="start">
            ${SR_LIST.map((sr) => `<option value="${esc(sr.navn)}" ${sr.navn === s.sr ? 'selected' : ''}>${esc(sr.navn)}</option>`).join('')}
          </select>
        </div>
      </div>
      ${s.cvrError ? `<div class="danger-bar">${esc(s.cvrError)}</div>` : ''}
      <div class="field">
        <label class="checkline"><input type="checkbox" data-bind="start.noCvr" data-recalc="start" ${s.noCvr ? 'checked' : ''}>Intet CVR</label>
      </div>
      ${s.noCvr ? `
      <div style="background:#f1efe8;border-radius:8px;padding:12px;">
        <div class="grid2">
          <div class="field">
            <label>Type <span class="req">*</span></label>
            <select data-bind="start.type" data-recalc="start">
              <option value="" ${s.type === '' ? 'selected' : ''}>Vælg...</option>
              <option value="Fond" ${s.type === 'Fond' ? 'selected' : ''}>Fond</option>
              <option value="Person" ${s.type === 'Person' ? 'selected' : ''}>Person</option>
              <option value="Forening" ${s.type === 'Forening' ? 'selected' : ''}>Forening</option>
            </select>
          </div>
          ${s.type === 'Person' ? `
          <div class="field">
            <label>CPR-nummer <span class="req">*</span></label>
            <input data-bind="start.cpr" placeholder="XXXXXX-XXXX" value="${esc(s.cpr)}">
            <p class="note-inline">Vises kun ved Type = Person. CPR er persondata — vises aldrig uden for dette felt i mockuppen.</p>
          </div>` : ''}
        </div>
      </div>` : ''}
      <div class="footerbar" style="max-width:none;margin-top:20px;">
        <span></span>
        <button class="btn btn-accent" data-action="start-create" ${!canCreateStart(s) ? 'disabled' : ''}>Opret kunde →</button>
      </div>
    </div>
  </div>`;
}

function canCreateStart(s) {
  if (s.noCvr) {
    if (!s.type) return false;
    if (s.type === 'Person' && !s.cpr) return false;
    return true;
  }
  return !!s.cvr;
}

/* ---------------------------------------------------------------------- */
/* App shell (sidenav + active tab)                                       */
/* ---------------------------------------------------------------------- */

function renderShell() {
  const c = state.customer;
  return `
  <div class="shell">
    <nav class="sidenav">
      <div class="brand">Kundeonboarding</div>
      ${TABS.map((t) => {
        const status = tabStatus(t.id, c);
        const cls = ['navstep'];
        if (t.id === state.currentTab) cls.push('active');
        if (status === 'done') cls.push('done');
        if (status === 'warn') cls.push('warn');
        return `<button class="${cls.join(' ')}" data-action="goto-tab" data-tab="${t.id}"><span class="dot"></span>${esc(t.label)}</button>`;
      }).join('')}
      <div style="margin-top:18px;border-top:1px solid var(--border);padding-top:12px;">
        <button class="navstep" data-action="restart"><span class="dot" style="background:transparent"></span>← Start forfra</button>
      </div>
    </nav>
    <main class="mainarea">
      <div class="pagehead">
        <h1 class="doctitle">${esc(c.internName || c.cvrData.virksomhedsnavn || 'Ny kunde')}</h1>
        <p class="subtitle">CVR ${c.noCvr ? '— intet CVR (' + esc(c.type) + ')' : esc(c.cvr)} · SR: ${esc(c.sr)}</p>
      </div>
      ${renderTab(state.currentTab, c)}
    </main>
  </div>`;
}

function renderTab(tabId, c) {
  switch (tabId) {
    case 'stamdata': return renderStamdata(c);
    case 'udvidet': return renderUdvidet(c);
    case 'team': return renderTeam(c);
    case 'kyc': return renderKyc(c);
    case 'service': return renderService(c);
    case 'dokumenter': return renderDokumenter(c);
    default: return '';
  }
}

function tabBar(activeId) {
  return `<div class="tabs">${TABS.map((t) => `<button class="tab ${t.id === activeId ? 'active' : ''}" data-action="goto-tab" data-tab="${t.id}">${esc(t.label)}</button>`).join('')}</div>`;
}

function footerNav(currentId, nextLabel) {
  const idx = TABS.findIndex((t) => t.id === currentId);
  const next = TABS[idx + 1];
  return `
  <div class="footerbar">
    <span class="stepdots">Fane ${idx + 1} af ${TABS.length}</span>
    ${next ? `<button class="btn btn-accent" data-action="save-continue" data-tab="${currentId}" data-next="${next.id}">Gem og fortsæt til ${esc(next.label)} →</button>`
           : `<button class="btn btn-accent" data-action="finish">Fuldfør oprettelse →</button>`}
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* 1. Stamdata                                                            */
/* ---------------------------------------------------------------------- */

function renderStamdata(c) {
  const d = c.cvrData;
  const multiDept = SR_LIST.find((s) => s.navn === c.sr && s.afdeling === null);
  return `
  <div class="panel">
    ${tabBar('stamdata')}
    ${c.noCvr
      ? `<div class="warn-bar">Intet CVR valgt — felterne herunder er manuelle og redigerbare.</div>`
      : `<div class="success-bar">✓ Data hentet fra CVR-registeret · 27. juli 2026</div>`}

    <div class="accent-box">
      <span class="accent-label">REDIGERBART</span>
      <label style="margin-top:6px">Internt navn (sendes til Uniconta)</label>
      <input data-bind="internName" data-action-input="intern-name" value="${esc(c.internName)}">
      <p class="note-inline">Må aldrig stå tomt. Tømmes feltet og forlades det, genudfyldes det automatisk med CVR-navnet.</p>
    </div>

    <div class="card-title">${c.noCvr ? 'Stamdata (manuel)' : 'Hentet fra CVR (låst)'}</div>
    <div class="grid2">
      <div class="field"><label>Virksomhedsnavn</label><input value="${esc(d.virksomhedsnavn)}" ${c.noCvr ? 'data-bind="cvrData.virksomhedsnavn" data-recalc="stamdata"' : 'readonly'}></div>
      <div class="field"><label>Virksomhedsform</label><input value="${esc(d.virksomhedsform)}" ${c.noCvr && c.type !== 'Person' ? 'data-bind="cvrData.virksomhedsform"' : 'readonly'}>${c.noCvr && c.type === 'Person' ? '<p class="note-inline">Sat automatisk til "Personligt ejet", fordi Type = Person.</p>' : ''}</div>
      <div class="field"><label>Status</label><input value="${esc(d.status)}" ${c.noCvr ? 'data-bind="cvrData.status"' : 'readonly'}></div>
      <div class="field"><label>Startdato</label><input value="${esc(d.startdato)}" ${c.noCvr ? 'data-bind="cvrData.startdato"' : 'readonly'}></div>
      <div class="field"><label>Branchekode</label><input value="${esc(d.branchekode)}" ${c.noCvr ? 'data-bind="cvrData.branchekode"' : 'readonly'}></div>
      <div class="field"><label>Antal ansatte (hele virksomheden)</label><input value="${esc(d.antalAnsatte)}" ${c.noCvr ? 'data-bind="cvrData.antalAnsatte"' : 'readonly'}></div>
      <div class="field"><label>Årsafslutning</label><input value="${esc(d.aarsafslutning)}" ${c.noCvr ? 'data-bind="cvrData.aarsafslutning"' : 'readonly'}></div>
      <div class="field"><label>CVR-nummer</label><input value="${c.noCvr ? '—' : esc(c.cvr)}" readonly></div>
      <div class="field">
        <label>Adresse</label><input value="${esc(d.adresse.gade)}" ${c.noCvr ? 'data-bind="cvrData.adresse.gade"' : 'readonly'} style="margin-bottom:6px">
        <div class="grid2">
          <input value="${esc(d.adresse.postnr)}" ${c.noCvr ? 'data-bind="cvrData.adresse.postnr"' : 'readonly'}>
          <input value="${esc(d.adresse.by)}" ${c.noCvr ? 'data-bind="cvrData.adresse.by"' : 'readonly'}>
        </div>
      </div>
      <div class="field"><label>Telefon (valgfrit)</label><input data-bind="companyPhone" value="${esc(c.companyPhone)}" placeholder="Ikke registreret i CVR"></div>
      <div class="field"><label>Mail (valgfrit)</label><input data-bind="companyMail" value="${esc(c.companyMail)}" placeholder="Ikke registreret i CVR"></div>
    </div>

    <div class="card-title" style="margin-top:14px">Kundestamdata (internt)</div>
    <div class="field">
      <label>Afdeling ${multiDept ? '<span class="req">*</span>' : ''}</label>
      <select data-bind="afdeling" class="${multiDept && !c.afdeling ? 'invalid' : ''}">
        <option value="" ${!c.afdeling ? 'selected' : ''}>${multiDept ? 'Vælg afdeling...' : ''}</option>
        ${DEPARTMENTS.map((dep) => `<option value="${dep}" ${c.afdeling === dep ? 'selected' : ''}>${dep}</option>`).join('')}
      </select>
      <p class="note-inline">${multiDept
        ? 'Edge case: valgte SR er knyttet til flere afdelinger — kan ikke forudfyldes entydigt. Vælg aktivt.'
        : 'Forudfyldt ud fra SR. Kan altid ændres.'}</p>
    </div>

    ${footerNav('stamdata')}
  </div>

  <div class="edgebox">
    <p class="etitle">Edge cases — Stamdata (demonstreret i denne mockup)</p>
    <ul>
      <li>Prøv "Intet CVR" på startskærmen — hele sektionen bliver manuel og redigerbar.</li>
      <li>Ryd "Internt navn" og klik væk fra feltet — det genudfyldes automatisk fra CVR-navnet.</li>
      <li>Vælg SR "Anna Byrn (demo: flere afdelinger)" på startskærmen — Afdeling kan her ikke forudfyldes og skal vælges aktivt.</li>
    </ul>
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* 2. Udvidet stamdata                                                     */
/* ---------------------------------------------------------------------- */

function renderUdvidet(c) {
  return `
  <div class="panel">
    ${tabBar('udvidet')}
    <div class="card-title">Virksomhedsstruktur (fra CVR)</div>
    <div class="field"><label>Moderselskab</label><input value="${esc(c.cvrData.moderselskab || '—')}" readonly></div>
    <div class="field"><label>Datterselskaber</label>
      <div style="border:1px solid var(--border);border-radius:6px;padding:8px 10px;font-size:12px;color:var(--text-muted)">
        ${c.cvrData.datterselskaber.length ? c.cvrData.datterselskaber.join(', ') : 'Ingen registreret under dette CVR-nummer'}
      </div>
    </div>

    <div class="card-title section-gap">Kontaktpersoner</div>
    <table class="mocktable">
      <tr><th>Primær</th><th>Navn</th><th>Rolle</th><th>Telefon</th><th>E-mail</th><th>Underskriver</th><th>Reel ejer</th><th>Adgang portal</th><th></th></tr>
      ${c.contacts.map((ct, i) => renderContactRow(ct, i)).join('')}
    </table>
    <button class="btn btn-sm" style="margin-top:8px" data-action="add-contact">+ Tilføj kontaktperson</button>

    <div class="card-title section-gap">Samarbejdspartnere</div>
    <table class="mocktable">
      <tr><th>Partner-type</th><th>Virksomhed</th><th>Kontaktnavn</th><th>Rolle</th><th>Telefon</th><th>Mail</th><th></th></tr>
      ${c.partners.map((p, i) => renderPartnerRow(p, i)).join('')}
    </table>
    <button class="btn btn-sm" style="margin-top:8px" data-action="add-partner">+ Tilføj samarbejdspartner</button>

    ${footerNav('udvidet')}
  </div>
  <div class="edgebox">
    <p class="etitle">Edge cases — Udvidet stamdata (demonstreret)</p>
    <ul>
      <li>Sæt en anden række som "Primær" — Rolle/Telefon/Mail bliver obligatoriske (rød ramme) for netop den række.</li>
      <li>Skriv et kontaktnavn på en samarbejdspartner-række uden telefon/mail — feltet markeres som krævet.</li>
      <li>Reelle ejere fra KYC-fanen er forudfyldt som kontaktpersoner med "Reel ejer" låst (kan ikke fjernes).</li>
    </ul>
  </div>`;
}

function renderContactRow(ct, i) {
  const requireFields = ct.primary;
  const missing = (v) => requireFields && !v;
  return `
  <tr class="${ct.primary ? 'primary-row' : ''}">
    <td><input type="radio" name="primary-contact" data-action="set-primary-contact" data-id="${ct.id}" ${ct.primary ? 'checked' : ''}></td>
    <td><input data-bind="contacts.${i}.navn" value="${esc(ct.navn)}"></td>
    <td><input data-bind="contacts.${i}.rolle" value="${esc(ct.rolle)}" class="${missing(ct.rolle) ? 'invalid' : ''}" placeholder="${requireFields ? 'Påkrævet' : ''}"></td>
    <td><input data-bind="contacts.${i}.telefon" value="${esc(ct.telefon)}" class="${missing(ct.telefon) ? 'invalid' : ''}" placeholder="${requireFields ? 'Påkrævet' : ''}"></td>
    <td><input data-bind="contacts.${i}.mail" value="${esc(ct.mail)}" class="${missing(ct.mail) ? 'invalid' : ''}" placeholder="${requireFields ? 'Påkrævet' : ''}"></td>
    <td style="text-align:center"><input type="checkbox" data-bind="contacts.${i}.underskriver" ${ct.underskriver ? 'checked' : ''}></td>
    <td style="text-align:center"><input type="checkbox" disabled ${ct.reelEjer ? 'checked' : ''} title="Låst — kommer fra KYC"></td>
    <td style="text-align:center"><input type="checkbox" data-bind="contacts.${i}.portalAdgang" ${ct.portalAdgang ? 'checked' : ''}></td>
    <td>${ct.reelEjer ? '' : `<button class="btn btn-ghost btn-sm" data-action="remove-contact" data-id="${ct.id}">✕</button>`}</td>
  </tr>`;
}

function renderPartnerRow(p, i) {
  const needsContact = !!p.kontaktnavn;
  const missing = needsContact && !p.telefon && !p.mail;
  return `
  <tr>
    <td><input data-bind="partners.${i}.type" value="${esc(p.type)}" placeholder="Bank / advokat / bogholder..."></td>
    <td><input data-bind="partners.${i}.virksomhed" value="${esc(p.virksomhed)}"></td>
    <td><input data-bind="partners.${i}.kontaktnavn" value="${esc(p.kontaktnavn)}"></td>
    <td><input data-bind="partners.${i}.rolle" value="${esc(p.rolle)}"></td>
    <td><input data-bind="partners.${i}.telefon" value="${esc(p.telefon)}" class="${missing ? 'invalid' : ''}"></td>
    <td><input data-bind="partners.${i}.mail" value="${esc(p.mail)}" class="${missing ? 'invalid' : ''}"></td>
    <td><button class="btn btn-ghost btn-sm" data-action="remove-partner" data-id="${p.id}">✕</button></td>
  </tr>${missing ? `<tr><td colspan="7" style="border:none;padding:0 6px 8px;"><span class="note-inline" style="color:var(--text-danger)">Kontaktnavn angivet — telefon eller mail kræves.</span></td></tr>` : ''}`;
}

/* ---------------------------------------------------------------------- */
/* 3. Team                                                                 */
/* ---------------------------------------------------------------------- */

function renderTeam(c) {
  const hasLR = teamHasLR(c);
  return `
  <div class="panel">
    ${tabBar('team')}
    ${!hasLR ? `<div class="warn-bar">⚠ Ledende revisor (LR) skal vælges, før du kan forlade denne fane.</div>` : `<div class="success-bar">✓ LR er valgt.</div>`}
    <div class="card-title">Team og adgang</div>
    <table class="mocktable">
      <tr><th>Person</th><th>Rolle</th><th>Adgang</th><th></th></tr>
      ${c.team.map((t, i) => `
      <tr>
        <td><select data-bind="team.${i}.navn">${EMPLOYEES.map((e) => `<option value="${esc(e)}" ${t.navn === e ? 'selected' : ''}>${esc(e)}</option>`).join('')}</select></td>
        <td><select data-bind="team.${i}.rolle" data-recalc="team">${TEAM_ROLES.map((r) => `<option value="${r}" ${t.rolle === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td>
        <td><select data-bind="team.${i}.adgang">${ACCESS_LEVELS.map((a) => `<option value="${a}" ${t.adgang === a ? 'selected' : ''}>${a}</option>`).join('')}</select></td>
        <td><button class="btn btn-ghost btn-sm" data-action="remove-team" data-id="${t.id}">✕</button></td>
      </tr>`).join('')}
    </table>
    <button class="btn btn-sm" style="margin-top:8px" data-action="add-team">+ Tilføj teammedlem</button>

    <div class="section-gap">
      <div class="card-title">Demo: edge case ved fjernelse af medarbejder</div>
      <p class="note-inline" style="margin-bottom:8px">Simulerer at en medarbejder blokeres i Microsoft, eller fjernes fra SR-/LR-gruppen, mens de forbliver ansat.</p>
      <button class="btn btn-sm" data-action="demo-block-employee">Simulér: bloker en tilfældig teammedlem i Microsoft</button>
    </div>
    ${footerNav('team')}
  </div>
  <div class="edgebox">
    <p class="etitle">Edge cases — Team (demonstreret)</p>
    <ul>
      <li>Du kan ikke gå videre til næste fane, før en LR er valgt (se advarslen ovenfor).</li>
      <li>"Simulér blokering"-knappen fjerner personens adgang helt (som ved sletning/blokering i Microsoft).</li>
      <li>Fjernes SR uden erstatning, falder kunden tilbage til standard-SR: <strong>${esc(STANDARD_SR)}</strong> (antagelse, ikke fastlagt i specifikationen — se README).</li>
      <li>Fjernes LR uden erstatning, falder LR-opgaver tilbage til siddende SR, indtil ny LR vælges manuelt.</li>
    </ul>
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* 4. KYC                                                                  */
/* ---------------------------------------------------------------------- */

function renderKyc(c) {
  const k = c.kyc;
  const statusBadge = { 'Ikke startet': 'badge-muted', 'Påbegyndt': 'badge-warn', 'Godkendt': 'badge-ok' }[k.status];
  const pepBadge = { 'Ikke tjekket': 'badge-muted', 'Ikke PEP': 'badge-ok', 'PEP': 'badge-warn' }[k.pep];
  return `
  <div class="panel">
    ${tabBar('kyc')}
    <div class="card-title">Reelle ejere (fra CVR)</div>
    <table class="mocktable">
      <tr><th>Navn</th><th>Ejerandel</th><th>ID-dokument krævet</th></tr>
      ${c.cvrData.reelleEjere.map((e) => `
      <tr><td>${esc(e.navn)}</td><td>${esc(e.andel)}</td><td>${e.andelPct > 25 ? '<span class="badge badge-warn">Ja, over 25%</span>' : '<span class="badge badge-muted">Nej</span>'}</td></tr>`).join('')}
    </table>
    ${c.type === 'Fond' || c.type === 'Forening' ? `<p class="note-inline" style="margin-top:8px;color:var(--text-warning)">Uafklaret i specifikationen: reelle ejere for Fond/Forening uden CVR er endnu ikke defineret — vises ikke i denne mockup.</p>` : ''}

    <div style="text-align:center;margin:18px 0;padding:20px;background:#f4f3f0;border-radius:10px;">
      <p class="card-title" style="margin-bottom:10px">KYC-proces (hvidvaskkontrol)</p>
      ${k.status === 'Ikke startet'
        ? `<button class="btn" data-action="kyc-start">Påbegynd hvidvaskproces →</button>
           <p class="note-inline" style="margin-top:8px">Fallback-knap — bruges hvis embedding af tredjepartssystemet ikke er muligt (uafklaret pt.).</p>`
        : `<button class="btn" data-action="kyc-advance" ${k.status === 'Godkendt' ? 'disabled' : ''}>${k.status === 'Påbegyndt' ? 'Simulér: modtag godkendelse fra tredjepart' : 'Proces godkendt'}</button>`}
    </div>

    <div class="card-title">Status (fra tredjepart)</div>
    <div class="grid2">
      <div class="field"><label>Processtatus</label><span class="badge ${statusBadge}">${esc(k.status)}</span></div>
      <div class="field"><label>PEP-tjek</label><span class="badge ${pepBadge}">${esc(k.pep)}</span></div>
      <div class="field" style="grid-column:span 2"><label>Sidst opdateret hvidvaskdokumentation</label><input value="${esc(k.sidstOpdateret || 'Endnu ikke opdateret')}" readonly></div>
    </div>

    <div class="card-title" style="margin-top:16px">Modtagne dokumenter</div>
    <table class="mocktable">
      ${k.docs.length ? k.docs.map((doc) => `<tr><td>${esc(doc.navn)}</td><td>${esc(doc.status)}</td><td>${doc.status.startsWith('Modtaget') ? '<a href="#" onclick="return false" class="btn btn-sm">Åbn</a>' : '—'}</td></tr>`).join('')
        : `<tr><td colspan="3" style="color:var(--text-muted)">Ingen dokumenter endnu — påbegynd processen ovenfor.</td></tr>`}
    </table>
    ${footerNav('kyc')}
  </div>
  <div class="edgebox">
    <p class="etitle">Edge cases — Hvidvask (KYC) (demonstreret)</p>
    <ul>
      <li>Kun ejerandele over 25% markeres som krævende ID-dokument.</li>
      <li>"Påbegynd hvidvaskproces" er den dokumenterede fallback for uafklaret embedding.</li>
      <li>Statusfeltet opdateres trinvist ("Simulér godkendelse") for at illustrere løbende sync fra tredjepart, fremfor ét engangsopslag.</li>
    </ul>
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* 5. Service                                                              */
/* ---------------------------------------------------------------------- */

function bogforingRevenue(bf) {
  const months = MONTHS_IN_INTERVAL[bf.momsinterval];
  const rows = bf.team.map((r) => {
    const perPeriod = (Number(r.timepris) || 0) * (Number(r.timer) || 0);
    const perMonth = perPeriod / months;
    return { ...r, perMonth };
  });
  const monthlyTotal = rows.reduce((s, r) => s + r.perMonth, 0);
  return { rows, monthlyTotal, annualTotal: monthlyTotal * 12 };
}

function lonRevenue(lon) {
  const rows = Object.keys(LOEN_LABELS).filter((k) => lon.typer[k]).map((k) => {
    const antal = Number(lon.antal[k]) || 0;
    const pris = Number(lon.pris[k]) || 0;
    const periods = LOENPERIODER[k];
    const perRun = antal * pris;
    const monthly = (perRun * periods) / 12;
    return { key: k, label: LOEN_LABELS[k], antal, pris, monthly };
  });
  const monthlyLoen = rows.reduce((s, r) => s + r.monthly, 0);
  const monthlyRaadgivning = (Number(lon.timeprisRaadgivning) || 0) * (Number(lon.timerRaadgivning) || 0);
  const monthlyTotal = monthlyLoen + monthlyRaadgivning;
  return { rows, monthlyTotal, annualTotal: monthlyTotal * 12 };
}

function renderService(c) {
  const s = c.service;
  const bf = bogforingRevenue(s.bogforing);
  const lon = lonRevenue(s.lon);
  const anyService = serviceHasAny(s);
  const unitLabel = INTERVAL_UNIT_LABEL[s.bogforing.momsinterval];

  return `
  <div class="panel">
    ${tabBar('service')}
    ${!anyService ? `<div class="warn-bar">Kunden skal have mindst én service for at kunne oprettes.</div>` : ''}
    <div class="field"><label>Faktureringsmail <span class="req">*</span></label><input data-bind="service.faktureringsmail" value="${esc(s.faktureringsmail)}" class="${!s.faktureringsmail ? 'invalid' : ''}" placeholder="fakturering@kunde.dk"></div>

    <!-- Revisionsservice -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:18px" class="section-gap">
      <div class="card-title" style="margin-top:0">Revisionsservice</div>
      <label class="checkline" style="font-size:12px;color:var(--text-muted)"><input type="checkbox" data-bind="service.revision.activeInverse" data-action-input="no-revision" ${!s.revision.active ? 'checked' : ''}>Ingen revisionsservice</label>
    </div>
    ${s.revision.active ? `
    <div class="grid2">
      <div class="field"><label>Erklæringstype <span class="req">*</span></label>
        <select data-bind="service.revision.erklaeringstype"><option>Revision</option><option>Udvidet gennemgang</option><option>Review</option><option>Assistance</option></select></div>
      <div class="field"><label>Årsafslutning</label><input value="${esc(c.cvrData.aarsafslutning)}" readonly></div>
      <div class="field"><label>Tilgang dato <span class="req">*</span></label><input type="date" data-bind="service.revision.tilgangDato" value="${esc(s.revision.tilgangDato)}"></div>
      <div class="field"><label>Tilgang årsag <span class="req">*</span></label>
        <select data-bind="service.revision.tilgangAarsag"><option>Netværk</option><option>Udbud</option><option>Anbefaling</option><option>Andet</option></select></div>
      <div class="field" style="grid-column:span 2"><label>Selvangivelse hovedaktionær <span class="req">*</span></label>
        <select data-bind="service.revision.selvangivelse"><option>Fra kontaktpersoner</option><option>Uden for aftale</option></select></div>
      <div class="field"><label>Assistancepris (fastpris) <span class="req">*</span></label><input data-bind="service.revision.assistancepris" value="${esc(s.revision.assistancepris)}" placeholder="kr."></div>
      <div class="field"><label>Timepris (udover standard)</label><input data-bind="service.revision.timepris" value="${esc(s.revision.timepris)}" placeholder="kr./t"></div>
    </div>` : '<p class="note-inline">Ingen revisionsservice valgt.</p>'}

    <!-- Bogføring -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px" class="section-gap">
      <div class="card-title" style="margin-top:0">Bogføring</div>
      <div class="toggle2">
        <button class="${s.bogforing.active ? 'on' : ''}" data-action="toggle" data-path="service.bogforing.active" data-value="true">Ja</button>
        <button class="${!s.bogforing.active ? 'on' : ''}" data-action="toggle" data-path="service.bogforing.active" data-value="false">Nej</button>
      </div>
    </div>
    ${s.bogforing.active ? `
    <div class="grid2">
      <div class="field"><label>Assistancetype</label>
        <select data-bind="service.bogforing.assistancetype">
          <option>Bogføring og momsindberetning</option><option>Ren bogføring</option><option>Kun ifm. momsindberetning</option>
        </select></div>
      <div class="field"><label>Momsinterval <span class="req">*</span></label>
        <select data-bind="service.bogforing.momsinterval" data-recalc="service">
          ${MOMS_INTERVALLER.map((m) => `<option ${s.bogforing.momsinterval === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select></div>
      <div class="field" style="grid-column:span 2"><label>Bogføringsforhold</label>
        <div class="chiprow">
          ${Object.entries({ projekter: 'Projekter', afdelinger: 'Afdelinger', lager: 'Lager', kreditor: 'Kreditorstyring', udlaeg: 'Udlæg / kort', rykker: 'Rykkerstyring', webshop: 'Webshop' })
            .map(([key, label]) => `<label class="chiplabel"><input type="checkbox" data-bind="service.bogforing.forhold.${key}" ${s.bogforing.forhold[key] ? 'checked' : ''}>${label}</label>`).join('')}
        </div>
      </div>
      <div class="field"><label>Aftalt assistancepris (fastpris)</label><input data-bind="service.bogforing.assistancepris" value="${esc(s.bogforing.assistancepris)}" placeholder="kr."></div>
      <div class="field"><label>Månedlige posteringer i ERP ${s.bogforing.assistancepris ? '<span class="req">*</span>' : ''}</label>
        <input data-bind="service.bogforing.posteringer" value="${esc(s.bogforing.posteringer)}" class="${s.bogforing.assistancepris && !s.bogforing.posteringer ? 'invalid' : ''}" placeholder="0">
        <p class="note-inline">Bliver påkrævet, hvis assistancepris er angivet.</p></div>
    </div>
    <table class="mocktable">
      <tr><th>Rolle</th><th>Timepris</th><th>Timer/${unitLabel}</th><th>Md. omsætning</th></tr>
      ${bf.rows.map((r, i) => `
      <tr>
        <td><input data-bind="service.bogforing.team.${i}.rolle" value="${esc(r.rolle)}"></td>
        <td><input data-bind="service.bogforing.team.${i}.timepris" value="${esc(r.timepris)}"></td>
        <td><input data-bind="service.bogforing.team.${i}.timer" value="${esc(r.timer)}"></td>
        <td>${kr(r.perMonth)}</td>
      </tr>`).join('')}
    </table>
    <div class="calc"><span>Forventet årlig indtjening (beregnet)</span><strong id="calc-bogforing">${kr(bf.annualTotal)}</strong></div>
    <p class="assumption">Antagelse: "Timer/${unitLabel}" omregnes til månedlig omsætning ud fra valgt momsinterval — se README.</p>
    ` : '<p class="note-inline">Ingen bogføringsservice valgt.</p>'}

    <!-- Lønassistance -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px" class="section-gap">
      <div class="card-title" style="margin-top:0">Lønassistance</div>
      <div class="toggle2">
        <button class="${s.lon.active ? 'on' : ''}" data-action="toggle" data-path="service.lon.active" data-value="true">Ja</button>
        <button class="${!s.lon.active ? 'on' : ''}" data-action="toggle" data-path="service.lon.active" data-value="false">Nej</button>
      </div>
    </div>
    ${s.lon.active ? `
    <div class="field"><label>Løntype</label>
      <div class="chiprow">
        ${Object.entries(LOEN_LABELS).map(([key, label]) => `<label class="chiplabel"><input type="checkbox" data-bind="service.lon.typer.${key}" data-recalc="service" ${s.lon.typer[key] ? 'checked' : ''}>${label}</label>`).join('')}
      </div>
    </div>
    <table class="mocktable">
      <tr><th>Løntype</th><th>Antal</th><th>Pris/seddel</th><th>Md. total</th></tr>
      ${lon.rows.map((r) => {
        const key = r.key;
        const idx = Object.keys(LOEN_LABELS).indexOf(key);
        return `
      <tr>
        <td>${esc(r.label)}</td>
        <td><input data-bind="service.lon.antal.${key}" value="${esc(r.antal)}"></td>
        <td><input data-bind="service.lon.pris.${key}" value="${esc(r.pris)}"></td>
        <td>${kr(r.monthly)}</td>
      </tr>`;
      }).join('')}
    </table>
    <div class="grid2" style="margin-top:12px">
      <div class="field" style="grid-column:span 2"><label>Overenskomster</label>
        <div class="chiprow">
          ${Object.entries({ industri: 'Industriens overenskomst', funktionaer: 'Funktionæroverenskomsten (HK/DI)', byg: 'Byggeoverenskomsten', ingen: 'Ingen overenskomst' })
            .map(([key, label]) => `<label class="chiplabel"><input type="checkbox" data-bind="service.lon.overenskomster.${key}" ${s.lon.overenskomster[key] ? 'checked' : ''}>${label}</label>`).join('')}
        </div>
      </div>
      <div class="field"><label>Timepris lønrådgivning</label><input data-bind="service.lon.timeprisRaadgivning" value="${esc(s.lon.timeprisRaadgivning)}" placeholder="kr./t"></div>
      <div class="field"><label>Forventet antal månedlige rådgivningstimer</label><input data-bind="service.lon.timerRaadgivning" value="${esc(s.lon.timerRaadgivning)}" placeholder="0"></div>
    </div>
    <div class="calc"><span>Forventet årlig indtjening (beregnet)</span><strong id="calc-lon">${kr(lon.annualTotal)}</strong></div>
    <p class="assumption">Antagelse: lønperioder pr. år (Funktionær/Timelønnet/Elev = 12, 14-dages = 26) indregnes i den månedlige omsætning — se README.</p>
    ` : '<p class="note-inline">Ingen lønassistance valgt.</p>'}

    <!-- Rådgivningsservice -->
    <div class="card-title section-gap">Rådgivningsservice</div>
    <table class="mocktable">
      <tr><th>Service</th><th>Timer</th><th>Timepris</th><th>Fastpris</th><th>Medarbejder</th><th></th></tr>
      ${s.raadgivning.map((r, i) => renderRaadgivningRow(r, i)).join('')}
    </table>
    <button class="btn btn-sm" style="margin-top:8px" data-action="add-raadgivning">+ Tilføj rådgivningsservice</button>

    ${footerNav('service')}
  </div>
  <div class="edgebox">
    <p class="etitle">Edge cases — Service (demonstreret)</p>
    <ul>
      <li>Slå Bogføring, Løn og Rådgivning fra, og lad "Ingen revisionsservice" være valgt — "Fuldfør oprettelse" blokeres, fordi mindst én service kræves.</li>
      <li>Udfyld "Aftalt assistancepris" under Bogføring — "Månedlige posteringer i ERP" bliver straks obligatorisk.</li>
      <li>Skift Momsinterval — kolonnen "Timer/..." og de beregnede beløb i bogføringstabellen opdateres dynamisk.</li>
      <li>Udfyld enten Timepris eller Fastpris pr. række under Rådgivningsservice — begge dele er ikke nødvendige.</li>
    </ul>
  </div>`;
}

function renderRaadgivningRow(r, i) {
  const needsOne = !r.timepris && !r.fastpris;
  return `
  <tr>
    <td><input data-bind="service.raadgivning.${i}.service" value="${esc(r.service)}"></td>
    <td><input data-bind="service.raadgivning.${i}.timer" value="${esc(r.timer)}"></td>
    <td><input data-bind="service.raadgivning.${i}.timepris" value="${esc(r.timepris)}" class="${needsOne ? 'invalid' : ''}" placeholder="kr./t"></td>
    <td><input data-bind="service.raadgivning.${i}.fastpris" value="${esc(r.fastpris)}" class="${needsOne ? 'invalid' : ''}" placeholder="kr."></td>
    <td><select data-bind="service.raadgivning.${i}.medarbejder">${EMPLOYEES.map((e) => `<option ${r.medarbejder === e ? 'selected' : ''}>${e}</option>`).join('')}</select></td>
    <td><button class="btn btn-ghost btn-sm" data-action="remove-raadgivning" data-id="${r.id}">✕</button></td>
  </tr>`;
}

/* ---------------------------------------------------------------------- */
/* 6. Dokumenter (placeholder)                                            */
/* ---------------------------------------------------------------------- */

function renderDokumenter(c) {
  return `
  <div class="panel">
    ${tabBar('dokumenter')}
    <div class="placeholder">Dokumenter uploadet af os eller kunden vil blive vist her.<br>Afventer dokumentportal fra Evobis — bygges ikke videre i denne mockup.</div>
    ${footerNav('dokumenter')}
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* Done screen                                                             */
/* ---------------------------------------------------------------------- */

function renderDone() {
  const c = state.customer;
  const items = [
    { label: 'Stamdata', ok: !!c.internName },
    { label: 'Udvidet stamdata — mindst én kontaktperson', ok: c.contacts.length > 0 },
    { label: 'Team — LR valgt', ok: teamHasLR(c) },
    { label: 'KYC — proces godkendt', ok: c.kyc.status === 'Godkendt' },
    { label: 'Service — mindst én service + faktureringsmail', ok: serviceHasAny(c.service) && !!c.service.faktureringsmail },
  ];
  return `
  <div class="centerwrap">
    <div class="startbox panel" style="max-width:none;margin:0;">
      <div class="card-title">Kunde oprettet (mockup)</div>
      <h1 class="doctitle" style="font-size:20px">${esc(c.internName)}</h1>
      <p class="meta" style="margin-bottom:16px">Dette er en simuleret afslutning — ingen data er sendt til Uniconta eller andre systemer.</p>
      <ul class="summarylist">
        ${items.map((it) => `<li><span class="${it.ok ? 'ok' : 'missing'}">${it.ok ? '✓' : '!'}</span>${esc(it.label)}</li>`).join('')}
      </ul>
      <div class="footerbar" style="max-width:none;margin-top:20px;">
        <button class="btn" data-action="back-to-app">← Tilbage til faner</button>
        <button class="btn btn-accent" data-action="restart">Start ny kunde</button>
      </div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* Event handling                                                          */
/* ---------------------------------------------------------------------- */

function currentScopeObject() {
  // data-bind paths on the start screen look like "start.cvr", so they are
  // rooted at `state` itself; everywhere else they are rooted at `state.customer`.
  return state.screen === 'start' ? state : state.customer;
}

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.matches('[data-bind]') && (t.tagName === 'INPUT' && t.type !== 'checkbox' && t.type !== 'radio')) {
    const scope = currentScopeObject();
    setPath(scope, t.getAttribute('data-bind'), t.value);
    if (t.dataset.recalc) render(); else patchLiveNumbers();
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (!t.matches('[data-bind]')) return;
  const scope = currentScopeObject();
  const path = t.getAttribute('data-bind');
  const isTextlike = t.tagName === 'INPUT' && t.type !== 'checkbox' && t.type !== 'radio';

  if (t.dataset.actionInput === 'no-revision') {
    scope.service.revision.active = !t.checked;
    render();
    return;
  }

  // Plain text/date/number fields: state is already kept in sync by the
  // 'input' listener above. Re-rendering here would tear down and replace
  // the DOM node the user is *about* to click into next (e.g. tabbing from
  // one field straight into another), stealing focus. Only re-render when
  // something structural actually needs to change.
  if (isTextlike) {
    setPath(scope, path, t.value);
    if (t.dataset.actionInput === 'intern-name' && !scope.internName.trim()) {
      scope.internName = scope.cvrData.virksomhedsnavn || '';
      render();
    }
    return;
  }

  if (t.type === 'checkbox') {
    setPath(scope, path, t.checked);
  } else {
    setPath(scope, path, t.value);
  }

  if (path === 'start.noCvr') {
    if (t.checked && !state.start.type) state.start.type = '';
  }
  if (path === 'sr') {
    const info = SR_LIST.find((s) => s.navn === t.value);
    state.customer.afdeling = info && info.afdeling ? info.afdeling : '';
  }
  render();
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const c = state.customer;

  switch (action) {
    case 'start-create': {
      if (!canCreateStart(state.start)) return;
      if (!state.start.noCvr && !MOCK_CVR_DB[state.start.cvr]) {
        state.start.cvrError = 'CVR-nummer findes ikke. Prøv igen (demo: brug 15807776).';
        render();
        return;
      }
      state.start.cvrError = '';
      state.customer = newCustomerFromStart(state.start);
      state.screen = 'app';
      state.currentTab = 'stamdata';
      render();
      break;
    }
    case 'goto-tab': {
      const target = btn.dataset.tab;
      if (state.currentTab === 'team' && !teamHasLR(c) && target !== 'team') {
        alert('Ledende revisor (LR) skal vælges, før du kan forlade Team-fanen.');
        return;
      }
      state.currentTab = target;
      render();
      break;
    }
    case 'save-continue': {
      const from = btn.dataset.tab;
      const next = btn.dataset.next;
      if (from === 'team' && !teamHasLR(c)) {
        alert('Ledende revisor (LR) skal vælges, før du kan forlade Team-fanen.');
        return;
      }
      state.savedTabs.add(from);
      state.currentTab = next;
      render();
      break;
    }
    case 'finish': {
      if (!serviceHasAny(c.service)) {
        alert('Kunden skal have mindst én service, før oprettelsen kan fuldføres.');
        return;
      }
      state.savedTabs.add('service');
      state.screen = 'done';
      render();
      break;
    }
    case 'back-to-app': {
      state.screen = 'app';
      render();
      break;
    }
    case 'restart': {
      if (!confirm('Start forfra? Al indtastet data i denne mockup går tabt.')) return;
      state = { screen: 'start', currentTab: 'stamdata', savedTabs: new Set(), start: { cvr: '15807776', sr: SR_LIST[0].navn, noCvr: false, type: '', cpr: '', cvrError: '' }, customer: null };
      render();
      break;
    }
    case 'add-contact':
      c.contacts.push({ id: uid(), primary: false, navn: '', rolle: '', telefon: '', mail: '', underskriver: false, reelEjer: false, portalAdgang: false });
      render();
      break;
    case 'remove-contact':
      c.contacts = c.contacts.filter((ct) => ct.id !== btn.dataset.id);
      render();
      break;
    case 'set-primary-contact':
      c.contacts.forEach((ct) => { ct.primary = ct.id === btn.dataset.id; });
      render();
      break;
    case 'add-partner':
      c.partners.push({ id: uid(), type: '', virksomhed: '', kontaktnavn: '', rolle: '', telefon: '', mail: '' });
      render();
      break;
    case 'remove-partner':
      c.partners = c.partners.filter((p) => p.id !== btn.dataset.id);
      render();
      break;
    case 'add-team':
      c.team.push({ id: uid(), navn: EMPLOYEES[0], rolle: 'Teammedlem', adgang: 'Kan se' });
      render();
      break;
    case 'remove-team':
      c.team = c.team.filter((t) => t.id !== btn.dataset.id);
      render();
      break;
    case 'demo-block-employee': {
      if (c.team.length === 0) return;
      const victim = c.team[Math.floor(Math.random() * c.team.length)];
      const wasSR = victim.rolle === 'SR';
      const wasLR = victim.rolle === 'LR';
      c.team = c.team.filter((t) => t.id !== victim.id);
      let msg = `Simuleret: ${victim.navn} er blokeret i Microsoft og har mistet al kundeadgang.`;
      if (wasSR) msg += `\nSR falder tilbage til standard-SR: ${STANDARD_SR}.`;
      if (wasLR) msg += `\nLR-opgaver falder tilbage til siddende SR, indtil ny LR vælges manuelt.`;
      alert(msg);
      render();
      break;
    }
    case 'kyc-start':
      c.kyc.status = 'Påbegyndt';
      c.kyc.pep = 'Ikke PEP';
      c.kyc.sidstOpdateret = '28. juli 2026';
      c.kyc.docs = c.cvrData.reelleEjere.filter((e) => e.andelPct > 25).map((e) => ({ navn: `ID – ${e.navn} (${e.andel})`, status: 'Modtaget 28.07.2026' }));
      c.kyc.docs.push({ navn: 'Fuldt CVR-dokument', status: 'Afventer' });
      render();
      break;
    case 'kyc-advance':
      if (c.kyc.status === 'Påbegyndt') {
        c.kyc.status = 'Godkendt';
        c.kyc.docs = c.kyc.docs.map((d) => d.status === 'Afventer' ? { ...d, status: 'Modtaget 28.07.2026' } : d);
      }
      render();
      break;
    case 'toggle':
      setPath(c, btn.dataset.path, btn.dataset.value === 'true');
      render();
      break;
    case 'add-raadgivning':
      c.service.raadgivning.push({ id: uid(), service: '', timer: '', timepris: '', fastpris: '', medarbejder: EMPLOYEES[0] });
      render();
      break;
    case 'remove-raadgivning':
      c.service.raadgivning = c.service.raadgivning.filter((r) => r.id !== btn.dataset.id);
      render();
      break;
  }
});

// Lightweight patch for plain-text inputs so typing doesn't lose focus:
// full re-render only happens on blur/change/structural actions above.
function patchLiveNumbers() {
  const c = state.customer;
  if (!c) return;
  const bfEl = el('calc-bogforing');
  const lonEl = el('calc-lon');
  if (bfEl) bfEl.textContent = kr(bogforingRevenue(c.service.bogforing).annualTotal);
  if (lonEl) lonEl.textContent = kr(lonRevenue(c.service.lon).annualTotal);
}

/* ---------------------------------------------------------------------- */
/* Boot                                                                    */
/* ---------------------------------------------------------------------- */

render();

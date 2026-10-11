// Batterie de tests backend Sprint 2/3/4 — réseau local sans secret.
const BASE = 'http://localhost:5000/api';
let pass = 0, fail = 0;
const results = [];
const check = (name, cond, extra = '') => {
  if (cond) { pass++; results.push(`  OK   ${name}`); }
  else { fail++; results.push(`  FAIL ${name} ${extra}`); }
};

const uid = () => 't' + Date.now().toString(36) + Math.floor(Math.random() * 9999);
const api = async (path, { method = 'GET', token, body, form, expect } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  let data = null;
  try { data = await res.json(); } catch { /* vide */ }
  return { status: res.status, data };
};

// Nettoyage : purge les comptes et dossiers créés par les précédents passages de tests
// (matching déterministe : seuls les profils créés dans CETTE exécution existent).
let others = [];
async function restoreOthers() {
  if (!others.length) return;
  const mysql = await import('mysql2/promise');
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'karriery' });
  await c.query('UPDATE redacteurs SET disponible=1 WHERE user_id IN (?)', [others]);
  await c.end();
}
{
  const mysql = await import('mysql2/promise');
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'karriery' });
  await c.query("DELETE FROM notifications WHERE demande_id IN (SELECT id FROM demandes WHERE candidat_id IN (SELECT id FROM users WHERE email LIKE '%@test.k'))");
  await c.query("DELETE FROM messages WHERE demande_id IN (SELECT id FROM demandes WHERE candidat_id IN (SELECT id FROM users WHERE email LIKE '%@test.k'))");
  await c.query("DELETE FROM fichiers WHERE demande_id IN (SELECT id FROM demandes WHERE candidat_id IN (SELECT id FROM users WHERE email LIKE '%@test.k'))");
  await c.query("DELETE FROM demande_refus WHERE demande_id IN (SELECT id FROM demandes WHERE candidat_id IN (SELECT id FROM users WHERE email LIKE '%@test.k'))");
  await c.query("DELETE FROM demandes WHERE candidat_id IN (SELECT id FROM users WHERE email LIKE '%@test.k')");
  await c.query("DELETE FROM users WHERE email LIKE '%@test.k'");
  // Garde-fou déterminisme : seuls R1/R2 (créés dans cette exécution) sont « disponibles »
  // pour la file d'acceptation et le compte de refus ; restauré en fin de main().
  const [rr] = await c.query("SELECT user_id FROM redacteurs rd JOIN users u ON u.id = rd.user_id WHERE rd.disponible = 1 AND u.role = 'redacteur' AND u.email NOT LIKE '%@test.k'");
  others = rr.map((o) => o.user_id);
  if (others.length) await c.query('UPDATE redacteurs SET disponible=0 WHERE user_id IN (?)', [others]);
  await c.end();
}

// ---- Fabrique de PDF minimal mais valide (texte extrait par pdf.js) ----
function buildPdf(title, lines) {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const content = 'BT /F1 12 Tf 50 700 Td ' +
    lines.map((l, i) => `(${esc(l)}) Tj ${i < lines.length - 1 ? '0 -16 Td' : ''}`).join(' ') +
    ' ET';
  const stream = 'stream\n' + content + '\nendstream';
  const pdf = [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(content)} >> ${stream}`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    'trailer << /Root 1 0 R >>',
    '%%EOF'
  ].join('\n');
  return Buffer.from(pdf, 'utf8');
}
const formWith = (buf, name, mime, extra = {}) => {
  const fd = new FormData();
  fd.append('cv', new Blob([buf], { type: mime }), name);
  for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  return fd;
};

// ================= Durée de vie =================
const lifecycle = {
  cA: null, cB: null, r1: null, r2: null,
  tokenA: null, tokenB: null, tokenR1: null, tokenR2: null,
  adminToken: null, demandeId: null, messageId: null, fichierId: null,
  candId: null
};

async function main() {
  // --- Connexions existantes ---
  const login = async (email, mdp) => (await api('/auth/login', { method: 'POST', body: { email, password: mdp } })).data;
  let r = await login('admin@karriery.tn', 'Admin_123456');
  check('login admin existant', !!r.token); if (r.token) lifecycle.adminToken = r.token;

  // --- Création des comptes de test ---
  const mkUser = async (role, nom, specialite = '') => {
    const email = `${nom.replace(/\W/g, '')}${uid()}@test.k`;
    const reg = await api('/auth/register', { method: 'POST', body: { nom, email, role, password: 'Motdepasse123!' } });
    check(`register ${role} ${nom}`, reg.status === 201 && !!reg.data.token);
    return { email, mdp: 'Motdepasse123!', token: reg.data?.token, id: null };
  };
  lifecycle.cA = await mkUser('candidat', 'Cand Alpha');
  lifecycle.r1 = await mkUser('redacteur', 'Redac Omega');
  lifecycle.r2 = await mkUser('redacteur', 'Redac Beta');
  lifecycle.cB = await mkUser('candidat', 'Cand Gamma');
  if (!lifecycle.cA.token || !lifecycle.r1.token || !lifecycle.r2.token || !lifecycle.cB.token) {
    console.log(results.join('\n')); console.log(`\n${pass} ok / ${fail} fail`);
    process.exit(1);
  }
  lifecycle.tokenA = lifecycle.cA.token;
  lifecycle.tokenB = lifecycle.cB.token;
  lifecycle.tokenR1 = lifecycle.r1.token;
  lifecycle.tokenR2 = lifecycle.r2.token;

// --- Profils candidat/rédacteur ---
  let p = await api('/candidat/profil', { method: 'PUT', token: lifecycle.tokenA, body: { titre_poste: 'Développeur Web', ville: 'Tunis', competences: 'React, Node.js, SQL' } });
  check('profil candidat enregistré', p.status === 200);
  p = await api('/candidat/profil', { method: 'PUT', token: lifecycle.tokenB, body: { titre_poste: 'Marketing Digital', ville: 'Sousse' } });
  check('profil candidat B enregistré (marketing)', p.status === 200);
  p = await api('/redacteur/profil', { method: 'PUT', token: lifecycle.tokenR1, body: { specialite: 'Développement Web', annees_experience: 5, disponible: 1 } });
  check('profil rédacteur 1 (spécialité dev web)', p.status === 200);
  p = await api('/redacteur/profil', { method: 'PUT', token: lifecycle.tokenR2, body: { specialite: 'Marketing Digital', annees_experience: 3, disponible: 1 } });
  check('profil rédacteur 2 (spécialité marketing)', p.status === 200);

  // ================= Upload / validation =================
  const pdfOk = buildPdf('Super CV', [
    'Mohamed Ali, Developpeur Web senior',
    'Experience : 5 ans chez une edtech, developpement React et Node.js',
    'Formation : Licence informatique', 'Satisfaction client amelioree de 30 pourcent',
    'Competences : React, Node.js, SQL, Git'
  ]);

  let up = await api('/demandes', { method: 'POST', token: lifecycle.tokenA, form: formWith(Buffer.from('not a pdf', 'utf8'), 'faux.txt', 'text/plain') });
  check('upload refusé : fichier non PDF', up.status === 400);

  const fakePdf = Buffer.concat([Buffer.from('%PDF-1.4 bonjour', 'utf8'), Buffer.alloc(2000)]);
  up = await api('/demandes', { method: 'POST', token: lifecycle.tokenA, form: formWith(fakePdf, 'fake.pdf', 'application/pdf') });
  check('upload refusé : PDF en réalité illisible', up.status === 400);

  const big = Buffer.alloc(6 * 1024 * 1024 + 100);
  up = await api('/demandes', { method: 'POST', token: lifecycle.tokenA, form: formWith(big, 'gros.pdf', 'application/pdf') });
  check('upload refusé : > 5 Mo', up.status === 413);

up = await api('/demandes', { method: 'POST', token: lifecycle.tokenA, form: formWith(pdfOk, 'cv-alpha.pdf', 'application/pdf') });
  check('upload valide + analyse + mise en attente (201)', up.status === 201, `-> ${up.status} ${JSON.stringify(up.data)}`);
  check('demande créée : statut en_attente, aucun rédacteur lié', up.data?.demande?.statut === 'en_attente' && up.data?.demande?.redacteur_id === null);
  check('demande créée : score 0-100', Number.isFinite(up.data?.demande?.score) && up.data.demande.score >= 0 && up.data.demande.score <= 100);
  lifecycle.demandeId = up.data?.demande?.id;

  // ================= Isolation =================
  let g = await api(`/candidat/demandes/${lifecycle.demandeId}`, { token: lifecycle.tokenA });
  check('détail demande (propriétaire) 200', g.status === 200);
  check('analyse JSON présente (forces/reco)', Array.isArray(g.data?.analyse?.forces) && Array.isArray(g.data?.analyse?.recommandations));
  check('rédacteur non encore assigné (en attente)', g.data?.redacteur === null);

  g = await api(`/candidat/demandes/${lifecycle.demandeId}`, { token: lifecycle.tokenB });
  check('isolation : autre candidat bloqué', g.status === 403);

  // ================= Workflow : demande → acceptation / refus =================
  let att = await api('/redacteur/demandes/en-attente', { token: lifecycle.tokenR1 });
  check('rédacteur disponible voit la demande en attente', Array.isArray(att.data) && att.data.some((d) => d.id === lifecycle.demandeId), `-> ${att.data?.length}`);
  const pendingA = att.data?.find((d) => d.id === lifecycle.demandeId);
  check('la file expose candidat + score + analyse IA', !!(pendingA?.candidat_nom) && pendingA?.score >= 0 && !!pendingA?.analyse?.forces);
  let cv = await api(`/demandes/${lifecycle.demandeId}/cv`, { token: lifecycle.tokenR1 });
  check('CV consultable par un rédacteur avant acceptation', cv.status === 200, `-> ${cv.status}`);

  let ac = await api(`/redacteur/demandes/${lifecycle.demandeId}/accepte`, { method: 'PUT', token: lifecycle.tokenR1 });
  check('rédacteur accepte la demande (liaison créée)', ac.status === 200 && ac.data?.statut === 'en_cours', `-> ${ac.status} ${JSON.stringify(ac.data)}`);
  g = await api(`/candidat/demandes/${lifecycle.demandeId}`, { token: lifecycle.tokenA });
  check('le candidat voit le rédacteur assigné après acceptation', !!g.data?.redacteur?.nom);
  att = await api('/redacteur/demandes/en-attente', { token: lifecycle.tokenR1 });
  check('la demande disparaît de la file après acceptation', !att.data?.some((d) => d.id === lifecycle.demandeId));
  ac = await api(`/redacteur/demandes/${lifecycle.demandeId}/accepte`, { method: 'PUT', token: lifecycle.tokenR2 });
  check('demande déjà acceptée : nouvel accept refusé', ac.status === 400, `-> ${ac.status}`);

  // Deuxième demande (candidat B) acceptée par R2 (le matching est devenu explicite)
  up = await api('/demandes', { method: 'POST', token: lifecycle.tokenB, form: formWith(buildPdf('CV Marketing', ['Communication digitale', 'Campagnes Facebook Ads', 'SEO', 'Content marketing', 'Analytics']), 'cv-gamma.pdf', 'application/pdf') });
  check('2e upload (candidat B) OK', up.status === 201, `-> ${up.status}`);
  const demandeB = up.data?.demande?.id;
  att = await api('/redacteur/demandes/en-attente', { token: lifecycle.tokenR2 });
  check('la demande B est proposée au rédacteur R2', att.data?.some((d) => d.id === demandeB));
  ac = await api(`/redacteur/demandes/${demandeB}/accepte`, { method: 'PUT', token: lifecycle.tokenR2 });
  check('R2 accepte la demande B', ac.status === 200);
  att = await api('/redacteur/demandes/en-attente', { token: lifecycle.tokenR1 });
  check('R1 ne voit plus la demande B (déjà prise)', !att.data?.some((d) => d.id === demandeB));

  // Refus : individuel, puis global (plus aucun rédacteur disponible → « refusee »)
  up = await api('/demandes', { method: 'POST', token: lifecycle.tokenA, form: formWith(buildPdf('CV Analyse', ['Gestion de projet', 'Reporting', 'Excel avancé', 'Analyse de données', 'Power BI']), 'cv-omega.pdf', 'application/pdf') });
  check('3e upload (candidat A) pour tester le refus', up.status === 201);
  const demandeC = up.data?.demande?.id;
  let rf = await api(`/redacteur/demandes/${demandeC}/refuse`, { method: 'PUT', token: lifecycle.tokenR1 });
  check('refus individuel : la demande reste en attente', rf.status === 200 && rf.data?.statut === 'en_attente', `-> ${rf.status} ${JSON.stringify(rf.data)}`);
  att = await api('/redacteur/demandes/en-attente', { token: lifecycle.tokenR2 });
  check('après refus de R1, la demande reste visible pour R2', att.data?.some((d) => d.id === demandeC));
  att = await api('/redacteur/demandes/en-attente', { token: lifecycle.tokenR1 });
  check(`la demande C n'est plus proposée à R1 (déjà refusée)`, !att.data?.some((d) => d.id === demandeC));
  rf = await api(`/redacteur/demandes/${demandeC}/refuse`, { method: 'PUT', token: lifecycle.tokenR2 });
  check('dernier rédacteur : la demande passe « refusee »', rf.status === 200 && rf.data?.statut === 'refusee', `-> ${rf.status} ${JSON.stringify(rf.data)}`);
  g = await api(`/candidat/demandes/${demandeC}`, { token: lifecycle.tokenA });
  check('le candidat voit la demande refusée', g.data?.statut === 'refusee');
  rf = await api(`/redacteur/demandes/${lifecycle.demandeId}/refuse`, { method: 'PUT', token: lifecycle.tokenR1 });
  check(`refus d'une demande déjà acceptée interdit`, rf.status === 400, `-> ${rf.status}`);

  // ================= Rédacteur (dossiers confiés) =================
  let rd = await api('/redacteur/demandes', { token: lifecycle.tokenR1 });
  check('liste rédacteur R1 (contient la demande acceptée)', Array.isArray(rd.data) && rd.data.some((d) => d.id === lifecycle.demandeId));
  rd = await api(`/redacteur/demandes/${lifecycle.demandeId}`, { token: lifecycle.tokenR1 });
  check('rédacteur affecté accède au dossier', rd.status === 200, `-> ${rd.status}`);
  const autreRedac = lifecycle.tokenR2;
  rd = await api(`/redacteur/demandes/${lifecycle.demandeId}`, { token: autreRedac });
  check('rédacteur non affecté bloqué', rd.status === 403, `-> ${rd.status} ${JSON.stringify(rd.data)}`);

  // ================= CV sécurisé =================
  cv = await api(`/demandes/${lifecycle.demandeId}/cv`, { token: lifecycle.tokenA });
  check('CV téléchargeable par le candidat', cv.status === 200 && (cv.data === null || cv.data));
  cv = await api(`/demandes/${lifecycle.demandeId}/cv`, { token: lifecycle.tokenB });
  check('CV inaccessible à un tiers', cv.status === 403, `-> ${cv.status}`);
  cv = await api(`/demandes/${lifecycle.demandeId}/cv`, { token: lifecycle.adminToken });
  check('CV accessible à l’admin', cv.status === 200);

  // ================= Messagerie REST + fichiers =================
  let m = await api(`/demandes/${lifecycle.demandeId}/messages`, { method: 'POST', token: lifecycle.tokenA,
    form: (() => { const fd = new FormData(); fd.append('contenu', 'Bonjour, merci pour votre analyse.'); return fd; })() });
  check('envoi message (candidat)', m.status === 201, `-> ${m.status} ${JSON.stringify(m.data)}`);
  lifecycle.messageId = m.data?.messageRow?.id;

  m = await api(`/demandes/${lifecycle.demandeId}/messages`, { method: 'POST', token: lifecycle.tokenB,
    form: (() => { const fd = new FormData(); fd.append('contenu', 'intrusion'); return fd; })() });
  check('message refusé : non participant', m.status === 403);

// message avec fichier image (autorise PNG)
  m = await api(`/demandes/${lifecycle.demandeId}/messages`, { method: 'POST', token: lifecycle.tokenR1,
    form: (() => { const fd = new FormData();
      fd.append('contenu', 'Voici le CV corrigé.');
      fd.append('fichier', new Blob([Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82])], { type: 'image/png' }), 'cv-corrige.png');
      return fd; })() });
  check('message avec fichier (rédacteur) OK', m.status === 201, `-> ${m.status}`);
  lifecycle.fichierMessageId = m.data?.messageRow?.id;
  lifecycle.fichierId = m.data?.messageRow?.fichier?.id;
  check('fichier renvoyé avec id', Number.isInteger(lifecycle.fichierId));

  let fm = await api(`/fichiers/${lifecycle.fichierId}`, { token: lifecycle.tokenA });
  check('fichier téléchargé par participant', fm.status === 200);
  fm = await api(`/fichiers/${lifecycle.fichierId}`, { token: lifecycle.tokenB });
  check('fichier refusé à un tiers', fm.status === 403);

  const pm = await api(`/demandes/${lifecycle.demandeId}/messages`, { token: lifecycle.tokenA });
  check('historique messages (2+)', Array.isArray(pm.data) && pm.data.length >= 2);
  check('historique : dernier message porte un fichier', !!(pm.data[pm.data.length - 1]?.fichier));

  // ================= Notifications =================
  let n = await api('/notifications', { token: lifecycle.tokenA });
  check('notifications candidate (>=2 événements vie demande)', Array.isArray(n.data?.items) && n.data.items.length >= 2, `-> ${n.data?.items?.length}`);
  check('notifications : shape {items, nonLues}', Number.isInteger(n.data?.nonLues));
  n = await api('/notifications/unread-count', { token: lifecycle.tokenA });
  check('compteur non lues >= 1', Number(n.data?.count) >= 1);
  if (n.data?.count >= 1) {
    const first = (await api('/notifications', { token: lifecycle.tokenA })).data.items.find((x) => !x.lue);
    if (first) {
      let rdN = await api(`/notifications/${first.id}/read`, { method: 'PUT', token: lifecycle.tokenA });
      check('marquer comme lue', rdN.status === 200);
    }
  }
  n = await api('/notifications', { token: lifecycle.tokenB });
  check('notifications vidées (marquer tout lu)', (await api('/notifications/lues', { method: 'POST', token: lifecycle.tokenA })).status === 200);
n = await api('/notifications', { token: lifecycle.tokenB });
  check('pas de notifications du dossier A chez un tiers', Array.isArray(n.data?.items) && n.data.items.every((x) => x.demande_id !== lifecycle.demandeId), `-> ${JSON.stringify(n.data?.items?.map((i)=>`${i.type}#${i.demande_id}`))}`);

  // ================= Statuts =================
  let st = await api(`/redacteur/demandes/${lifecycle.demandeId}/statut`, { method: 'PUT', token: lifecycle.tokenR1, body: { statut: 'terminee' } });
  check('rédacteur: transition en_cours -> terminee', st.status === 200, `-> ${st.status} ${JSON.stringify(st.data)}`);
  st = await api(`/redacteur/demandes/${lifecycle.demandeId}/statut`, { method: 'PUT', token: lifecycle.tokenR1, body: { statut: 'annulee' } });
  check('rédacteur: transition invalide refusée', st.status === 400);
  const autre = await api(`/redacteur/demandes/${demandeB}/statut`, { method: 'PUT', token: lifecycle.tokenR1, body: { statut: 'terminee' } });
  check('rédacteur: ne modifie pas la demande d’un autre', autre.status === 403, `-> ${autre.status}`);

  // ================= Admin =================
  if (lifecycle.adminToken) {
    let adm = await api('/admin/dashboard', { token: lifecycle.adminToken });
    check('dashboard admin', adm.status === 200 && Array.isArray(adm.data?.users) && Array.isArray(adm.data?.demandes));
    adm = await api('/admin/users', { token: lifecycle.adminToken });
    check('liste utilisateurs (filtre rôle)', Array.isArray(adm.data) && adm.data.length >= 4);
    // appeler l'API du nouveau signalement : les ids des users
    const someUser = adm.data.find((u) => u.role !== 'admin');
    if (someUser) {
      const id = someUser.id;
      let c = await api(`/admin/users/${id}/cancel`, { method: 'PUT', token: lifecycle.adminToken });
      check('admin: annuler un compte', c.status === 200);
      c = await api(`/admin/users/${id}/activate`, { method: 'PUT', token: lifecycle.adminToken });
      check('admin: réactiver un compte', c.status === 200);
    }
    adm = await api('/admin/demandes', { token: lifecycle.adminToken });
    const someDemande = adm.data?.find((d) => d.id === lifecycle.demandeId);
    let stAdm = await api(`/admin/demandes/${lifecycle.demandeId}/status`, { method: 'PUT', token: lifecycle.adminToken, body: { statut: 'en_cours' } });
    check('admin: changer statut demande', stAdm.status === 200);
    stAdm = await api(`/admin/demandes/${someDemande?.id || 1}/status`, { method: 'PUT', token: lifecycle.adminToken, body: { statut: 'vide' } });
    check('admin: statut invalide refusé', stAdm.status === 400);
  }

  // ================= Contrat compatibilité (routes génériques de la spec) =================
  let cq = await api('/demandes', { token: lifecycle.tokenA });
  check('GET /api/demandes (candidat)', Array.isArray(cq.data) && cq.data.some((d) => d.id === lifecycle.demandeId));
  cq = await api(`/demandes/${lifecycle.demandeId}`, { token: lifecycle.tokenR1 });
  check('GET /api/demandes/:id (rédacteur)', cq.status === 200 && !!cq.data?.candidat?.nom);
cq = await api(`/demandes/${lifecycle.demandeId}/statut`, { method: 'PATCH', token: lifecycle.adminToken, body: { statut: 'terminee' } });
  check('PATCH /api/demandes/:id/statut (admin)', cq.status === 200, `-> ${cq.status} ${JSON.stringify(cq.data)} [demandeId=${lifecycle.demandeId}]`);
cq = await api(`/messages/${lifecycle.fichierMessageId}/fichier`, { token: lifecycle.tokenA });
  check('GET /api/messages/:id/fichier par message', cq.status === 200, `-> ${cq.status}`);
  cq = await api('/admin/stats', { token: lifecycle.adminToken });
  check('GET /api/admin/stats', cq.status === 200 && Array.isArray(cq.data?.users));
  const someGuy = (await api('/admin/users', { token: lifecycle.adminToken })).data.find((u) => u.role !== 'admin');
  if (someGuy) {
    cq = await api(`/admin/users/${someGuy.id}/statut`, { method: 'PATCH', token: lifecycle.adminToken, body: { statut: 'annule' } });
    check('PATCH /api/admin/users/:id/statut', cq.status === 200);
    await api(`/api-nous-ne-tappelons-pas/${someGuy.id}/statut`, { token: lifecycle.adminToken });
  }

  // ================= Requêtes non autorisées =================
  let q = await api('/candidat/demandes');
  check('sans jeton : 401', q.status === 401);
  q = await api('/admin/users', { token: lifecycle.tokenA });
  check('admin bloqué pour candidat', q.status === 403);
  q = await api('/api-health', { token: lifecycle.adminToken });
  check('route inconnue : 404 JSON', q.status === 404);

  console.log(results.join('\n'));
  console.log(`\n${pass} ok / ${fail} fail`);
}

main()
  .catch((e) => { console.error('ERREUR FATALE', e); process.exit(2); })
  .finally(async () => { await restoreOthers(); process.exit(fail ? 1 : 0); });


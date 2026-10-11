import { io as socketIO } from 'socket.io-client';
import mysql from 'mysql2/promise';

const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'karriery' });
await c.query("DELETE FROM notifications WHERE demande_id IN (SELECT id FROM demandes WHERE candidat_id IN (SELECT id FROM users WHERE email LIKE '%@test.k'))");
await c.query("DELETE FROM messages WHERE demande_id IN (SELECT id FROM demandes WHERE candidat_id IN (SELECT id FROM users WHERE email LIKE '%@test.k'))");
await c.query("DELETE FROM fichiers WHERE demande_id IN (SELECT id FROM demandes WHERE candidat_id IN (SELECT id FROM users WHERE email LIKE '%@test.k'))");
await c.query("DELETE FROM demandes WHERE candidat_id IN (SELECT id FROM users WHERE email LIKE '%@test.k')");
await c.query("DELETE FROM users WHERE email LIKE '%@test.k'");
await c.end();

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';
const api = async (p, { method = 'GET', token, body } = {}) => {
  const h = {}; if (token) h.Authorization = `Bearer ${token}`; let pl;
  if (body) { h['Content-Type'] = 'application/json'; pl = JSON.stringify(body); }
  const r = await fetch(BASE + '/api' + p, { method, headers: h, body: pl });
  let d = null; try { d = await r.json(); } catch {}
  return { status: r.status, data: d };
};
const reg = async (role, nom) => (await api('/auth/register', { method: 'POST', body: { nom, email: `${nom}${Date.now()}@test.k`, role, password: 'Motdepasse123!' } })).data.token;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const results = []; let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { results.push(`${ok ? '  OK  ' : ' FAIL '} ${label}${extra ? ' ' + extra : ''}`); ok ? pass++ : fail++; };

const pdf = () => {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const content = 'BT /F1 12 Tf 50 700 Td (CV socket IO diff) Tj 0 -16 Td (Node temps reel) Tj ET';
  const C = Buffer.byteLength(content);
  const objs = [`1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`, `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`, `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj`, `4 0 obj << /Length ${C} >> stream\n${content}\nendstream endobj`, `5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`];
  let out = '%PDF-1.4\n'; const offs = {}; objs.forEach((o, i) => { offs[i + 1] = Buffer.byteLength(out); out += o + '\n'; });
  const xs = Buffer.byteLength(out);
  out += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) out += `${String(offs[i]).padStart(10, '0')} 00000 n \n`;
  out += `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xs}\n%%EOF`;
  return Buffer.from(out);
};

const tokenC = await reg('candidat', 'SockCand');
const tokenR = await reg('redacteur', 'SockRed');
const tokenI = await reg('candidat', 'SockIntrus');
await api('/candidat/profil', { method: 'PUT', token: tokenC, body: { titre_poste: 'Developpeur Web' } });
await api('/redacteur/profil', { method: 'PUT', token: tokenR, body: { specialite: 'Developpement Web', disponible: 1, annees_experience: 6 } });

const fd = new FormData();
fd.append('cv', new Blob([pdf()], { type: 'application/pdf' }), 'cv.pdf');
const up = await fetch(BASE + '/api/demandes', { method: 'POST', headers: { Authorization: `Bearer ${tokenC}` }, body: fd });
const created = await up.json();
const demandeId = created.demande?.id;
check('demande creee en attente (201)', up.status === 201 && !!demandeId, `-> ${up.status}`);

const ev = { c: [], r: [], i: [], sent: [], n: [], t: [], cn: [] };
const sC = socketIO(BASE, { auth: { token: tokenC }, transports: ['websocket'] });
const sR = socketIO(BASE, { auth: { token: tokenR }, transports: ['websocket'] });
const sI = socketIO(BASE, { auth: { token: tokenI }, transports: ['websocket'] });
sC.on('new_message', (d) => ev.c.push(d));
sR.on('new_message', (d) => ev.r.push(d));
sI.on('new_message', (d) => ev.i.push(d));
sC.on('message_sent', (d) => ev.sent.push(d));
sR.on('new_notification', (d) => ev.n.push(d));
sC.on('new_notification', (d) => ev.cn.push(d));
sI.on('new_notification', (d) => ev.i.push(d));
sC.on('typing', (d) => ev.t.push(d));
await Promise.all([new Promise((r) => sC.once('connect', r)), new Promise((r) => sR.once('connect', r)), new Promise((r) => sI.once('connect', r))]);
await wait(300);
check('3 sockets connectes avec JWT', sC.connected && sR.connected && sI.connected);

const acc = await api(`/redacteur/demandes/${demandeId}/accepte`, { method: 'PUT', token: tokenR });
await wait(900);
check('le redacteur accepte la demande (workflow)', acc.status === 200 && acc.data?.statut === 'en_cours', `-> ${acc.status}`);
check('notification d\'acceptation recue par le candidat en direct', ev.cn.some((x) => x.type === 'statut' && /accepté/.test(x.message || '')), `-> ${ev.cn.map((x) => x.type).join(',')}`);

sC.emit('join_demande', demandeId);
sR.emit('join_demande', demandeId);
sI.emit('join_demande', demandeId);
await wait(500);

sC.emit('send_message', { demandeId, contenu: 'hello temps reel' });
await wait(900);
check('message_sent ok cote candidat', ev.sent.some((d) => d.ok === true));
check('echo new_message recu par le candidat (io.to inclut l auteur)', ev.c.some((m) => m.contenu === 'hello temps reel'));
check('new_message recu par le redacteur', ev.r.some((m) => m.contenu === 'hello temps reel'));
check("notification 'message' recue par le redacteur", ev.n.some((x) => x.type === 'message'));
check('intrus (non participant) ne recoit pas new_message', ev.i.length === 0);

sR.emit('typing', demandeId);
await wait(500);
check('typing recu par le candidat', ev.t.length >= 1);

const rr = await fetch(BASE + '/api/demandes/' + demandeId + '/messages', { method: 'POST', headers: { Authorization: `Bearer ${tokenC}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ contenu: 'hello par REST' }) });
await wait(900);
check('message REST 201', rr.status === 201);
check('new_message REST recu par le redacteur en direct', ev.r.some((m) => m.contenu === 'hello par REST'));

const hist = await api(`/demandes/${demandeId}/messages`, { token: tokenC });
check('historique exactement 2 messages (zero duplication)', Array.isArray(hist.data) && hist.data.length === 2, `-> ${hist.data?.length}`);

sC.disconnect(); sR.disconnect(); sI.disconnect();
console.log(results.join('\n'));
console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
// Modèle d'email responsive pour les campagnes créées depuis le panneau admin.
// Tout le contenu est échappé : l'administrateur saisit du texte, jamais du HTML brut.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lines = (s) => esc(s).replace(/\r?\n/g, '<br>');

const section = (eyebrow, title, body) => `
      <tr><td style="padding:0 28px 18px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E9F0;border-radius:14px;background:#FFFFFF">
          <tr><td style="padding:20px 22px">
            <div style="font-size:10px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#E0183F">${esc(eyebrow)}</div>
            <h2 style="margin:6px 0 10px;font-size:19px;line-height:1.3;color:#14151B">${esc(title)}</h2>
            ${body}
          </td></tr>
        </table>
      </td></tr>`;

const paragraph = (text, style = '') =>
  `<p style="margin:0 0 10px;font-size:14px;line-height:1.65;color:#4B4F63;${style}">${lines(text)}</p>`;

const button = (label, url) => `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px">
          <tr><td style="border-radius:999px;background:#E0183F">
            <a href="${esc(url)}" style="display:inline-block;padding:11px 20px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px">${esc(label)}</a>
          </td></tr>
        </table>`;

const badge = (text) =>
  `<span style="display:inline-block;margin:0 6px 6px 0;padding:5px 10px;border-radius:999px;background:#FFF0F3;color:#B41232;font-size:12px;font-weight:700">${esc(text)}</span>`;

export function buildNewsletterEmail(content) {
  const htmlBlocks = [];
  const textBlocks = [];

  if (content.intro) {
    htmlBlocks.push(`
      <tr><td style="padding:0 28px 18px">${paragraph(content.intro, 'font-size:15px;color:#2C2F3D')}</td></tr>`);
    textBlocks.push(content.intro);
  }

  const o = content.offre;
  if (o?.enabled) {
    const tags = [o.entreprise, o.categorie, o.lieu, o.salaire, o.experience].filter(Boolean);
    htmlBlocks.push(section('Nouvelle opportunité', o.titre, `
      <div style="margin-bottom:10px">${tags.map(badge).join('')}</div>
      ${o.description ? paragraph(o.description) : ''}
      ${o.lien ? button("Voir l'offre", o.lien) : ''}`));
    textBlocks.push([
      `NOUVELLE OPPORTUNITÉ — ${o.titre}`,
      tags.filter(Boolean).join(' · '),
      o.description || '',
      o.lien ? `Voir l'offre : ${o.lien}` : '',
    ].filter(Boolean).join('\n'));
  }

  const c = content.carriere;
  if (c?.enabled) {
    htmlBlocks.push(section('Career story', c.titre, paragraph(c.texte)));
    textBlocks.push(`CAREER STORY — ${c.titre}\n${c.texte}`);
  }

  const m = content.marche;
  if (m?.enabled) {
    const indicator = m.chiffre || m.libelle
      ? `<div style="display:inline-block;margin:2px 10px 12px 0;padding:10px 14px;border-left:3px solid #E0183F;background:#FFF7F9">
           <b style="font-size:18px;color:#14151B">${esc(m.chiffre)}</b>
           <span style="display:block;font-size:12px;color:#6B6F82">${esc(m.libelle)}</span>
         </div>`
      : '';
    htmlBlocks.push(section('Local market insight', m.titre, `${indicator}${paragraph(m.texte)}`));
    textBlocks.push([
      `LOCAL MARKET INSIGHT — ${m.titre}`,
      [m.chiffre, m.libelle].filter(Boolean).join(' — '),
      m.texte,
    ].filter(Boolean).join('\n'));
  }

  const s = content.succes;
  if (s?.enabled) {
    const stories = (s.stories || []).filter((x) => x && (x.titre || x.texte));
    const body = stories.map((x) => `
      <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #F0F0F4">
        ${x.titre ? `<h3 style="margin:0 0 5px;font-size:15px;color:#14151B">${esc(x.titre)}</h3>` : ''}
        ${x.texte ? paragraph(x.texte, 'margin-bottom:0') : ''}
      </div>`).join('');
    htmlBlocks.push(section('Success stories', s.titre, body));
    textBlocks.push([
      `SUCCESS STORIES — ${s.titre}`,
      ...stories.map((x) => `${x.titre ? `${x.titre} — ` : ''}${x.texte || ''}`),
    ].join('\n'));
  }

  const w = content.ecrivain;
  if (w?.enabled) {
    const examples = `
      ${w.avant ? `<div style="margin:8px 0"><b style="font-size:12px;color:#8A8FA3">AVANT</b>${paragraph(w.avant, 'margin-top:4px')}</div>` : ''}
      ${w.apres ? `<div style="margin:8px 0"><b style="font-size:12px;color:#E0183F">APRÈS</b>${paragraph(w.apres, 'margin-top:4px')}</div>` : ''}`;
    htmlBlocks.push(section('Spotlight on the writers', w.nom, `
      ${w.specialite ? paragraph(`Spécialité : ${w.specialite}`, 'font-weight:700;color:#14151B') : ''}
      ${w.permission && (w.avant || w.apres)
        ? `<div style="margin-top:10px;padding:12px;border-radius:10px;background:#F7F8FC">${examples}</div>`
        : ''}
      ${button(w.cta_label || 'Book this writer', w.cta_url)}`));
    textBlocks.push([
      `SPOTLIGHT ON THE WRITERS — ${w.nom}`,
      w.specialite ? `Spécialité : ${w.specialite}` : '',
      w.permission ? `${w.avant ? `AVANT : ${w.avant}` : ''}${w.apres ? `\nAPRÈS : ${w.apres}` : ''}` : '',
      `${w.cta_label || 'Book this writer'} : ${w.cta_url}`,
    ].filter(Boolean).join('\n'));
  }

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(content.objet)}</title></head>
<body style="margin:0;background:#F4F5F9;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F9;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border-radius:18px;overflow:hidden;border:1px solid #E8E9F0">
        <tr><td style="padding:22px 28px;background:#14151B">
          <div style="font-size:22px;font-weight:800;letter-spacing:-.5px;color:#FFFFFF">Karriery<span style="color:#E0183F">.</span></div>
          <div style="margin-top:3px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#A9ACBD">Newsletter</div>
        </td></tr>
        <tr><td style="padding:24px 28px 0"><h1 style="margin:0;font-size:24px;line-height:1.25;color:#14151B">${esc(content.objet)}</h1></td></tr>
        ${htmlBlocks.join('')}
        <tr><td style="padding:18px 28px 26px;border-top:1px solid #EEEFF4">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8A8FA3">
            Vous recevez cette newsletter car vous êtes inscrit aux actualités Karriery.
            Les offres, témoignages et analyses présentés ont été sélectionnés par l’équipe éditoriale.
          </p>
          <p style="margin:10px 0 0;font-size:12px;color:#8A8FA3">L’équipe Karriery — newsletter@karriery.tn</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    text: [content.objet, ...textBlocks, '', 'L’équipe Karriery — newsletter@karriery.tn'].join('\n\n'),
    html,
  };
}

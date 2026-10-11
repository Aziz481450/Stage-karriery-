import PDFDocument from 'pdfkit';

// Rend le CV amélioré (Markdown simple : # titre, ## sections, - puces, paragraphes)
// en un vrai PDF A4. pdfkit gère le retour à la ligne et la pagination automatique.
const TITLE = /^#\s+(.+)/;
const SECTION = /^##\s+(.+)/;
const JOB = /^###\s+(.+)/;
const BULLET = /^[-*•]\s+/;

export function renderCvPdf(text) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 64, right: 64 } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const textWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let first = true;

    const push = (str) => doc.text(str, { width: textWidth, lineGap: 1.2 });

    for (const raw of String(text).split('\n')) {
      const content = raw.trim();
      if (!content) { doc.moveDown(0.45); continue; }

      const t = content.match(TITLE);
      if (t) {
        if (!first) doc.moveDown(0.8);
        doc.fontSize(21).font('Helvetica-Bold').fillColor('#111111');
        push(t[1].trim().replace(/\s{2,}/g, ' '));
        first = false;
        continue;
      }
      const s = content.match(SECTION);
      if (s) {
        if (!first) doc.moveDown(0.85);
        doc.fontSize(13.5).font('Helvetica-Bold').fillColor('#7c3aed');
        push(s[1].trim());
        doc.moveDown(0.35);
        continue;
      }
      const j = content.match(JOB);
      if (j) {
        if (!first) doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111111');
        push(j[1].trim());
        continue;
      }
      const b = content.match(BULLET);
      if (b) {
        doc.moveDown(0.22);
        doc.font('Helvetica').fontSize(10).fillColor('#222222');
        push('•  ' + content.replace(b[0], '').trim());
        continue;
      }
      if (!first) doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).fillColor('#222222');
      push(content.replace(/\s{2,}/g, ' '));
      first = false;
    }
    doc.end();
  });
}
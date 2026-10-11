import { ApiError } from '../utils/ApiError.js';

// pdf.js moderne (v4) nécessite ces globaux pour tourner sous Node.
import { DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
globalThis.DOMMatrix ??= DOMMatrix;
globalThis.ImageData ??= ImageData;
globalThis.Path2D ??= Path2D;

const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs');
GlobalWorkerOptions.workerSrc = new URL('../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();

// Vérifie les "magic bytes" d'un PDF (%PDF-...) avant d'essayer de l'analyser.
export const looksLikePdf = (buf) =>
  buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-';

export async function extractCvText(buf) {
  if (!looksLikePdf(buf)) {
    throw new ApiError(400, 'Le fichier n\u2019est pas un PDF valide.');
  }
  let text = '';
  try {
    const task = getDocument({ data: new Uint8Array(buf) });
    const doc = await task.promise;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      text += (tc.items || []).map((it) => it.str || '').join(' ') + '\n';
    }
    await doc.destroy();
  } catch (e) {
    throw new ApiError(400, 'Impossible de lire le contenu du PDF. Vérifiez qu\u2019il n\u2019est pas protégé.');
  }
  const t = text.replace(/[ \t]+/g, ' ').trim();
  if (t.length < 20) {
    throw new ApiError(400, 'Le PDF semble vide ou protégé : aucun texte lisible à analyser.');
  }
  return t.slice(0, 12000);
}
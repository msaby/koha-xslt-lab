import { kohaStyles } from './koha-styles.js';

let active = null;
export function cancelKohaTransformation() {
  if (active) active(new Error('Transformation annulée.'));
}

export function transformKoha(xml, styleId) {
  cancelKohaTransformation();
  if (!kohaStyles.some(style => style.id === styleId)) return Promise.reject(new Error('Transformation Koha inconnue.'));
  if (new TextEncoder().encode(xml).length > 2 * 1024 * 1024) return Promise.reject(new Error('La notice dépasse la limite de 2 Mio.'));
  if (/<!DOCTYPE/i.test(xml)) return Promise.reject(new Error('Les déclarations DOCTYPE ne sont pas acceptées pour les notices Koha.'));
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) return Promise.reject(new Error('La notice XML est mal formée.'));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./koha-worker.js', import.meta.url), { type: 'module' });
    const finish = (error, result) => {
      clearTimeout(timeout);
      worker.terminate();
      if (active === finish) active = null;
      if (error) reject(error); else resolve(result);
    };
    const timeout = setTimeout(() => finish(new Error('La transformation Koha a dépassé 15 secondes.')), 15000);
    active = finish;
    worker.onmessage = ({ data }) => finish(data.error ? new Error(data.error) : null, data.content);
    worker.onerror = () => finish(new Error('Impossible de démarrer le moteur Koha.'));
    worker.postMessage({ xml, styleId });
  });
}

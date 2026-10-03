/* =====================================================================
   AVELINE – Funções utilitárias (usadas pela loja e pelo admin)
   ===================================================================== */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatBRL(value) {
  const n = Number(value);
  return BRL.format(Number.isFinite(n) ? n : 0);
}

/** Escapa texto antes de inserir em HTML. */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Gera slug a partir de um texto ("L'Heure Dorée" -> "lheure-doree"). */
function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Normaliza texto para busca (sem acento, minúsculo). */
function normalizeText(text) {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** localStorage com tratamento de erro (aba anônima, cota cheia etc.). */
const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) { /* ignora */ }
  },
};

let toastTimer = null;
function showToast(message, type) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.toggle('is-error', type === 'error');
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

/** Link do WhatsApp com mensagem opcional. */
function whatsappLink(message) {
  const number = (window.AVELINE_CONFIG && window.AVELINE_CONFIG.WHATSAPP_NUMBER) || '';
  return 'https://wa.me/' + number + (message ? '?text=' + encodeURIComponent(message) : '');
}

/** Rótulo "Extrait de Parfum • 70ml". */
function productSpec(p) {
  return [p.concentration, p.volume_ml ? p.volume_ml + 'ml' : ''].filter(Boolean).join(' • ');
}

/**
 * Bloco de imagem do produto com placeholder elegante por baixo.
 * Se a imagem falhar, ela some e o placeholder aparece.
 */
function productImageHtml(p, src) {
  const url = src || p.image_url;
  return (
    '<div class="product-placeholder" aria-hidden="true">' +
      '<span class="material-symbols-outlined">water_drop</span>' +
      '<span class="text-[9px] tracking-[0.3em] uppercase font-semibold">' + esc(p.house || 'Aveline') + '</span>' +
    '</div>' +
    (url
      ? '<img src="' + esc(url) + '" alt="' + esc(p.name + ' – ' + (p.house || '')) + '" loading="lazy" onerror="this.remove()"/>'
      : '')
  );
}

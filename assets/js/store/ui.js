/* =====================================================================
   AVELINE – Interface: overlays, busca, conta, newsletter, menu
   ===================================================================== */

const OVERLAY_IDS = ['cart-drawer', 'wishlist-drawer', 'mobile-menu', 'product-modal', 'search-modal', 'account-modal'];

function openOverlay(id) {
  OVERLAY_IDS.forEach((other) => {
    const el = document.getElementById(other);
    if (el) el.classList.toggle('is-open', other === id);
  });
  const backdrop = document.getElementById('backdrop');
  if (backdrop) backdrop.classList.add('is-open');
  document.body.classList.add('is-locked');
}

function closeAllOverlays() {
  OVERLAY_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('is-open');
  });
  const backdrop = document.getElementById('backdrop');
  if (backdrop) backdrop.classList.remove('is-open');
  document.body.classList.remove('is-locked');
}

function toggleMobileMenu(open) {
  if (open) openOverlay('mobile-menu');
  else closeAllOverlays();
}

function openAccountModal() {
  openOverlay('account-modal');
}

/* ---------------- Busca ---------------- */
function toggleSearch(open) {
  if (open === false) return closeAllOverlays();
  openOverlay('search-modal');
  const input = document.getElementById('search-input');
  if (input) {
    input.value = '';
    runSearch('');
    setTimeout(() => input.focus(), 50);
  }
}

function runSearch(query) {
  const box = document.getElementById('search-results');
  if (!box) return;
  const q = normalizeText(query).trim();

  if (!q) {
    box.innerHTML = '<p class="text-xs text-brand-dark/50 px-3 py-6 text-center">Digite para buscar entre ' + PRODUCTS.length + ' fragrâncias.</p>';
    return;
  }

  const terms = q.split(/\s+/);
  const results = PRODUCTS.filter((p) => {
    const haystack = normalizeText([
      p.name, p.house, p.category, p.concentration, p.short_description,
      (p.families || []).join(' '),
      (p.notes_top || []).join(' '), (p.notes_heart || []).join(' '), (p.notes_base || []).join(' '),
    ].join(' '));
    return terms.every((t) => haystack.includes(t));
  });

  if (!results.length) {
    box.innerHTML = '<p class="text-sm text-brand-dark/60 px-3 py-6 text-center">Nada encontrado para "' + esc(query) + '".</p>';
    return;
  }

  box.innerHTML = results.map((p) =>
    '<button onclick="openProduct(\'' + p.id + '\')" class="w-full flex items-center gap-4 p-3 text-left hover:bg-brand-linen transition-colors">' +
      '<div class="product-media w-14 h-16 flex-shrink-0 border border-brand-border">' + productImageHtml(p) + '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<span class="text-[9px] tracking-[0.2em] uppercase text-brand-gold font-bold">' + esc(p.house) + '</span>' +
        '<p class="font-serif text-base text-brand-wine font-bold truncate">' + esc(p.name) + '</p>' +
        '<p class="text-[11px] text-brand-dark/60 truncate">' + esc((p.families || []).join(' · ')) + '</p>' +
      '</div>' +
      '<span class="font-serif text-sm font-bold text-brand-wine">' + formatBRL(p.price) + '</span>' +
    '</button>'
  ).join('');
}

/* ---------------- Newsletter ---------------- */
async function handleNewsletter(event) {
  event.preventDefault();
  const form = event.target;
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button[type="submit"]');
  const feedback = document.getElementById('newsletter-feedback');
  const email = (input.value || '').trim().toLowerCase();
  if (!email) return;

  button.disabled = true;
  try {
    if (window.sb) {
      const { error } = await window.sb.from('newsletter').insert({ email });
      // 23505 = e-mail já cadastrado: tratamos como sucesso
      if (error && error.code !== '23505') throw error;
    }
    form.reset();
    if (feedback) feedback.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    showToast('Não foi possível cadastrar agora. Tente novamente.', 'error');
  } finally {
    button.disabled = false;
  }
}

/* ---------------- Links dinâmicos (WhatsApp / Instagram) ---------------- */
function applyDynamicLinks() {
  const cfg = window.AVELINE_CONFIG || {};
  document.querySelectorAll('[data-link]').forEach((a) => {
    const type = a.dataset.link;
    if (type === 'whatsapp') a.href = whatsappLink();
    if (type === 'whatsapp-hello') a.href = whatsappLink('Olá! Gostaria de tirar uma dúvida sobre as fragrâncias da AVELINE.');
    if (type === 'instagram' && cfg.INSTAGRAM_URL) a.href = cfg.INSTAGRAM_URL;
  });
}

/* ---------------- Menu ativo conforme a rolagem ---------------- */
function watchActiveSection() {
  const links = document.querySelectorAll('#main-nav [data-section]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.dataset.section === entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  ['inicio', 'catalogo', 'decantes', 'sobre'].forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

/* Máscara simples de CEP */
function bindCepMask() {
  const cep = document.getElementById('order-customer-cep');
  if (!cep) return;
  cep.addEventListener('input', () => {
    const digits = cep.value.replace(/\D/g, '').slice(0, 8);
    cep.value = digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits;
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllOverlays();
});

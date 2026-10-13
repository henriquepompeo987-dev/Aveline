/* =====================================================================
   AVELINE – Catálogo: carregamento, grade, destaque e detalhe
   ===================================================================== */

let PRODUCTS = [];
let currentFilter = 'todos';

const CATEGORY_LABELS = { feminino: 'Feminino', masculino: 'Masculino', unissex: 'Unissex' };

/** Busca os produtos ativos no Supabase (ou usa o catálogo local). */
async function loadProducts() {
  if (window.sb) {
    const { data, error } = await window.sb
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data)) {
      PRODUCTS = data;
      return;
    }
    console.warn('[AVELINE] Erro ao buscar produtos no Supabase, usando catálogo local.', error);
  }
  PRODUCTS = (window.FALLBACK_PRODUCTS || []).filter((p) => p.active !== false);
}

function getProduct(id) {
  return PRODUCTS.find((p) => String(p.id) === String(id));
}

function getCarouselProducts() {
  const list = PRODUCTS.filter((p) => p.is_carousel);
  if (list.length) return list;
  const feat = PRODUCTS.find((p) => p.is_featured);
  return feat ? [feat] : PRODUCTS.length ? [PRODUCTS[0]] : [];
}

/** Opções de compra de um produto. */
function productVariants(p) {
  return [{ key: 'full', label: 'Frasco ' + (p.volume_ml ? p.volume_ml + 'ml' : 'original'), sub: p.concentration || '', price: Number(p.price) }];
}

/* ---------------------------------------------------------------------
   Filtros e grade
   --------------------------------------------------------------------- */
function matchesFilter(p, filter) {
  switch (filter) {
    case 'todos':       return true;
    case 'nicho':       return p.is_niche;
    case 'arabe':       return p.is_arabic;
    case 'lancamentos': return p.is_new;
    default:            return p.category === filter;
  }
}

function filterCatalog(filter, scroll) {
  currentFilter = filter || 'todos';
  document.querySelectorAll('#catalog-filters .cat-pill').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.filter === currentFilter);
  });
  renderCatalog();
  if (scroll) {
    const section = document.getElementById('catalogo');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  }
}

function productCardHtml(p) {
  const liked = typeof isWishlisted === 'function' && isWishlisted(p.id);
  const badge = !p.in_stock
    ? '<span class="absolute top-3 left-3 px-2.5 py-1 bg-brand-dark text-brand-cream text-[9px] font-bold tracking-[0.2em] uppercase">Esgotado</span>'
    : p.badge
      ? '<span class="absolute top-3 left-3 px-2.5 py-1 bg-brand-wine text-brand-cream text-[9px] font-bold tracking-[0.2em] uppercase">' + esc(p.badge) + '</span>'
      : '';
  const compare = p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
    ? '<span class="text-xs text-brand-dark/50 line-through mr-2">' + formatBRL(p.compare_at_price) + '</span>'
    : '';
  const families = (p.families || []).slice(0, 3).map((f) => '<span class="family-chip">' + esc(f) + '</span>').join(' ');
  const buyBtn = p.in_stock
    ? '<button onclick="addToCart(\'' + p.id + '\')" class="card-action flex-1 py-3 bg-brand-wine text-white text-[10px] font-bold tracking-[0.16em] uppercase hover:bg-brand-dark transition-colors">Adicionar à sacola</button>'
    : '<a href="' + esc(whatsappLink('Olá! Gostaria de encomendar o ' + p.name + ' (' + p.house + ').')) + '" target="_blank" rel="noopener" class="card-action flex-1 py-3 text-center bg-brand-dark text-white text-[10px] font-bold tracking-[0.16em] uppercase hover:bg-brand-wine transition-colors">Encomendar</a>';

  return (
    '<article class="group bg-brand-surface border border-brand-border flex flex-col hover:shadow-xl hover:border-brand-gold transition-all duration-300' + (!p.in_stock ? ' opacity-75' : '') + '">' +
      '<div class="product-media aspect-[4/5] cursor-pointer" onclick="openProduct(\'' + p.id + '\')">' +
        productImageHtml(p) +
        badge +
        '<button onclick="event.stopPropagation(); toggleWishlist(\'' + p.id + '\')" data-wish="' + p.id + '" class="card-wish absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 border border-brand-border flex items-center justify-center text-brand-wine hover:scale-110 transition-transform" aria-label="Favoritar">' +
          '<span class="material-symbols-outlined text-[18px] ' + (liked ? 'is-filled' : '') + '">favorite</span>' +
        '</button>' +
      '</div>' +
      '<div class="p-3 sm:p-6 flex flex-col flex-1 gap-2">' +
        '<span class="text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-brand-gold font-bold truncate">' + esc(p.house) + (p.is_niche ? ' • Nicho' : '') + '</span>' +
        '<h3 class="font-serif text-base sm:text-2xl text-brand-wine leading-tight cursor-pointer hover:underline decoration-brand-gold/60 underline-offset-4" onclick="openProduct(\'' + p.id + '\')">' + esc(p.name) + '</h3>' +
        '<p class="text-[11px] sm:text-xs text-brand-dark/60">' + esc(productSpec(p)) + ' • ' + esc(CATEGORY_LABELS[p.category] || '') + '</p>' +
        (p.short_description ? '<p class="hidden sm:block text-sm text-brand-dark/75 leading-relaxed line-clamp-2">' + esc(p.short_description) + '</p>' : '') +
        '<div class="flex flex-wrap gap-1.5 pt-1">' + families + '</div>' +
        '<div class="mt-auto pt-4 border-t border-brand-border/60 space-y-3">' +
          (p.in_stock
            ? '<div class="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">' +
                '<div>' + compare + '<span class="font-serif text-lg sm:text-2xl font-bold text-brand-wine">' + formatBRL(p.price) + '</span></div>' +
              '</div>'
            : '<div class="flex items-center gap-2">' +
                '<span class="font-serif text-lg sm:text-2xl font-bold text-brand-dark/40 line-through">' + (p.price > 0 ? formatBRL(p.price) : '') + '</span>' +
                '<span class="text-[10px] font-bold tracking-[0.16em] uppercase text-red-700/80">Esgotado</span>' +
              '</div>') +
          '<div class="flex gap-2">' +
            '<button onclick="openProduct(\'' + p.id + '\')" class="card-action flex-1 py-3 bg-brand-cream text-brand-wine text-[9px] sm:text-[10px] font-bold tracking-[0.12em] sm:tracking-[0.16em] uppercase hover:bg-brand-gold/30 transition-colors">Pirâmide</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

function renderCatalog() {
  const grid = document.getElementById('product-grid-container');
  const empty = document.getElementById('catalog-empty');
  if (!grid) return;
  const list = PRODUCTS.filter((p) => matchesFilter(p, currentFilter));
  grid.innerHTML = list.map(productCardHtml).join('');
  if (empty) empty.classList.toggle('hidden', list.length > 0);
}

/* ---------------------------------------------------------------------
   Carrossel do hero
   --------------------------------------------------------------------- */
let heroSlideIndex = 0;
let heroTimer = null;

function heroSlideHtml(p) {
  return (
    '<div class="hero-slide absolute inset-0 opacity-0 transition-opacity duration-700">' +
      '<div class="product-media absolute inset-0">' + productImageHtml(p) + '</div>' +
      '<div class="absolute inset-0 bg-gradient-to-t from-brand-wine/80 via-transparent to-transparent pointer-events-none"></div>' +
      '<div class="absolute bottom-6 inset-x-6 bg-brand-surface/95 backdrop-blur-md p-5 border border-brand-gold/30 shadow-lg">' +
        '<div class="min-w-0">' +
          '<span class="text-[9px] font-bold tracking-[0.25em] text-brand-gold uppercase block">' + esc(p.badge || 'Destaque da Curadoria') + '</span>' +
          '<span class="font-serif text-xl text-brand-wine font-medium block truncate">' + esc(p.name) + ' • ' + esc(p.house) + '</span>' +
          '<span class="text-xs text-brand-dark/70 block mt-0.5">' + esc(productSpec(p)) + '</span>' +
        '</div>' +
        '<button onclick="openProduct(\'' + p.id + '\')" class="mt-3 w-full py-2.5 bg-brand-wine text-brand-cream text-[10px] tracking-widest uppercase font-bold hover:bg-brand-dark transition-colors">Pirâmide</button>' +
      '</div>' +
    '</div>'
  );
}

function goToSlide(index) {
  const slides = document.querySelectorAll('#hero-slides .hero-slide');
  const dots = document.querySelectorAll('#hero-dots button');
  if (!slides.length) return;
  heroSlideIndex = ((index % slides.length) + slides.length) % slides.length;
  slides.forEach((s, i) => {
    s.classList.toggle('opacity-0', i !== heroSlideIndex);
    s.classList.toggle('opacity-100', i === heroSlideIndex);
    s.classList.toggle('z-10', i === heroSlideIndex);
  });
  dots.forEach((d, i) => d.classList.toggle('is-active', i === heroSlideIndex));
}

function startHeroTimer() {
  if (heroTimer) clearInterval(heroTimer);
  const slides = document.querySelectorAll('#hero-slides .hero-slide');
  if (slides.length > 1) heroTimer = setInterval(() => goToSlide(heroSlideIndex + 1), 5000);
}

function renderHeroCarousel() {
  const container = document.getElementById('hero-slides');
  const dotsBox = document.getElementById('hero-dots');
  if (!container) return;

  const items = getCarouselProducts();
  if (!items.length) {
    container.innerHTML = '';
    if (dotsBox) dotsBox.innerHTML = '';
    return;
  }

  container.innerHTML = items.map(heroSlideHtml).join('');

  if (dotsBox) {
    if (items.length > 1) {
      dotsBox.innerHTML = items.map((_, i) =>
        '<button onclick="goToSlide(' + i + '); startHeroTimer();" class="hero-dot' + (i === 0 ? ' is-active' : '') + '" aria-label="Slide ' + (i + 1) + '"></button>'
      ).join('');
    } else {
      dotsBox.innerHTML = '';
    }
  }

  goToSlide(0);
  startHeroTimer();
}

/* ---------------------------------------------------------------------
   Modal de detalhe / pirâmide olfativa
   --------------------------------------------------------------------- */
const detailState = { id: null, variant: 'full', image: null };

function openProduct(id) {
  const p = getProduct(id);
  if (!p) return;
  detailState.id = p.id;
  detailState.variant = 'full';
  detailState.image = p.image_url || (p.gallery || [])[0] || null;
  renderProductModal();
  openOverlay('product-modal');
}

// Compatibilidade com o HTML antigo (quickOpenDetail(0) = produto em destaque)
function quickOpenDetail(indexOrId) {
  const p = typeof indexOrId === 'number' ? PRODUCTS[indexOrId] : getProduct(indexOrId);
  if (p) openProduct(p.id);
}

function selectVariant(key) {
  detailState.variant = key;
  renderProductModal();
}

function selectImage(index) {
  const p = getProduct(detailState.id);
  if (!p) return;
  const images = [p.image_url].concat(p.gallery || []).filter(Boolean);
  detailState.image = images[index] || null;
  renderProductModal();
}

function pyramidRow(icon, title, notes) {
  if (!notes || !notes.length) return '';
  return (
    '<div class="flex gap-4 py-3 border-b border-brand-border/60 last:border-0">' +
      '<span class="material-symbols-outlined text-brand-gold text-[22px]">' + icon + '</span>' +
      '<div>' +
        '<span class="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-wine">' + title + '</span>' +
        '<p class="text-sm text-brand-dark/80 mt-0.5">' + notes.map(esc).join(' · ') + '</p>' +
      '</div>' +
    '</div>'
  );
}

function renderProductModal() {
  const box = document.getElementById('product-modal-content');
  const p = getProduct(detailState.id);
  if (!box || !p) return;

  const images = [p.image_url].concat(p.gallery || []).filter(Boolean);
  const variants = productVariants(p);
  const selected = variants.find((v) => v.key === detailState.variant) || variants[0];
  const liked = typeof isWishlisted === 'function' && isWishlisted(p.id);

  const thumbs = images.length > 1
    ? '<div class="flex gap-2 p-3 overflow-x-auto bg-white border-t border-brand-border">' +
        images.map((url, i) =>
          '<button onclick="selectImage(' + i + ')" class="thumb-btn w-16 h-16 flex-shrink-0 overflow-hidden ' + (url === detailState.image ? 'is-active' : '') + '">' +
            '<img src="' + esc(url) + '" alt="" class="w-full h-full object-cover" loading="lazy"/>' +
          '</button>'
        ).join('') +
      '</div>'
    : '';

  const variantButtons = variants.map((v) =>
    '<button onclick="selectVariant(\'' + v.key + '\')" class="variant-option ' + (v.key === selected.key ? 'is-active' : '') + '">' +
      '<span class="text-left"><span class="font-semibold text-brand-wine block">' + esc(v.label) + '</span><span class="text-[11px] text-brand-dark/60">' + esc(v.sub) + '</span></span>' +
      '<span class="font-serif text-base font-bold text-brand-wine">' + formatBRL(v.price) + '</span>' +
    '</button>'
  ).join('');

  const canBuy = p.in_stock || selected.key !== 'full';
  const buy = canBuy
    ? '<button onclick="addToCart(\'' + p.id + '\', \'' + selected.key + '\'); closeAllOverlays();" class="flex-1 py-4 bg-brand-wine text-white text-xs font-bold tracking-[0.16em] uppercase hover:bg-brand-dark transition-colors">Adicionar à sacola • ' + formatBRL(selected.price) + '</button>'
    : '<a href="' + esc(whatsappLink('Olá! Gostaria de encomendar o ' + p.name + ' (' + p.house + ').')) + '" target="_blank" rel="noopener" class="flex-1 py-4 text-center bg-brand-dark text-white text-xs font-bold tracking-[0.16em] uppercase hover:bg-brand-wine transition-colors">Frasco esgotado • Encomendar</a>';

  box.innerHTML =
    '<div class="grid grid-cols-1 md:grid-cols-2">' +
      '<div class="flex flex-col">' +
        '<div class="product-media aspect-[4/5] md:aspect-auto md:flex-1 md:min-h-[520px]">' + productImageHtml(p, detailState.image) + '</div>' +
        thumbs +
      '</div>' +
      '<div class="p-6 sm:p-10 space-y-5">' +
        '<div>' +
          '<span class="text-[10px] tracking-[0.25em] uppercase text-brand-gold font-bold">' + esc(p.house) + (p.is_niche ? ' • Perfumaria de Nicho' : '') + '</span>' +
          '<h3 id="pm-name" class="font-serif text-3xl sm:text-4xl text-brand-wine mt-1">' + esc(p.name) + '</h3>' +
          '<p class="text-xs text-brand-dark/60 mt-1">' + esc(productSpec(p)) + ' • ' + esc(CATEGORY_LABELS[p.category] || '') + '</p>' +
        '</div>' +
        (p.description
          ? '<div class="rich-text text-sm text-brand-dark/80 leading-relaxed">' + sanitizeHtml(p.description) + '</div>'
          : p.short_description
            ? '<p class="text-sm text-brand-dark/80 leading-relaxed">' + esc(p.short_description) + '</p>'
            : '') +
        '<div class="bg-white border border-brand-border px-5 py-2">' +
          '<span class="block pt-2 text-[10px] font-bold tracking-[0.25em] uppercase text-brand-gold">Pirâmide Olfativa</span>' +
          pyramidRow('air', 'Notas de Saída', p.notes_top) +
          pyramidRow('favorite', 'Notas de Coração', p.notes_heart) +
          pyramidRow('park', 'Notas de Fundo', p.notes_base) +
        '</div>' +
        ((p.families || []).length ? '<div class="flex flex-wrap gap-1.5">' + p.families.map((f) => '<span class="family-chip">' + esc(f) + '</span>').join('') + '</div>' : '') +
        '<div class="space-y-2">' + variantButtons + '</div>' +
        '<div class="flex gap-2">' +
          buy +
          '<button onclick="toggleWishlist(\'' + p.id + '\'); renderProductModal();" class="px-4 border border-brand-border text-brand-wine hover:border-brand-wine transition-colors" aria-label="Favoritar">' +
            '<span class="material-symbols-outlined ' + (liked ? 'is-filled' : '') + '">favorite</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/** Re-renderiza tudo que depende do catálogo. */
function renderAllProducts() {
  renderHeroCarousel();
  renderCatalog();
  if (typeof renderQuiz === 'function') renderQuiz();
}

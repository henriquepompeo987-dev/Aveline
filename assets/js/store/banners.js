/* =====================================================================
   AVELINE – Banners criados no painel
   Cada banner entra no <div data-banner-slot="..."> da sua posição.
   Dois ou mais banners na mesma posição viram um carrossel.
   ===================================================================== */

/* groupHasText: com texto sobreposto o grupo usa altura fixa, porque o
   texto precisa de uma área previsível. Sem texto, cada imagem aparece
   inteira e a altura do carrossel acompanha a imagem visível — assim
   imagens de proporções diferentes não sobram espaço nem são cortadas. */
function storeBannerSlideHtml(b, groupHasText) {
  const hasText = Boolean(b.title || b.description);
  const img = b.image_url
    ? (groupHasText
        ? '<img src="' + esc(b.image_url) + '" alt="" class="absolute inset-0 w-full h-full object-cover" loading="lazy" onerror="this.remove()"/>'
        : '<img src="' + esc(b.image_url) + '" alt="" class="block w-full h-auto" loading="lazy" onerror="this.remove()"/>')
    : '';
  const shade = b.image_url && hasText
    ? '<div class="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-brand-dark/45 to-transparent"></div>'
    : '';
  const copy = hasText
    ? '<div class="banner-copy relative p-6 sm:p-10 lg:p-14 max-w-2xl text-brand-dark">' +
        (b.title ? '<div class="banner-title font-serif text-2xl sm:text-4xl leading-tight">' + sanitizeHtml(b.title) + '</div>' : '') +
        (b.description ? '<div class="rich-text text-sm sm:text-base leading-relaxed text-brand-dark/90 mt-3">' + sanitizeHtml(b.description) + '</div>' : '') +
      '</div>'
    : '';

  return (
    '<div class="banner-slide relative overflow-hidden flex items-center bg-brand-linen w-full shrink-0">' +
      img + shade + copy +
    '</div>'
  );
}

function storeBannerGroupHtml(list, slotName) {
  const hasText = list.some((b) => b.title || b.description);
  const size = hasText ? 'h-[420px] sm:h-[480px] lg:h-[520px]' : '';
  const slides = list.map((b) => storeBannerSlideHtml(b, hasText)).join('');

  let nav = '';
  if (list.length > 1) {
    const dots = list.map((_, i) =>
      '<button type="button" class="banner-dot' + (i === 0 ? ' is-active' : '') +
      '" data-banner-go="' + i + '" aria-label="Ir para o banner ' + (i + 1) + '"></button>'
    ).join('');
    nav =
      '<button type="button" class="banner-arrow banner-arrow-prev" data-banner-nav="-1" aria-label="Banner anterior">' +
        '<span class="material-symbols-outlined">chevron_left</span>' +
      '</button>' +
      '<button type="button" class="banner-arrow banner-arrow-next" data-banner-nav="1" aria-label="Próximo banner">' +
        '<span class="material-symbols-outlined">chevron_right</span>' +
      '</button>' +
      '<div class="banner-dots">' + dots + '</div>';
  }

  return (
    '<section class="w-full">' +
      '<div class="banner-carousel ' + size + '" data-banner-carousel="' + esc(slotName) + '"' +
        ' data-banner-index="0" data-banner-fixed="' + (hasText ? '1' : '0') + '">' +
        '<div class="banner-track">' + slides + '</div>' + nav +
      '</div>' +
    '</section>'
  );
}

/* Sem texto o carrossel não tem altura fixa: ele assume a altura da
   imagem visível, para não cortar nem deixar sobra. */
function syncBannerCarouselHeight(carousel) {
  if (carousel.dataset.bannerFixed === '1') return;
  const slide = carousel.querySelectorAll('.banner-slide')[Number(carousel.dataset.bannerIndex) || 0];
  if (slide && slide.offsetHeight) carousel.style.height = slide.offsetHeight + 'px';
}

function goToBannerSlide(carousel, index) {
  const total = carousel.querySelectorAll('.banner-slide').length;
  if (!total) return;

  const next = ((index % total) + total) % total;
  carousel.dataset.bannerIndex = String(next);
  carousel.querySelector('.banner-track').style.transform = 'translateX(-' + (next * 100) + '%)';
  carousel.querySelectorAll('.banner-dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === next);
  });
  syncBannerCarouselHeight(carousel);
}

function bindBannerCarousel(carousel) {
  // As imagens chegam depois: cada uma recalcula a altura ao carregar.
  carousel.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', () => syncBannerCarouselHeight(carousel), { once: true });
  });
  syncBannerCarouselHeight(carousel);
}

function bindBannerCarouselNav(carousel) {
  carousel.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-banner-nav]');
    if (nav) {
      goToBannerSlide(carousel, Number(carousel.dataset.bannerIndex) + Number(nav.dataset.bannerNav));
      return;
    }
    const dot = e.target.closest('[data-banner-go]');
    if (dot) goToBannerSlide(carousel, Number(dot.dataset.bannerGo));
  });

  // Arrastar com o dedo no celular
  let startX = null;
  carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const delta = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(delta) < 40) return;
    goToBannerSlide(carousel, Number(carousel.dataset.bannerIndex) + (delta < 0 ? 1 : -1));
  });
}

async function renderStoreBanners() {
  if (!window.sb) return;
  const { data, error } = await window.sb
    .from('banners')
    .select('id, title, description, image_url, position, full_width, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[AVELINE] Não foi possível carregar os banners.', error);
    return;
  }

  document.querySelectorAll('[data-banner-slot]').forEach((slot) => {
    const name = slot.dataset.bannerSlot;
    const list = (data || []).filter((b) => b.position === name);
    slot.innerHTML = list.length ? storeBannerGroupHtml(list, name) : '';
    const carousel = slot.querySelector('[data-banner-carousel]');
    if (!carousel) return;
    bindBannerCarousel(carousel);
    if (list.length > 1) bindBannerCarouselNav(carousel);
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('[data-banner-carousel]').forEach(syncBannerCarouselHeight);
  });
}

/* =====================================================================
   AVELINE – Banners criados no painel
   Cada banner entra no <div data-banner-slot="..."> da sua posição.
   Dois ou mais banners na mesma posição viram um carrossel.
   ===================================================================== */

function storeBannerSlideHtml(b) {
  const hasText = Boolean(b.title || b.description);
  const img = b.image_url
    ? '<img src="' + esc(b.image_url) + '" alt="" class="absolute inset-0 w-full h-full object-cover" loading="lazy" onerror="this.remove()"/>'
    : '';
  const shade = b.image_url && hasText
    ? '<div class="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-brand-dark/45 to-transparent"></div>'
    : '';
  const copy = hasText
    ? '<div class="banner-copy relative p-6 sm:p-10 lg:p-14 max-w-2xl text-brand-cream">' +
        (b.title ? '<div class="banner-title font-serif text-2xl sm:text-4xl leading-tight">' + sanitizeHtml(b.title) + '</div>' : '') +
        (b.description ? '<div class="rich-text text-sm sm:text-base leading-relaxed text-brand-cream/90 mt-3">' + sanitizeHtml(b.description) + '</div>' : '') +
      '</div>'
    : '';

  return (
    '<div class="banner-slide relative overflow-hidden flex items-center bg-brand-wine w-full shrink-0">' +
      img + shade + copy +
    '</div>'
  );
}

function storeBannerGroupHtml(list, slotName) {
  const hasText = list.some((b) => b.title || b.description);
  const size = hasText ? 'h-[420px] sm:h-[480px] lg:h-[520px]' : 'h-[350px] sm:h-[420px] lg:h-[480px]';
  const slides = list.map(storeBannerSlideHtml).join('');

  if (list.length < 2) {
    return '<section class="w-full"><div class="banner-carousel ' + size + '">' + slides + '</div></section>';
  }

  const dots = list.map((_, i) =>
    '<button type="button" class="banner-dot' + (i === 0 ? ' is-active' : '') +
    '" data-banner-go="' + i + '" aria-label="Ir para o banner ' + (i + 1) + '"></button>'
  ).join('');

  return (
    '<section class="w-full">' +
      '<div class="banner-carousel ' + size + '" data-banner-carousel="' + esc(slotName) + '" data-banner-index="0">' +
        '<div class="banner-track">' + slides + '</div>' +
        '<button type="button" class="banner-arrow banner-arrow-prev" data-banner-nav="-1" aria-label="Banner anterior">' +
          '<span class="material-symbols-outlined">chevron_left</span>' +
        '</button>' +
        '<button type="button" class="banner-arrow banner-arrow-next" data-banner-nav="1" aria-label="Próximo banner">' +
          '<span class="material-symbols-outlined">chevron_right</span>' +
        '</button>' +
        '<div class="banner-dots">' + dots + '</div>' +
      '</div>' +
    '</section>'
  );
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
}

function bindBannerCarousel(carousel) {
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
    if (carousel) bindBannerCarousel(carousel);
  });
}

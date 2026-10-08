/* =====================================================================
   AVELINE – Banners criados no painel
   Cada banner entra no <div data-banner-slot="..."> da sua posição.
   ===================================================================== */

function storeBannerHtml(b) {
  const hasText = Boolean(b.title || b.description);
  const full = b.full_width;
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
  const size = hasText ? 'min-h-[220px] sm:min-h-[260px] lg:min-h-0 lg:aspect-[4/1]' : 'aspect-[3/1] sm:aspect-[4/1]';
  const wrapper = full ? 'w-full' : 'max-w-[1380px] mx-auto px-4 sm:px-8';

  return (
    '<section class="' + wrapper + ' py-6">' +
      '<div class="relative overflow-hidden flex items-center bg-brand-wine ' + (full ? '' : 'border border-brand-gold/30 ') + size + '">' +
        img + shade + copy +
      '</div>' +
    '</section>'
  );
}

async function renderStoreBanners() {
  if (!window.sb) return;
  const { data, error } = await window.sb
    .from('banners')
    .select('id, title, description, image_url, position, full_width')
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[AVELINE] Não foi possível carregar os banners.', error);
    return;
  }

  document.querySelectorAll('[data-banner-slot]').forEach((slot) => {
    slot.innerHTML = (data || [])
      .filter((b) => b.position === slot.dataset.bannerSlot)
      .map(storeBannerHtml)
      .join('');
  });
}

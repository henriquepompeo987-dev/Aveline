/* =====================================================================
   AVELINE – Favoritos (salvos no navegador)
   ===================================================================== */

const WISHLIST_KEY = 'aveline_wishlist';
let wishlist = storage.get(WISHLIST_KEY, []);

function isWishlisted(id) {
  return wishlist.includes(String(id));
}

function toggleWishlist(id) {
  const key = String(id);
  const p = getProduct(key);
  if (isWishlisted(key)) {
    wishlist = wishlist.filter((w) => w !== key);
    if (p) showToast(p.name + ' removido dos favoritos.');
  } else {
    wishlist.push(key);
    if (p) showToast(p.name + ' adicionado aos favoritos.');
  }
  storage.set(WISHLIST_KEY, wishlist);
  updateWishlistUI();
}

function updateWishlistUI() {
  // Remove favoritos de produtos que não existem mais
  if (PRODUCTS.length) wishlist = wishlist.filter((id) => getProduct(id));

  const badge = document.getElementById('wishlist-badge');
  if (badge) {
    badge.textContent = wishlist.length;
    badge.classList.toggle('hidden', wishlist.length === 0);
    badge.classList.toggle('flex', wishlist.length > 0);
  }

  document.querySelectorAll('[data-wish]').forEach((btn) => {
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.toggle('is-filled', isWishlisted(btn.dataset.wish));
  });

  renderWishlist();
}

function renderWishlist() {
  const box = document.getElementById('wishlist-items');
  if (!box) return;
  const items = wishlist.map(getProduct).filter(Boolean);

  if (!items.length) {
    box.innerHTML =
      '<div class="flex flex-col items-center justify-center text-center gap-3 py-16">' +
        '<span class="material-symbols-outlined text-[48px] text-brand-gold">favorite</span>' +
        '<p class="font-serif text-xl text-brand-wine">Nenhum favorito ainda</p>' +
        '<p class="text-xs text-brand-dark/60 max-w-[240px]">Toque no coração dos perfumes para guardá-los aqui.</p>' +
      '</div>';
    return;
  }

  box.innerHTML = items.map((p) =>
    '<div class="flex gap-4 pb-4 border-b border-brand-border/60">' +
      '<div class="product-media w-20 h-24 flex-shrink-0 border border-brand-border cursor-pointer" onclick="openProduct(\'' + p.id + '\')">' + productImageHtml(p) + '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<span class="text-[9px] tracking-[0.2em] uppercase text-brand-gold font-bold">' + esc(p.house) + '</span>' +
        '<h4 class="font-serif text-base text-brand-wine font-bold leading-tight">' + esc(p.name) + '</h4>' +
        '<p class="text-[11px] text-brand-dark/60">' + esc(productSpec(p)) + '</p>' +
        '<div class="flex items-center justify-between mt-2 gap-2">' +
          '<span class="font-serif text-sm font-bold text-brand-wine">' + formatBRL(p.price) + '</span>' +
          (p.in_stock
            ? '<button onclick="addToCart(\'' + p.id + '\')" class="px-3 py-1.5 bg-brand-wine text-white text-[9px] font-bold tracking-widest uppercase hover:bg-brand-dark">Sacola</button>'
            : '<span class="text-[9px] font-bold tracking-widest uppercase text-brand-dark/50">Esgotado</span>') +
        '</div>' +
      '</div>' +
      '<button onclick="toggleWishlist(\'' + p.id + '\')" class="self-start text-brand-dark/40 hover:text-brand-wine" aria-label="Remover dos favoritos">' +
        '<span class="material-symbols-outlined text-[18px]">close</span>' +
      '</button>' +
    '</div>'
  ).join('');
}

function toggleWishlistDrawer(open) {
  const drawer = document.getElementById('wishlist-drawer');
  if (!drawer) return;
  const shouldOpen = open === undefined ? !drawer.classList.contains('is-open') : open;
  if (shouldOpen) {
    renderWishlist();
    openOverlay('wishlist-drawer');
  } else {
    closeAllOverlays();
  }
}

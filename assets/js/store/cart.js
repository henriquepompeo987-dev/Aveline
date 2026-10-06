/* =====================================================================
   AVELINE – Sacola (carrinho) com finalização pelo WhatsApp
   Os itens ficam salvos no navegador (localStorage).
   ===================================================================== */

const CART_KEY = 'aveline_cart_v2';
let cart = storage.get(CART_KEY, []);

function saveCart() {
  storage.set(CART_KEY, cart);
}

function variantLabel(p, key) {
  if (key === 'd5') return 'Decante 5ml';
  if (key === 'd10') return 'Decante 10ml';
  return productSpec(p) || 'Frasco';
}

function variantPrice(p, key) {
  if (key === 'd5') return Number(p.decant_5ml_price);
  if (key === 'd10') return Number(p.decant_10ml_price);
  return Number(p.price);
}

function addToCart(id, variant) {
  const key = variant || 'full';
  const p = getProduct(id);
  if (!p) return;
  const price = variantPrice(p, key);
  if (!price) return showToast('Opção indisponível para este perfume.', 'error');

  const itemKey = p.id + '|' + key;
  const existing = cart.find((i) => i.key === itemKey);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      key: itemKey,
      productId: p.id,
      variant: key,
      name: p.name,
      house: p.house,
      label: variantLabel(p, key),
      price: price,
      image: p.image_url || null,
      qty: 1,
    });
  }
  saveCart();
  renderCart();
  trackAddToCart(p, key, price);
  showToast(p.name + ' (' + variantLabel(p, key) + ') adicionado à sacola.');
}

// Compatibilidade com chamadas antigas: addDecantToCart(id, '5ml')
function addDecantToCart(id, size) {
  addToCart(id, size === '10ml' ? 'd10' : 'd5');
}

function changeQty(itemKey, delta) {
  const item = cart.find((i) => i.key === itemKey);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.key !== itemKey);
  saveCart();
  renderCart();
}

function removeFromCart(itemKey) {
  cart = cart.filter((i) => i.key !== itemKey);
  saveCart();
  renderCart();
}

/** Atualiza nome/preço/imagem com os dados atuais do catálogo. */
function syncCartWithCatalog() {
  if (!PRODUCTS.length) return;
  cart = cart.filter((item) => {
    const p = getProduct(item.productId);
    if (!p) return false; // produto removido ou desativado
    const price = variantPrice(p, item.variant);
    if (!price) return false;
    item.name = p.name;
    item.house = p.house;
    item.label = variantLabel(p, item.variant);
    item.price = price;
    item.image = p.image_url || null;
    return true;
  });
  saveCart();
}

function cartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function renderCart() {
  const count = cartCount();
  const total = cartTotal();

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setText('cart-counter', count);
  setText('drawer-count', count);
  setText('cart-subtotal', formatBRL(total));
  setText('cart-total', formatBRL(total));

  const list = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');
  if (!list) return;

  if (!cart.length) {
    list.innerHTML =
      '<div class="h-full flex flex-col items-center justify-center text-center gap-3 py-16">' +
        '<span class="material-symbols-outlined text-[48px] text-brand-gold">local_mall</span>' +
        '<p class="font-serif text-xl text-brand-wine">Sua sacola está vazia</p>' +
        '<p class="text-xs text-brand-dark/60 max-w-[240px]">Explore a curadoria e encontre a fragrância que conta a sua história.</p>' +
        '<a href="#catalogo" onclick="closeAllOverlays()" class="mt-2 px-6 py-3 bg-brand-wine text-white text-[10px] font-bold tracking-[0.16em] uppercase hover:bg-brand-dark">Explorar perfumes</a>' +
      '</div>';
    if (footer) footer.classList.add('hidden');
    return;
  }
  if (footer) footer.classList.remove('hidden');

  list.innerHTML = cart.map((item) =>
    '<div class="flex gap-4 pb-4 border-b border-brand-border/60">' +
      '<div class="product-media w-20 h-24 flex-shrink-0 border border-brand-border">' +
        productImageHtml({ name: item.name, house: item.house, image_url: item.image }) +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<span class="text-[9px] tracking-[0.2em] uppercase text-brand-gold font-bold">' + esc(item.house) + '</span>' +
        '<h4 class="font-serif text-base text-brand-wine font-bold leading-tight truncate">' + esc(item.name) + '</h4>' +
        '<p class="text-[11px] text-brand-dark/60">' + esc(item.label) + '</p>' +
        '<div class="flex items-center justify-between mt-2">' +
          '<div class="flex items-center border border-brand-border">' +
            '<button onclick="changeQty(\'' + item.key + '\', -1)" class="w-7 h-7 text-brand-wine hover:bg-brand-cream" aria-label="Diminuir">−</button>' +
            '<span class="w-7 text-center text-xs font-semibold">' + item.qty + '</span>' +
            '<button onclick="changeQty(\'' + item.key + '\', 1)" class="w-7 h-7 text-brand-wine hover:bg-brand-cream" aria-label="Aumentar">+</button>' +
          '</div>' +
          '<span class="font-serif text-sm font-bold text-brand-wine">' + formatBRL(item.price * item.qty) + '</span>' +
        '</div>' +
      '</div>' +
      '<button onclick="removeFromCart(\'' + item.key + '\')" class="self-start text-brand-dark/40 hover:text-brand-wine" aria-label="Remover">' +
        '<span class="material-symbols-outlined text-[18px]">delete</span>' +
      '</button>' +
    '</div>'
  ).join('');
}

function toggleCart(open) {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  const shouldOpen = open === undefined ? !drawer.classList.contains('is-open') : open;
  if (shouldOpen) {
    renderCart();
    openOverlay('cart-drawer');
  } else {
    closeAllOverlays();
  }
}

function checkoutViaWhatsApp() {
  if (!cart.length) return showToast('Sua sacola está vazia.', 'error');

  const name = (document.getElementById('order-customer-name') || {}).value || '';
  const cep = (document.getElementById('order-customer-cep') || {}).value || '';
  const phone = (document.getElementById('order-customer-phone') || {}).value || '';

  if (name.trim().length < 3) {
    showToast('Informe seu nome para finalizar o pedido.', 'error');
    const el = document.getElementById('order-customer-name');
    if (el) el.focus();
    return;
  }

  const lines = [
    'Olá, AVELINE! Gostaria de finalizar meu pedido:',
    '',
    ...cart.map((i) => '• ' + i.qty + 'x ' + i.name + ' – ' + i.house + ' (' + i.label + ') — ' + formatBRL(i.price * i.qty)),
    '',
    'Total estimado: ' + formatBRL(cartTotal()),
    '',
    'Nome: ' + name.trim(),
  ];
  if (cep.trim()) lines.push('CEP: ' + cep.trim());
  if (phone.trim()) lines.push('WhatsApp: ' + phone.trim());

  trackCheckout(cart, cartTotal(), name.trim());
  window.open(whatsappLink(lines.join('\n')), '_blank', 'noopener');
}

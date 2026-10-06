/* =====================================================================
   AVELINE – Registro de eventos da loja
   Grava em public.events quando alguém adiciona à sacola e quando
   alguém segue para o WhatsApp. Falhas são silenciosas: o visitante
   nunca deve ser interrompido por causa da métrica.
   ===================================================================== */

const SESSION_KEY = 'aveline_session';

function sessionId() {
  let id = storage.get(SESSION_KEY, null);
  if (!id) {
    id = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    storage.set(SESSION_KEY, id);
  }
  return id;
}

function trackEvent(type, payload) {
  if (!window.sb) return;
  window.sb
    .from('events')
    .insert([Object.assign({ type: type, session_id: sessionId() }, payload)])
    .then(null, () => {});
}

function trackAddToCart(product, variant, price) {
  trackEvent('add_to_cart', {
    product_id: product.id,
    product_name: product.name,
    variant: variant,
    quantity: 1,
    value: price,
  });
}

function trackCheckout(items, total, customerName) {
  trackEvent('checkout_whatsapp', {
    quantity: items.reduce((sum, i) => sum + i.qty, 0),
    value: total,
    customer_name: customerName || null,
    items: items.map((i) => ({
      product_id: i.productId,
      name: i.name,
      house: i.house,
      label: i.label,
      variant: i.variant,
      qty: i.qty,
      price: i.price,
    })),
  });
}

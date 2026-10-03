/* =====================================================================
   AVELINE – Inicialização da loja
   Roda depois que todas as partes (partials) foram carregadas.
   ===================================================================== */

async function initStore() {
  const year = document.getElementById('footer-year');
  if (year) year.textContent = new Date().getFullYear();

  applyDynamicLinks();
  bindCepMask();
  watchActiveSection();
  renderQuizTags();
  renderCart();

  await loadProducts();

  syncCartWithCatalog();
  renderAllProducts();
  renderCart();
  updateWishlistUI();

  // Se a página abriu com #ancora, rola até ela agora que o conteúdo existe
  if (location.hash) {
    try {
      const target = document.querySelector(location.hash);
      if (target) target.scrollIntoView();
    } catch (_) { /* hash que não é seletor válido */ }
  }
}

if (window.__partialsLoaded) initStore();
else document.addEventListener('partials:loaded', initStore, { once: true });

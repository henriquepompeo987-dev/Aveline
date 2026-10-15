/* =====================================================================
   AVELINE – Bússola Olfativa
   Recomenda o perfume com mais famílias em comum com as escolhidas.
   ===================================================================== */

const SCENT_FAMILIES = [
  'Floral', 'Amadeirado', 'Oriental', 'Cítrico', 'Gourmand',
  'Couro', 'Aromático', 'Baunilha', 'Frutado', 'Almiscarado',
];

const selectedFamilies = new Set(['Amadeirado', 'Baunilha']);

function renderQuizTags() {
  const box = document.getElementById('scent-tag-list');
  if (!box) return;
  box.innerHTML = SCENT_FAMILIES.map((f) =>
    '<button type="button" onclick="toggleTag(this, \'' + f + '\')" class="tag-btn ' + (selectedFamilies.has(f) ? 'is-active' : '') + '" aria-pressed="' + selectedFamilies.has(f) + '">' + f + '</button>'
  ).join('');
}

function toggleTag(btn, family) {
  if (selectedFamilies.has(family)) selectedFamilies.delete(family);
  else selectedFamilies.add(family);
  if (btn) {
    btn.classList.toggle('is-active', selectedFamilies.has(family));
    btn.setAttribute('aria-pressed', selectedFamilies.has(family));
  }
  renderQuiz();
}

function bestMatch() {
  if (!PRODUCTS.length) return null;
  let best = null;
  let bestScore = -1;
  PRODUCTS.forEach((p) => {
    const fams = p.families || [];
    let score = fams.filter((f) => selectedFamilies.has(f)).length * 10;
    if (p.is_featured) score += 1;   // desempate a favor do destaque
    if (p.in_stock) score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  });
  return best;
}

function renderQuiz() {
  const box = document.getElementById('quiz-result');
  if (!box) return;

  if (!selectedFamilies.size) {
    box.innerHTML =
      '<div class="w-full text-center py-6">' +
        '<span class="material-symbols-outlined text-[40px] text-brand-gold">explore</span>' +
        '<p class="text-sm text-brand-dark/70 mt-2">Escolha ao menos uma família olfativa para receber sua recomendação.</p>' +
      '</div>';
    return;
  }

  const p = bestMatch();
  if (!p) return;

  box.innerHTML =
    '<div class="product-media w-28 h-32 flex-shrink-0 border border-brand-border/60 cursor-pointer" onclick="openProduct(\'' + p.id + '\')">' + productImageHtml(p) + '</div>' +
    '<div class="space-y-1 text-center sm:text-left">' +
      '<span class="text-[10px] font-bold tracking-widest text-brand-gold uppercase">Sua Assinatura Ideal</span>' +
      '<h4 class="font-serif text-xl font-bold text-brand-wine">' + esc(p.name) + ' • ' + esc(p.house) + '</h4>' +
      '<p class="text-xs text-brand-dark/70">' + esc(p.short_description || '') + '</p>' +
      '<div class="pt-3 flex flex-wrap gap-2 justify-center sm:justify-start">' +
        (p.in_stock
          ? '<button onclick="addToCart(\'' + p.id + '\')" class="px-4 py-2 bg-brand-wine text-white text-[10px] font-bold tracking-widest uppercase hover:bg-brand-dark transition-colors">Adicionar à sacola • ' + formatBRL(p.price) + '</button>'
          : '') +
        '<button onclick="openProduct(\'' + p.id + '\')" class="px-4 py-2 bg-brand-cream text-brand-wine text-[10px] font-bold tracking-widest uppercase hover:bg-brand-gold/30 transition-colors">Ver pirâmide</button>' +
      '</div>' +
    '</div>';
}

/* =====================================================================
   AVELINE Admin – Produtos (listar, criar, editar, excluir, imagens)
   ===================================================================== */

const FAMILY_OPTIONS = [
  'Floral', 'Amadeirado', 'Oriental', 'Cítrico', 'Gourmand',
  'Couro', 'Aromático', 'Baunilha', 'Frutado', 'Almiscarado',
];
const CATEGORY_NAMES = { feminino: 'Feminino', masculino: 'Masculino', unissex: 'Unissex' };

const state = {
  products: [],
  editingId: null,
  mainImage: null,
  gallery: [],
  originalImages: [],  // imagens que o produto tinha ao abrir o editor
  sessionUploads: [],  // imagens enviadas desde que o editor foi aberto
  uploading: 0,
  pendingGallery: 0,
  slugTouched: false,
  dirty: false,
};

/* ---------------------------------------------------------------------
   Listagem
   --------------------------------------------------------------------- */
async function loadAdminProducts() {
  const { data, error } = await window.sb
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    document.getElementById('product-rows').innerHTML =
      '<tr><td colspan="7" class="text-center py-10 text-red-700">Erro ao carregar produtos: ' + esc(error.message) + '</td></tr>';
    return;
  }
  state.products = data || [];
  renderStats();
  renderProductTable();
  fillHouseList();
}

function renderStats() {
  const list = state.products;
  const cards = [
    { icon: 'inventory_2', label: 'Produtos', value: list.length },
    { icon: 'visibility', label: 'Visíveis na loja', value: list.filter((p) => p.active).length },
    { icon: 'remove_shopping_cart', label: 'Esgotados', value: list.filter((p) => !p.in_stock).length },
    { icon: 'hide_image', label: 'Sem imagem', value: list.filter((p) => !p.image_url).length },
  ];
  document.getElementById('stats').innerHTML = cards.map((c) =>
    '<div class="bg-white border border-brand-border p-4 flex items-center gap-4">' +
      '<span class="w-11 h-11 rounded-full bg-brand-cream/70 text-brand-wine flex items-center justify-center"><span class="material-symbols-outlined">' + c.icon + '</span></span>' +
      '<div><div class="font-serif text-2xl font-bold text-brand-wine leading-none">' + c.value + '</div>' +
      '<div class="text-[10px] uppercase tracking-[0.14em] text-brand-dark/60 mt-1">' + c.label + '</div></div>' +
    '</div>'
  ).join('');
}

function filteredProducts() {
  const text = normalizeText(document.getElementById('filter-text').value).trim();
  const category = document.getElementById('filter-category').value;
  const status = document.getElementById('filter-status').value;

  return state.products.filter((p) => {
    if (text && !normalizeText([p.name, p.house, p.slug].join(' ')).includes(text)) return false;
    if (category && p.category !== category) return false;
    if (status === 'active' && !p.active) return false;
    if (status === 'inactive' && p.active) return false;
    if (status === 'out' && p.in_stock) return false;
    if (status === 'noimage' && p.image_url) return false;
    return true;
  });
}

function renderProductTable() {
  const tbody = document.getElementById('product-rows');
  const list = filteredProducts();

  if (!state.products.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center py-14">' +
        '<p class="font-serif text-xl text-brand-wine">Nenhum produto cadastrado</p>' +
        '<p class="text-xs text-brand-dark/60 mt-1">Clique em "Novo produto" ou rode o supabase/seed.sql.</p>' +
      '</td></tr>';
    return;
  }
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-brand-dark/50">Nenhum produto com esses filtros.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((p) => {
    const pills = [
      p.active ? '<span class="status-pill ok">Visível</span>' : '<span class="status-pill off">Oculto</span>',
      !p.in_stock ? '<span class="status-pill warn">Esgotado</span>' : '',
      !p.image_url ? '<span class="status-pill warn">Sem imagem</span>' : '',
      p.is_featured ? '<span class="status-pill brand">Destaque</span>' : '',
      p.is_niche ? '<span class="status-pill brand">Nicho</span>' : '',
      p.is_new ? '<span class="status-pill brand">Lançamento</span>' : '',
    ].join(' ');

    const decants = [
      p.decant_5ml_price ? '5ml ' + formatBRL(p.decant_5ml_price) : '',
      p.decant_10ml_price ? '10ml ' + formatBRL(p.decant_10ml_price) : '',
    ].filter(Boolean).join('<br/>') || '<span class="text-brand-dark/40">—</span>';

    const compare = p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
      ? '<div class="text-[11px] text-brand-dark/45 line-through">' + formatBRL(p.compare_at_price) + '</div>'
      : '';

    return (
      '<tr class="' + (p.active ? '' : 'is-inactive') + '">' +
        '<td><div class="product-media w-14 h-16 border border-brand-border">' + productImageHtml(p) + '</div></td>' +
        '<td>' +
          '<button onclick="openEditor(\'' + p.id + '\')" class="text-left group">' +
            '<span class="block text-[10px] tracking-[0.18em] uppercase text-brand-gold font-bold">' + esc(p.house) + '</span>' +
            '<span class="block font-serif text-base font-bold text-brand-wine group-hover:underline">' + esc(p.name) + '</span>' +
            '<span class="block text-[11px] text-brand-dark/55">' + esc(productSpec(p)) + '</span>' +
          '</button>' +
        '</td>' +
        '<td>' + esc(CATEGORY_NAMES[p.category] || p.category) + '</td>' +
        '<td class="text-right whitespace-nowrap">' + compare + '<span class="font-semibold text-brand-wine">' + formatBRL(p.price) + '</span></td>' +
        '<td class="text-right text-xs whitespace-nowrap">' + decants + '</td>' +
        '<td><div class="flex flex-wrap gap-1 max-w-[220px]">' + pills + '</div></td>' +
        '<td class="text-right whitespace-nowrap">' +
          '<button onclick="toggleActive(\'' + p.id + '\')" class="icon-btn" title="' + (p.active ? 'Ocultar da loja' : 'Mostrar na loja') + '">' +
            '<span class="material-symbols-outlined">' + (p.active ? 'visibility' : 'visibility_off') + '</span></button> ' +
          '<button onclick="openEditor(\'' + p.id + '\')" class="icon-btn" title="Editar"><span class="material-symbols-outlined">edit</span></button> ' +
          '<button onclick="deleteProduct(\'' + p.id + '\')" class="icon-btn danger" title="Excluir"><span class="material-symbols-outlined">delete</span></button>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

function fillHouseList() {
  const houses = Array.from(new Set(state.products.map((p) => p.house).filter(Boolean))).sort();
  document.getElementById('house-list').innerHTML = houses.map((h) => '<option value="' + esc(h) + '"></option>').join('');
}

function replaceProductInState(product) {
  const idx = state.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) state.products[idx] = product;
  else state.products.push(product);
  state.products.sort((a, b) => (a.sort_order - b.sort_order) || String(a.created_at).localeCompare(String(b.created_at)));
  renderStats();
  renderProductTable();
  fillHouseList();
}

async function toggleActive(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  const { data, error } = await window.sb.from('products').update({ active: !p.active }).eq('id', id).select().single();
  if (error) return showToast(friendlyError(error), 'error');
  replaceProductInState(data);
  showToast(data.active ? '"' + data.name + '" está visível na loja.' : '"' + data.name + '" foi ocultado da loja.');
}

async function deleteProduct(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  if (!confirm('Excluir "' + p.name + '" definitivamente?\nAs imagens enviadas para este produto também serão apagadas.')) return;

  const { data, error } = await window.sb.from('products').delete().eq('id', id).select('id');
  if (error) return showToast(friendlyError(error), 'error');
  if (!data || !data.length) return showToast('Sem permissão para excluir este produto.', 'error');

  const extra = state.editingId === id ? state.sessionUploads : [];
  await deleteStorageImages([p.image_url].concat(p.gallery || [], extra));

  state.products = state.products.filter((x) => x.id !== id);
  renderStats();
  renderProductTable();
  if (state.editingId === id) closeEditor(true);
  showToast('"' + p.name + '" foi excluído.');
}

function friendlyError(error) {
  if (!error) return 'Erro desconhecido.';
  if (error.code === '23505') return 'Já existe um produto com esse slug. Altere o campo "Slug".';
  if (error.code === 'PGRST116' || error.code === '42501') return 'Sem permissão. Verifique se sua conta está na tabela public.admins.';
  return error.message || String(error);
}

/* ---------------------------------------------------------------------
   Editor
   --------------------------------------------------------------------- */
const EMPTY_PRODUCT = {
  name: '', house: '', slug: '', badge: '', category: 'unissex',
  concentration: 'Eau de Parfum', volume_ml: 100,
  price: '', compare_at_price: '', decant_5ml_price: '', decant_10ml_price: '',
  short_description: '', description: '',
  notes_top: [], notes_heart: [], notes_base: [], families: [],
  active: true, in_stock: true, is_niche: false, is_new: false, is_featured: false,
  sort_order: 0, image_url: null, gallery: [],
};

function renderFamilies(selected) {
  document.getElementById('families-box').innerHTML = FAMILY_OPTIONS.map((f) =>
    '<label class="family-toggle"><input type="checkbox" name="families" value="' + f + '" ' + (selected.includes(f) ? 'checked' : '') + '/><span>' + f + '</span></label>'
  ).join('');
}

function setField(name, value) {
  const el = document.getElementById('product-form').elements[name];
  if (!el) return;
  if (el.type === 'checkbox') el.checked = Boolean(value);
  else el.value = value == null ? '' : value;
}

function openEditor(id) {
  const p = id ? state.products.find((x) => x.id === id) : null;
  const v = Object.assign({}, EMPTY_PRODUCT, p || {});
  const form = document.getElementById('product-form');

  form.reset();
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));

  ['name', 'house', 'slug', 'badge', 'category', 'concentration', 'volume_ml', 'price', 'compare_at_price',
   'decant_5ml_price', 'decant_10ml_price', 'short_description', 'description', 'sort_order',
   'active', 'in_stock', 'is_niche', 'is_new', 'is_featured'].forEach((k) => setField(k, v[k]));
  setField('notes_top', (v.notes_top || []).join(', '));
  setField('notes_heart', (v.notes_heart || []).join(', '));
  setField('notes_base', (v.notes_base || []).join(', '));
  renderFamilies(v.families || []);

  state.editingId = p ? p.id : null;
  state.mainImage = v.image_url || null;
  state.gallery = (v.gallery || []).slice();
  state.originalImages = [state.mainImage].concat(state.gallery).filter(Boolean);
  state.sessionUploads = [];
  state.slugTouched = Boolean(p && p.slug);
  state.dirty = false;
  document.getElementById('image-url-input').value = '';

  document.getElementById('editor-kicker').textContent = p ? 'Editando produto' : 'Novo produto';
  document.getElementById('editor-title').textContent = p ? p.name : 'Cadastrar fragrância';
  document.getElementById('btn-delete-in-editor').classList.toggle('hidden', !p);

  renderImages();
  document.getElementById('editor').classList.add('is-open');
  document.getElementById('editor-backdrop').classList.add('is-open');
  document.body.classList.add('is-locked');
  form.scrollTop = 0;
  setTimeout(() => document.getElementById('f-name').focus(), 300);
}

function closeEditor(saved) {
  const isOpen = document.getElementById('editor').classList.contains('is-open');
  if (!isOpen) return;

  if (saved !== true) {
    if (state.uploading && !confirm('Ainda há imagens sendo enviadas. Fechar mesmo assim?')) return;
    if (state.dirty && !confirm('Descartar as alterações deste produto?')) return;
    // Imagens enviadas e não salvas viram lixo no Storage: apaga
    if (state.sessionUploads.length) deleteStorageImages(state.sessionUploads);
  }

  state.editingId = null;
  state.sessionUploads = [];
  state.dirty = false;
  document.getElementById('editor').classList.remove('is-open');
  document.getElementById('editor-backdrop').classList.remove('is-open');
  document.body.classList.remove('is-locked');
}

function autoSlug() {
  if (state.slugTouched) return;
  document.getElementById('f-slug').value = slugify(document.getElementById('f-name').value);
}

/* ---------------- Imagens no editor ---------------- */
function uploadFolder() {
  return document.getElementById('f-slug').value || slugify(document.getElementById('f-name').value) || 'novo-produto';
}

function renderImages() {
  const zone = document.getElementById('main-dropzone');
  const preview = document.getElementById('main-image-preview');
  preview.innerHTML = state.mainImage ? '<img src="' + esc(state.mainImage) + '" alt="Imagem principal"/>' : '';
  zone.classList.toggle('has-image', Boolean(state.mainImage));

  const items = state.gallery.map((url, i) =>
    '<div class="gallery-item">' +
      '<img src="' + esc(url) + '" alt="Imagem ' + (i + 2) + '" loading="lazy"/>' +
      '<div class="gallery-actions">' +
        '<button type="button" onclick="makeMainImage(' + i + ')" title="Usar como principal"><span class="material-symbols-outlined">star</span></button>' +
        '<button type="button" onclick="removeGalleryImage(' + i + ')" title="Remover"><span class="material-symbols-outlined">close</span></button>' +
      '</div>' +
    '</div>'
  );
  for (let i = 0; i < state.pendingGallery; i++) items.push('<div class="gallery-item is-uploading"></div>');

  document.getElementById('gallery-list').innerHTML = items.length
    ? items.join('')
    : '<p class="col-span-full text-[11px] text-brand-dark/50 py-3">Nenhuma imagem extra.</p>';
}

function setMainLoading(loading) {
  document.querySelector('#main-dropzone .dropzone-loading').classList.toggle('hidden', !loading);
}

async function handleMainImage(files) {
  const file = files && files[0];
  const input = document.getElementById('main-image-input');
  if (!file) return;

  state.uploading++;
  setMainLoading(true);
  try {
    const url = await uploadProductImage(file, uploadFolder());
    state.sessionUploads.push(url);
    state.mainImage = url;
    state.dirty = true;
    renderImages();
    showToast('Imagem principal enviada.');
  } catch (err) {
    console.error(err);
    showToast('Falha no envio: ' + (err.message || err), 'error');
  } finally {
    state.uploading--;
    setMainLoading(false);
    if (input) input.value = '';
  }
}

async function handleGalleryImages(files) {
  const list = Array.from(files || []);
  if (!list.length) return;

  state.pendingGallery += list.length;
  state.uploading += list.length;
  renderImages();

  await Promise.all(list.map(async (file) => {
    try {
      const url = await uploadProductImage(file, uploadFolder());
      state.sessionUploads.push(url);
      state.gallery.push(url);
      state.dirty = true;
    } catch (err) {
      console.error(err);
      showToast('Falha no envio: ' + (err.message || err), 'error');
    } finally {
      state.pendingGallery--;
      state.uploading--;
      renderImages();
    }
  }));
}

function removeMainImage() {
  if (!state.mainImage) return;
  state.mainImage = null;
  state.dirty = true;
  renderImages();
}

function removeGalleryImage(index) {
  state.gallery.splice(index, 1);
  state.dirty = true;
  renderImages();
}

function makeMainImage(index) {
  const url = state.gallery.splice(index, 1)[0];
  if (state.mainImage) state.gallery.unshift(state.mainImage);
  state.mainImage = url;
  state.dirty = true;
  renderImages();
}

function useImageUrl() {
  const input = document.getElementById('image-url-input');
  const url = input.value.trim();
  if (!/^https?:\/\/\S+$/i.test(url)) return showToast('Informe uma URL começando com http:// ou https://', 'error');
  if (!state.mainImage) state.mainImage = url;
  else state.gallery.push(url);
  input.value = '';
  state.dirty = true;
  renderImages();
}

/* ---------------- Salvar ---------------- */
function parseList(value) {
  return String(value || '').split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
}

function numberOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function textOrNull(value) {
  const t = String(value || '').trim();
  return t || null;
}

async function saveProduct(event) {
  event.preventDefault();
  if (state.uploading) return showToast('Aguarde o envio das imagens terminar.', 'error');

  const form = document.getElementById('product-form');
  const fd = new FormData(form);
  const el = form.elements;
  const name = String(fd.get('name') || '').trim();

  const payload = {
    name: name,
    house: String(fd.get('house') || '').trim(),
    slug: slugify(fd.get('slug') || name),
    badge: textOrNull(fd.get('badge')),
    category: fd.get('category'),
    concentration: textOrNull(fd.get('concentration')),
    volume_ml: numberOrNull(fd.get('volume_ml')) ? Math.round(numberOrNull(fd.get('volume_ml'))) : null,
    price: numberOrNull(fd.get('price')),
    compare_at_price: numberOrNull(fd.get('compare_at_price')),
    decant_5ml_price: numberOrNull(fd.get('decant_5ml_price')),
    decant_10ml_price: numberOrNull(fd.get('decant_10ml_price')),
    short_description: textOrNull(fd.get('short_description')),
    description: textOrNull(fd.get('description')),
    notes_top: parseList(fd.get('notes_top')),
    notes_heart: parseList(fd.get('notes_heart')),
    notes_base: parseList(fd.get('notes_base')),
    families: fd.getAll('families'),
    active: el.active.checked,
    in_stock: el.in_stock.checked,
    is_niche: el.is_niche.checked,
    is_new: el.is_new.checked,
    is_featured: el.is_featured.checked,
    sort_order: Math.round(numberOrNull(fd.get('sort_order')) || 0),
    image_url: state.mainImage,
    gallery: state.gallery,
  };

  // Validação
  form.querySelectorAll('.is-invalid').forEach((x) => x.classList.remove('is-invalid'));
  const invalid = [];
  if (!payload.name) invalid.push('name');
  if (!payload.house) invalid.push('house');
  if (payload.price === null || payload.price < 0) invalid.push('price');
  if (!payload.slug) invalid.push('slug');
  if (invalid.length) {
    invalid.forEach((n) => el[n].classList.add('is-invalid'));
    el[invalid[0]].focus();
    return showToast('Preencha os campos obrigatórios destacados.', 'error');
  }

  const btn = document.getElementById('btn-save');
  btn.disabled = true;

  const query = state.editingId
    ? window.sb.from('products').update(payload).eq('id', state.editingId)
    : window.sb.from('products').insert(payload);
  const { data, error } = await query.select().single();

  btn.disabled = false;
  if (error) {
    console.error(error);
    if (error.code === '23505') el.slug.classList.add('is-invalid');
    return showToast(friendlyError(error), 'error');
  }

  // Apaga do Storage as imagens que saíram do produto
  const finalUrls = [payload.image_url].concat(payload.gallery).filter(Boolean);
  const orphans = state.originalImages.concat(state.sessionUploads).filter((u) => !finalUrls.includes(u));
  deleteStorageImages(orphans);

  const wasNew = !state.editingId;
  replaceProductInState(data);
  closeEditor(true);
  showToast(wasNew ? '"' + data.name + '" cadastrado com sucesso.' : 'Alterações de "' + data.name + '" salvas.');
}

/* =====================================================================
   AVELINE Admin – Banners (faixas horizontais da loja)
   ===================================================================== */

const BANNER_POSITIONS = [
  { value: 'topo', label: 'Topo (antes do destaque principal)' },
  { value: 'apos-hero', label: 'Depois do destaque principal' },
  { value: 'apos-quiz', label: 'Depois da Bússola Olfativa' },
  { value: 'apos-catalogo', label: 'Depois do catálogo' },
  { value: 'apos-sobre', label: 'Depois do "Sobre"' },
  { value: 'apos-depoimentos', label: 'Depois dos depoimentos' },
  { value: 'antes-rodape', label: 'Antes do rodapé' },
];

const bannerState = {
  banners: [],
  loaded: false,
  editingId: null,
  image: null,
  originalImage: null,
  sessionUploads: [],
  uploading: 0,
  dirty: false,
};

function positionLabel(value) {
  const p = BANNER_POSITIONS.find((x) => x.value === value);
  return p ? p.label : value;
}

function htmlToText(html) {
  return new DOMParser().parseFromString(String(html || ''), 'text/html').body.textContent.trim();
}

/* ---------------- Listagem ---------------- */
async function loadBanners() {
  const { data, error } = await window.sb
    .from('banners')
    .select('*')
    .order('position', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    const hint = error.code === '42P01' || /banners|sort_order/.test(error.message || '')
      ? ' Rode novamente o supabase/schema.sql no Supabase para atualizar a tabela.'
      : '';
    document.getElementById('banner-rows').innerHTML =
      '<tr><td colspan="6" class="text-center py-10 text-red-700">Erro ao carregar banners: ' + esc(error.message) + esc(hint) + '</td></tr>';
    return;
  }
  bannerState.banners = data || [];
  bannerState.loaded = true;
  renderBannerTable();
}

function renderBannerTable() {
  const tbody = document.getElementById('banner-rows');
  const list = bannerState.banners;

  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center py-14">' +
        '<p class="font-serif text-xl text-brand-wine">Nenhum banner criado</p>' +
        '<p class="text-xs text-brand-dark/60 mt-1">Clique em "Novo banner" para criar o primeiro.</p>' +
      '</td></tr>';
    return;
  }

  // Posições com dois ou mais banners viram carrossel na loja
  const perPosition = {};
  list.forEach((b) => { perPosition[b.position] = (perPosition[b.position] || 0) + 1; });

  tbody.innerHTML = list.map((b) => {
    const titleText = htmlToText(b.title);
    const title = titleText ? esc(titleText) : '<span class="text-brand-dark/40">Sem título</span>';
    const thumb = b.image_url
      ? '<img src="' + esc(b.image_url) + '" alt="" class="w-full h-full object-cover" loading="lazy"/>'
      : '<span class="material-symbols-outlined text-brand-gold">image</span>';
    const carousel = perPosition[b.position] > 1
      ? '<span class="block text-[10px] text-brand-gold font-bold uppercase tracking-wider mt-1">Carrossel de ' + perPosition[b.position] + '</span>'
      : '';
    return (
      '<tr class="' + (b.active ? '' : 'is-inactive') + '">' +
        '<td><div class="w-40 aspect-[4/1] border border-brand-border bg-brand-linen flex items-center justify-center overflow-hidden">' + thumb + '</div></td>' +
        '<td><button onclick="openBannerEditor(\'' + b.id + '\')" class="text-left font-serif text-base font-bold text-brand-wine hover:underline">' + title + '</button></td>' +
        '<td class="text-xs">' + esc(positionLabel(b.position)) + carousel + '</td>' +
        '<td class="text-center font-serif text-lg text-brand-wine">' + (b.sort_order || 0) + '</td>' +
        '<td>' + (b.active ? '<span class="status-pill ok">Visível</span>' : '<span class="status-pill off">Oculto</span>') + '</td>' +
        '<td class="text-right whitespace-nowrap">' +
          '<button onclick="toggleBannerActive(\'' + b.id + '\')" class="icon-btn" title="' + (b.active ? 'Ocultar da loja' : 'Mostrar na loja') + '">' +
            '<span class="material-symbols-outlined">' + (b.active ? 'visibility' : 'visibility_off') + '</span></button> ' +
          '<button onclick="openBannerEditor(\'' + b.id + '\')" class="icon-btn" title="Editar"><span class="material-symbols-outlined">edit</span></button> ' +
          '<button onclick="deleteBanner(\'' + b.id + '\')" class="icon-btn danger" title="Excluir"><span class="material-symbols-outlined">delete</span></button>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

function replaceBannerInState(banner) {
  const idx = bannerState.banners.findIndex((b) => b.id === banner.id);
  if (idx >= 0) bannerState.banners[idx] = banner;
  else bannerState.banners.push(banner);
  bannerState.banners.sort((a, b) =>
    a.position.localeCompare(b.position) ||
    (a.sort_order || 0) - (b.sort_order || 0) ||
    String(a.created_at).localeCompare(String(b.created_at))
  );
  renderBannerTable();
}

async function toggleBannerActive(id) {
  const b = bannerState.banners.find((x) => x.id === id);
  if (!b) return;
  const { data, error } = await window.sb.from('banners').update({ active: !b.active }).eq('id', id).select().single();
  if (error) return showToast(friendlyError(error), 'error');
  replaceBannerInState(data);
  showToast(data.active ? 'Banner visível na loja.' : 'Banner ocultado da loja.');
}

async function deleteBanner(id) {
  const b = bannerState.banners.find((x) => x.id === id);
  if (!b) return;
  if (!confirm('Excluir este banner definitivamente?\nA imagem enviada também será apagada.')) return;

  const { data, error } = await window.sb.from('banners').delete().eq('id', id).select('id');
  if (error) return showToast(friendlyError(error), 'error');
  if (!data || !data.length) return showToast('Sem permissão para excluir este banner.', 'error');

  const extra = bannerState.editingId === id ? bannerState.sessionUploads : [];
  await deleteStorageImages([b.image_url].concat(extra));

  bannerState.banners = bannerState.banners.filter((x) => x.id !== id);
  renderBannerTable();
  if (bannerState.editingId === id) closeBannerEditor(true);
  showToast('Banner excluído.');
}

/* ---------------- Editor ---------------- */
function fillBannerPositions() {
  const select = document.getElementById('b-position');
  if (select.options.length) return;
  select.innerHTML = BANNER_POSITIONS.map((p) => '<option value="' + p.value + '">' + esc(p.label) + '</option>').join('');
}

function nextSortOrder(position) {
  const used = bannerState.banners
    .filter((b) => b.position === position)
    .map((b) => b.sort_order || 0);
  return used.length ? Math.max.apply(null, used) + 1 : 1;
}

function openBannerEditor(id) {
  const b = id ? bannerState.banners.find((x) => x.id === id) : null;
  const form = document.getElementById('banner-form');
  const position = b ? b.position : 'apos-hero';

  fillBannerPositions();
  form.reset();
  setRichText('b-title', b ? b.title : '');
  setRichText('b-description', b ? b.description : '');
  form.elements.position.value = position;
  form.elements.sort_order.value = b ? (b.sort_order || 1) : nextSortOrder(position);
  form.elements.active.checked = b ? b.active : true;
  form.elements.full_width.checked = b ? b.full_width : false;
  document.getElementById('banner-image-url').value = '';

  bannerState.editingId = b ? b.id : null;
  bannerState.image = b ? b.image_url : null;
  bannerState.originalImage = bannerState.image;
  bannerState.sessionUploads = [];
  bannerState.dirty = false;

  document.getElementById('banner-editor-kicker').textContent = b ? 'Editando banner' : 'Novo banner';
  document.getElementById('btn-delete-banner').classList.toggle('hidden', !b);

  renderBannerImage();
  document.getElementById('banner-editor').classList.add('is-open');
  document.getElementById('banner-editor-backdrop').classList.add('is-open');
  document.body.classList.add('is-locked');
  form.scrollTop = 0;
}

function closeBannerEditor(saved) {
  if (!document.getElementById('banner-editor').classList.contains('is-open')) return;

  if (saved !== true) {
    if (bannerState.uploading && !confirm('A imagem ainda está sendo enviada. Fechar mesmo assim?')) return;
    if (bannerState.dirty && !confirm('Descartar as alterações deste banner?')) return;
    if (bannerState.sessionUploads.length) deleteStorageImages(bannerState.sessionUploads);
  }

  bannerState.editingId = null;
  bannerState.sessionUploads = [];
  bannerState.dirty = false;
  document.getElementById('banner-editor').classList.remove('is-open');
  document.getElementById('banner-editor-backdrop').classList.remove('is-open');
  document.body.classList.remove('is-locked');
}

function renderBannerImage() {
  document.getElementById('banner-image-preview').innerHTML = bannerState.image
    ? '<img src="' + esc(bannerState.image) + '" alt="Imagem do banner"/>'
    : '';
  document.getElementById('banner-dropzone').classList.toggle('has-image', Boolean(bannerState.image));
}

async function handleBannerImage(files) {
  const file = files && files[0];
  const input = document.getElementById('banner-image-input');
  if (!file) return;

  const loading = document.querySelector('#banner-dropzone .dropzone-loading');
  bannerState.uploading++;
  loading.classList.remove('hidden');
  try {
    const url = await uploadProductImage(file, 'banners');
    bannerState.sessionUploads.push(url);
    bannerState.image = url;
    bannerState.dirty = true;
    renderBannerImage();
    showToast('Imagem do banner enviada.');
  } catch (err) {
    console.error(err);
    showToast('Falha no envio: ' + (err.message || err), 'error');
  } finally {
    bannerState.uploading--;
    loading.classList.add('hidden');
    if (input) input.value = '';
  }
}

function removeBannerImage() {
  if (!bannerState.image) return;
  bannerState.image = null;
  bannerState.dirty = true;
  renderBannerImage();
}

function useBannerImageUrl() {
  const input = document.getElementById('banner-image-url');
  const url = input.value.trim();
  if (!/^https?:\/\/\S+$/i.test(url)) return showToast('Informe uma URL começando com http:// ou https://', 'error');
  bannerState.image = url;
  bannerState.dirty = true;
  input.value = '';
  renderBannerImage();
}

/* ---------------- Salvar ---------------- */
async function saveBanner(event) {
  event.preventDefault();
  if (bannerState.uploading) return showToast('Aguarde o envio da imagem terminar.', 'error');

  const form = document.getElementById('banner-form');
  syncRichText('b-title');
  syncRichText('b-description');

  const payload = {
    title: textOrNull(form.elements.title.value),
    description: textOrNull(form.elements.description.value),
    image_url: bannerState.image,
    position: form.elements.position.value,
    sort_order: Math.max(0, parseInt(form.elements.sort_order.value, 10) || 0),
    active: form.elements.active.checked,
    full_width: form.elements.full_width.checked,
  };

  if (!payload.image_url && !payload.title) {
    return showToast('Adicione uma imagem ou um título ao banner.', 'error');
  }

  const btn = document.getElementById('btn-save-banner');
  btn.disabled = true;

  const query = bannerState.editingId
    ? window.sb.from('banners').update(payload).eq('id', bannerState.editingId)
    : window.sb.from('banners').insert(payload);
  const { data, error } = await query.select().single();

  btn.disabled = false;
  if (error) {
    console.error(error);
    return showToast(friendlyError(error), 'error');
  }

  const orphans = [bannerState.originalImage].concat(bannerState.sessionUploads)
    .filter((u) => u && u !== payload.image_url);
  deleteStorageImages(orphans);

  const wasNew = !bannerState.editingId;
  replaceBannerInState(data);
  closeBannerEditor(true);
  showToast(wasNew ? 'Banner criado.' : 'Banner salvo.');
}

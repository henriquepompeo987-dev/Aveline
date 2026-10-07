/* =====================================================================
   AVELINE Admin – Inicialização
   ===================================================================== */

function switchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  ['produtos', 'banners', 'metricas', 'log', 'newsletter'].forEach((name) => {
    document.getElementById('tab-' + name).classList.toggle('hidden', tab !== name);
  });
  if (tab === 'banners' && !bannerState.loaded) loadBanners();
  if (tab === 'newsletter') loadNewsletter();
  if (tab === 'metricas') loadEvents();
  if (tab === 'log') loadAccounts();
}

function bindEditorEvents() {
  const form = document.getElementById('product-form');
  initRichText('f-description');
  form.addEventListener('input', () => { state.dirty = true; });
  form.addEventListener('change', () => { state.dirty = true; });

  document.getElementById('f-slug').addEventListener('input', (e) => {
    state.slugTouched = e.target.value.trim() !== '';
  });

  // Arrastar e soltar na imagem principal
  const zone = document.getElementById('main-dropzone');
  ['dragenter', 'dragover'].forEach((evt) => zone.addEventListener(evt, (e) => {
    e.preventDefault();
    zone.classList.add('is-dragover');
  }));
  ['dragleave', 'drop'].forEach((evt) => zone.addEventListener(evt, (e) => {
    e.preventDefault();
    zone.classList.remove('is-dragover');
  }));
  zone.addEventListener('drop', (e) => handleMainImage(e.dataTransfer.files));

  // Editor de banner
  const bannerForm = document.getElementById('banner-form');
  initRichText('b-title');
  initRichText('b-description');
  bannerForm.addEventListener('input', () => { bannerState.dirty = true; });
  bannerForm.addEventListener('change', () => { bannerState.dirty = true; });

  const bannerZone = document.getElementById('banner-dropzone');
  ['dragenter', 'dragover'].forEach((evt) => bannerZone.addEventListener(evt, (e) => {
    e.preventDefault();
    bannerZone.classList.add('is-dragover');
  }));
  ['dragleave', 'drop'].forEach((evt) => bannerZone.addEventListener(evt, (e) => {
    e.preventDefault();
    bannerZone.classList.remove('is-dragover');
  }));
  bannerZone.addEventListener('drop', (e) => handleBannerImage(e.dataTransfer.files));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeEditor();
    closeBannerEditor();
  });

  window.addEventListener('beforeunload', (e) => {
    if (state.dirty || state.uploading || bannerState.dirty || bannerState.uploading) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

function initAdmin() {
  if (!window.sb) {
    showView('setup');
    return;
  }

  bindEditorEvents();

  // INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED...
  // setTimeout evita chamar o Supabase de dentro do callback (recomendação da lib).
  window.sb.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => handleSession(session), 0);
  });
}

initAdmin();

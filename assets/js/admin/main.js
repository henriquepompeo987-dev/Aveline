/* =====================================================================
   AVELINE Admin – Inicialização
   ===================================================================== */

function switchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  document.getElementById('tab-produtos').classList.toggle('hidden', tab !== 'produtos');
  document.getElementById('tab-newsletter').classList.toggle('hidden', tab !== 'newsletter');
  if (tab === 'newsletter') loadNewsletter();
}

function bindEditorEvents() {
  const form = document.getElementById('product-form');
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEditor();
  });

  window.addEventListener('beforeunload', (e) => {
    if (state.dirty || state.uploading) {
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

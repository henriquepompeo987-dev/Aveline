/* =====================================================================
   AVELINE Admin – Autenticação (Supabase Auth + GitHub)
   Qualquer pessoa pode entrar com GitHub, mas só quem está na tabela
   public.admins consegue gravar (garantido pelas políticas RLS).
   ===================================================================== */

const auth = { userId: null, ready: false, checking: false };

const VIEWS = ['loading', 'setup', 'login', 'denied', 'app'];

function showView(name) {
  VIEWS.forEach((v) => {
    const el = document.getElementById('view-' + v);
    if (el) el.classList.toggle('hidden', v !== name);
  });
}

function showLoginError(message) {
  const el = document.getElementById('login-error');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('hidden', !message);
}

/** Lê erros devolvidos pelo OAuth na URL (?error=... ou #error=...). */
function readOAuthError() {
  const params = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const desc = params.get('error_description') || hash.get('error_description');
  const code = params.get('error') || hash.get('error');
  return code ? decodeURIComponent((desc || code).replace(/\+/g, ' ')) : null;
}

/** Remove ?code=, #access_token= etc. da barra de endereço após o login. */
function cleanAuthParamsFromUrl() {
  if (location.search || location.hash) {
    history.replaceState(null, '', location.pathname);
  }
}

async function signInWithGitHub() {
  const btn = document.getElementById('btn-github');
  if (btn) btn.disabled = true;
  showLoginError('');

  const { error } = await window.sb.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: location.origin + location.pathname },
  });

  if (error) {
    if (btn) btn.disabled = false;
    showLoginError('Não foi possível iniciar o login com GitHub: ' + error.message);
  }
}

async function signOut() {
  await window.sb.auth.signOut();
  auth.userId = null;
  auth.ready = false;
  showView('login');
}

function fillUserChip(user) {
  const meta = user.user_metadata || {};
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('user-name');
  if (avatar && meta.avatar_url) {
    avatar.src = meta.avatar_url;
    avatar.classList.remove('hidden');
  }
  if (name) name.textContent = meta.user_name ? '@' + meta.user_name : (user.email || '');
}

function showDenied(user, detail) {
  const email = user.email || '(sem e-mail)';
  document.getElementById('denied-email').textContent = email;
  document.getElementById('denied-sql').textContent =
    "insert into public.admins (user_id, email) values ('" + user.id + "', '" + email + "');";
  const detailEl = document.getElementById('denied-detail');
  if (detailEl) {
    detailEl.textContent = detail || '';
    detailEl.classList.toggle('hidden', !detail);
  }
  showView('denied');
}

/** Decide qual tela mostrar para a sessão atual. */
async function handleSession(session) {
  if (!session) {
    auth.userId = null;
    auth.ready = false;
    showView('login');
    const oauthError = readOAuthError();
    if (oauthError) {
      showLoginError('O GitHub/Supabase recusou o login: ' + oauthError);
      cleanAuthParamsFromUrl();
    }
    return;
  }

  // Renovação de token / evento repetido do mesmo usuário: nada a fazer
  if (auth.userId === session.user.id && (auth.ready || auth.checking)) return;

  auth.userId = session.user.id;
  auth.checking = true;
  showView('loading');
  cleanAuthParamsFromUrl();

  const { data: isAdmin, error } = await window.sb.rpc('is_admin');
  auth.checking = false;

  if (error) {
    console.error(error);
    showDenied(session.user, 'Erro ao verificar permissão (' + error.message + '). Confirme que o schema.sql foi executado.');
    return;
  }
  if (!isAdmin) {
    showDenied(session.user);
    return;
  }

  auth.ready = true;
  fillUserChip(session.user);
  showView('app');
  await loadAdminProducts();
}

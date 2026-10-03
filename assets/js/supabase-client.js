/* Cria o cliente Supabase (window.sb). Fica null se config.js não foi preenchido,
   e a loja usa o catálogo local de assets/js/data/fallback-products.js. */
(function () {
  const cfg = window.AVELINE_CONFIG || {};
  const configured =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes('SEU-PROJETO') &&
    !cfg.SUPABASE_ANON_KEY.includes('SUA-CHAVE');

  window.SUPABASE_CONFIGURED = Boolean(configured);
  window.sb = null;

  if (!configured) {
    console.info('[AVELINE] Supabase não configurado – usando catálogo local.');
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error('[AVELINE] Biblioteca supabase-js não carregou.');
    return;
  }

  window.sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
})();

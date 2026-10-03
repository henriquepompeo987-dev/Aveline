/* =====================================================================
   Carregador de partes: troca cada <div data-include="arquivo.html">
   pelo conteúdo do arquivo. Ao terminar, dispara "partials:loaded".
   Observação: precisa de um servidor (Live Server, GitHub Pages...).
   Abrindo o index.html direto (file://) o navegador bloqueia o fetch.
   ===================================================================== */
(async function loadPartials() {
  const slots = Array.from(document.querySelectorAll('[data-include]'));

  // Aberto com duplo clique (file://): o navegador bloqueia o fetch. Mostra um aviso único.
  if (location.protocol === 'file:') {
    slots.forEach((slot, i) => (i === 0 ? null : slot.remove()));
    if (slots[0]) {
      slots[0].outerHTML =
        '<div style="max-width:560px;margin:12vh auto;padding:32px;background:#FFFBF7;border:1px solid #CBB68E;font:14px/1.6 sans-serif;color:#2D1B1E;text-align:center">' +
          '<div style="font:600 26px Georgia,serif;letter-spacing:.25em;color:#541623">AVELINE</div>' +
          '<p style="margin:16px 0 8px"><b>Abra o site pelo Live Server</b>, e não com duplo clique no arquivo.</p>' +
          '<ol style="text-align:left;display:inline-block;margin:8px 0;padding-left:20px">' +
            '<li>No VS Code, abra a pasta <b>Avile</b>.</li>' +
            '<li>Clique em <b>Go Live</b> no canto inferior direito<br/>(ou botão direito no <i>index.html</i> &rsaquo; <i>Open with Live Server</i>).</li>' +
            '<li>O site abrirá em <b>http://127.0.0.1:5500/</b></li>' +
          '</ol>' +
        '</div>';
    }
    return;
  }

  await Promise.all(
    slots.map(async (slot) => {
      const url = slot.getAttribute('data-include');
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const tpl = document.createElement('template');
        tpl.innerHTML = await res.text();
        slot.replaceWith(tpl.content);
      } catch (err) {
        console.error('[AVELINE] Falha ao carregar', url, err);
        slot.innerHTML =
          '<p style="padding:12px;margin:8px;border:1px dashed #CBB68E;font:12px sans-serif;color:#541623">' +
          'Não foi possível carregar <b>' + url + '</b>. Abra o site por um servidor local ' +
          '(ex.: extensão "Live Server" do VS Code) em vez de abrir o arquivo direto.</p>';
      }
    })
  );

  window.__partialsLoaded = true;
  document.dispatchEvent(new Event('partials:loaded'));
})();

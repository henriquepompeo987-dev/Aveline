/* =====================================================================
   AVELINE Admin – Editor de texto formatado
   Monta uma barra de ferramentas sobre um <textarea>. O textarea segue
   sendo quem guarda o valor, então o FormData do produto não muda.
   ===================================================================== */

const RICH_BUTTONS = [
  { cmd: 'undo', title: 'Desfazer', html: '&#8630;' },
  { cmd: 'redo', title: 'Refazer', html: '&#8631;' },
  { sep: true },
  { cmd: 'bold', title: 'Negrito', html: '<b>B</b>' },
  { cmd: 'italic', title: 'Itálico', html: '<i>I</i>' },
  { cmd: 'underline', title: 'Sublinhado', html: '<span style="text-decoration:underline">U</span>' },
  { cmd: 'strikeThrough', title: 'Riscado', html: '<s>ab</s>' },
  { sep: true },
  { cmd: 'insertOrderedList', title: 'Lista numerada', html: '<span class="material-symbols-outlined text-[18px]">format_list_numbered</span>' },
  { cmd: 'insertUnorderedList', title: 'Lista com marcadores', html: '<span class="material-symbols-outlined text-[18px]">format_list_bulleted</span>' },
  { sep: true },
  { cmd: 'createLink', title: 'Inserir link', html: '<span class="material-symbols-outlined text-[18px]">link</span>' },
  { cmd: 'removeFormat', title: 'Limpar formatação', html: '<span class="material-symbols-outlined text-[18px]">format_clear</span>' },
  { cmd: 'html', title: 'Ver HTML', html: '&lt;/&gt;' },
];

const RICH_STYLES = [
  { value: 'p', label: 'Normal' },
  { value: 'h2', label: 'Título 1' },
  { value: 'h3', label: 'Título 2' },
  { value: 'pre', label: 'Código' },
];

const richEditors = {};

function buildRichToolbar() {
  const buttons = RICH_BUTTONS.map((b) =>
    b.sep
      ? '<span class="rsw-separator"></span>'
      : '<button type="button" class="rsw-btn" tabindex="-1" title="' + b.title + '" data-cmd="' + b.cmd + '">' + b.html + '</button>'
  ).join('');

  const styles = '<select class="rsw-dd" tabindex="-1" title="Estilos" data-cmd="formatBlock">' +
    '<option hidden>Estilos</option>' +
    RICH_STYLES.map((s) => '<option value="' + s.value + '">' + s.label + '</option>').join('') +
    '</select>';

  return '<div class="rsw-toolbar">' + buttons + '<span class="rsw-separator"></span>' + styles + '</div>';
}

/** Substitui o textarea por um editor visual; o textarea vira o campo oculto. */
function initRichText(textareaId) {
  const textarea = document.getElementById(textareaId);
  if (!textarea || richEditors[textareaId]) return;

  const wrap = document.createElement('div');
  wrap.className = 'rsw-editor';
  wrap.innerHTML = buildRichToolbar() +
    '<div class="rsw-ce" contenteditable="true" data-placeholder="' + esc(textarea.placeholder || '') + '"></div>';

  textarea.parentNode.insertBefore(wrap, textarea);
  textarea.classList.add('sr-only');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.tabIndex = -1;

  const surface = wrap.querySelector('.rsw-ce');
  const editor = { wrap: wrap, surface: surface, textarea: textarea, htmlMode: false };
  richEditors[textareaId] = editor;

  const pushToTextarea = () => {
    textarea.value = editor.htmlMode ? surface.textContent : sanitizeHtml(surface.innerHTML);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  };

  surface.addEventListener('input', pushToTextarea);
  surface.addEventListener('blur', pushToTextarea);

  // Cola como texto puro, para não trazer a formatação do site de origem.
  surface.addEventListener('paste', (e) => {
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  });

  surface.addEventListener('keyup', () => refreshRichToolbar(editor));
  surface.addEventListener('mouseup', () => refreshRichToolbar(editor));

  wrap.querySelectorAll('.rsw-btn').forEach((btn) => {
    // mousedown: evita que o botão roube o foco e destrua a seleção.
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => runRichCommand(editor, btn.dataset.cmd));
  });

  wrap.querySelector('.rsw-dd').addEventListener('change', (e) => {
    surface.focus();
    document.execCommand('formatBlock', false, e.target.value);
    e.target.selectedIndex = 0;
    pushToTextarea();
  });

  setRichText(textareaId, textarea.value);
}

function runRichCommand(editor, cmd) {
  if (cmd === 'html') return toggleRichHtmlMode(editor);
  if (editor.htmlMode) return;

  editor.surface.focus();

  if (cmd === 'createLink') {
    const url = prompt('Endereço do link:', 'https://');
    if (!url) return;
    document.execCommand('createLink', false, url);
  } else {
    document.execCommand(cmd, false, null);
  }

  editor.textarea.value = sanitizeHtml(editor.surface.innerHTML);
  editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
  refreshRichToolbar(editor);
}

function toggleRichHtmlMode(editor) {
  const surface = editor.surface;
  if (editor.htmlMode) {
    editor.htmlMode = false;
    surface.classList.remove('is-html');
    surface.innerHTML = sanitizeHtml(surface.textContent);
  } else {
    editor.htmlMode = true;
    surface.classList.add('is-html');
    surface.textContent = sanitizeHtml(surface.innerHTML);
  }
  editor.wrap.querySelector('[data-cmd="html"]').classList.toggle('is-active', editor.htmlMode);
  editor.textarea.value = editor.htmlMode ? surface.textContent : sanitizeHtml(surface.innerHTML);
}

function refreshRichToolbar(editor) {
  if (editor.htmlMode) return;
  editor.wrap.querySelectorAll('.rsw-btn[data-cmd]').forEach((btn) => {
    const cmd = btn.dataset.cmd;
    if (cmd === 'html' || cmd === 'undo' || cmd === 'redo' || cmd === 'createLink' || cmd === 'removeFormat') return;
    let active = false;
    try { active = document.queryCommandState(cmd); } catch (err) { active = false; }
    btn.classList.toggle('is-active', active);
  });
}

/** Carrega um valor no editor (usado ao abrir um produto). */
function setRichText(textareaId, value) {
  const editor = richEditors[textareaId];
  const html = sanitizeHtml(value);
  if (!editor) {
    const textarea = document.getElementById(textareaId);
    if (textarea) textarea.value = html;
    return;
  }
  editor.htmlMode = false;
  editor.surface.classList.remove('is-html');
  editor.wrap.querySelector('[data-cmd="html"]').classList.remove('is-active');
  editor.surface.innerHTML = html;
  editor.textarea.value = html;
}

/** Garante que o textarea está em dia antes de salvar. */
function syncRichText(textareaId) {
  const editor = richEditors[textareaId];
  if (!editor) return;
  const html = sanitizeHtml(editor.htmlMode ? editor.surface.textContent : editor.surface.innerHTML);
  // Só sobrou marcação vazia (<br>, <p></p>): grava nulo em vez de lixo.
  editor.textarea.value = editor.surface.textContent.trim() ? html : '';
}

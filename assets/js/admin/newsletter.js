/* =====================================================================
   AVELINE Admin – Inscritos na newsletter
   ===================================================================== */

let subscribers = [];

async function loadNewsletter() {
  const tbody = document.getElementById('newsletter-rows');
  tbody.innerHTML = '<tr><td colspan="3" class="text-center py-10 text-brand-dark/50">Carregando...</td></tr>';

  const { data, error } = await window.sb
    .from('newsletter')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-10 text-red-700">Erro: ' + esc(error.message) + '</td></tr>';
    return;
  }
  subscribers = data || [];
  renderNewsletter();
}

function renderNewsletter() {
  const tbody = document.getElementById('newsletter-rows');
  document.getElementById('newsletter-count').textContent = '(' + subscribers.length + ')';

  if (!subscribers.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-10 text-brand-dark/50">Nenhum inscrito ainda.</td></tr>';
    return;
  }

  const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  tbody.innerHTML = subscribers.map((s) =>
    '<tr>' +
      '<td><a href="mailto:' + esc(s.email) + '" class="text-brand-wine hover:underline">' + esc(s.email) + '</a></td>' +
      '<td class="text-brand-dark/70">' + dateFmt.format(new Date(s.created_at)) + '</td>' +
      '<td class="text-right"><button onclick="deleteSubscriber(\'' + s.id + '\')" class="icon-btn danger" title="Remover"><span class="material-symbols-outlined">delete</span></button></td>' +
    '</tr>'
  ).join('');
}

async function deleteSubscriber(id) {
  const s = subscribers.find((x) => x.id === id);
  if (!s || !confirm('Remover ' + s.email + ' da newsletter?')) return;
  const { error } = await window.sb.from('newsletter').delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  subscribers = subscribers.filter((x) => x.id !== id);
  renderNewsletter();
  showToast('Inscrito removido.');
}

function exportNewsletterCSV() {
  if (!subscribers.length) return showToast('Não há inscritos para exportar.', 'error');
  const rows = [['email', 'data_inscricao']].concat(subscribers.map((s) => [s.email, s.created_at]));
  const csv = rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'aveline-newsletter-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

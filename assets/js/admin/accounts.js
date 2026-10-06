/* =====================================================================
   AVELINE Admin – Log de contas criadas
   ===================================================================== */

let accounts = [];

async function loadAccounts() {
  const tbody = document.getElementById('accounts-rows');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-brand-dark/50">Carregando...</td></tr>';

  const { data, error } = await window.sb
    .from('account_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-red-700">Erro: ' + esc(error.message) + '</td></tr>';
    return;
  }
  accounts = data || [];
  renderAccounts();
}

function providerPill(provider) {
  const name = { google: 'Google', github: 'GitHub', email: 'E-mail' }[provider] || provider || '—';
  const icon = provider === 'email' ? 'mail' : 'key';
  return '<span class="status-pill brand"><span class="material-symbols-outlined text-[13px]">' + icon + '</span> ' + esc(name) + '</span>';
}

function renderAccounts() {
  const tbody = document.getElementById('accounts-rows');
  document.getElementById('accounts-count').textContent = '(' + accounts.length + ')';

  if (!accounts.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-brand-dark/50">Nenhuma conta criada ainda.</td></tr>';
    return;
  }

  const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  tbody.innerHTML = accounts.map((a) => {
    const initial = esc((a.full_name || a.email || '?').trim().charAt(0).toUpperCase());
    const avatar = a.avatar_url
      ? '<img src="' + esc(a.avatar_url) + '" alt="" class="w-9 h-9 rounded-full object-cover border border-brand-border">'
      : '<span class="w-9 h-9 rounded-full bg-brand-wine text-white flex items-center justify-center font-serif text-sm">' + initial + '</span>';

    return '<tr>' +
      '<td><div class="flex items-center gap-3">' + avatar +
        '<div><b>' + esc(a.full_name || 'Sem nome') + '</b>' +
        '<span class="block text-[11px] text-brand-dark/60">' + esc(a.email || '—') + '</span></div>' +
      '</div></td>' +
      '<td>' + providerPill(a.provider) + '</td>' +
      '<td class="text-brand-dark/70 whitespace-nowrap">' + dateFmt.format(new Date(a.created_at)) + '</td>' +
      '<td class="text-right"><button onclick="deleteAccountLog(\'' + a.id + '\')" class="icon-btn danger" title="Remover do log"><span class="material-symbols-outlined">delete</span></button></td>' +
    '</tr>';
  }).join('');
}

async function deleteAccountLog(id) {
  const a = accounts.find((x) => x.id === id);
  if (!a || !confirm('Remover ' + (a.email || 'esta conta') + ' do log? A conta continua existindo no Supabase.')) return;
  const { error } = await window.sb.from('account_logs').delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  accounts = accounts.filter((x) => x.id !== id);
  renderAccounts();
  showToast('Registro removido do log.');
}

function exportAccountsCSV() {
  if (!accounts.length) return showToast('Não há contas para exportar.', 'error');
  const rows = [['nome', 'email', 'provedor', 'data_criacao']].concat(
    accounts.map((a) => [a.full_name || '', a.email || '', a.provider || '', a.created_at])
  );
  const csv = rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'aveline-contas-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

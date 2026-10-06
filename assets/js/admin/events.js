/* =====================================================================
   AVELINE Admin – Métricas da loja (sacola e WhatsApp)
   ===================================================================== */

let events = [];
let eventsPeriod = 7; // dias; 0 = tudo

async function loadEvents() {
  const tbody = document.getElementById('events-rows');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-brand-dark/50">Carregando...</td></tr>';

  let query = window.sb.from('events').select('*').order('created_at', { ascending: false }).limit(500);
  if (eventsPeriod) {
    const since = new Date(Date.now() - eventsPeriod * 86400000).toISOString();
    query = query.gte('created_at', since);
  }

  const { data, error } = await query;
  if (error) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-red-700">Erro: ' + esc(error.message) + '</td></tr>';
    return;
  }
  events = data || [];
  renderEvents();
}

function setEventsPeriod(days) {
  eventsPeriod = Number(days);
  loadEvents();
}

function renderEventStats() {
  const adds = events.filter((e) => e.type === 'add_to_cart');
  const checkouts = events.filter((e) => e.type === 'checkout_whatsapp');
  const checkoutValue = checkouts.reduce((sum, e) => sum + Number(e.value || 0), 0);
  const sessions = new Set(events.map((e) => e.session_id).filter(Boolean)).size;
  const rate = adds.length ? Math.round((checkouts.length / adds.length) * 100) : 0;

  const card = (label, value, icon) =>
    '<div class="bg-white border border-brand-border p-4 flex items-center gap-3">' +
      '<span class="material-symbols-outlined text-brand-gold text-[28px]">' + icon + '</span>' +
      '<div><span class="block text-[10px] font-bold tracking-[0.14em] uppercase text-brand-dark/55">' + label + '</span>' +
      '<b class="font-serif text-2xl text-brand-wine">' + value + '</b></div>' +
    '</div>';

  document.getElementById('events-stats').innerHTML =
    card('Adições à sacola', adds.length, 'add_shopping_cart') +
    card('Idas ao WhatsApp', checkouts.length, 'send') +
    card('Valor enviado', formatBRL(checkoutValue), 'payments') +
    card('Visitantes', sessions, 'group') +
    card('Conversão', rate + '%', 'trending_up');
}

function renderEvents() {
  renderEventStats();

  const tbody = document.getElementById('events-rows');
  if (!events.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-brand-dark/50">Nenhum evento registrado no período.</td></tr>';
    return;
  }

  const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const variantName = { full: 'Frasco', d5: 'Decante 5ml', d10: 'Decante 10ml' };

  tbody.innerHTML = events.map((e) => {
    const isCheckout = e.type === 'checkout_whatsapp';
    const pill = isCheckout
      ? '<span class="status-pill brand"><span class="material-symbols-outlined text-[13px]">send</span> WhatsApp</span>'
      : '<span class="status-pill ok"><span class="material-symbols-outlined text-[13px]">add_shopping_cart</span> Sacola</span>';

    let detail;
    if (isCheckout) {
      const items = Array.isArray(e.items) ? e.items : [];
      detail = '<b>' + esc(e.customer_name || 'Sem nome') + '</b>' +
        (items.length
          ? '<span class="block text-[11px] text-brand-dark/60">' +
            esc(items.map((i) => i.qty + 'x ' + i.name).join(', ')) + '</span>'
          : '');
    } else {
      detail = esc(e.product_name || '—') +
        '<span class="block text-[11px] text-brand-dark/60">' + esc(variantName[e.variant] || e.variant || '') + '</span>';
    }

    return '<tr>' +
      '<td>' + pill + '</td>' +
      '<td>' + detail + '</td>' +
      '<td class="text-right font-semibold text-brand-wine">' + (e.value ? formatBRL(Number(e.value)) : '—') + '</td>' +
      '<td class="text-brand-dark/70 whitespace-nowrap">' + dateFmt.format(new Date(e.created_at)) + '</td>' +
      '<td class="text-right"><button onclick="deleteEvent(\'' + e.id + '\')" class="icon-btn danger" title="Remover"><span class="material-symbols-outlined">delete</span></button></td>' +
    '</tr>';
  }).join('');
}

async function deleteEvent(id) {
  const { error } = await window.sb.from('events').delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  events = events.filter((e) => e.id !== id);
  renderEvents();
  showToast('Evento removido.');
}

function exportEventsCSV() {
  if (!events.length) return showToast('Não há eventos para exportar.', 'error');
  const rows = [['tipo', 'produto', 'variante', 'quantidade', 'valor', 'cliente', 'sessao', 'data']].concat(
    events.map((e) => [
      e.type === 'checkout_whatsapp' ? 'WhatsApp' : 'Sacola',
      e.product_name || (Array.isArray(e.items) ? e.items.map((i) => i.qty + 'x ' + i.name).join(' | ') : ''),
      e.variant || '',
      e.quantity || '',
      e.value || '',
      e.customer_name || '',
      e.session_id || '',
      e.created_at,
    ])
  );
  const csv = rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'aveline-metricas-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

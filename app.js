(() => {
  'use strict';
  const Core = window.KhataCore;
  const STORAGE_KEY = 'khata-shield:v1';
  const DEFAULT_STATE = { transactions: [], rules: {}, settings: { businessName: '', threshold: 2000000 } };
  const $ = id => document.getElementById(id);
  const state = loadState();
  let deferredInstall;

  function loadState() {
    try { return { ...DEFAULT_STATE, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'), settings: { ...DEFAULT_STATE.settings, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').settings || {}) } }; }
    catch { return structuredClone(DEFAULT_STATE); }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function money(value) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0); }
  function shortMoney(value) { return new Intl.NumberFormat('en-IN', { notation: value >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value || 0); }
  function fmtDate(value, withTime = false) { return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(value)); }
  function esc(value) { const el = document.createElement('span'); el.textContent = value || ''; return el.innerHTML; }
  function currentMonth() { return new Date().toISOString().slice(0, 7); }
  function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2400); }

  function setView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === name));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    location.hash = name;
    if (name === 'reports') renderReport();
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAll() {
    state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderDashboard(); renderTransactions(); renderReport(); renderAwareness(); renderSettings(); saveState();
  }

  function renderDashboard() {
    const month = currentMonth();
    const summary = Core.summarize(state.transactions, month);
    $('businessMetric').textContent = money(summary.business);
    $('inflowMetric').textContent = money(summary.total);
    $('nonBusinessMetric').textContent = money(summary.personal + summary.other);
    const monthItems = state.transactions.filter(x => Core.monthKey(x.date) === month);
    const unclear = monthItems.filter(x => x.category === 'other').length;
    $('healthMetric').textContent = monthItems.length === 0 ? 'Start now' : unclear > monthItems.length / 3 ? 'Review' : 'Good';
    $('healthHint').textContent = unclear ? `${unclear} “Other” entr${unclear === 1 ? 'y' : 'ies'} to review` : 'Records are classified';
    const months = Core.lastMonths(6);
    const values = months.map(m => Core.summarize(state.transactions, m).business);
    const max = Math.max(...values, 1);
    $('chart').innerHTML = months.map((m, i) => `<div class="bar-wrap"><div class="bar" style="height:${Math.max(2, values[i] / max * 100)}%" data-value="${esc(money(values[i]))}"></div><small>${new Date(m + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}</small></div>`).join('');
    $('recentList').innerHTML = state.transactions.slice(0, 5).map(transactionCard).join('') || '<div class="empty">Add your first transaction to begin.</div>';
  }

  function transactionCard(x) {
    const icon = x.category === 'business' ? '🏪' : x.category === 'personal' ? '🏠' : '•••';
    return `<div class="transaction-item"><span class="tx-icon">${icon}</span><div><b>${esc(x.party || x.note || 'Transaction')}</b><small>${fmtDate(x.date, true)} · ${esc(x.method)}</small></div><div class="amount"><b>+${money(x.amount)}</b><span class="tag ${x.category}">${x.category}</span></div></div>`;
  }

  function filteredTransactions() {
    const q = $('searchInput').value.toLowerCase().trim();
    const category = $('categoryFilter').value;
    const month = $('monthFilter').value;
    return state.transactions.filter(x => (!q || `${x.party} ${x.note} ${x.amount}`.toLowerCase().includes(q)) && (category === 'all' || x.category === category) && (!month || Core.monthKey(x.date) === month));
  }

  function renderTransactions() {
    if (!$('transactionBody')) return;
    const items = filteredTransactions();
    $('transactionBody').innerHTML = items.map(x => `<tr><td>${fmtDate(x.date, true)}</td><td><b>${esc(x.party || '—')}</b><br><small class="muted">${esc(x.note || '')}</small></td><td>${esc(x.method)}</td><td><span class="tag ${x.category}">${x.category}</span></td><td class="right"><b>${money(x.amount)}</b></td><td><div class="row-actions"><button class="small-action" data-edit="${x.id}">Edit</button><button class="small-action delete-action" data-delete="${x.id}">Delete</button></div></td></tr>`).join('');
    $('emptyTransactions').classList.toggle('hidden', items.length > 0);
  }

  function renderReport() {
    const month = $('reportMonth').value || currentMonth();
    const items = state.transactions.filter(x => Core.monthKey(x.date) === month);
    const sum = Core.summarize(items);
    $('reportPeriodLabel').textContent = new Date(month + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    $('reportName').textContent = ($('reportBusiness').value || state.settings.businessName || 'Vendor') + ' transaction summary';
    $('reportBusinessTotal').textContent = money(sum.business); $('reportPersonalTotal').textContent = money(sum.personal); $('reportOtherTotal').textContent = money(sum.other); $('reportGrandTotal').textContent = money(sum.total);
    $('reportBody').innerHTML = items.map(x => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.party || x.note || '—')}</td><td><span class="tag ${x.category}">${x.category}</span></td><td class="right">${money(x.amount)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No transactions for this month.</td></tr>';
  }

  function renderAwareness() {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 12);
    const business = state.transactions.filter(x => x.category === 'business' && new Date(x.date) >= cutoff).reduce((s, x) => s + x.amount, 0);
    const threshold = Number(state.settings.threshold) || 2000000;
    const percent = Math.min(100, business / threshold * 100);
    $('annualTurnover').textContent = money(business);
    $('gauge').style.setProperty('--progress', `${percent * 1.8}deg`);
    $('thresholdText').textContent = `${percent.toFixed(1)}% of your ₹${shortMoney(threshold)} awareness reference. This is not a tax-liability assessment.`;
  }

  function renderSettings() { $('businessName').value = state.settings.businessName || ''; $('thresholdInput').value = state.settings.threshold || 2000000; $('reportBusiness').value = state.settings.businessName || ''; }
  function localDateTime(iso) { const d = iso ? new Date(iso) : new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }

  function openForm(item) {
    $('transactionForm').reset(); $('transactionId').value = item?.id || ''; $('formTitle').textContent = item ? 'Edit transaction' : 'Add transaction'; $('date').value = localDateTime(item?.date);
    if (item) { $('amount').value = item.amount; $('party').value = item.party; $('note').value = item.note; $('method').value = item.method; document.querySelector(`[name="category"][value="${item.category}"]`).checked = true; }
    $('suggestion').textContent = ''; $('transactionDialog').showModal();
  }
  function closeForm() { $('transactionDialog').close(); }
  function updateSuggestion() {
    const text = `${$('party').value} ${$('note').value}`.trim(); if (!text) return;
    const suggestion = Core.suggestCategory(text, state.rules); document.querySelector(`[name="category"][value="${suggestion.category}"]`).checked = true; $('suggestion').textContent = `Suggested: ${suggestion.category}. ${suggestion.reason}.`;
  }

  function submitTransaction(event) {
    event.preventDefault();
    try {
      const id = $('transactionId').value;
      const item = Core.normalizeTransaction({ id: id || undefined, amount: $('amount').value, date: $('date').value, party: $('party').value, note: $('note').value, method: $('method').value, category: new FormData(event.target).get('category') });
      const oldIndex = state.transactions.findIndex(x => x.id === id);
      if (oldIndex >= 0) state.transactions[oldIndex] = item; else state.transactions.push(item);
      const learningKey = (item.party || item.note).toLowerCase().trim().split(/\s+/).slice(0, 3).join(' '); if (learningKey.length >= 3) state.rules[learningKey] = item.category;
      closeForm(); renderAll(); toast(id ? 'Transaction updated' : 'Transaction saved on this device');
    } catch (error) { toast(error.message); }
  }

  function deleteTransaction(id) { if (!confirm('Delete this transaction? This cannot be undone.')) return; state.transactions = state.transactions.filter(x => x.id !== id); renderAll(); toast('Transaction deleted'); }
  function download(name, content, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function exportCsv() { const month = $('reportMonth').value || currentMonth(); download(`khata-shield-${month}.csv`, '\uFEFF' + Core.toCsv(state.transactions.filter(x => Core.monthKey(x.date) === month)), 'text/csv;charset=utf-8'); }

  function demoTransactions() {
    const now = new Date(); const date = days => new Date(now.getTime() - days * 86400000).toISOString();
    return [
      { amount: 850, party: 'Morning customers', note: 'Tea and breakfast sales', category: 'business', method: 'UPI', date: date(0) },
      { amount: 1200, party: 'Ramesh', note: 'Catering order', category: 'business', method: 'UPI', date: date(1) },
      { amount: 3000, party: 'Sister', note: 'Family transfer', category: 'personal', method: 'Bank transfer', date: date(2) },
      { amount: 450, party: 'Daily sales', note: 'Cash counter', category: 'business', method: 'Cash', date: date(3) },
      { amount: 700, party: 'Supplier', note: 'Refund for returned stock', category: 'other', method: 'UPI', date: date(5) }
    ].map(Core.normalizeTransaction);
  }

  function startVoice() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { toast('Voice entry is not supported in this browser'); return; }
    const recognition = new Recognition(); recognition.lang = 'en-IN'; recognition.interimResults = false;
    $('voiceStatus').textContent = 'Listening…'; $('voiceBtn').disabled = true;
    recognition.onresult = e => { const text = e.results[0][0].transcript; const parsed = Core.parseVoice(text); if (parsed.amount) $('amount').value = parsed.amount; $('party').value = parsed.party; $('note').value = parsed.note; document.querySelector(`[name="category"][value="${parsed.suggestion.category}"]`).checked = true; $('suggestion').textContent = `Heard: “${text}” · Suggested ${parsed.suggestion.category}`; };
    recognition.onerror = e => toast(`Voice entry: ${e.error}`);
    recognition.onend = () => { $('voiceStatus').textContent = 'Review the entry before saving'; $('voiceBtn').disabled = false; }; recognition.start();
  }

  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  document.querySelectorAll('[data-open-form]').forEach(b => b.addEventListener('click', () => openForm()));
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => setView(b.dataset.go)));
  $('closeDialog').onclick = $('cancelDialog').onclick = closeForm; $('transactionForm').addEventListener('submit', submitTransaction);
  $('party').addEventListener('blur', updateSuggestion); $('note').addEventListener('blur', updateSuggestion); $('voiceBtn').onclick = startVoice;
  ['searchInput', 'categoryFilter', 'monthFilter'].forEach(id => $(id).addEventListener(id === 'searchInput' ? 'input' : 'change', renderTransactions));
  $('clearFilters').onclick = () => { $('searchInput').value = ''; $('categoryFilter').value = 'all'; $('monthFilter').value = ''; renderTransactions(); };
  $('transactionBody').onclick = e => { if (e.target.dataset.edit) openForm(state.transactions.find(x => x.id === e.target.dataset.edit)); if (e.target.dataset.delete) deleteTransaction(e.target.dataset.delete); };
  $('reportMonth').addEventListener('change', renderReport); $('reportBusiness').addEventListener('input', renderReport); $('exportCsv').onclick = exportCsv; $('printReport').onclick = () => print();
  $('saveSettings').onclick = () => { state.settings.businessName = $('businessName').value.trim(); state.settings.threshold = Math.max(1, Number($('thresholdInput').value) || 2000000); renderAll(); toast('Settings saved'); };
  $('exportJson').onclick = () => download(`khata-shield-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'Khata Shield', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2), 'application/json');
  $('importJson').onchange = async e => { try { const data = JSON.parse(await e.target.files[0].text()); if (!Array.isArray(data.transactions)) throw new Error('Invalid backup file'); state.transactions = data.transactions.map(Core.normalizeTransaction); state.rules = data.rules || {}; state.settings = { ...DEFAULT_STATE.settings, ...(data.settings || {}) }; renderAll(); toast('Backup restored'); } catch (err) { toast(err.message); } e.target.value = ''; };
  $('loadDemo').onclick = () => { if (state.transactions.length && !confirm('Add demo entries to your existing records?')) return; state.transactions.push(...demoTransactions()); renderAll(); toast('Demo data added'); };
  $('clearData').onclick = () => { if (!confirm('Permanently delete every local transaction and setting?')) return; state.transactions = []; state.rules = {}; state.settings = { ...DEFAULT_STATE.settings }; renderAll(); toast('All local data deleted'); };
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; $('installBtn').classList.remove('hidden'); });
  $('installBtn').onclick = async () => { if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('installBtn').classList.add('hidden'); } };
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  $('reportMonth').value = currentMonth(); const initial = location.hash.slice(1); setView(['dashboard','transactions','reports','awareness','settings'].includes(initial) ? initial : 'dashboard'); renderAll();
})();

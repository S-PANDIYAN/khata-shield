(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KhataCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const CATEGORIES = ['business', 'personal', 'other'];
  const KEYWORDS = {
    business: ['sale', 'customer', 'tea', 'coffee', 'food', 'order', 'shop', 'vegetable', 'snacks', 'invoice', 'service'],
    personal: ['family', 'friend', 'gift', 'home', 'personal', 'mother', 'father', 'wife', 'husband'],
    other: ['loan', 'refund', 'reimbursement', 'deposit', 'borrowed', 'repayment']
  };

  function normalizeTransaction(input) {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than zero');
    const date = new Date(input.date);
    if (Number.isNaN(date.getTime())) throw new Error('A valid date is required');
    const category = CATEGORIES.includes(input.category) ? input.category : 'other';
    return {
      id: String(input.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7))),
      amount: Math.round(amount * 100) / 100,
      date: date.toISOString(),
      party: String(input.party || '').trim().slice(0, 80),
      note: String(input.note || '').trim().slice(0, 140),
      method: String(input.method || 'Other').slice(0, 30),
      category
    };
  }

  function suggestCategory(text, learnedRules) {
    const value = String(text || '').toLowerCase();
    const rules = learnedRules || {};
    const learned = Object.keys(rules).find(k => k && value.includes(k.toLowerCase()) && CATEGORIES.includes(rules[k]));
    if (learned) return { category: rules[learned], reason: `Based on your earlier choice for “${learned}”` };
    for (const category of CATEGORIES) {
      const match = KEYWORDS[category].find(word => value.includes(word));
      if (match) return { category, reason: `“${match}” usually looks ${category}` };
    }
    return { category: 'business', reason: 'Default suggestion—please confirm' };
  }

  function parseVoice(text, now) {
    const raw = String(text || '').trim();
    const amountMatch = raw.match(/(?:₹|rs\.?|rupees?)?\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null;
    const partyMatch = raw.match(/\bfrom\s+(.+?)(?:\s+for\s+|$)/i);
    const noteMatch = raw.match(/\bfor\s+(.+)$/i);
    return {
      amount,
      party: partyMatch ? partyMatch[1].trim() : '',
      note: noteMatch ? noteMatch[1].trim() : raw,
      date: (now ? new Date(now) : new Date()).toISOString(),
      suggestion: suggestCategory(raw)
    };
  }

  function monthKey(date) { return new Date(date).toISOString().slice(0, 7); }
  function summarize(items, month) {
    const filtered = month ? items.filter(x => monthKey(x.date) === month) : items;
    const summary = { business: 0, personal: 0, other: 0, total: 0, count: filtered.length };
    filtered.forEach(x => { const value = Number(x.amount) || 0; summary[x.category] = (summary[x.category] || 0) + value; summary.total += value; });
    Object.keys(summary).forEach(k => { if (typeof summary[k] === 'number' && k !== 'count') summary[k] = Math.round(summary[k] * 100) / 100; });
    return summary;
  }

  function lastMonths(count, reference) {
    const end = reference ? new Date(reference) : new Date();
    const result = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return result;
  }

  function csvEscape(value) { const s = String(value == null ? '' : value); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
  function toCsv(items) {
    const rows = [['Date', 'Amount', 'Category', 'Sender/Customer', 'Method', 'Note']];
    items.forEach(x => rows.push([x.date, x.amount.toFixed(2), x.category, x.party, x.method, x.note]));
    return rows.map(row => row.map(csvEscape).join(',')).join('\n');
  }

  return { CATEGORIES, normalizeTransaction, suggestCategory, parseVoice, monthKey, summarize, lastMonths, toCsv };
});

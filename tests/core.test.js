const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../core.js');

test('normalizes and validates transactions', () => {
  const item = Core.normalizeTransaction({ amount: '250.456', date: '2026-08-24T10:00:00Z', category: 'business', party: ' Ravi ' });
  assert.equal(item.amount, 250.46);
  assert.equal(item.party, 'Ravi');
  assert.equal(item.category, 'business');
  assert.throws(() => Core.normalizeTransaction({ amount: 0, date: new Date() }), /greater than zero/);
  assert.throws(() => Core.normalizeTransaction({ amount: 1, date: 'invalid' }), /valid date/);
});

test('classifies using keywords and learned corrections', () => {
  assert.equal(Core.suggestCategory('tea sale from customer').category, 'business');
  assert.equal(Core.suggestCategory('family transfer').category, 'personal');
  assert.equal(Core.suggestCategory('supplier refund').category, 'other');
  const learned = Core.suggestCategory('Payment from Ravi', { ravi: 'personal' });
  assert.equal(learned.category, 'personal');
  assert.match(learned.reason, /earlier choice/);
});

test('parses a natural voice transaction', () => {
  const parsed = Core.parseVoice('Received 1,250 rupees from Ravi for tea and snacks', '2026-08-24T05:00:00Z');
  assert.equal(parsed.amount, 1250);
  assert.equal(parsed.party, 'Ravi');
  assert.equal(parsed.note, 'tea and snacks');
  assert.equal(parsed.suggestion.category, 'business');
});

test('summarizes business separately from total inflow', () => {
  const records = [
    { amount: 3000, category: 'business', date: '2026-08-01T00:00:00Z' },
    { amount: 1500, category: 'personal', date: '2026-08-02T00:00:00Z' },
    { amount: 500, category: 'other', date: '2026-08-03T00:00:00Z' },
    { amount: 900, category: 'business', date: '2026-07-03T00:00:00Z' }
  ];
  assert.deepEqual(Core.summarize(records, '2026-08'), { business: 3000, personal: 1500, other: 500, total: 5000, count: 3 });
});

test('builds stable month series', () => {
  assert.deepEqual(Core.lastMonths(3, '2026-08-24T00:00:00Z'), ['2026-06', '2026-07', '2026-08']);
});

test('exports valid CSV escaping commas and quotes', () => {
  const csv = Core.toCsv([{ date: '2026-08-24', amount: 20, category: 'business', party: 'Ravi, Kumar', method: 'UPI', note: 'Tea "large"' }]);
  assert.match(csv, /"Ravi, Kumar"/);
  assert.match(csv, /"Tea ""large"""/);
  assert.equal(csv.split('\n').length, 2);
});

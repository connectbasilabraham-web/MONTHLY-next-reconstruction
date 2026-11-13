const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, 'finance.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const financeModule = { exports: {} };
vm.runInNewContext(compiled, { module: financeModule, exports: financeModule.exports });
const finance = financeModule.exports;

function transaction(overrides) {
  return {
    id: 'tx-1',
    type: 'income',
    amount: 1000,
    date: '2026-01-01',
    categoryId: 'salary',
    description: 'Salary',
    method: 'Bank transfer',
    account: 'others',
    ...overrides
  };
}

test('calendar month helpers follow local calendar months across year boundaries', () => {
  assert.equal(finance.monthKey(new Date(2026, 10, 1)), '2026-11');
  assert.equal(finance.shiftMonth('2026-11', -1), '2026-10');
  assert.equal(finance.shiftMonth('2026-01', -1), '2025-12');
  assert.equal(finance.shiftMonth('2026-12', 1), '2027-01');
  assert.equal(finance.shiftMonth('2026-11', -1), finance.shiftMonth('2026-10', 0));
});

test('monthly summary keeps the existing income, expense, investment, and closing formulas', () => {
  const data = finance.seed();
  data.transactions = [
    transaction({ id: 'income-food', amount: 500, account: 'food' }),
    transaction({ id: 'income-others', amount: 1000 }),
    transaction({ id: 'expense-food', type: 'expense', amount: 100, categoryId: 'food', account: 'food' }),
    transaction({ id: 'expense-other', type: 'expense', amount: 400, categoryId: 'rent' }),
    transaction({ id: 'investment', type: 'expense', amount: 200, date: '2026-02-01', categoryId: 'sip' })
  ];

  const january = finance.summary(data, '2026-01');
  assert.equal(january.income, 1500);
  assert.equal(january.expenses, 500);
  assert.equal(january.investments, 0);
  assert.equal(january.lifestyle, 500);
  assert.equal(january.closing, 1000);
  assert.equal(january.count, 4);

  const february = finance.summary(data, '2026-02');
  assert.equal(february.expenses, 200);
  assert.equal(february.investments, 200);
  assert.equal(february.lifestyle, 0);
  assert.equal(february.closing, -200);
  assert.equal(finance.rows(data, '2026-01').length, 4);
  assert.equal(finance.rows(data, '2026-02').length, 1);
});

test('empty months and previous-month analytics inputs are well-defined', () => {
  const empty = finance.summary(finance.seed(), '2026-03');
  assert.equal(empty.opening, 0);
  assert.equal(empty.income, 0);
  assert.equal(empty.expenses, 0);
  assert.equal(empty.closing, 0);
  assert.equal(empty.count, 0);
  assert.equal(empty.spentPercent, null);
  assert.equal(finance.shiftMonth('2026-11', -1), '2026-10');
});

test('Food funding transfers preserve the existing account allocation formula', () => {
  const data = finance.seed();
  data.foodFunding['2026-01'] = 100;
  data.transactions = [
    transaction({ id: 'food-income', amount: 500, account: 'food' }),
    transaction({ id: 'others-income', amount: 1000 }),
    transaction({ id: 'food-expense', type: 'expense', amount: 100, categoryId: 'food', account: 'food' }),
    transaction({ id: 'others-expense', type: 'expense', amount: 400, categoryId: 'rent' })
  ];

  const before = finance.accounts(data, '2026-01');
  assert.equal(before.foodFunded, 600);
  assert.equal(before.foodBalance, 500);
  assert.equal(before.othersSpent, 400);
  assert.equal(before.othersBalance, 500);

  const after = finance.accounts(finance.addFood(data, '2026-01', 50), '2026-01');
  assert.equal(after.foodFunded, 650);
  assert.equal(after.foodBalance, 550);
  assert.equal(after.othersBalance, 450);
  assert.equal(after.foodBalance + after.othersBalance, finance.summary(data, '2026-01').closing);
  assert.throws(() => finance.addFood(data, '2026-01', 601), /Others balance/);
});

test('transaction and Food transfer amounts share positive and two-decimal validation', () => {
  assert.equal(finance.validateAmount(1), undefined);
  assert.equal(finance.validateAmount(1.25), undefined);
  assert.match(finance.validateAmount(0), /greater than/);
  assert.match(finance.validateAmount(0.001), /2 decimal places/);
  const data = finance.seed();
  assert.throws(() => finance.addFood(data, '2026-01', 0.001), /2 decimal places/);
  assert.throws(() => finance.addFood(data, '2026-01', 0), /greater than/);
});

test('compatible older backups receive documented defaults and missing accounts use Others', () => {
  const backup = JSON.parse(JSON.stringify(finance.seed()));
  delete backup.version;
  delete backup.openingOverrides;
  delete backup.budgets;
  delete backup.totalBudgets;
  delete backup.goals;
  delete backup.foodFunding;
  delete backup.chat;
  backup.transactions = [transaction({ account: undefined })];

  const restored = finance.deserializeData(backup);
  assert.equal(restored.version, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.openingOverrides)), {});
  assert.deepEqual(JSON.parse(JSON.stringify(restored.budgets)), {});
  assert.deepEqual(JSON.parse(JSON.stringify(restored.totalBudgets)), {});
  assert.deepEqual(JSON.parse(JSON.stringify(restored.goals)), []);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.foodFunding)), {});
  assert.deepEqual(JSON.parse(JSON.stringify(restored.chat)), []);
  assert.equal(restored.transactions[0].account, 'others');
  assert.deepEqual(
    JSON.parse(JSON.stringify(finance.deserializeData({ ...backup, openingOverrides: { legacyOpening: 10 } }).openingOverrides)),
    { legacyOpening: 10 }
  );
});

test('malformed or incompatible backups are rejected', () => {
  const backup = JSON.parse(JSON.stringify(finance.seed()));
  backup.version = 2;
  assert.throws(() => finance.deserializeData(backup), /Unsupported backup version/);

  const brokenTransaction = JSON.parse(JSON.stringify(finance.seed()));
  brokenTransaction.transactions = [transaction({ categoryId: 'missing-category' })];
  assert.throws(() => finance.deserializeData(brokenTransaction), /Unknown category/);

  const invalidDate = JSON.parse(JSON.stringify(finance.seed()));
  invalidDate.transactions = [transaction({ date: '2026-02-30' })];
  assert.throws(() => finance.deserializeData(invalidDate), /transactions/);
});

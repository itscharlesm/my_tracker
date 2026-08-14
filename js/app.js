/* =========================================================================
   MONEY TRACKER — app.js
   A plain-JS + Bootstrap rebuild of the Google Sheet tracker.

   HOW THE "DATABASE" WORKS
   -------------------------
   GitHub Pages only serves static files — it cannot run a real database.
   So this app stores everything in the browser's localStorage, on the
   device you're using. SEED_DATA (js/seed-data.js) is the data that was
   already in your spreadsheet; it's loaded into localStorage exactly once,
   the first time the app runs on a device/browser.

   Because localStorage is per-browser, your phone and laptop will each
   have their own copy. Use Settings → "Export backup" / "Import backup"
   to move data between them (see README.md for the full explanation and
   for how to upgrade to a real synced backend later if you want one).

   FORMULA GUIDE (spreadsheet -> JS)
   -------------------------
   Transactions!I (Year)          -> deriveYear(date)
   Transactions!J (Month)         -> deriveMonthName(date)
   Transactions!K (Week)          -> deriveWeek(date)
   Transactions!L (Payroll Half)  -> derivePayrollHalf(date)
   Transactions!M (Signed Cashflow) -> signedAmount(type, amount)
   Accounts!D (Transaction Net)   -> sum of signedAmount for that account
   Accounts!E/F (Transfers In/Out)-> sums over transfers by account
   Accounts!G (Current Balance)   -> opening + net + in - out
   Budget!E (Actual)              -> sum of expense amounts matching year/month/category
   Payroll!I/J (Actual Salary/Incentives) -> sum of Work income in the pay period
   Atome!B7 (Outstanding)         -> Atome purchases - Atome payments
   ========================================================================= */

const LS_PREFIX = 'moneytracker_';
const LS_KEYS = {
  transactions: LS_PREFIX + 'transactions',
  transfers: LS_PREFIX + 'transfers',
  accounts: LS_PREFIX + 'accounts',
  budget: LS_PREFIX + 'budget',
  payroll: LS_PREFIX + 'payroll',
  dropdowns: LS_PREFIX + 'dropdowns',
  settings: LS_PREFIX + 'settings',
  initialized: LS_PREFIX + 'initialized',
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ---------------------------------------------------------------- init */

function loadAll() {
  if (!localStorage.getItem(LS_KEYS.initialized)) {
    // First run on this device/browser: seed from the spreadsheet's data.
    const seed = SEED_DATA;
    localStorage.setItem(LS_KEYS.transactions, JSON.stringify(seed.transactions.map(withId)));
    localStorage.setItem(LS_KEYS.transfers, JSON.stringify(seed.transfers.map(withId)));
    localStorage.setItem(LS_KEYS.accounts, JSON.stringify(seed.accounts.map(withId)));
    localStorage.setItem(LS_KEYS.budget, JSON.stringify(seed.budget.map(withId)));
    localStorage.setItem(LS_KEYS.payroll, JSON.stringify(seed.payroll.map(withId)));
    localStorage.setItem(LS_KEYS.dropdowns, JSON.stringify(seed.dropdowns));
    localStorage.setItem(LS_KEYS.settings, JSON.stringify(seed.settings));
    localStorage.setItem(LS_KEYS.initialized, '1');
  }
}
let _idCounter = 1;
function withId(obj) { return Object.assign({ id: _idCounter++ }, obj); }

function get(key) { return JSON.parse(localStorage.getItem(key) || 'null'); }
function set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getTransactions() { return get(LS_KEYS.transactions) || []; }
function getTransfers() { return get(LS_KEYS.transfers) || []; }
function getAccounts() { return get(LS_KEYS.accounts) || []; }
function getBudget() { return get(LS_KEYS.budget) || []; }
function getPayroll() { return get(LS_KEYS.payroll) || []; }
function getDropdowns() { return get(LS_KEYS.dropdowns) || {}; }
function getSettings() { return get(LS_KEYS.settings) || {}; }

function nextId(list) { return list.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1; }

/* ------------------------------------------------------------ formulas */

function parseDate(str) { // "YYYY-MM-DD" -> local Date at midnight
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function deriveYear(dateStr) { const d = parseDate(dateStr); return d ? d.getFullYear() : ''; }
function deriveMonthName(dateStr) { const d = parseDate(dateStr); return d ? MONTHS[d.getMonth()] : ''; }
function deriveWeek(dateStr) { // approximates Excel WEEKNUM(date,2): Monday-start week-of-year
  const d = parseDate(dateStr); if (!d) return '';
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const jan1Dow = (jan1.getDay() + 6) % 7; // 0=Mon
  const firstMonday = new Date(jan1); firstMonday.setDate(jan1.getDate() - jan1Dow);
  const diffDays = Math.round((d - firstMonday) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}
function derivePayrollHalf(dateStr) {
  const d = parseDate(dateStr); if (!d) return '';
  return d.getDate() <= 15 ? '1st Half (1–15)' : '2nd Half (16–End)';
}
function signedAmount(type, amount) {
  amount = Number(amount) || 0;
  return type === 'Income' ? amount : -amount;
}
// Excel's SUMIFS/COUNTIFS match text case-insensitively, so comparisons that
// mirror a spreadsheet formula do the same here (matters because the sheet
// itself has accounts saved with inconsistent capitalization, e.g. "Atome
// (EXPENSES)" vs "Atome (Expenses)").
function sameText(a, b) { return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase(); }
function fmt(n) {
  n = Number(n) || 0;
  const s = getSettings();
  return (s.currency || '') + ' ' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n) { return (Number(n) * 100).toFixed(1) + '%'; }

// Format a local Date as YYYY-MM-DD using its LOCAL fields — unlike
// toISOString(), this never converts through UTC, so the date you see
// here always matches the date you get from new Date(y, m, d) / typed input.
function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* current balance of one account, mirrors Accounts&Goals!G */
function accountBalance(acctName) {
  const opening = Number((getAccounts().find(a => sameText(a.account, acctName)) || {}).opening) || 0;
  const net = getTransactions()
    .filter(t => sameText(t.account, acctName))
    .reduce((sum, t) => sum + signedAmount(t.type, t.amount), 0);
  const inn = getTransfers().filter(t => sameText(t.toAccount, acctName)).reduce((s, t) => s + Number(t.amount || 0), 0);
  const out = getTransfers().filter(t => sameText(t.fromAccount, acctName)).reduce((s, t) => s + Number(t.amount || 0), 0);
  return opening + net + inn - out;
}

/* ------------------------------------------------------------- routing */

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});
function showPage(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('d-none'));
  document.getElementById('page-' + page).classList.remove('d-none');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  render[page] && render[page]();
}

/* ----------------------------------------------------- confirm & toast
   Shared UI helpers so every confirmation and notice in the app uses an
   in-app Bootstrap modal / toast instead of the browser's native
   confirm()/alert() popups. Every call site below passes the exact same
   message and, on confirm, runs the exact same code that used to run
   immediately after the old `if (!confirm(...)) return;` line. */
function showConfirmModal(message, onConfirm, opts) {
  opts = opts || {};
  document.getElementById('confirmModalBody').textContent = message;
  const btn = document.getElementById('confirmModalActionBtn');
  btn.textContent = opts.confirmText || 'Confirm';
  btn.className = 'btn ' + (opts.danger === false ? 'btn-primary' : 'btn-danger');
  const modalEl = document.getElementById('confirmModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const handler = () => {
    modal.hide();
    btn.removeEventListener('click', handler);
    onConfirm();
  };
  btn.addEventListener('click', handler);
  modal.show();
}
function showToast(message, variant) {
  const toastEl = document.getElementById('appToast');
  document.getElementById('appToastBody').textContent = message;
  toastEl.classList.remove('text-bg-primary', 'text-bg-danger', 'text-bg-success');
  toastEl.classList.add('text-bg-' + (variant || 'primary'));
  bootstrap.Toast.getOrCreateInstance(toastEl).show();
}

/* --------------------------------------------------------- dropdown UI */

function fillSelect(sel, items, selected) {
  sel.innerHTML = items.map(i => `<option value="${i}" ${i === selected ? 'selected' : ''}>${i}</option>`).join('');
}
function yearsInData() {
  const yrs = new Set();
  getTransactions().forEach(t => yrs.add(deriveYear(t.date)));
  getBudget().forEach(b => yrs.add(b.year));
  getPayroll().forEach(p => yrs.add(deriveYear(p.payDate)));
  const arr = [...yrs].filter(Boolean).sort();
  return arr.length ? arr : [new Date().getFullYear()];
}

/* ================================================================
   DASHBOARD
   ================================================================ */
let chartMonthly, chartCategory, chartIncomeCategory;

function initDashboardFilters() {
  const dd = getDropdowns();
  const yrs = yearsInData();
  fillSelect(document.getElementById('dashYear'), yrs, yrs[yrs.length - 1]);
  fillSelect(document.getElementById('dashMonth'), ['All', ...MONTHS], 'All');
  const weeks = ['All', ...Array.from({ length: 53 }, (_, i) => i + 1)];
  fillSelect(document.getElementById('dashWeek'), weeks, 'All');
  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', renderDashboard));
}

function renderDashboard() {
  const year = document.getElementById('dashYear').value;
  const month = document.getElementById('dashMonth').value;
  const week = document.getElementById('dashWeek').value;
  document.getElementById('dashPeriodLabel').textContent =
    `${month} ${year}${week !== 'All' ? ' • Week ' + week : ''}`;

  const txns = getTransactions().filter(t => {
    if (String(deriveYear(t.date)) !== String(year)) return false;
    if (month !== 'All' && deriveMonthName(t.date) !== month) return false;
    if (week !== 'All' && String(deriveWeek(t.date)) !== String(week)) return false;
    return true;
  });
  const income = txns.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const expense = txns.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount || 0), 0);
  const net = income - expense;
  document.getElementById('statIncome').textContent = fmt(income);
  document.getElementById('statExpense').textContent = fmt(expense);
  document.getElementById('statNet').textContent = fmt(net);
  document.getElementById('statSavings').textContent = income ? fmtPct(net / income) : '0%';

  // accounts table
  const accBody = document.querySelector('#dashAccountsTable tbody');
  accBody.innerHTML = getAccounts().map(a => {
    const bal = accountBalance(a.account);
    const goal = a.goal ? Number(a.goal) : null;
    const pct = goal ? Math.min(bal / goal, 1) : null;
    return `<tr>
      <td>${a.account}</td>
      <td class="text-end">${fmt(bal)}</td>
      <td style="min-width:120px">${goal ? `<div class="progress" style="height:14px"><div class="progress-bar" style="width:${(pct * 100).toFixed(0)}%">${(pct * 100).toFixed(0)}%</div></div>` : '<span class="text-muted small">—</span>'}</td>
    </tr>`;
  }).join('');

  // monthly chart (whole selected year)
  const incomeByMonth = MONTHS.map(m => getTransactions()
    .filter(t => String(deriveYear(t.date)) === String(year) && deriveMonthName(t.date) === m && t.type === 'Income')
    .reduce((s, t) => s + Number(t.amount || 0), 0));
  const expenseByMonth = MONTHS.map(m => getTransactions()
    .filter(t => String(deriveYear(t.date)) === String(year) && deriveMonthName(t.date) === m && t.type === 'Expense')
    .reduce((s, t) => s + Number(t.amount || 0), 0));

  const ctx1 = document.getElementById('chartMonthly').getContext('2d');
  if (chartMonthly) chartMonthly.destroy();
  chartMonthly = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: MONTHS.map(m => m.slice(0, 3)), datasets: [
        { label: 'Income', data: incomeByMonth, backgroundColor: '#2f8f5e', borderRadius: 4 },
        { label: 'Expenses', data: expenseByMonth, backgroundColor: '#bf4632', borderRadius: 4 },
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: "'Inter', sans-serif" }, usePointStyle: true, boxWidth: 8 } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#e8ddc0' } } } }
  });

  // category doughnut for selected period
  const byCat = {};
  txns.filter(t => t.type === 'Expense').forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount || 0);
  });
  const catLabels = Object.keys(byCat);
  document.getElementById('totalExpenseCategory').textContent =
    'Total: ' + fmt(catLabels.reduce((s, c) => s + byCat[c], 0));
  const ctx2 = document.getElementById('chartCategory').getContext('2d');
  if (chartCategory) chartCategory.destroy();
  chartCategory = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: catLabels, datasets: [{
        data: catLabels.map(c => byCat[c]),
        backgroundColor: ['#1f6f57', '#bf4632', '#cf8a34', '#3f6fa8', '#8a5ca8', '#c98a3e', '#4f9e94', '#b25a8c', '#7a8a3e', '#5e6b8a'],
        borderColor: '#fffdf9', borderWidth: 2
      }]
    },
    options: {
      responsive: true, cutout: '62%', plugins: {
        legend: {
          position: 'right', labels: {
            boxWidth: 12, font: { size: 10, family: "'Inter', sans-serif" }, generateLabels: (chart) => {
              const ds = chart.data.datasets[0];
              return chart.data.labels.map((label, i) => ({
                text: `${label}: ${fmt(ds.data[i])}`,
                fillStyle: ds.backgroundColor[i],
                strokeStyle: ds.backgroundColor[i],
                index: i
              }));
            }
          }
        }
      }
    }
  });

  // income category doughnut for selected period, mirrors the sheet's
  // "Income Category" table: the Work category is broken out by its
  // subcategory (Regular Salary, Incentives, Sideline, Refund, Other)
  // while every other income category is shown as a single slice.
  const byIncomeCat = {};
  txns.filter(t => t.type === 'Income').forEach(t => {
    const label = (sameText(t.category, 'Work') && t.subcategory) ? t.subcategory : t.category;
    byIncomeCat[label] = (byIncomeCat[label] || 0) + Number(t.amount || 0);
  });
  const incCatLabels = Object.keys(byIncomeCat);
  document.getElementById('totalIncomeCategory').textContent =
    'Total: ' + fmt(incCatLabels.reduce((s, c) => s + byIncomeCat[c], 0));
  const ctx3 = document.getElementById('chartIncomeCategory').getContext('2d');
  if (chartIncomeCategory) chartIncomeCategory.destroy();
  chartIncomeCategory = new Chart(ctx3, {
    type: 'doughnut',
    data: {
      labels: incCatLabels, datasets: [{
        data: incCatLabels.map(c => byIncomeCat[c]),
        backgroundColor: ['#2f8f5e', '#3f6fa8', '#cf8a34', '#8a5ca8', '#4f9e94', '#b25a8c', '#7a8a3e', '#5e6b8a', '#bf4632', '#a3752f'],
        borderColor: '#fffdf9', borderWidth: 2
      }]
    },
    options: {
      responsive: true, cutout: '62%', plugins: {
        legend: {
          position: 'right', labels: {
            boxWidth: 12, font: { size: 10, family: "'Inter', sans-serif" }, generateLabels: (chart) => {
              const ds = chart.data.datasets[0];
              return chart.data.labels.map((label, i) => ({
                text: `${label}: ${fmt(ds.data[i])}`,
                fillStyle: ds.backgroundColor[i],
                strokeStyle: ds.backgroundColor[i],
                index: i
              }));
            }
          }
        }
      }
    }
  });
}

/* ================================================================
   TRANSACTIONS
   ================================================================ */
let txnPage = 1;
const TXN_PAGE_SIZE = 50;

function initTxnFilters() {
  const yrs = yearsInData();
  fillSelect(document.getElementById('txnFilterYear'), ['All', ...yrs], yrs[yrs.length - 1]);
  fillSelect(document.getElementById('txnFilterMonth'), ['All', ...MONTHS], 'All');
  document.getElementById('txnFilterYear').addEventListener('change', () => { txnPage = 1; renderTransactions(); });
  document.getElementById('txnFilterMonth').addEventListener('change', () => { txnPage = 1; renderTransactions(); });
  document.getElementById('txnSearch').addEventListener('input', () => { txnPage = 1; renderTransactions(); });
}

function filteredTransactions() {
  const year = document.getElementById('txnFilterYear').value;
  const month = document.getElementById('txnFilterMonth').value;
  const q = document.getElementById('txnSearch').value.trim().toLowerCase();
  return getTransactions()
    .filter(t => year === 'All' || String(deriveYear(t.date)) === String(year))
    .filter(t => month === 'All' || deriveMonthName(t.date) === month)
    .filter(t => !q || [t.type, t.description, t.category, t.subcategory, t.account, t.note].join(' ').toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

function renderTransactions() {
  const all = filteredTransactions();
  const totalPages = Math.max(1, Math.ceil(all.length / TXN_PAGE_SIZE));
  txnPage = Math.min(txnPage, totalPages);
  const rows = all.slice((txnPage - 1) * TXN_PAGE_SIZE, txnPage * TXN_PAGE_SIZE);

  document.querySelector('#txnTable tbody').innerHTML = rows.map(t => `
    <tr class="row-clickable" onclick="openTxnModal(${t.id})">
      <td>${t.date}</td>
      <td><span class="badge ${t.type === 'Income' ? 'badge-ok' : 'badge-over'}">${t.type}</span></td>
      <td>${t.account}</td>
      <td>${t.category}${t.subcategory ? ' / ' + t.subcategory : ''}</td>
      <td>${t.description || ''}</td>
      <td class="text-end">${fmt(t.amount)}</td>
      <td class="text-muted"><i class="bi bi-chevron-right"></i></td>
    </tr>`).join('') || `<tr><td colspan="7" class="text-center text-muted py-4">No transactions found.</td></tr>`;

  const pag = document.getElementById('txnPagination');
  pag.innerHTML = '';
  if (totalPages > 1) {
    for (let p = 1; p <= totalPages; p++) {
      if (p > 3 && p < totalPages - 2 && Math.abs(p - txnPage) > 1) { if (p === 4) pag.innerHTML += '<li class="page-item disabled"><span class="page-link">…</span></li>'; continue; }
      pag.innerHTML += `<li class="page-item ${p === txnPage ? 'active' : ''}"><a class="page-link" href="#" onclick="event.preventDefault();txnPage=${p};renderTransactions();">${p}</a></li>`;
    }
  }
}

function openTxnModal(id) {
  const dd = getDropdowns();
  fillSelect(document.getElementById('txnAccount'), dd.account, dd.account[0]);
  document.getElementById('txnId').value = id || '';
  document.getElementById('txnDeleteBtn').classList.toggle('d-none', !id);
  if (id) {
    const t = getTransactions().find(x => x.id === id);
    document.getElementById('txnDate').value = t.date;
    document.getElementById('txnType').value = t.type;
    onTxnTypeChange();
    document.getElementById('txnAccount').value = t.account;
    document.getElementById('txnCategory').value = t.category;
    onTxnCategoryChangeSet(t.subcategory);
    document.getElementById('txnAmount').value = t.amount;
    document.getElementById('txnDescription').value = t.description || '';
    document.getElementById('txnNote').value = t.note || '';
  } else {
    document.getElementById('txnDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('txnType').value = 'Expense';
    onTxnTypeChange();
    document.getElementById('txnAmount').value = '';
    document.getElementById('txnDescription').value = '';
    document.getElementById('txnNote').value = '';
  }
  new bootstrap.Modal(document.getElementById('txnModal')).show();
}
function onTxnTypeChange() {
  const dd = getDropdowns();
  const type = document.getElementById('txnType').value;
  const cats = type === 'Income' ? dd.incomeCategory : dd.expenseCategory;
  fillSelect(document.getElementById('txnCategory'), cats, cats[0]);
  onTxnCategoryChangeSet();
  document.getElementById('txnCategory').onchange = () => onTxnCategoryChangeSet();
}
function onTxnCategoryChangeSet(selected) {
  const dd = getDropdowns();
  const type = document.getElementById('txnType').value;
  const cat = document.getElementById('txnCategory').value;
  const showSub = (type === 'Income' && cat === 'Work');
  document.getElementById('txnSubcatWrap').classList.toggle('d-none', !showSub);
  if (showSub) fillSelect(document.getElementById('txnSubcategory'), dd.incomeSubcategory, selected || dd.incomeSubcategory[0]);
}
function saveTxnFromModal() {
  const id = document.getElementById('txnId').value;
  const type = document.getElementById('txnType').value;
  const showSub = !document.getElementById('txnSubcatWrap').classList.contains('d-none');
  const obj = {
    date: document.getElementById('txnDate').value,
    type,
    account: document.getElementById('txnAccount').value,
    category: document.getElementById('txnCategory').value,
    subcategory: showSub ? document.getElementById('txnSubcategory').value : '',
    description: document.getElementById('txnDescription').value,
    amount: parseFloat(document.getElementById('txnAmount').value) || 0,
    note: document.getElementById('txnNote').value,
  };
  if (!obj.date || !obj.amount) { showToast('Date and amount are required.', 'danger'); return; }
  const list = getTransactions();
  if (id) {
    const idx = list.findIndex(x => x.id === Number(id));
    list[idx] = Object.assign({ id: Number(id) }, obj);
  } else {
    list.push(Object.assign({ id: nextId(list) }, obj));
  }
  set(LS_KEYS.transactions, list);
  bootstrap.Modal.getInstance(document.getElementById('txnModal')).hide();
  renderTransactions();
}
function deleteTxnFromModal() {
  const id = Number(document.getElementById('txnId').value);
  showConfirmModal('Delete this transaction?', () => {
    set(LS_KEYS.transactions, getTransactions().filter(x => x.id !== id));
    bootstrap.Modal.getInstance(document.getElementById('txnModal')).hide();
    renderTransactions();
  }, { danger: true, confirmText: 'Delete' });
}

/* ================================================================
   TRANSFERS
   ================================================================ */
function renderTransfers() {
  const list = getTransfers().slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  document.querySelector('#transferTable tbody').innerHTML = list.map(t => `
    <tr class="row-clickable" onclick="openTransferModal(${t.id})">
      <td>${t.date}</td><td>${t.transferType}</td><td>${t.fromAccount}</td><td>${t.toAccount}</td>
      <td class="text-end">${fmt(t.amount)}</td><td class="text-muted"><i class="bi bi-chevron-right"></i></td>
    </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted py-4">No transfers yet.</td></tr>`;
}
function openTransferModal(id) {
  const dd = getDropdowns();
  fillSelect(document.getElementById('trfType'), dd.transferType, dd.transferType[0]);
  fillSelect(document.getElementById('trfFrom'), dd.account, dd.account[0]);
  fillSelect(document.getElementById('trfTo'), dd.account, dd.account[0]);
  document.getElementById('trfId').value = id || '';
  document.getElementById('trfDeleteBtn').classList.toggle('d-none', !id);
  if (id) {
    const t = getTransfers().find(x => x.id === id);
    document.getElementById('trfDate').value = t.date;
    document.getElementById('trfType').value = t.transferType;
    document.getElementById('trfFrom').value = t.fromAccount;
    document.getElementById('trfTo').value = t.toAccount;
    document.getElementById('trfAmount').value = t.amount;
    document.getElementById('trfNote').value = t.note || '';
  } else {
    document.getElementById('trfDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('trfAmount').value = '';
    document.getElementById('trfNote').value = '';
  }
  new bootstrap.Modal(document.getElementById('transferModal')).show();
}
function saveTransferFromModal() {
  const id = document.getElementById('trfId').value;
  const obj = {
    date: document.getElementById('trfDate').value,
    transferType: document.getElementById('trfType').value,
    fromAccount: document.getElementById('trfFrom').value,
    toAccount: document.getElementById('trfTo').value,
    amount: parseFloat(document.getElementById('trfAmount').value) || 0,
    note: document.getElementById('trfNote').value,
  };
  if (!obj.date || !obj.amount) { showToast('Date and amount are required.', 'danger'); return; }
  const list = getTransfers();
  if (id) {
    const idx = list.findIndex(x => x.id === Number(id));
    list[idx] = Object.assign({ id: Number(id) }, obj);
  } else {
    list.push(Object.assign({ id: nextId(list) }, obj));
  }
  set(LS_KEYS.transfers, list);
  bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
  renderTransfers();
}
function deleteTransferFromModal() {
  const id = Number(document.getElementById('trfId').value);
  showConfirmModal('Delete this transfer?', () => {
    set(LS_KEYS.transfers, getTransfers().filter(x => x.id !== id));
    bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
    renderTransfers();
  }, { danger: true, confirmText: 'Delete' });
}

/* ================================================================
   BUDGET
   ================================================================ */
function initBudgetFilters() {
  const yrs = yearsInData();
  fillSelect(document.getElementById('budgetYear'), yrs, yrs[yrs.length - 1]);
  fillSelect(document.getElementById('budgetMonth'), MONTHS, MONTHS[new Date().getMonth()]);
  document.getElementById('budgetYear').addEventListener('change', renderBudget);
  document.getElementById('budgetMonth').addEventListener('change', renderBudget);
}
function renderBudget() {
  const year = Number(document.getElementById('budgetYear').value);
  const month = document.getElementById('budgetMonth').value;
  const dd = getDropdowns();
  let rows = getBudget().filter(b => Number(b.year) === year && b.month === month);
  // ensure every expense category has a row (auto-create at 0 like the sheet does)
  const list = getBudget();
  let changed = false;
  dd.expenseCategory.forEach(cat => {
    if (!rows.find(r => r.category === cat)) {
      const row = { id: nextId(list), year, month, category: cat, amount: 0, note: '' };
      list.push(row); rows.push(row); changed = true;
    }
  });
  if (changed) set(LS_KEYS.budget, list);

  document.querySelector('#budgetTable tbody').innerHTML = rows.map(r => {
    const actual = getTransactions()
      .filter(t => sameText(t.type, 'Expense') && sameText(t.category, r.category) && deriveYear(t.date) === year && deriveMonthName(t.date) === month)
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const remaining = Number(r.amount) - actual;
    const used = r.amount > 0 ? actual / r.amount : 0;
    let status = 'SET BUDGET', cls = 'badge-set';
    if (r.amount > 0) {
      if (remaining < 0) { status = 'OVER BUDGET'; cls = 'badge-over'; }
      else if (used >= 0.8) { status = 'WATCH'; cls = 'badge-watch'; }
      else { status = 'ON TRACK'; cls = 'badge-ok'; }
    }
    return `<tr>
      <td>${r.category}</td>
      <td><input type="number" step="0.01" class="form-control form-control-sm" value="${r.amount}" onchange="updateBudgetAmount(${r.id}, this.value)"></td>
      <td class="text-end">${fmt(actual)}</td>
      <td class="text-end">${fmt(remaining)}</td>
      <td class="text-end">${fmtPct(used)}</td>
      <td><span class="badge ${cls}">${status}</span></td>
    </tr>`;
  }).join('');
}
function updateBudgetAmount(id, val) {
  const list = getBudget();
  const row = list.find(r => r.id === id);
  row.amount = parseFloat(val) || 0;
  set(LS_KEYS.budget, list);
  renderBudget();
}

/* ================================================================
   ACCOUNTS & GOALS
   ================================================================ */
function renderAccounts() {
  document.querySelector('#accountsTable tbody').innerHTML = getAccounts().map(a => {
    const bal = accountBalance(a.account);
    const goal = a.goal ? Number(a.goal) : null;
    const pct = goal ? Math.min(Math.max(bal / goal, 0), 1) : null;
    return `<tr class="row-clickable" onclick="openAccountModal(${a.id})">
      <td>${a.account}</td><td>${a.purpose || ''}</td>
      <td class="text-end">${fmt(a.opening)}</td>
      <td class="text-end fw-semibold">${fmt(bal)}</td>
      <td>${goal ? fmt(goal) : '<span class="text-muted">—</span>'}</td>
      <td>${goal ? `<div class="progress" style="height:14px"><div class="progress-bar bg-success" style="width:${(pct * 100).toFixed(0)}%">${(pct * 100).toFixed(0)}%</div></div>` : ''}</td>
      <td class="text-muted"><i class="bi bi-chevron-right"></i></td>
    </tr>`;
  }).join('');
}
function openAccountModal(id) {
  document.getElementById('acctId').value = id || '';
  document.getElementById('acctDeleteBtn').classList.toggle('d-none', !id);
  if (id) {
    const a = getAccounts().find(x => x.id === id);
    document.getElementById('acctName').value = a.account;
    document.getElementById('acctPurpose').value = a.purpose || '';
    document.getElementById('acctOpening').value = a.opening;
    document.getElementById('acctGoal').value = a.goal || '';
  } else {
    document.getElementById('acctName').value = '';
    document.getElementById('acctPurpose').value = '';
    document.getElementById('acctOpening').value = 0;
    document.getElementById('acctGoal').value = '';
  }
  new bootstrap.Modal(document.getElementById('accountModal')).show();
}
function saveAccountFromModal() {
  const id = document.getElementById('acctId').value;
  const obj = {
    account: document.getElementById('acctName').value.trim(),
    purpose: document.getElementById('acctPurpose').value,
    opening: parseFloat(document.getElementById('acctOpening').value) || 0,
    goal: document.getElementById('acctGoal').value ? parseFloat(document.getElementById('acctGoal').value) : null,
  };
  if (!obj.account) { showToast('Account name is required.', 'danger'); return; }
  const list = getAccounts();
  if (id) {
    const idx = list.findIndex(x => x.id === Number(id));
    list[idx] = Object.assign({ id: Number(id) }, obj);
  } else {
    list.push(Object.assign({ id: nextId(list) }, obj));
    // also add to the account dropdown list
    const dd = getDropdowns();
    if (!dd.account.includes(obj.account)) { dd.account.push(obj.account); set(LS_KEYS.dropdowns, dd); }
  }
  set(LS_KEYS.accounts, list);
  bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide();
  renderAccounts();
}
function deleteAccountFromModal() {
  const id = Number(document.getElementById('acctId').value);
  showConfirmModal('Delete this account? Existing transactions referencing it will stay as-is.', () => {
    set(LS_KEYS.accounts, getAccounts().filter(x => x.id !== id));
    bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide();
    renderAccounts();
  }, { danger: true, confirmText: 'Delete' });
}

/* ================================================================
   PAYROLL
   ================================================================ */
function renderPayroll() {
  const list = getPayroll().slice().sort((a, b) => a.payDate.localeCompare(b.payDate));
  document.querySelector('#payrollTable tbody').innerHTML = list.map(p => {
    const half = derivePayrollHalf(p.payDate);
    const d = parseDate(p.payDate);
    const periodStart = d.getDate() === 15 ? new Date(d.getFullYear(), d.getMonth(), 1) : new Date(d.getFullYear(), d.getMonth(), 16);
    const periodEnd = d.getDate() === 15 ? d : new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const inRange = (t) => { const td = parseDate(t.date); return td >= periodStart && td <= periodEnd; };
    const salary = getTransactions().filter(t => sameText(t.type, 'Income') && sameText(t.category, 'Work') && sameText(t.subcategory, 'Regular Salary') && inRange(t)).reduce((s, t) => s + Number(t.amount || 0), 0);
    const incentives = getTransactions().filter(t => sameText(t.type, 'Income') && sameText(t.category, 'Work') && sameText(t.subcategory, 'Incentives') && inRange(t)).reduce((s, t) => s + Number(t.amount || 0), 0);
    const actualTotal = salary + incentives;
    const variance = actualTotal - Number(p.expectedSalary || 0);
    return `<tr class="row-clickable" onclick="openPayrollModal(${p.id})">
      <td>${p.payDate}</td><td class="small">${half}</td>
      <td class="text-end">${p.expectedWorkdays || 0}</td><td class="text-end">${p.actualWorkdays || 0}</td>
      <td class="text-end">${fmt(p.expectedSalary)}</td>
      <td class="text-end">${fmt(actualTotal)}</td>
      <td class="text-end ${variance < 0 ? 'text-danger' : 'text-success'}">${fmt(variance)}</td>
      <td class="text-muted"><i class="bi bi-chevron-right"></i></td>
    </tr>`;
  }).join('') || `<tr><td colspan="8" class="text-center text-muted py-4">No pay dates yet.</td></tr>`;
}
function openPayrollModal(id) {
  document.getElementById('prlId').value = id || '';
  document.getElementById('prlDeleteBtn').classList.toggle('d-none', !id);
  if (id) {
    const p = getPayroll().find(x => x.id === id);
    document.getElementById('prlDate').value = p.payDate;
    document.getElementById('prlExpectedDays').value = p.expectedWorkdays || 0;
    document.getElementById('prlActualDays').value = p.actualWorkdays || 0;
    document.getElementById('prlExpectedSalary').value = p.expectedSalary || 0;
  } else {
    document.getElementById('prlDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('prlExpectedDays').value = '';
    document.getElementById('prlActualDays').value = '';
    document.getElementById('prlExpectedSalary').value = '';
  }
  new bootstrap.Modal(document.getElementById('payrollModal')).show();
}
function savePayrollFromModal() {
  const id = document.getElementById('prlId').value;
  const obj = {
    payDate: document.getElementById('prlDate').value,
    expectedWorkdays: parseFloat(document.getElementById('prlExpectedDays').value) || 0,
    actualWorkdays: parseFloat(document.getElementById('prlActualDays').value) || 0,
    expectedSalary: parseFloat(document.getElementById('prlExpectedSalary').value) || 0,
  };
  if (!obj.payDate) { showToast('Pay date is required.', 'danger'); return; }
  const list = getPayroll();
  if (id) {
    const idx = list.findIndex(x => x.id === Number(id));
    list[idx] = Object.assign({ id: Number(id) }, obj);
  } else {
    list.push(Object.assign({ id: nextId(list) }, obj));
  }
  set(LS_KEYS.payroll, list);
  bootstrap.Modal.getInstance(document.getElementById('payrollModal')).hide();
  renderPayroll();
}
function deletePayrollFromModal() {
  const id = Number(document.getElementById('prlId').value);
  showConfirmModal('Delete this pay date?', () => {
    set(LS_KEYS.payroll, getPayroll().filter(x => x.id !== id));
    bootstrap.Modal.getInstance(document.getElementById('payrollModal')).hide();
    renderPayroll();
  }, { danger: true, confirmText: 'Delete' });
}

/* ================================================================
   ATOME
   ================================================================ */
function renderAtome() {
  const s = getSettings();
  const acct = getAccounts().find(a => /atome/i.test(a.account));
  const limit = acct ? Number(acct.opening) : 0;
  const purchases = getTransactions().filter(t => sameText(t.type, 'Expense') && /atome/i.test(t.account)).reduce((s, t) => s + Number(t.amount || 0), 0);
  const payments = getTransfers().filter(t => sameText(t.transferType, 'Atome Payment') && /atome/i.test(t.toAccount)).reduce((s, t) => s + Number(t.amount || 0), 0);
  const outstanding = Math.max(purchases - payments, 0);
  const available = Math.max(limit - outstanding, 0);
  const utilization = limit ? outstanding / limit : 0;

  document.getElementById('atomeLimit').textContent = fmt(limit);
  document.getElementById('atomeOutstanding').textContent = fmt(outstanding);
  document.getElementById('atomeAvailable').textContent = fmt(available);
  document.getElementById('atomeUtilization').textContent = fmtPct(utilization);

  // next 12 statement/due cycles from today
  const today = new Date();
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const ref = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const stmt = new Date(ref.getFullYear(), ref.getMonth(), s.atomeStatementDay || 10);
    const due = new Date(ref.getFullYear(), ref.getMonth(), s.atomeDueDay || 20);
    let status = 'OPEN', cls = 'badge-set';
    if (outstanding === 0) { status = 'PAID / NO BALANCE'; cls = 'badge-ok'; }
    else if (today > due) { status = 'PAST DUE'; cls = 'badge-over'; }
    else if (today >= stmt) { status = 'STATEMENT READY'; cls = 'badge-watch'; }
    rows.push(`<tr><td>${toLocalISODate(stmt)}</td><td>${toLocalISODate(due)}</td>
      <td class="text-end">${fmt(outstanding)}</td><td><span class="badge ${cls}">${status}</span></td></tr>`);
  }
  document.querySelector('#atomeTable tbody').innerHTML = rows.join('');
}

/* ================================================================
   SETTINGS
   ================================================================ */
function renderSettings() {
  const s = getSettings();
  document.getElementById('settingCurrency').value = s.currency || '';
  document.getElementById('settingAtomeStmt').value = s.atomeStatementDay || 10;
  document.getElementById('settingAtomeDue').value = s.atomeDueDay || 20;
  document.getElementById('currencyLabel').textContent = s.currency || '';

  const dd = getDropdowns();
  const labels = {
    account: 'Accounts', expenseCategory: 'Expense categories', incomeCategory: 'Income categories',
    incomeSubcategory: 'Income subcategories', transferType: 'Transfer types', transactionType: 'Transaction types'
  };
  document.getElementById('dropdownEditors').innerHTML = Object.keys(labels).map(key => `
    <div class="col-md-6">
      <label class="form-label small mb-0">${labels[key]}</label>
      <textarea class="form-control form-control-sm" rows="5" id="dd_${key}">${(dd[key] || []).join('\n')}</textarea>
    </div>`).join('');
}
function saveGeneralSettings() {
  const s = getSettings();
  s.currency = document.getElementById('settingCurrency').value;
  s.atomeStatementDay = parseInt(document.getElementById('settingAtomeStmt').value) || 10;
  s.atomeDueDay = parseInt(document.getElementById('settingAtomeDue').value) || 20;
  set(LS_KEYS.settings, s);
  document.getElementById('currencyLabel').textContent = s.currency || '';
  showToast('Saved.', 'success');
}
function saveDropdowns() {
  const dd = getDropdowns();
  ['account', 'expenseCategory', 'incomeCategory', 'incomeSubcategory', 'transferType', 'transactionType'].forEach(key => {
    dd[key] = document.getElementById('dd_' + key).value.split('\n').map(s => s.trim()).filter(Boolean);
  });
  set(LS_KEYS.dropdowns, dd);
  showToast('Saved.', 'success');
}
function exportBackup() {
  const backup = {
    transactions: getTransactions(), transfers: getTransfers(), accounts: getAccounts(),
    budget: getBudget(), payroll: getPayroll(), dropdowns: getDropdowns(), settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `money-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}
function importBackup(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      showConfirmModal('This will replace all data currently in this browser with the backup file. Continue?', () => {
        set(LS_KEYS.transactions, data.transactions || []);
        set(LS_KEYS.transfers, data.transfers || []);
        set(LS_KEYS.accounts, data.accounts || []);
        set(LS_KEYS.budget, data.budget || []);
        set(LS_KEYS.payroll, data.payroll || []);
        set(LS_KEYS.dropdowns, data.dropdowns || {});
        set(LS_KEYS.settings, data.settings || {});
        localStorage.setItem(LS_KEYS.initialized, '1');
        showToast('Backup imported.', 'success');
        setTimeout(() => location.reload(), 600);
      }, { danger: true, confirmText: 'Replace data' });
    } catch (e) { showToast('Could not read that file: ' + e.message, 'danger'); }
  };
  reader.readAsText(file);
}
function resetToSeed() {
  showConfirmModal('This erases everything you added and restores the data originally imported from your spreadsheet. Continue?', () => {
    localStorage.removeItem(LS_KEYS.initialized);
    Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
    loadAll();
    location.reload();
  }, { danger: true, confirmText: 'Reset' });
}
function wipeAll() {
  showConfirmModal('This erases ALL data in this browser permanently. Continue?', () => {
    Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
    set(LS_KEYS.transactions, []); set(LS_KEYS.transfers, []); set(LS_KEYS.accounts, []);
    set(LS_KEYS.budget, []); set(LS_KEYS.payroll, []);
    set(LS_KEYS.dropdowns, { transactionType: ['Income', 'Expense'], account: [], expenseCategory: [], incomeCategory: [], incomeSubcategory: [], transferType: [] });
    set(LS_KEYS.settings, { currency: '', atomeStatementDay: 10, atomeDueDay: 20 });
    localStorage.setItem(LS_KEYS.initialized, '1');
    location.reload();
  }, { danger: true, confirmText: 'Erase everything' });
}

/* ================================================================
   BOOT
   ================================================================ */
const render = {
  dashboard: renderDashboard,
  transactions: renderTransactions,
  transfers: renderTransfers,
  budget: renderBudget,
  accounts: renderAccounts,
  payroll: renderPayroll,
  atome: renderAtome,
  settings: renderSettings,
};

loadAll();
document.getElementById('currencyLabel').textContent = getSettings().currency || '';
initDashboardFilters();
initTxnFilters();
initBudgetFilters();
renderDashboard();

/* =========================================================================
   ADDED: extra dashboard insights — Net Cashflow Trend, Top Spending
   Categories, and Account Balance Distribution.

   This block is appended after everything above and does not modify a
   single existing line, function, or comment. It reuses the existing
   helper functions (getTransactions, deriveYear, deriveMonthName,
   accountBalance, fmt, etc.) and hooks into the dashboard's existing
   render cycle by wrapping render.dashboard, so it stays in sync with
   the same Year / Month / Week filters already on the dashboard.
   ========================================================================= */
(function () {
  let chartNetTrend, chartAccountDistribution;

  function currentDashFilters() {
    return {
      year: document.getElementById('dashYear').value,
      month: document.getElementById('dashMonth').value,
      week: document.getElementById('dashWeek').value,
    };
  }

  // Net cashflow (income - expense) for every month of the selected year,
  // same building blocks as the existing "Income vs Expenses by Month" chart.
  function renderNetTrend(year) {
    document.getElementById('netTrendYearLabel').textContent = year;
    const netByMonth = MONTHS.map(m => {
      const monthTxns = getTransactions().filter(t =>
        String(deriveYear(t.date)) === String(year) && deriveMonthName(t.date) === m);
      const income = monthTxns.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const expense = monthTxns.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      return income - expense;
    });
    const ctx = document.getElementById('chartNetTrend').getContext('2d');
    if (chartNetTrend) chartNetTrend.destroy();
    chartNetTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: MONTHS.map(m => m.slice(0, 3)),
        datasets: [{
          label: 'Net Cashflow',
          data: netByMonth,
          borderColor: '#1f6f57',
          backgroundColor: 'rgba(31,111,87,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: netByMonth.map(v => v < 0 ? '#bf4632' : '#1f6f57'),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#e8ddc0' } } }
      }
    });
  }

  // Top 5 expense categories for the currently selected dashboard period,
  // shown as a ranked list with a share-of-total progress bar each.
  function renderTopCategories(year, month, week) {
    const txns = getTransactions().filter(t => {
      if (String(deriveYear(t.date)) !== String(year)) return false;
      if (month !== 'All' && deriveMonthName(t.date) !== month) return false;
      if (week !== 'All' && String(deriveWeek(t.date)) !== String(week)) return false;
      return t.type === 'Expense';
    });
    const byCat = {};
    txns.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount || 0); });
    const total = Object.values(byCat).reduce((s, v) => s + v, 0);
    const top = Object.keys(byCat)
      .map(c => ({ category: c, amount: byCat[c] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const list = document.getElementById('topCategoriesList');
    if (!top.length) {
      list.innerHTML = '<p class="text-muted small mb-0">No expenses in this period.</p>';
      return;
    }
    list.innerHTML = top.map((row, i) => {
      const pct = total ? (row.amount / total * 100) : 0;
      return `<div class="top-cat-row">
        <span class="top-cat-rank">${i + 1}</span>
        <div class="top-cat-info">
          <div class="top-cat-name-row"><span>${row.category}</span><span class="amt">${fmt(row.amount)}</span></div>
          <div class="progress" style="height:8px"><div class="progress-bar" style="width:${pct.toFixed(0)}%"></div></div>
        </div>
      </div>`;
    }).join('');
  }

  // Distribution of current balances across all accounts (reuses the
  // existing accountBalance() formula, same one used on the Accounts page).
  function renderAccountDistribution() {
    const accounts = getAccounts().filter(a => !/atome/i.test(a.account));
    const labels = accounts.map(a => a.account);
    const balances = accounts.map(a => Math.max(accountBalance(a.account), 0));
    const total = balances.reduce((s, v) => s + v, 0);
    document.getElementById('totalAccountBalance').textContent = 'Total: ' + fmt(total);

    const ctx = document.getElementById('chartAccountDistribution').getContext('2d');
    if (chartAccountDistribution) chartAccountDistribution.destroy();
    chartAccountDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: balances,
          backgroundColor: ['#1f6f57', '#cf8a34', '#3f6fa8', '#8a5ca8', '#bf4632', '#4f9e94', '#b25a8c', '#7a8a3e'],
          borderColor: '#fffdf9', borderWidth: 2
        }]
      },
      options: {
        responsive: true, cutout: '62%',
        plugins: {
          legend: {
            position: 'right', labels: {
              boxWidth: 12, font: { size: 10, family: "'Inter', sans-serif" }, generateLabels: (chart) => {
                const ds = chart.data.datasets[0];
                return chart.data.labels.map((label, i) => ({
                  text: `${label}: ${fmt(ds.data[i])}`,
                  fillStyle: ds.backgroundColor[i],
                  strokeStyle: ds.backgroundColor[i],
                  index: i
                }));
              }
            }
          }
        }
      }
    });
  }

  function renderDashboardExtras() {
    const { year, month, week } = currentDashFilters();
    renderNetTrend(year);
    renderTopCategories(year, month, week);
    renderAccountDistribution();
  }

  // Wrap (not replace) the existing dashboard renderer so page navigation
  // keeps refreshing these new cards too, without editing renderDashboard itself.
  const _origRenderDashboard = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboard();
    renderDashboardExtras();
  };

  // Keep the new cards in sync with the existing period filter dropdowns.
  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', renderDashboardExtras));

  // Paint once on initial load (the original renderDashboard() already ran
  // above as part of the existing boot sequence).
  renderDashboardExtras();
})();
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
// ADDED: per-month week number (1-based) — days 1-7 = Week 1, 8-14 = Week 2,
// etc. This is what the dashboard's dynamic "Week" filter uses, since weeks
// there are scoped to the selected month, not the whole year.
function deriveWeekOfMonth(dateStr) {
  const d = parseDate(dateStr); if (!d) return '';
  return Math.ceil(d.getDate() / 7);
}
// ADDED: how many weeks a given month has (4 or 5, depending on length).
function daysInMonth(year, monthIndex) { return new Date(year, monthIndex + 1, 0).getDate(); }
function weeksInMonthCount(year, monthName) {
  const monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex === -1) return 0;
  return Math.ceil(daysInMonth(year, monthIndex) / 7);
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

// ADDED: fills the Week dropdown with ['All', 'Week 1'...'Week N'], where N
// depends on how many weeks the CURRENTLY selected Year+Month has. When
// Month = 'All' there's no single month to break into weeks, so only 'All'
// is offered. Normally keeps the current selection if it's still valid,
// falling back to 'All' otherwise. Pass defaultToCurrentWeek=true (used
// only on initial page load) to instead default the selection to today's
// week-of-month, but only when the selected Year+Month is actually the
// current year/month — otherwise it still falls back to 'All'.
function populateDashWeekOptions(defaultToCurrentWeek) {
  const year = Number(document.getElementById('dashYear').value) || new Date().getFullYear();
  const month = document.getElementById('dashMonth').value;
  const weekSel = document.getElementById('dashWeek');
  const prevSelected = weekSel.value || 'All';
  const weeks = ['All'];
  if (month !== 'All') {
    const count = weeksInMonthCount(year, month);
    for (let w = 1; w <= count; w++) weeks.push(String(w));
  }
  let defaultSelection = weeks.includes(prevSelected) ? prevSelected : 'All';
  if (defaultToCurrentWeek && month !== 'All') {
    const today = new Date();
    if (today.getFullYear() === year && MONTHS[today.getMonth()] === month) {
      const currentWeek = String(deriveWeekOfMonth(toLocalISODate(today)));
      if (weeks.includes(currentWeek)) defaultSelection = currentWeek;
    }
  }
  fillSelect(weekSel, weeks, defaultSelection);
}

function initDashboardFilters() {
  const dd = getDropdowns();
  const yrs = yearsInData();
  fillSelect(document.getElementById('dashYear'), yrs, yrs.includes(new Date().getFullYear()) ? new Date().getFullYear() : yrs[yrs.length - 1]);
  fillSelect(document.getElementById('dashMonth'), ['All', ...MONTHS], MONTHS[new Date().getMonth()]);
  populateDashWeekOptions(true);
  document.getElementById('dashYear').addEventListener('change', () => { populateDashWeekOptions(); renderDashboard(); });
  document.getElementById('dashMonth').addEventListener('change', () => { populateDashWeekOptions(); renderDashboard(); });
  document.getElementById('dashWeek').addEventListener('change', renderDashboard);
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
    if (week !== 'All' && String(deriveWeekOfMonth(t.date)) !== String(week)) return false;
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

  // monthly chart — Income vs Expenses across the whole selected year by
  // default (Week = All, whatever Month is set to), and only switches to a
  // weekly breakdown of the selected month once a specific Week is chosen
  // (week count is dynamic per month). Picking a Month alone does NOT
  // switch this to weekly — only picking a Week does.
  let monthlyLabels, incomeByMonth, expenseByMonth, monthlyChartLabel;
  if (week === 'All') {
    monthlyLabels = MONTHS.map(m => m.slice(0, 3));
    incomeByMonth = MONTHS.map(m => getTransactions()
      .filter(t => String(deriveYear(t.date)) === String(year) && deriveMonthName(t.date) === m && t.type === 'Income')
      .reduce((s, t) => s + Number(t.amount || 0), 0));
    expenseByMonth = MONTHS.map(m => getTransactions()
      .filter(t => String(deriveYear(t.date)) === String(year) && deriveMonthName(t.date) === m && t.type === 'Expense')
      .reduce((s, t) => s + Number(t.amount || 0), 0));
    monthlyChartLabel = `Income vs Expenses by Month (${year})`;
  } else {
    // week !== 'All' — populateDashWeekOptions() only offers real week
    // numbers once a specific Month is selected, so `month` is guaranteed
    // to be a real month name here.
    const weekCount = weeksInMonthCount(Number(year), month);
    monthlyLabels = Array.from({ length: weekCount }, (_, i) => 'Week ' + (i + 1));
    const monthTxnsAll = getTransactions().filter(t =>
      String(deriveYear(t.date)) === String(year) && deriveMonthName(t.date) === month);
    incomeByMonth = monthlyLabels.map((_, i) => monthTxnsAll
      .filter(t => t.type === 'Income' && deriveWeekOfMonth(t.date) === i + 1)
      .reduce((s, t) => s + Number(t.amount || 0), 0));
    expenseByMonth = monthlyLabels.map((_, i) => monthTxnsAll
      .filter(t => t.type === 'Expense' && deriveWeekOfMonth(t.date) === i + 1)
      .reduce((s, t) => s + Number(t.amount || 0), 0));
    monthlyChartLabel = `Weekly Income vs Expenses — ${month} ${year}`;
  }
  const monthlyTitleEl = document.getElementById('monthlyChartTitle');
  if (monthlyTitleEl) monthlyTitleEl.textContent = monthlyChartLabel;

  const ctx1 = document.getElementById('chartMonthly').getContext('2d');
  if (chartMonthly) chartMonthly.destroy();
  chartMonthly = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: monthlyLabels, datasets: [
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
  fillSelect(document.getElementById('txnFilterYear'), ['All', ...yrs], yrs.includes(new Date().getFullYear()) ? new Date().getFullYear() : yrs[yrs.length - 1]);
  fillSelect(document.getElementById('txnFilterMonth'), ['All', ...MONTHS], MONTHS[new Date().getMonth()]);
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
function initTransferFilters() {
  const yrs = yearsInData();
  fillSelect(document.getElementById('transferFilterYear'), ['All', ...yrs], yrs.includes(new Date().getFullYear()) ? new Date().getFullYear() : yrs[yrs.length - 1]);
  fillSelect(document.getElementById('transferFilterMonth'), ['All', ...MONTHS], MONTHS[new Date().getMonth()]);
  document.getElementById('transferFilterYear').addEventListener('change', renderTransfers);
  document.getElementById('transferFilterMonth').addEventListener('change', renderTransfers);
}

function filteredTransfers() {
  const year = document.getElementById('transferFilterYear').value;
  const month = document.getElementById('transferFilterMonth').value;
  return getTransfers()
    .filter(t => year === 'All' || String(deriveYear(t.date)) === String(year))
    .filter(t => month === 'All' || deriveMonthName(t.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

function renderTransfers() {
  const list = filteredTransfers();
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
  fillSelect(document.getElementById('budgetYear'), yrs, yrs.includes(new Date().getFullYear()) ? new Date().getFullYear() : yrs[yrs.length - 1]);
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
    const holiday = getTransactions().filter(t => sameText(t.type, 'Income') && sameText(t.category, 'Work') && sameText(t.subcategory, 'Holiday') && inRange(t)).reduce((s, t) => s + Number(t.amount || 0), 0);
    const actualTotal = salary + incentives + holiday;
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

/* =========================================================================
   ADDED: Payroll — Holiday and Incentive columns.

   Purely additive — it does not modify a single existing line, function,
   or comment above (including renderPayroll itself). It reuses the
   existing helper functions (getPayroll, getTransactions, sameText,
   parseDate, fmt, etc.) and hooks into the existing render.payroll render
   cycle by wrapping it further down in the BOOT section (same technique
   already used for the dashboard extras block below), so the two new
   columns stay in sync automatically every time the Payroll page
   re-renders. It matches the same pay-period math renderPayroll already
   uses for "Actual (from entries)".

   Requires the two new <th> cells ("Holiday" and "Incentive") to be added
   to the #payrollTable header in index.html, right after "Expected
   Salary" and before "Actual (from entries)".
   ========================================================================= */
function payrollPeriodRange(payDate) {
  const d = parseDate(payDate);
  const periodStart = d.getDate() === 15 ? new Date(d.getFullYear(), d.getMonth(), 1) : new Date(d.getFullYear(), d.getMonth(), 16);
  const periodEnd = d.getDate() === 15 ? d : new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { periodStart, periodEnd };
}
function payrollSubcategoryTotal(payDate, subcategory) {
  const { periodStart, periodEnd } = payrollPeriodRange(payDate);
  return getTransactions()
    .filter(t => sameText(t.type, 'Income') && sameText(t.category, 'Work') && sameText(t.subcategory, subcategory))
    .filter(t => { const td = parseDate(t.date); return td >= periodStart && td <= periodEnd; })
    .reduce((s, t) => s + Number(t.amount || 0), 0);
}
function addPayrollHolidayIncentiveColumns() {
  try {
    const rows = Array.from(document.querySelectorAll('#payrollTable tbody tr'));

    // empty-state row (the "No pay dates yet." placeholder) — just widen its colspan
    if (rows.length === 1 && rows[0].querySelector('td[colspan]')) {
      const emptyTd = rows[0].querySelector('td[colspan]');
      emptyTd.colSpan = Number(emptyTd.colSpan) + 2;
      return;
    }

    const list = getPayroll().slice().sort((a, b) => a.payDate.localeCompare(b.payDate));
    rows.forEach((row, i) => {
      const p = list[i];
      if (!p) return;
      const tds = row.querySelectorAll('td');
      // Anchor from the END of the row instead of a fixed front index: the
      // last 3 cells are always [Actual (from entries), Variance, chevron],
      // regardless of how many columns come before them. This is robust
      // even if this function runs more than once or the row shape changes.
      const actualTd = tds[tds.length - 3];
      if (!actualTd) return;

      // Guard against double-inserting if this ever runs twice on the same
      // row (e.g. re-render race): remove any previously-added cells first.
      row.querySelectorAll('td[data-added="holiday-incentive"]').forEach(td => td.remove());

      const holiday = payrollSubcategoryTotal(p.payDate, 'Holiday');
      const incentive = payrollSubcategoryTotal(p.payDate, 'Incentives');

      const holidayTd = document.createElement('td');
      holidayTd.className = 'text-end';
      holidayTd.dataset.added = 'holiday-incentive';
      holidayTd.textContent = fmt(holiday);

      const incentiveTd = document.createElement('td');
      incentiveTd.className = 'text-end';
      incentiveTd.dataset.added = 'holiday-incentive';
      incentiveTd.textContent = fmt(incentive);

      actualTd.before(holidayTd, incentiveTd);
    });
  } catch (err) {
    console.error('Payroll Holiday/Incentive columns failed to render:', err);
  }
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
  // FIXED: each cycle's outstanding is now computed per-row instead of
  // reusing the single global `outstanding` value on every row. A purchase
  // only counts toward a cycle if it happened on/before that cycle's
  // statement date (later purchases roll into the NEXT statement), and a
  // payment only clears a cycle if it happened on/before that cycle's due
  // date. This is the only part of renderAtome() that was changed.
  const today = new Date();
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const ref = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const stmt = new Date(ref.getFullYear(), ref.getMonth(), s.atomeStatementDay || 10);
    const due = new Date(ref.getFullYear(), ref.getMonth(), s.atomeDueDay || 20);
    const cyclePurchases = getTransactions()
      .filter(t => sameText(t.type, 'Expense') && /atome/i.test(t.account) && parseDate(t.date) <= stmt)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const cyclePayments = getTransfers()
      .filter(t => sameText(t.transferType, 'Atome Payment') && /atome/i.test(t.toAccount) && parseDate(t.date) <= due)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const cycleOutstanding = Math.max(cyclePurchases - cyclePayments, 0);
    let status = 'OPEN', cls = 'badge-set';
    if (cycleOutstanding === 0) { status = 'PAID / NO BALANCE'; cls = 'badge-ok'; }
    else if (today > due) { status = 'PAST DUE'; cls = 'badge-over'; }
    else if (today >= stmt) { status = 'STATEMENT READY'; cls = 'badge-watch'; }
    rows.push(`<tr><td>${toLocalISODate(stmt)}</td><td>${toLocalISODate(due)}</td>
      <td class="text-end">${fmt(cycleOutstanding)}</td><td><span class="badge ${cls}">${status}</span></td></tr>`);
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
initTransferFilters();
initBudgetFilters();
renderDashboard();

/* ADDED: patch the global renderPayroll function itself (not just
   render.payroll) so the new Holiday / Incentive columns are painted no
   matter how the render is triggered — both page navigation (which calls
   render.payroll()) and the Add/Edit/Delete pay-date modal buttons (which
   call renderPayroll() directly) end up running the same patched
   function, without touching renderPayroll's own original body or any of
   its call sites. */
(function () {
  const _origRenderPayroll = renderPayroll;
  renderPayroll = function () {
    _origRenderPayroll();
    addPayrollHolidayIncentiveColumns();
  };
  render.payroll = renderPayroll;
})();

/* =========================================================================
   ADDED: extra dashboard insights — Net Cashflow Trend and Top Spending
   Categories. (Account Balance Distribution was removed from here.)

   This block is appended after everything above and does not modify a
   single existing line, function, or comment. It reuses the existing
   helper functions (getTransactions, deriveYear, deriveMonthName,
   accountBalance, fmt, etc.) and hooks into the dashboard's existing
   render cycle by wrapping it, so it stays in sync with
   the same Year / Month / Week filters already on the dashboard.
   Net Cashflow Trend and Income vs Expenses by Month both switch from a
   year-of-months view to a weekly-within-the-month view once a specific
   Month is selected (see populateDashWeekOptions / weeksInMonthCount).
   ========================================================================= */
(function () {
  let chartNetTrend;

  function currentDashFilters() {
    return {
      year: document.getElementById('dashYear').value,
      month: document.getElementById('dashMonth').value,
      week: document.getElementById('dashWeek').value,
    };
  }

  // Net cashflow (income - expense) across the whole selected year by
  // default (Week = All), and only switches to a weekly breakdown of the
  // selected month once a specific Week is chosen (week count is dynamic
  // per month) — same trigger as the "Income vs Expenses by Month" chart.
  // Picking a Month alone does NOT switch this to weekly — only picking a
  // Week does.
  function renderNetTrend(year, month, week) {
    let labels, netValues;
    if (week === 'All') {
      document.getElementById('netTrendYearLabel').textContent = year;
      labels = MONTHS.map(m => m.slice(0, 3));
      netValues = MONTHS.map(m => {
        const monthTxns = getTransactions().filter(t =>
          String(deriveYear(t.date)) === String(year) && deriveMonthName(t.date) === m);
        const income = monthTxns.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount || 0), 0);
        const expense = monthTxns.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount || 0), 0);
        return income - expense;
      });
    } else {
      document.getElementById('netTrendYearLabel').textContent = `Weekly — ${month} ${year}`;
      const weekCount = weeksInMonthCount(Number(year), month);
      labels = Array.from({ length: weekCount }, (_, i) => 'Week ' + (i + 1));
      const monthTxnsAll = getTransactions().filter(t =>
        String(deriveYear(t.date)) === String(year) && deriveMonthName(t.date) === month);
      netValues = labels.map((_, i) => {
        const weekTxns = monthTxnsAll.filter(t => deriveWeekOfMonth(t.date) === i + 1);
        const income = weekTxns.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount || 0), 0);
        const expense = weekTxns.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount || 0), 0);
        return income - expense;
      });
    }
    const ctx = document.getElementById('chartNetTrend').getContext('2d');
    if (chartNetTrend) chartNetTrend.destroy();
    chartNetTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Net Cashflow',
          data: netValues,
          borderColor: '#1f6f57',
          backgroundColor: 'rgba(31,111,87,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: netValues.map(v => v < 0 ? '#bf4632' : '#1f6f57'),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#e8ddc0' } } }
      }
    });
  }

  function renderDashboardExtras() {
    const { year, month, week } = currentDashFilters();
    renderNetTrend(year, month, week);
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

/* =========================================================================
   ADDED: Budget Performance report (dashboard). Reuses existing helpers
   (getBudget, getTransactions, deriveYear, deriveMonthName, deriveWeek,
   sameText, fmt, fmtPct) and wraps the current render.dashboard (which
   already includes the earlier "extra dashboard insights" wrapper) so
   this new card refreshes in step with it, without editing a single
   existing line, function, or comment anywhere above.

   Requires the following in index.html, placed right below the existing
   Income by Category / Expenses by Category row and right above the
   "ADDED: extra dashboard insights" block:

     <div class="row g-3 mb-3">
       <div class="col-12">
         <div class="card h-100">
           <div class="card-body">
             <h6 class="card-title"><i class="bi bi-clipboard-data"></i> Budget Performance (<span id="budgetReportPeriodLabel"></span>)</h6>
             <div class="row g-2 mb-3" id="budgetReportSummary"></div>
             <div id="budgetReportList"></div>
           </div>
         </div>
       </div>
     </div>

   And the matching CSS block (.budget-rep-*) appended to css/style.css.
   ========================================================================= */
(function () {
  function currentDashFiltersForBudgetReport() {
    return {
      year: document.getElementById('dashYear').value,
      month: document.getElementById('dashMonth').value,
      week: document.getElementById('dashWeek').value,
    };
  }

  // Actual spend for one category, honoring Year + Month + Week — the
  // Budget tab itself only filters by Year/Month, so this extends that
  // same idea to also respect the dashboard's Week filter when set.
  function categoryActualForPeriod(category, year, month, week) {
    return getTransactions()
      .filter(t => sameText(t.type, 'Expense') && sameText(t.category, category))
      .filter(t => String(deriveYear(t.date)) === String(year))
      .filter(t => month === 'All' || deriveMonthName(t.date) === month)
      .filter(t => week === 'All' || String(deriveWeekOfMonth(t.date)) === String(week))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }

  // Only categories that actually have a budget set (amount > 0). When
  // Month = "All", budgeted amounts for that category across every month
  // of the selected year are summed together.
  function budgetedRowsForPeriod(year, month) {
    return getBudget().filter(b =>
      String(b.year) === String(year) &&
      Number(b.amount) > 0 &&
      (month === 'All' || b.month === month));
  }

  function renderBudgetReport() {
    const { year, month, week } = currentDashFiltersForBudgetReport();
    document.getElementById('budgetReportPeriodLabel').textContent =
      `${month} ${year}${week !== 'All' ? ' • Week ' + week : ''}`;

    const rows = budgetedRowsForPeriod(year, month);
    const byCategory = {};
    rows.forEach(r => { byCategory[r.category] = (byCategory[r.category] || 0) + Number(r.amount || 0); });
    // ADDED: when a specific Week is selected (only possible once a specific
    // Month is also selected — see populateDashWeekOptions), the "budgeted"
    // figure shown is that week's even slice of the month's budget, not the
    // whole month's allowance. e.g. a 1,000 monthly budget in a 4-week month
    // becomes a 250 budget for each individual week.
    if (week !== 'All' && month !== 'All') {
      const weekCount = weeksInMonthCount(Number(year), month) || 1;
      Object.keys(byCategory).forEach(cat => { byCategory[cat] = byCategory[cat] / weekCount; });
    }
    const categories = Object.keys(byCategory);

    const summaryEl = document.getElementById('budgetReportSummary');
    const listEl = document.getElementById('budgetReportList');

    if (!categories.length) {
      summaryEl.innerHTML = '';
      listEl.innerHTML = '<p class="text-muted small mb-0">No budgeted categories for this period yet — set one in the Budget tab.</p>';
      return;
    }

    let totalBudgeted = 0, totalActual = 0;
    const items = categories.map(cat => {
      const budgeted = byCategory[cat];
      const actual = categoryActualForPeriod(cat, year, month, week);
      totalBudgeted += budgeted;
      totalActual += actual;
      const remaining = budgeted - actual;
      const used = budgeted > 0 ? actual / budgeted : 0;
      let status = 'ON TRACK', cls = 'badge-ok';
      if (remaining < 0) { status = 'OVER BUDGET'; cls = 'badge-over'; }
      else if (used >= 0.8) { status = 'WATCH'; cls = 'badge-watch'; }
      return { cat, budgeted, actual, remaining, used, status, cls };
    }).sort((a, b) => b.used - a.used);

    const totalRemaining = totalBudgeted - totalActual;

    summaryEl.innerHTML = `
      <div class="col-4">
        <div class="budget-rep-stat">
          <div class="budget-rep-stat-label">Budgeted</div>
          <div class="budget-rep-stat-value">${fmt(totalBudgeted)}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="budget-rep-stat">
          <div class="budget-rep-stat-label">Spent</div>
          <div class="budget-rep-stat-value ${totalRemaining < 0 ? 'text-danger' : ''}">${fmt(totalActual)}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="budget-rep-stat">
          <div class="budget-rep-stat-label">${totalRemaining < 0 ? 'Over by' : 'Remaining'}</div>
          <div class="budget-rep-stat-value ${totalRemaining < 0 ? 'text-danger' : 'text-success'}">${fmt(Math.abs(totalRemaining))}</div>
        </div>
      </div>`;

    listEl.innerHTML = items.map(it => `
      <div class="budget-rep-row">
        <div class="budget-rep-row-top">
          <span class="budget-rep-cat">${it.cat}</span>
          <span class="badge ${it.cls}">${it.status}</span>
        </div>
        <div class="progress" style="height:10px">
          <div class="progress-bar ${it.remaining < 0 ? '' : 'bg-success'}" style="width:${Math.min(it.used * 100, 100).toFixed(0)}%;${it.remaining < 0 ? 'background:var(--expense);' : ''}"></div>
        </div>
        <div class="budget-rep-row-bottom">
          <span>${fmt(it.actual)} of ${fmt(it.budgeted)}</span>
          <span class="${it.remaining < 0 ? 'text-danger' : ''}">${fmtPct(it.used)}</span>
        </div>
      </div>`).join('');
  }

  // Wrap (not replace) the current render.dashboard — at this point it's
  // already the version wrapped by the earlier "extra dashboard insights"
  // block, so both keep running in sequence on every render.
  const _origRenderDashboardForBudgetReport = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboardForBudgetReport();
    renderBudgetReport();
  };

  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', renderBudgetReport));

  renderBudgetReport();
})();

/* =========================================================================
   ADDED: "Today" stat card (dashboard) — shows today's income, expenses,
   and net cashflow, regardless of the dashboard's Year/Month/Week filter.
   Purely additive — does not modify a single existing line above.
   ========================================================================= */
(function () {
  function renderTodayCard() {
    const todayStr = toLocalISODate(new Date());
    const todaysTxns = getTransactions().filter(t => t.date === todayStr);
    const income = todaysTxns.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = todaysTxns.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const net = income - expense;

    const netEl = document.getElementById('statTodayNet');
    netEl.textContent = fmt(net);
    netEl.classList.toggle('positive', net >= 0);
    netEl.classList.toggle('negative', net < 0);

    document.getElementById('statTodayIncome').textContent = 'In ' + fmt(income);
    document.getElementById('statTodayExpense').textContent = 'Out ' + fmt(expense);
  }

  const _origRenderDashboardForToday = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboardForToday();
    renderTodayCard();
  };

  renderTodayCard();
})();

/* =========================================================================
   ADDED: sub-line text for Income / Expenses / Savings cards (entry counts,
   average per entry, and net amount) so they visually match the Today
   card. Reuses the same period-filter logic as the existing dashboard
   (dashYear/dashMonth/dashWeek), wraps render.dashboard again — does not
   modify a single existing line above.
   ========================================================================= */
(function () {
  function periodTxns(year, month, week) {
    return getTransactions().filter(t => {
      if (String(deriveYear(t.date)) !== String(year)) return false;
      if (month !== 'All' && deriveMonthName(t.date) !== month) return false;
      if (week !== 'All' && String(deriveWeekOfMonth(t.date)) !== String(week)) return false;
      return true;
    });
  }

  function renderStatSubs() {
    const year = document.getElementById('dashYear').value;
    const month = document.getElementById('dashMonth').value;
    const week = document.getElementById('dashWeek').value;
    const txns = periodTxns(year, month, week);

    const incomeTxns = txns.filter(t => t.type === 'Income');
    const expenseTxns = txns.filter(t => t.type === 'Expense');
    const income = incomeTxns.reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = expenseTxns.reduce((s, t) => s + Number(t.amount || 0), 0);
    const net = income - expense;

    document.getElementById('statIncomeSub').textContent =
      `${incomeTxns.length} entries · avg ${fmt(incomeTxns.length ? income / incomeTxns.length : 0)}`;
    document.getElementById('statExpenseSub').textContent =
      `${expenseTxns.length} entries · avg ${fmt(expenseTxns.length ? expense / expenseTxns.length : 0)}`;

    const savingsSub = document.getElementById('statSavingsSub');
    savingsSub.textContent = `Net ${fmt(net)}`;
    savingsSub.classList.toggle('positive', net >= 0);
    savingsSub.classList.toggle('negative', net < 0);
  }

  const _origRenderDashboardForSubs = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboardForSubs();
    renderStatSubs();
  };

  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', renderStatSubs));

  renderStatSubs();
})();

/* =========================================================================
   ADDED: dynamic period labels for Income/Expenses by Category cards, plus
   interactive category totals — clicking a legend entry (e.g. "Work") to
   hide/show its slice now also recalculates "Total: X" from only the
   currently-visible slices, and shows a strike-through on the clicked
   label (Chart.js draws this automatically once `hidden` is present on
   the generated label). Reuses chartCategory / chartIncomeCategory and the
   existing dashYear/dashMonth/dashWeek filters — wraps render.dashboard
   again and does not modify a single existing line, function, or comment
   anywhere above.

   Requires two small additive spans in index.html:
   <span id="incomeCatPeriodLabel"> and <span id="expenseCatPeriodLabel">
   placed right after "Income by Category" / "Expenses by Category".
   ========================================================================= */
(function () {
  function categoryPeriodLabel() {
    const year = document.getElementById('dashYear').value;
    const month = document.getElementById('dashMonth').value;
    const week = document.getElementById('dashWeek').value;
    if (month === 'All') return `(${year})`;
    return `(${month} ${year}${week !== 'All' ? ' | Week ' + week : ''})`;
  }

  function renderCategoryPeriodLabels() {
    const label = categoryPeriodLabel();
    const incEl = document.getElementById('incomeCatPeriodLabel');
    const expEl = document.getElementById('expenseCatPeriodLabel');
    if (incEl) incEl.textContent = label;
    if (expEl) expEl.textContent = label;
  }

  function updateCategoryChartTotal(chart, totalElId) {
    if (!chart) return;
    const ds = chart.data.datasets[0];
    let total = 0;
    chart.data.labels.forEach((_, i) => {
      if (chart.getDataVisibility(i)) total += Number(ds.data[i]) || 0;
    });
    const el = document.getElementById(totalElId);
    if (el) el.textContent = 'Total: ' + fmt(total);
  }

  function interactiveGenerateLabels(chart) {
    const ds = chart.data.datasets[0];
    return chart.data.labels.map((label, i) => ({
      text: `${label}: ${fmt(ds.data[i])}`,
      fillStyle: ds.backgroundColor[i],
      strokeStyle: ds.backgroundColor[i],
      hidden: !chart.getDataVisibility(i),
      index: i
    }));
  }

  function patchCategoryChart(chart, totalElId) {
    if (!chart) return;
    chart.options.plugins.legend.labels.generateLabels = interactiveGenerateLabels;
    chart.options.plugins.legend.onClick = function (e, legendItem, legend) {
      const ci = legend.chart;
      ci.toggleDataVisibility(legendItem.index);
      updateCategoryChartTotal(ci, totalElId);
      ci.update();
    };
    updateCategoryChartTotal(chart, totalElId);
    chart.update();
  }

  function renderCategoryExtras() {
    renderCategoryPeriodLabels();
    patchCategoryChart(chartCategory, 'totalExpenseCategory');
    patchCategoryChart(chartIncomeCategory, 'totalIncomeCategory');
  }

  const _origRenderDashboardForCategoryExtras = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboardForCategoryExtras();
    renderCategoryExtras();
  };

  // FIXED: filter changes now re-run renderCategoryExtras() (which patches
  // the freshly-recreated chartCategory / chartIncomeCategory instances
  // with the interactive legend + total-recalculation behavior), instead
  // of only renderCategoryPeriodLabels(). Previously, changing Year/Month/
  // Week destroyed and rebuilt both doughnut charts with Chart.js defaults
  // (see renderDashboard()'s `if (chartCategory) chartCategory.destroy();`
  // + `new Chart(...)` calls), which wiped out the click-to-toggle/total
  // behavior until the next full patch — this line restores it every time.
  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', renderCategoryExtras));

  renderCategoryExtras();
})();

/* =========================================================================
   ADDED: show DAYS (not weeks) in "Income vs Expenses by Month" and "Net
   Cashflow Trend" once a specific Week is selected on the dashboard.

   Purely additive — does not modify a single existing line, function, or
   comment anywhere above. Instead of touching chartMonthly / chartNetTrend
   directly (the latter lives inside another IIFE's private closure), this
   looks the live chart instances up via Chart.js's own Chart.getChart()
   registry (keyed by canvas element) and just updates their .data + calls
   .update() — so it never creates a second chart on the same canvas and
   never disturbs the existing chartMonthly variable that other code above
   still reads.

   When dashWeek === 'All' (or dashMonth === 'All') this block returns
   immediately and leaves the existing weekly/yearly charts exactly as the
   code above already renders them.
   ========================================================================= */
(function () {
  const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function daysInSelectedWeek(year, month, week) {
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) return [];
    const totalDays = daysInMonth(year, monthIndex);
    const startDay = (Number(week) - 1) * 7 + 1;
    const endDay = Math.min(startDay + 6, totalDays);
    const days = [];
    for (let d = startDay; d <= endDay; d++) {
      const dateObj = new Date(year, monthIndex, d);
      days.push({ iso: toLocalISODate(dateObj), label: WEEKDAY_ABBR[dateObj.getDay()] + ' ' + d });
    }
    return days;
  }

  function renderDailyBreakdown() {
    const year = Number(document.getElementById('dashYear').value);
    const month = document.getElementById('dashMonth').value;
    const week = document.getElementById('dashWeek').value;
    if (week === 'All' || month === 'All') return;

    const days = daysInSelectedWeek(year, month, week);
    if (!days.length) return;

    const labels = days.map(d => d.label);
    const txnsByDay = days.map(d => getTransactions().filter(t => t.date === d.iso));
    const incomeByDay = txnsByDay.map(list => list.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount || 0), 0));
    const expenseByDay = txnsByDay.map(list => list.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount || 0), 0));
    const netByDay = incomeByDay.map((inc, i) => inc - expenseByDay[i]);

    const monthlyTitleEl = document.getElementById('monthlyChartTitle');
    if (monthlyTitleEl) monthlyTitleEl.textContent = `Daily Income vs Expenses — Week ${week}, ${month} ${year}`;
    const monthlyChart = Chart.getChart(document.getElementById('chartMonthly'));
    if (monthlyChart) {
      monthlyChart.data.labels = labels;
      monthlyChart.data.datasets[0].data = incomeByDay;
      monthlyChart.data.datasets[1].data = expenseByDay;
      monthlyChart.update();
    }

    const netTrendYearLabelEl = document.getElementById('netTrendYearLabel');
    if (netTrendYearLabelEl) netTrendYearLabelEl.textContent = `Daily — Week ${week}, ${month} ${year}`;
    const netChart = Chart.getChart(document.getElementById('chartNetTrend'));
    if (netChart) {
      netChart.data.labels = labels;
      netChart.data.datasets[0].data = netByDay;
      netChart.data.datasets[0].pointBackgroundColor = netByDay.map(v => v < 0 ? '#bf4632' : '#1f6f57');
      netChart.update();
    }
  }

  const _origRenderDashboardForDaily = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboardForDaily();
    renderDailyBreakdown();
  };

  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', renderDailyBreakdown));

  renderDailyBreakdown();
})();

/* =========================================================================
   ADDED: Weekly / Monthly checkbox column for the Budget tab. A budget row
   checked here is a "Weekly" budget (recurring, meant to be spread across
   the weeks of its month — e.g. Food); left unchecked it's a "Monthly"
   budget (a whole-month amount that shouldn't be divided per week — e.g.
   Subscription, Gym Membership). This flag is read by the Budget
   Performance report on the dashboard to decide whether that category's
   budgeted amount gets divided across weeks when a specific Week is
   selected.

   Purely additive: it does not modify a single existing line, function, or
   comment above (including renderBudget itself). It wraps renderBudget the
   same way the earlier "ADDED: Payroll — Holiday and Incentive columns"
   block wraps renderPayroll, and it reuses the existing helper functions
   (getBudget, set, LS_KEYS). It relies on the new "Weekly" <th> placed
   right after the existing "Budget" <th> in the #budgetTable header in
   index.html.
   ========================================================================= */
function updateBudgetWeekly(id, checked) {
  const list = getBudget();
  const row = list.find(r => r.id === id);
  if (row) row.weekly = !!checked;
  set(LS_KEYS.budget, list);
  renderBudget();
}
(function () {
  function currentBudgetRowsForWeeklyColumn() {
    const year = Number(document.getElementById('budgetYear').value);
    const month = document.getElementById('budgetMonth').value;
    // renderBudget() (which already ran by the time this wrapper runs) has
    // already auto-created a row for every expense category for this
    // year/month, so filtering getBudget() here lines up 1-for-1, in the
    // same order, with the rows renderBudget() just drew into the table.
    return getBudget().filter(b => Number(b.year) === year && b.month === month);
  }

  function addBudgetWeeklyColumn() {
    const bodyRows = Array.from(document.querySelectorAll('#budgetTable tbody tr'));
    const dataRows = currentBudgetRowsForWeeklyColumn();
    bodyRows.forEach((tr, i) => {
      const r = dataRows[i];
      if (!r) return;
      // Guard against double-inserting if this ever runs twice on the same
      // row (e.g. re-render race): remove any previously-added cell first.
      tr.querySelectorAll('td[data-added="weekly"]').forEach(td => td.remove());
      const tds = tr.querySelectorAll('td');
      const budgetTd = tds[1]; // [Category, Budget input, Actual, Remaining, Used %, Status]
      if (!budgetTd) return;
      const weeklyTd = document.createElement('td');
      weeklyTd.dataset.added = 'weekly';
      weeklyTd.innerHTML = `<input type="checkbox" class="form-check-input" ${r.weekly ? 'checked' : ''} onchange="updateBudgetWeekly(${r.id}, this.checked)">`;
      budgetTd.after(weeklyTd);
    });
  }

  const _origRenderBudgetForWeeklyColumn = renderBudget;
  renderBudget = function () {
    _origRenderBudgetForWeeklyColumn();
    addBudgetWeeklyColumn();
  };
  render.budget = renderBudget;

  // FIXED-FOR-SAFETY: initBudgetFilters() bound its Year/Month 'change'
  // listeners directly to the ORIGINAL renderBudget function reference
  // before this wrapper existed, so those two listeners alone would still
  // call the unwrapped version and drop this column. Adding our own
  // listeners here (registered after theirs, so they fire after) keeps the
  // column present no matter which path triggers a re-render.
  ['budgetYear', 'budgetMonth'].forEach(id =>
    document.getElementById(id).addEventListener('change', addBudgetWeeklyColumn));
})();

/* =========================================================================
   ADDED: split the dashboard's Budget Performance report into "Weekly" and
   "Monthly" groups, based on each budget category's new Weekly checkbox
   (see the block above). Weekly-flagged categories keep the existing
   behavior of dividing their monthly budgeted amount across the weeks of
   the month once a specific Week is selected; Monthly-flagged categories
   (e.g. a subscription, a one-time monthly payment) always keep their full
   month's budgeted amount and full month's actual spend, regardless of
   which Week is selected on the dashboard, since a whole-month amount
   isn't meant to be spread across weeks.

   Purely additive — it does not modify a single existing line, function,
   or comment above, including the earlier "ADDED: Budget Performance
   report (dashboard)" block; it simply runs after it (by wrapping the
   render.dashboard function again) and overwrites #budgetReportSummary /
   #budgetReportList with the corrected, grouped output. It reuses the
   existing helper functions (getBudget, getTransactions, deriveYear,
   deriveMonthName, deriveWeekOfMonth, weeksInMonthCount, sameText, fmt,
   fmtPct) and the existing .budget-rep-* CSS classes, plus the new
   .budget-rep-group-title class.
   ========================================================================= */
(function () {
  function currentDashFiltersForBudgetSplit() {
    return {
      year: document.getElementById('dashYear').value,
      month: document.getElementById('dashMonth').value,
      week: document.getElementById('dashWeek').value,
    };
  }

  function categoryActualForPeriodSplit(category, year, month, week) {
    return getTransactions()
      .filter(t => sameText(t.type, 'Expense') && sameText(t.category, category))
      .filter(t => String(deriveYear(t.date)) === String(year))
      .filter(t => month === 'All' || deriveMonthName(t.date) === month)
      .filter(t => week === 'All' || String(deriveWeekOfMonth(t.date)) === String(week))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }

  function budgetedRowsForPeriodSplit(year, month) {
    return getBudget().filter(b =>
      String(b.year) === String(year) &&
      Number(b.amount) > 0 &&
      (month === 'All' || b.month === month));
  }

  function buildGroupItems(rows, year, month, week, weeklyFlag) {
    const byCategory = {};
    rows.filter(r => !!r.weekly === weeklyFlag).forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + Number(r.amount || 0);
    });
    // Only Weekly categories get divided across the weeks of the month once
    // a specific Week is picked — same trigger the original block used.
    if (weeklyFlag && week !== 'All' && month !== 'All') {
      const weekCount = weeksInMonthCount(Number(year), month) || 1;
      Object.keys(byCategory).forEach(cat => { byCategory[cat] = byCategory[cat] / weekCount; });
    }
    // Monthly categories ignore the Week filter entirely — their actual
    // spend is always the whole month's, matching their whole-month budget.
    const effectiveWeek = weeklyFlag ? week : 'All';
    return Object.keys(byCategory).map(cat => {
      const budgeted = byCategory[cat];
      const actual = categoryActualForPeriodSplit(cat, year, month, effectiveWeek);
      const remaining = budgeted - actual;
      const used = budgeted > 0 ? actual / budgeted : 0;
      let status = 'ON TRACK', cls = 'badge-ok';
      if (remaining < 0) { status = 'OVER BUDGET'; cls = 'badge-over'; }
      else if (used >= 0.8) { status = 'WATCH'; cls = 'badge-watch'; }
      return { cat, budgeted, actual, remaining, used, status, cls };
    }).sort((a, b) => b.used - a.used);
  }

  function renderGroupHtml(title, items) {
    if (!items.length) return '';
    const rowsHtml = items.map(it => `
      <div class="budget-rep-row">
        <div class="budget-rep-row-top">
          <span class="budget-rep-cat">${it.cat}</span>
          <span class="badge ${it.cls}">${it.status}</span>
        </div>
        <div class="progress" style="height:10px">
          <div class="progress-bar ${it.remaining < 0 ? '' : 'bg-success'}" style="width:${Math.min(it.used * 100, 100).toFixed(0)}%;${it.remaining < 0 ? 'background:var(--expense);' : ''}"></div>
        </div>
        <div class="budget-rep-row-bottom">
          <span>${fmt(it.actual)} of ${fmt(it.budgeted)}</span>
          <span class="${it.remaining < 0 ? 'text-danger' : ''}">${fmtPct(it.used)}</span>
        </div>
      </div>`).join('');
    return `<div class="budget-rep-group-title">${title}</div>${rowsHtml}`;
  }

  function renderBudgetReportSplit() {
    const { year, month, week } = currentDashFiltersForBudgetSplit();
    const listEl = document.getElementById('budgetReportList');
    const summaryEl = document.getElementById('budgetReportSummary');
    if (!listEl || !summaryEl) return;

    const rows = budgetedRowsForPeriodSplit(year, month);
    if (!rows.length) return; // leave the original "no budgeted categories yet" message as-is

    const weeklyItems = buildGroupItems(rows, year, month, week, true);
    const monthlyItems = buildGroupItems(rows, year, month, week, false);

    listEl.innerHTML = renderGroupHtml('Weekly', weeklyItems) + renderGroupHtml('Monthly', monthlyItems);

    let totalBudgeted = 0, totalActual = 0;
    [...weeklyItems, ...monthlyItems].forEach(it => { totalBudgeted += it.budgeted; totalActual += it.actual; });
    const totalRemaining = totalBudgeted - totalActual;
    summaryEl.innerHTML = `
      <div class="col-4">
        <div class="budget-rep-stat">
          <div class="budget-rep-stat-label">Budgeted</div>
          <div class="budget-rep-stat-value">${fmt(totalBudgeted)}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="budget-rep-stat">
          <div class="budget-rep-stat-label">Spent</div>
          <div class="budget-rep-stat-value ${totalRemaining < 0 ? 'text-danger' : ''}">${fmt(totalActual)}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="budget-rep-stat">
          <div class="budget-rep-stat-label">${totalRemaining < 0 ? 'Over by' : 'Remaining'}</div>
          <div class="budget-rep-stat-value ${totalRemaining < 0 ? 'text-danger' : 'text-success'}">${fmt(Math.abs(totalRemaining))}</div>
        </div>
      </div>`;
  }

  const _origRenderDashboardForBudgetSplit = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboardForBudgetSplit();
    renderBudgetReportSplit();
  };

  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', renderBudgetReportSplit));

  renderBudgetReportSplit();
})();

/* =========================================================================
   ADDED: pace indicator for Weekly categories, "days left" note for
   Monthly categories, and per-group (Weekly / Monthly) subtotal rows in
   the dashboard's Budget Performance report.

   - Weekly categories: when a specific Week is selected, shows "Day X of
     Y · used Z%" and flags "AHEAD OF PACE" if the % of the weekly budget
     already spent is running meaningfully ahead of how much of that week
     has elapsed (today's date vs. the week's date range) — a simple
     early-warning signal distinct from the OVER BUDGET / WATCH status.
   - Monthly categories: shows how many days are left in the selected
     month (using today's real date), since a whole-month budget like a
     subscription can look "fine" while actually being due soon.
   - Adds a small subtotal line (Budgeted / Spent) under each of the
     "Weekly" and "Monthly" headings, on top of the existing grand total.

   Purely additive — it does not modify a single existing line, function,
   or comment above, including the previous "ADDED: split the dashboard's
   Budget Performance report into Weekly and Monthly groups" block; it
   simply runs after it (by wrapping render.dashboard again) and
   overwrites #budgetReportList with the enhanced output. It reuses the
   existing helper functions/data (getBudget, getTransactions, deriveYear,
   deriveMonthName, deriveWeekOfMonth, weeksInMonthCount, daysInMonth,
   parseDate, toLocalISODate, MONTHS, sameText, fmt, fmtPct) and the
   existing .budget-rep-* CSS classes, plus the new ones above.
   ========================================================================= */
(function () {
  function currentDashFiltersForPaceBlock() {
    return {
      year: document.getElementById('dashYear').value,
      month: document.getElementById('dashMonth').value,
      week: document.getElementById('dashWeek').value,
    };
  }

  function categoryActualForPeriodPace(category, year, month, week) {
    return getTransactions()
      .filter(t => sameText(t.type, 'Expense') && sameText(t.category, category))
      .filter(t => String(deriveYear(t.date)) === String(year))
      .filter(t => month === 'All' || deriveMonthName(t.date) === month)
      .filter(t => week === 'All' || String(deriveWeekOfMonth(t.date)) === String(week))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }

  function budgetedRowsForPeriodPace(year, month) {
    return getBudget().filter(b =>
      String(b.year) === String(year) &&
      Number(b.amount) > 0 &&
      (month === 'All' || b.month === month));
  }

  function buildGroupItemsPace(rows, year, month, week, weeklyFlag) {
    const byCategory = {};
    rows.filter(r => !!r.weekly === weeklyFlag).forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + Number(r.amount || 0);
    });
    if (weeklyFlag && week !== 'All' && month !== 'All') {
      const weekCount = weeksInMonthCount(Number(year), month) || 1;
      Object.keys(byCategory).forEach(cat => { byCategory[cat] = byCategory[cat] / weekCount; });
    }
    const effectiveWeek = weeklyFlag ? week : 'All';
    return Object.keys(byCategory).map(cat => {
      const budgeted = byCategory[cat];
      const actual = categoryActualForPeriodPace(cat, year, month, effectiveWeek);
      const remaining = budgeted - actual;
      const used = budgeted > 0 ? actual / budgeted : 0;
      let status = 'ON TRACK', cls = 'badge-ok';
      if (remaining < 0) { status = 'OVER BUDGET'; cls = 'badge-over'; }
      else if (used >= 0.8) { status = 'WATCH'; cls = 'badge-watch'; }
      return { cat, budgeted, actual, remaining, used, status, cls };
    }).sort((a, b) => b.used - a.used);
  }

  // Date range (inclusive) covered by a given week-of-month, mirrors the
  // same math already used elsewhere for the daily breakdown.
  function selectedWeekRange(year, month, week) {
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) return null;
    const totalDays = daysInMonth(year, monthIndex);
    const startDay = (Number(week) - 1) * 7 + 1;
    const endDay = Math.min(startDay + 6, totalDays);
    return {
      start: new Date(year, monthIndex, startDay),
      end: new Date(year, monthIndex, endDay),
      totalDaysInWeek: endDay - startDay + 1,
    };
  }

  function weeklyPaceHtml(year, month, week) {
    if (week === 'All' || month === 'All') return '';
    const range = selectedWeekRange(Number(year), month, week);
    if (!range) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let elapsedDays;
    if (today < range.start) elapsedDays = 0;
    else if (today > range.end) elapsedDays = range.totalDaysInWeek;
    else elapsedDays = Math.floor((today - range.start) / 86400000) + 1;
    const paceRatio = range.totalDaysInWeek ? elapsedDays / range.totalDaysInWeek : 0;
    return { elapsedDays, totalDaysInWeek: range.totalDaysInWeek, paceRatio };
  }

  function renderGroupHtmlPace(title, items, paceInfo) {
    if (!items.length) return '';
    let totalBudgeted = 0, totalActual = 0;
    const rowsHtml = items.map(it => {
      totalBudgeted += it.budgeted;
      totalActual += it.actual;
      let paceHtml = '';
      if (paceInfo) {
        const aheadByMuch = it.used - paceInfo.paceRatio >= 0.15; // spent noticeably faster than week has elapsed
        const noteCls = aheadByMuch ? 'ahead' : 'ontrack';
        const noteText = aheadByMuch ? 'AHEAD OF PACE' : 'ON PACE';
        paceHtml = `<div class="budget-rep-pace">
          <span>Day ${paceInfo.elapsedDays} of ${paceInfo.totalDaysInWeek}</span>
          <span class="budget-rep-pace-note ${noteCls}">${noteText}</span>
        </div>`;
      }
      return `
      <div class="budget-rep-row">
        <div class="budget-rep-row-top">
          <span class="budget-rep-cat">${it.cat}</span>
          <span class="badge ${it.cls}">${it.status}</span>
        </div>
        <div class="progress" style="height:10px">
          <div class="progress-bar ${it.remaining < 0 ? '' : 'bg-success'}" style="width:${Math.min(it.used * 100, 100).toFixed(0)}%;${it.remaining < 0 ? 'background:var(--expense);' : ''}"></div>
        </div>
        <div class="budget-rep-row-bottom">
          <span>${fmt(it.actual)} of ${fmt(it.budgeted)}</span>
          <span class="${it.remaining < 0 ? 'text-danger' : ''}">${fmtPct(it.used)}</span>
        </div>
        ${paceHtml}
      </div>`;
    }).join('');
    const subtotalHtml = `<div class="budget-rep-subtotal"><span>${title} subtotal</span><span>${fmt(totalActual)} of ${fmt(totalBudgeted)}</span></div>`;
    return `<div class="budget-rep-group-title">${title}</div>${rowsHtml}${subtotalHtml}`;
  }

  function monthlyDaysLeftNote(year, month) {
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) return '';
    const today = new Date();
    if (Number(year) !== today.getFullYear() || monthIndex !== today.getMonth()) {
      const target = new Date(Number(year), monthIndex, 1);
      return target < today
        ? '<div class="budget-rep-monthly-note">Month ended</div>'
        : '<div class="budget-rep-monthly-note">Month hasn\'t started</div>';
    }
    const total = daysInMonth(today.getFullYear(), today.getMonth());
    const left = total - today.getDate();
    return `<div class="budget-rep-monthly-note">${left} day${left === 1 ? '' : 's'} left in ${month}</div>`;
  }

  function renderMonthlyGroupHtmlPace(title, items, year, month) {
    if (!items.length) return '';
    let totalBudgeted = 0, totalActual = 0;
    const daysLeftNote = (month !== 'All') ? monthlyDaysLeftNote(year, month) : '';
    const rowsHtml = items.map(it => {
      totalBudgeted += it.budgeted;
      totalActual += it.actual;
      return `
      <div class="budget-rep-row">
        <div class="budget-rep-row-top">
          <span class="budget-rep-cat">${it.cat}</span>
          <span class="badge ${it.cls}">${it.status}</span>
        </div>
        <div class="progress" style="height:10px">
          <div class="progress-bar ${it.remaining < 0 ? '' : 'bg-success'}" style="width:${Math.min(it.used * 100, 100).toFixed(0)}%;${it.remaining < 0 ? 'background:var(--expense);' : ''}"></div>
        </div>
        <div class="budget-rep-row-bottom">
          <span>${fmt(it.actual)} of ${fmt(it.budgeted)}</span>
          <span class="${it.remaining < 0 ? 'text-danger' : ''}">${fmtPct(it.used)}</span>
        </div>
        ${daysLeftNote}
      </div>`;
    }).join('');
    const subtotalHtml = `<div class="budget-rep-subtotal"><span>${title} subtotal</span><span>${fmt(totalActual)} of ${fmt(totalBudgeted)}</span></div>`;
    return `<div class="budget-rep-group-title">${title}</div>${rowsHtml}${subtotalHtml}`;
  }

  function renderBudgetReportPaceEnhanced() {
    const { year, month, week } = currentDashFiltersForPaceBlock();
    const listEl = document.getElementById('budgetReportList');
    if (!listEl) return;

    const rows = budgetedRowsForPeriodPace(year, month);
    if (!rows.length) return; // leave the existing "no budgeted categories yet" message as-is

    const weeklyItems = buildGroupItemsPace(rows, year, month, week, true);
    const monthlyItems = buildGroupItemsPace(rows, year, month, week, false);
    const paceInfo = weeklyPaceHtml(year, month, week);

    listEl.innerHTML =
      renderGroupHtmlPace('Weekly', weeklyItems, paceInfo) +
      renderMonthlyGroupHtmlPace('Monthly', monthlyItems, year, month);
    // Grand-total summary cards above the list are left exactly as the
    // earlier split block already computes and renders them.
  }

  const _origRenderDashboardForPaceBlock = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboardForPaceBlock();
    renderBudgetReportPaceEnhanced();
  };

  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', renderBudgetReportPaceEnhanced));

  renderBudgetReportPaceEnhanced();
})();

/* =========================================================================
   ADDED: redefine week-of-month numbering as CALENDAR weeks (Monday to
   Sunday) instead of fixed 7-day chunks from day 1. The first week of a
   month is whatever partial days come before the month's first Monday
   (e.g. August 2026 starts on a Wednesday, so Week 1 = Wed–Sun, Week 2 =
   Mon–Sun, ...); if a month starts on a Monday, Week 1 is a full Mon–Sun
   week. The last week is likewise whatever partial days remain after the
   month's last Monday (e.g. September 2026's last week = Mon–Wed).

   This reassigns the existing deriveWeekOfMonth() and weeksInMonthCount()
   function bindings declared above — the same technique already used
   elsewhere in this file (see the renderPayroll / renderBudget wraps).
   Every other piece of code calls these two functions by name at run
   time, so reassigning them here transparently fixes week numbering
   everywhere they're already used (dashboard Year/Month/Week filters and
   dropdown, transaction filtering by week, the Budget Performance
   report's weekly-budget division, the stat sub-lines, etc.) without
   editing a single one of those call sites. It does not modify a single
   existing line, function, or comment above.
   ========================================================================= */
deriveWeekOfMonth = function (dateStr) {
  const d = parseDate(dateStr); if (!d) return '';
  const day = d.getDate();
  let week = 1;
  for (let dd = 2; dd <= day; dd++) {
    if (new Date(d.getFullYear(), d.getMonth(), dd).getDay() === 1) week++;
  }
  return week;
};

weeksInMonthCount = function (year, monthName) {
  const monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex === -1) return 0;
  const total = daysInMonth(year, monthIndex);
  let week = 1;
  for (let dd = 2; dd <= total; dd++) {
    if (new Date(year, monthIndex, dd).getDay() === 1) week++;
  }
  return week;
};

// Returns the actual start/end Date (inclusive) covered by a given
// week-of-month number, under the calendar-week scheme above. Used by the
// two blocks below to correct anything that still assumed fixed 7-day
// weeks for display purposes.
function calendarWeekRange(year, monthName, week) {
  const monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex === -1) return null;
  const total = daysInMonth(year, monthIndex);
  let start = null, end = null;
  for (let dd = 1; dd <= total; dd++) {
    if (deriveWeekOfMonth(toLocalISODate(new Date(year, monthIndex, dd))) === Number(week)) {
      if (start === null) start = dd;
      end = dd;
    }
  }
  if (start === null) return null;
  return {
    start: new Date(year, monthIndex, start),
    end: new Date(year, monthIndex, end),
    totalDaysInWeek: end - start + 1,
  };
}

/* =========================================================================
   ADDED: correct the "daily" breakdown drawn by the earlier "ADDED: show
   DAYS (not weeks)..." block so its date range matches the new calendar
   week definition above, instead of that block's own fixed 7-day-chunk
   math. This does not edit that block — it re-reads the live chart
   instances via Chart.getChart() (same technique that block already
   uses) after render.dashboard finishes, and overwrites their labels/data
   with the corrected calendar-week range. Purely additive.
   ========================================================================= */
(function () {
  const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function correctedDaysInSelectedWeek(year, month, week) {
    const range = calendarWeekRange(year, month, week);
    if (!range) return [];
    const days = [];
    for (let dt = new Date(range.start); dt <= range.end; dt.setDate(dt.getDate() + 1)) {
      days.push({ iso: toLocalISODate(dt), label: WEEKDAY_ABBR[dt.getDay()] + ' ' + dt.getDate() });
    }
    return days;
  }

  function fixDailyCharts() {
    const year = Number(document.getElementById('dashYear').value);
    const month = document.getElementById('dashMonth').value;
    const week = document.getElementById('dashWeek').value;
    if (week === 'All' || month === 'All') return;

    const days = correctedDaysInSelectedWeek(year, month, week);
    if (!days.length) return;

    const labels = days.map(d => d.label);
    const txnsByDay = days.map(d => getTransactions().filter(t => t.date === d.iso));
    const incomeByDay = txnsByDay.map(list => list.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount || 0), 0));
    const expenseByDay = txnsByDay.map(list => list.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount || 0), 0));
    const netByDay = incomeByDay.map((inc, i) => inc - expenseByDay[i]);

    const monthlyChart = Chart.getChart(document.getElementById('chartMonthly'));
    if (monthlyChart) {
      monthlyChart.data.labels = labels;
      monthlyChart.data.datasets[0].data = incomeByDay;
      monthlyChart.data.datasets[1].data = expenseByDay;
      monthlyChart.update();
    }

    const netChart = Chart.getChart(document.getElementById('chartNetTrend'));
    if (netChart) {
      netChart.data.labels = labels;
      netChart.data.datasets[0].data = netByDay;
      netChart.data.datasets[0].pointBackgroundColor = netByDay.map(v => v < 0 ? '#bf4632' : '#1f6f57');
      netChart.update();
    }
  }

  const _origRenderDashboardForCalendarWeekCharts = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboardForCalendarWeekCharts();
    fixDailyCharts();
  };

  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', fixDailyCharts));

  fixDailyCharts();
})();

/* =========================================================================
   ADDED: correct the Budget Performance report's weekly pace indicator
   ("Day X of Y" + AHEAD OF PACE / ON PACE) so it uses the new calendar
   week range above, instead of the earlier pace block's own fixed
   7-day-chunk math. Runs after render.dashboard (which already includes
   the pace block) and rewrites just the pace line's text/class in the
   DOM — it does not edit the pace block itself. Purely additive.
   ========================================================================= */
(function () {
  function fixPaceIndicator() {
    const year = Number(document.getElementById('dashYear').value);
    const month = document.getElementById('dashMonth').value;
    const week = document.getElementById('dashWeek').value;
    const paceEls = document.querySelectorAll('#budgetReportList .budget-rep-pace');
    if (!paceEls.length) return;
    if (week === 'All' || month === 'All') return;

    const range = calendarWeekRange(year, month, week);
    if (!range) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let elapsedDays;
    if (today < range.start) elapsedDays = 0;
    else if (today > range.end) elapsedDays = range.totalDaysInWeek;
    else elapsedDays = Math.floor((today - range.start) / 86400000) + 1;
    const paceRatio = range.totalDaysInWeek ? elapsedDays / range.totalDaysInWeek : 0;

    paceEls.forEach(el => {
      const dayLabelEl = el.querySelector('span:first-child');
      const noteEl = el.querySelector('.budget-rep-pace-note');
      if (dayLabelEl) dayLabelEl.textContent = `Day ${elapsedDays} of ${range.totalDaysInWeek}`;
      if (!noteEl) return;
      const row = el.closest('.budget-rep-row');
      const pctEl = row ? row.querySelector('.budget-rep-row-bottom span:last-child') : null;
      const usedPct = pctEl ? parseFloat(pctEl.textContent) / 100 : 0;
      const aheadByMuch = usedPct - paceRatio >= 0.15;
      noteEl.textContent = aheadByMuch ? 'AHEAD OF PACE' : 'ON PACE';
      noteEl.classList.toggle('ahead', aheadByMuch);
      noteEl.classList.toggle('ontrack', !aheadByMuch);
    });
  }

  const _origRenderDashboardForPaceFix = render.dashboard;
  render.dashboard = function () {
    _origRenderDashboardForPaceFix();
    fixPaceIndicator();
  };

  ['dashYear', 'dashMonth', 'dashWeek'].forEach(id =>
    document.getElementById(id).addEventListener('change', fixPaceIndicator));

  fixPaceIndicator();
})();
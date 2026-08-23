index:
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Charles' Money Tracker</title>
  <link rel="icon" href="data:,">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="css/style.css" rel="stylesheet">
  <link rel="icon" type="image/png" href="css/images/logo.png">
</head>

<body>

  <!-- Top navbar -->
  <nav class="navbar navbar-dark sticky-top app-navbar">
    <div class="container-fluid d-flex justify-content-between align-items-center">
      <span class="navbar-brand mb-0 h1">
        <i class="bi bi-wallet2"></i>
        <span>
          <span class="brand-eyebrow">Charles' Ledger</span>
          Money Tracker
        </span>
      </span>
      <span class="text-white-50 small" id="currencyLabel"></span>
    </div>
  </nav>

  <div class="container-fluid pb-5" style="max-width:1100px;">

    <!-- ===================== DASHBOARD ===================== -->
    <section id="page-dashboard" class="page-section">

      <!-- Passbook hero summary -->
      <div class="passbook-hero">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <span class="ph-eyebrow">Net cashflow</span>
            <div class="ph-net" id="statNet">0</div>
          </div>
          <button type="button" class="chip-btn" data-bs-toggle="modal" data-bs-target="#dashFilterModal"
            style="background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.35); color:#fff;">
            <i class="bi bi-sliders" style="color:#fff;"></i>
            <span id="dashPeriodLabel">Loading…</span>
          </button>
        </div>
        <div class="ph-stitch"></div>
        <div class="ph-row">
          <div class="ph-item"><span class="ph-dot" style="background:#8fe0b8;"></span>Track income, expenses &amp;
            savings below</div>
        </div>
      </div>

      <div class="row g-2 my-3">
        <div class="col-4">
          <div class="card stat-card stat-income h-100">
            <div class="card-body">
              <div class="stat-icon"><i class="bi bi-arrow-down-left"></i></div>
              <div class="stat-label">Income</div>
              <div class="stat-value" id="statIncome">0</div>
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="card stat-card stat-expense h-100">
            <div class="card-body">
              <div class="stat-icon"><i class="bi bi-arrow-up-right"></i></div>
              <div class="stat-label">Expenses</div>
              <div class="stat-value" id="statExpense">0</div>
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="card stat-card stat-savings h-100">
            <div class="card-body">
              <div class="stat-icon"><i class="bi bi-piggy-bank"></i></div>
              <div class="stat-label">Savings</div>
              <div class="stat-value" id="statSavings">0%</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-body">
          <h6 class="card-title"><i class="bi bi-bank2"></i> Accounts</h6>
          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0" id="dashAccountsTable">
              <thead>
                <tr>
                  <th>Account</th>
                  <th class="text-end">Balance</th>
                  <th>Goal</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-clipboard-data"></i> Budget Performance (<span
                  id="budgetReportPeriodLabel"></span>)</h6>
              <div class="row g-2 mb-3" id="budgetReportSummary"></div>
              <div id="budgetReportList"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-bar-chart-line"></i> Income vs Expenses by Month</h6>
              <canvas id="chartMonthly" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-pie-chart-fill"></i> Income by Category</h6>
              <canvas id="chartIncomeCategory" height="200"></canvas>
              <div class="text-end fw-semibold mt-2" id="totalIncomeCategory">Total: 0</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-pie-chart"></i> Expenses by Category</h6>
              <canvas id="chartCategory" height="200"></canvas>
              <div class="text-end fw-semibold mt-2" id="totalExpenseCategory">Total: 0</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-graph-up-arrow"></i> Net Cashflow Trend (<span
                  id="netTrendYearLabel"></span>)</h6>
              <canvas id="chartNetTrend" height="180"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-trophy"></i> Top Spending Categories</h6>
              <div id="topCategoriesList"></div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-bank2"></i> Account Balance Distribution</h6>
              <canvas id="chartAccountDistribution" height="200"></canvas>
              <div class="text-end fw-semibold mt-2" id="totalAccountBalance">Total: 0</div>
            </div>
          </div>
        </div>
      </div>
      <!-- ===== END ADDED ===== -->
    </section>

    <!-- Dashboard filter modal -->
    <div class="modal fade" id="dashFilterModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-sliders"></i> Dashboard period</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="modal-lead">Choose the year, month, and week you want the dashboard to summarize.</p>
            <div class="row g-2">
              <div class="col-4">
                <label class="form-label small mb-0">Year</label>
                <select id="dashYear" class="form-select form-select-sm"></select>
              </div>
              <div class="col-4">
                <label class="form-label small mb-0">Month</label>
                <select id="dashMonth" class="form-select form-select-sm"></select>
              </div>
              <div class="col-4">
                <label class="form-label small mb-0">Week</label>
                <select id="dashWeek" class="form-select form-select-sm"></select>
              </div>
            </div>
          </div>
          <!-- <div class="modal-footer">
            <button class="btn btn-primary w-100" data-bs-dismiss="modal">Apply</button>
          </div> -->
        </div>
      </div>
    </div>

    <!-- ===================== TRANSACTIONS ===================== -->
    <section id="page-transactions" class="page-section d-none">
      <div class="section-toolbar">
        <h6 class="section-heading me-auto"><span class="icon-badge"><i class="bi bi-list-ul"></i></span> Entries</h6>
        <button type="button" class="chip-btn" data-bs-toggle="modal" data-bs-target="#txnFilterModal">
          <i class="bi bi-sliders"></i> Filter
        </button>
        <button class="btn btn-primary btn-sm" onclick="openTxnModal()"><i class="bi bi-plus-lg"></i> Add
          Transaction</button>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm table-hover align-middle mb-0" id="txnTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Account</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th class="text-end">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
      <nav>
        <ul class="pagination pagination-sm justify-content-center mt-3" id="txnPagination"></ul>
      </nav>
    </section>

    <!-- Transactions filter modal -->
    <div class="modal fade" id="txnFilterModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-sliders"></i> Filter entries</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label small mb-0">Year</label>
                <select id="txnFilterYear" class="form-select form-select-sm"></select>
              </div>
              <div class="col-6">
                <label class="form-label small mb-0">Month</label>
                <select id="txnFilterMonth" class="form-select form-select-sm"></select>
              </div>
              <div class="col-12">
                <label class="form-label small mb-0">Search</label>
                <input id="txnSearch" class="form-control form-control-sm"
                  placeholder="type, account, category, subcategory, description...">
              </div>
            </div>
          </div>
          <!-- <div class="modal-footer">
            <button class="btn btn-primary w-100" data-bs-dismiss="modal">Apply</button>
          </div> -->
        </div>
      </div>
    </div>

    <!-- ===================== TRANSFERS ===================== -->
    <section id="page-transfers" class="page-section d-none">
      <div class="section-toolbar">
        <h6 class="section-heading me-auto"><span class="icon-badge"><i class="bi bi-arrow-left-right"></i></span>
          Transfer &amp; Cashflow History</h6>
        <button type="button" class="chip-btn" data-bs-toggle="modal" data-bs-target="#transferFilterModal">
          <i class="bi bi-sliders"></i> Filter
        </button>
        <button class="btn btn-primary btn-sm" onclick="openTransferModal()"><i class="bi bi-plus-lg"></i> Add
          Transfer</button>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm table-hover align-middle mb-0" id="transferTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th class="text-end">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Transfers filter modal -->
    <div class="modal fade" id="transferFilterModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-sliders"></i> Filter transfers</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label small mb-0">Year</label>
                <select id="transferFilterYear" class="form-select form-select-sm"></select>
              </div>
              <div class="col-6">
                <label class="form-label small mb-0">Month</label>
                <select id="transferFilterMonth" class="form-select form-select-sm"></select>
              </div>
            </div>
          </div>
          <!-- <div class="modal-footer">
            <button class="btn btn-primary w-100" data-bs-dismiss="modal">Apply</button>
          </div> -->
        </div>
      </div>
    </div>

    <!-- ===================== BUDGET ===================== -->
    <section id="page-budget" class="page-section d-none">
      <div class="section-toolbar">
        <h6 class="section-heading me-auto"><span class="icon-badge"><i class="bi bi-pie-chart"></i></span> Budget</h6>
        <button type="button" class="chip-btn" data-bs-toggle="modal" data-bs-target="#budgetFilterModal">
          <i class="bi bi-sliders"></i> Period
        </button>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0" id="budgetTable">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style="width:110px">Budget</th>
                  <th class="text-end">Actual</th>
                  <th class="text-end">Remaining</th>
                  <th class="text-end">Used %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Budget filter modal -->
    <div class="modal fade" id="budgetFilterModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-sliders"></i> Budget period</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label small mb-0">Year</label>
                <select id="budgetYear" class="form-select form-select-sm"></select>
              </div>
              <div class="col-6">
                <label class="form-label small mb-0">Month</label>
                <select id="budgetMonth" class="form-select form-select-sm"></select>
              </div>
            </div>
          </div>
          <!-- <div class="modal-footer">
            <button class="btn btn-primary w-100" data-bs-dismiss="modal">Apply</button>
          </div> -->
        </div>
      </div>
    </div>

    <!-- ===================== ACCOUNTS & GOALS ===================== -->
    <section id="page-accounts" class="page-section d-none">
      <div class="section-toolbar">
        <h6 class="section-heading me-auto"><span class="icon-badge"><i class="bi bi-bank"></i></span> Accounts,
          Balances &amp; Goals</h6>
        <button class="btn btn-primary btn-sm" onclick="openAccountModal()"><i class="bi bi-plus-lg"></i> Add
          Account</button>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0" id="accountsTable">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Purpose</th>
                  <th class="text-end">Opening</th>
                  <th class="text-end">Current Balance</th>
                  <th>Goal</th>
                  <th style="width:140px">Progress</th>
                  <th></th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== PAYROLL ===================== -->
    <section id="page-payroll" class="page-section d-none">
      <div class="section-toolbar">
        <h6 class="section-heading me-auto"><span class="icon-badge"><i class="bi bi-cash-stack"></i></span> Payroll
          Schedule &amp; Workdays</h6>
        <button class="btn btn-primary btn-sm" onclick="openPayrollModal()"><i class="bi bi-plus-lg"></i> Add Pay
          Date</button>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0" id="payrollTable">
              <thead>
                <tr>
                  <th>Pay Date</th>
                  <th>Half</th>
                  <th>Exp. Workdays</th>
                  <th>Actual Workdays</th>
                  <th class="text-end">Expected Salary</th>
                  <th class="text-end">Holiday</th>
                  <th class="text-end">Incentive</th>
                  <th class="text-end">Actual (from entries)</th>
                  <th class="text-end">Variance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== ATOME ===================== -->
    <section id="page-atome" class="page-section d-none">
      <div class="section-toolbar">
        <h6 class="section-heading me-auto"><span class="icon-badge"><i class="bi bi-credit-card"></i></span> Atome
          Credit Card</h6>
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6 col-md-3">
          <div class="card h-100">
            <div class="card-body">
              <span class="atome-card-icon mb-2 d-inline-flex"><i class="bi bi-shield-check"></i></span>
              <div class="stat-label">Credit Limit</div>
              <div class="stat-value" id="atomeLimit">0</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100">
            <div class="card-body">
              <span class="atome-card-icon mb-2 d-inline-flex"><i class="bi bi-receipt"></i></span>
              <div class="stat-label">Outstanding</div>
              <div class="stat-value" id="atomeOutstanding">0</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100">
            <div class="card-body">
              <span class="atome-card-icon mb-2 d-inline-flex"><i class="bi bi-wallet2"></i></span>
              <div class="stat-label">Available Credit</div>
              <div class="stat-value" id="atomeAvailable">0</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100">
            <div class="card-body">
              <span class="atome-card-icon mb-2 d-inline-flex"><i class="bi bi-speedometer2"></i></span>
              <div class="stat-label">Utilization</div>
              <div class="stat-value" id="atomeUtilization">0%</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0" id="atomeTable">
              <thead>
                <tr>
                  <th>Statement Date</th>
                  <th>Due Date</th>
                  <th class="text-end">Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== SETTINGS ===================== -->
    <section id="page-settings" class="page-section d-none">
      <div class="section-toolbar">
        <h6 class="section-heading me-auto"><span class="icon-badge"><i class="bi bi-gear"></i></span> Settings</h6>
      </div>

      <button type="button" class="menu-row" data-bs-toggle="modal" data-bs-target="#backupModal">
        <span class="menu-icon"><i class="bi bi-cloud-arrow-up"></i></span>
        <span class="menu-text">
          <span class="menu-title d-block">Backup &amp; Sync</span>
          <span class="menu-sub">Export or import a backup file between devices</span>
        </span>
        <i class="bi bi-chevron-right"></i>
      </button>

      <button type="button" class="menu-row" data-bs-toggle="modal" data-bs-target="#generalSettingsModal">
        <span class="menu-icon"><i class="bi bi-sliders2"></i></span>
        <span class="menu-text">
          <span class="menu-title d-block">General</span>
          <span class="menu-sub">Currency and Atome statement/due days</span>
        </span>
        <i class="bi bi-chevron-right"></i>
      </button>

      <button type="button" class="menu-row" data-bs-toggle="modal" data-bs-target="#dropdownModal">
        <span class="menu-icon"><i class="bi bi-list-check"></i></span>
        <span class="menu-text">
          <span class="menu-title d-block">Dropdown Lists</span>
          <span class="menu-sub">Edit the choices used in Add/Edit forms</span>
        </span>
        <i class="bi bi-chevron-right"></i>
      </button>

      <button type="button" class="menu-row danger" data-bs-toggle="modal" data-bs-target="#dangerModal">
        <span class="menu-icon"><i class="bi bi-exclamation-triangle"></i></span>
        <span class="menu-text">
          <span class="menu-title d-block">Danger Zone</span>
          <span class="menu-sub">Reset to seed data or erase everything</span>
        </span>
        <i class="bi bi-chevron-right"></i>
      </button>
    </section>

    <!-- Backup modal -->
    <div class="modal fade" id="backupModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-cloud-arrow-up"></i> Backup &amp; Sync</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="modal-lead">Your data lives in this browser only. Export a backup file and import it on your
              other device to keep them in sync.</p>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-outline-primary btn-sm" onclick="exportBackup()"><i class="bi bi-download"></i>
                Export backup (.json)</button>
              <label class="btn btn-outline-secondary btn-sm mb-0">
                <i class="bi bi-upload"></i> Import backup
                <input type="file" accept=".json" class="d-none" onchange="importBackup(event)">
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- General settings modal -->
    <div class="modal fade" id="generalSettingsModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-sliders2"></i> General</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label small mb-0">Currency</label>
                <input id="settingCurrency" class="form-control form-control-sm">
              </div>
              <div class="col-6">
                <label class="form-label small mb-0">Atome statement day</label>
                <input id="settingAtomeStmt" type="number" min="1" max="28" class="form-control form-control-sm">
              </div>
              <div class="col-6">
                <label class="form-label small mb-0">Atome due day</label>
                <input id="settingAtomeDue" type="number" min="1" max="28" class="form-control form-control-sm">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary w-100" onclick="saveGeneralSettings()">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dropdown lists modal -->
    <div class="modal fade" id="dropdownModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-list-check"></i> Dropdown Lists</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="modal-lead mb-2">One item per line. These populate the choices in the Add/Edit forms.</p>
            <div class="row g-3" id="dropdownEditors"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary w-100" onclick="saveDropdowns()">Save lists</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger zone modal -->
    <div class="modal fade" id="dangerModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-exclamation-triangle"></i> Danger Zone</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="modal-lead">These actions cannot be undone. Make sure you have a backup exported first.</p>
            <div class="d-grid gap-2">
              <button class="btn btn-outline-danger btn-sm" onclick="resetToSeed()">Reset app to original imported
                data</button>
              <button class="btn btn-outline-danger btn-sm" onclick="wipeAll()">Erase all data</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- Bottom nav (mobile-friendly, works on desktop too) -->
  <nav class="navbar fixed-bottom bottom-nav">
    <div class="container-fluid px-0">
      <div class="btn-group w-100" role="group">
        <button class="btn nav-btn active" data-page="dashboard"><i
            class="bi bi-speedometer2"></i><span>Dashboard</span></button>
        <button class="btn nav-btn" data-page="transactions"><i class="bi bi-list-ul"></i><span>Entries</span></button>
        <button class="btn nav-btn" data-page="transfers"><i
            class="bi bi-arrow-left-right"></i><span>Transfers</span></button>
        <button class="btn nav-btn" data-page="budget"><i class="bi bi-pie-chart"></i><span>Budget</span></button>
        <button class="btn nav-btn" data-page="accounts"><i class="bi bi-bank"></i><span>Accounts</span></button>
        <button class="btn nav-btn" data-page="payroll"><i class="bi bi-cash-stack"></i><span>Payroll</span></button>
        <button class="btn nav-btn" data-page="atome"><i class="bi bi-credit-card"></i><span>Atome</span></button>
        <button class="btn nav-btn" data-page="settings"><i class="bi bi-gear"></i><span>Settings</span></button>
      </div>
    </div>
  </nav>

  <!-- ===================== MODALS (record editors) ===================== -->

  <!-- Transaction modal -->
  <div class="modal fade" id="txnModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-receipt-cutoff"></i> Transaction</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="txnId">
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label small mb-0">Date</label>
              <input type="date" id="txnDate" class="form-control">
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Type</label>
              <select id="txnType" class="form-select" onchange="onTxnTypeChange()">
                <option>Expense</option>
                <option>Income</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Account</label>
              <select id="txnAccount" class="form-select"></select>
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Category</label>
              <select id="txnCategory" class="form-select"></select>
            </div>
            <div class="col-6" id="txnSubcatWrap">
              <label class="form-label small mb-0">Subcategory</label>
              <select id="txnSubcategory" class="form-select"></select>
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Amount</label>
              <input type="number" step="0.01" id="txnAmount" class="form-control">
            </div>
            <div class="col-12">
              <label class="form-label small mb-0">Description</label>
              <input id="txnDescription" class="form-control">
            </div>
            <div class="col-12">
              <label class="form-label small mb-0">Note</label>
              <input id="txnNote" class="form-control">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-danger me-auto d-none" id="txnDeleteBtn" onclick="deleteTxnFromModal()"><i
              class="bi bi-trash"></i> Delete</button>
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" onclick="saveTxnFromModal()">Save</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Transfer modal -->
  <div class="modal fade" id="transferModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-arrow-left-right"></i> Transfer</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="trfId">
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label small mb-0">Date</label>
              <input type="date" id="trfDate" class="form-control">
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Transfer Type</label>
              <select id="trfType" class="form-select"></select>
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">From Account</label>
              <select id="trfFrom" class="form-select"></select>
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">To Account</label>
              <select id="trfTo" class="form-select"></select>
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Amount</label>
              <input type="number" step="0.01" id="trfAmount" class="form-control">
            </div>
            <div class="col-12">
              <label class="form-label small mb-0">Note</label>
              <input id="trfNote" class="form-control">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-danger me-auto d-none" id="trfDeleteBtn" onclick="deleteTransferFromModal()"><i
              class="bi bi-trash"></i> Delete</button>
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" onclick="saveTransferFromModal()">Save</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Account modal -->
  <div class="modal fade" id="accountModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-bank"></i> Account</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="acctId">
          <div class="row g-2">
            <div class="col-12">
              <label class="form-label small mb-0">Account name</label>
              <input id="acctName" class="form-control">
            </div>
            <div class="col-12">
              <label class="form-label small mb-0">Purpose</label>
              <input id="acctPurpose" class="form-control">
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Opening balance</label>
              <input type="number" step="0.01" id="acctOpening" class="form-control">
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Goal (optional)</label>
              <input type="number" step="0.01" id="acctGoal" class="form-control">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-danger me-auto d-none" id="acctDeleteBtn" onclick="deleteAccountFromModal()"><i
              class="bi bi-trash"></i> Delete</button>
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" onclick="saveAccountFromModal()">Save</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Payroll modal -->
  <div class="modal fade" id="payrollModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-cash-stack"></i> Pay Date</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="prlId">
          <div class="row g-2">
            <div class="col-12">
              <label class="form-label small mb-0">Pay date</label>
              <input type="date" id="prlDate" class="form-control">
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Expected workdays</label>
              <input type="number" step="0.5" id="prlExpectedDays" class="form-control">
            </div>
            <div class="col-6">
              <label class="form-label small mb-0">Actual workdays</label>
              <input type="number" step="0.5" id="prlActualDays" class="form-control">
            </div>
            <div class="col-12">
              <label class="form-label small mb-0">Expected regular salary</label>
              <input type="number" step="0.01" id="prlExpectedSalary" class="form-control">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-danger me-auto d-none" id="prlDeleteBtn" onclick="deletePayrollFromModal()"><i
              class="bi bi-trash"></i> Delete</button>
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" onclick="savePayrollFromModal()">Save</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Generic confirm modal (replaces window.confirm everywhere) -->
  <div class="modal fade" id="confirmModal" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-question-circle"></i> Please confirm</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <p class="modal-lead mb-0" id="confirmModalBody"></p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-danger" id="confirmModalActionBtn">Confirm</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast (replaces window.alert everywhere) -->
  <div class="toast-container position-fixed bottom-0 end-0 p-3" style="margin-bottom:70px;">
    <div id="appToast" class="toast text-bg-primary" role="alert">
      <div class="d-flex">
        <div class="toast-body" id="appToastBody"></div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
  <script src="js/seed-data.js"></script>
  <script src="js/app.js"></script>
</body>

</html>

style.css:
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');

/* =========================================================================
   DESIGN TOKENS — "Passbook" theme: a warm paper ledger reimagined as an app
   ========================================================================= */
:root {
  /* surfaces */
  --bg: #f1ead9;
  --bg-pattern: #e9dfc8;
  --surface: #fffdf9;
  --surface-2: #f6efe1;
  --line: #ddd0ac;
  --line-soft: #e8ddc0;

  /* ink */
  --ink: #1c2621;
  --ink-soft: #445048;
  --muted: #7a7263;

  /* brand */
  --brand: #1f6f57;
  --brand-dark: #123c30;
  --brand-light: #dff0e7;
  --accent: #cf8a34;
  --accent-dark: #96601c;
  --accent-light: #faead0;

  /* semantic */
  --income: #2f8f5e;
  --income-bg: #e3f3e9;
  --expense: #bf4632;
  --expense-bg: #fbe7e1;
  --watch: #a3752f;
  --watch-bg: #fbf0da;
  --info: #3f6fa8;
  --info-bg: #e7eff8;

  /* elevation */
  --shadow-sm: 0 1px 2px rgba(28, 38, 33, .06), 0 1px 1px rgba(28, 38, 33, .04);
  --shadow-md: 0 6px 18px -6px rgba(28, 38, 33, .18), 0 2px 6px rgba(28, 38, 33, .06);
  --shadow-lg: 0 16px 40px -12px rgba(18, 60, 48, .28);

  /* radii */
  --r-sm: 10px;
  --r-md: 16px;
  --r-lg: 22px;
  --r-pill: 999px;

  /* type */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background:
    radial-gradient(circle at 1px 1px, var(--bg-pattern) 1px, transparent 0) 0 0/22px 22px,
    var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  padding-bottom: 92px;
  -webkit-font-smoothing: antialiased;
}

::selection {
  background: var(--brand);
  color: #fff;
}

a {
  color: var(--brand);
}

/* focus visibility */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* =========================================================================
   TOP BAR
   ========================================================================= */
.app-navbar {
  background: linear-gradient(135deg, var(--brand-dark), var(--brand) 130%);
  padding: 14px 0 16px;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.app-navbar::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 10px;
  background-image: radial-gradient(circle at 10px 0, transparent 9px, var(--bg) 10px);
  background-size: 20px 10px;
  background-repeat: repeat-x;
}

.app-navbar .navbar-brand {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.3rem;
  letter-spacing: .01em;
  display: flex;
  align-items: center;
  gap: .5rem;
}

.app-navbar .navbar-brand i {
  background: rgba(255, 255, 255, .14);
  border: 1px solid rgba(255, 255, 255, .22);
  width: 38px;
  height: 38px;
  border-radius: var(--r-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
}

.app-navbar .brand-eyebrow {
  display: block;
  font-size: .64rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .62);
  font-weight: 600;
  margin-bottom: 1px;
}

#currencyLabel {
  font-family: var(--font-mono);
  font-size: .72rem;
  letter-spacing: .06em;
  background: rgba(255, 255, 255, .14);
  border: 1px solid rgba(255, 255, 255, .22);
  padding: 5px 11px;
  border-radius: var(--r-pill);
}

/* =========================================================================
   LAYOUT / SECTION HEADERS
   ========================================================================= */
.container-fluid {
  padding-left: 14px;
  padding-right: 14px;
}

.section-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 18px 0 14px;
}

.section-heading {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--brand-dark);
  margin: 0;
  display: flex;
  align-items: center;
  gap: .5rem;
}

.section-heading .icon-badge {
  width: 30px;
  height: 30px;
  border-radius: var(--r-sm);
  background: var(--brand-light);
  color: var(--brand-dark);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: .9rem;
}

.section-sub {
  font-size: .74rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .1em;
  font-weight: 600;
}

/* pill filter / trigger buttons */
.chip-btn {
  border: 1px dashed var(--line);
  background: var(--surface);
  color: var(--ink-soft);
  border-radius: var(--r-pill);
  padding: 8px 16px;
  font-size: .8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  box-shadow: var(--shadow-sm);
  transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
}

.chip-btn i {
  color: var(--brand);
}

.chip-btn:hover {
  border-color: var(--brand);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  color: var(--ink);
}

.chip-btn:active {
  transform: translateY(0);
}

.btn {
  border-radius: var(--r-sm);
  font-weight: 600;
  font-size: .86rem;
  padding: 9px 16px;
  letter-spacing: .01em;
}

.btn-sm {
  padding: 7px 13px;
  font-size: .78rem;
  border-radius: 9px;
}

.btn-primary {
  background: var(--brand);
  border-color: var(--brand);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover,
.btn-primary:focus {
  background: var(--brand-dark);
  border-color: var(--brand-dark);
}

.btn-outline-primary {
  color: var(--brand);
  border-color: var(--brand);
}

.btn-outline-primary:hover {
  background: var(--brand);
  border-color: var(--brand);
}

.btn-outline-secondary {
  color: var(--ink-soft);
  border-color: var(--line);
}

.btn-outline-secondary:hover {
  background: var(--surface-2);
  color: var(--ink);
  border-color: var(--line);
}

.btn-outline-danger {
  color: var(--expense);
  border-color: var(--expense);
}

.btn-outline-danger:hover {
  background: var(--expense);
  border-color: var(--expense);
}

.btn-danger {
  background: var(--expense);
  border-color: var(--expense);
}

/* =========================================================================
   STAT CARDS (dashboard)
   ========================================================================= */
.stat-card {
  border: none;
  border-radius: var(--r-md);
  box-shadow: var(--shadow-sm);
  background: var(--surface);
  position: relative;
  overflow: hidden;
  border-left: 4px solid transparent;
  transition: transform .15s ease, box-shadow .15s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card .card-body {
  padding: 14px 16px;
}

.stat-card .stat-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .85rem;
  opacity: .9;
}

.stat-income {
  border-left-color: var(--income);
}

.stat-income .stat-icon {
  background: var(--income-bg);
  color: var(--income);
}

.stat-expense {
  border-left-color: var(--expense);
}

.stat-expense .stat-icon {
  background: var(--expense-bg);
  color: var(--expense);
}

.stat-net {
  border-left-color: var(--brand);
}

.stat-net .stat-icon {
  background: var(--brand-light);
  color: var(--brand-dark);
}

.stat-savings {
  border-left-color: var(--accent);
}

.stat-savings .stat-icon {
  background: var(--accent-light);
  color: var(--accent-dark);
}

.stat-label {
  font-size: .66rem;
  text-transform: uppercase;
  letter-spacing: .09em;
  color: var(--muted);
  font-weight: 700;
  padding-right: 34px;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 1.28rem;
  font-weight: 600;
  margin-top: 5px;
  letter-spacing: -.01em;
}

.stat-income .stat-value {
  color: var(--income);
}

.stat-expense .stat-value {
  color: var(--expense);
}

.stat-net .stat-value {
  color: var(--brand-dark);
}

.stat-savings .stat-value {
  color: var(--accent-dark);
}

@media (max-width: 576px) {
  .stat-card .card-body {
    padding: 11px 10px;
  }

  .stat-card .stat-icon {
    width: 24px;
    height: 24px;
    font-size: .72rem;
    top: 9px;
    right: 9px;
  }

  .stat-value {
    font-size: .82rem;
    word-break: break-word;
  }

  .stat-label {
    padding-right: 22px;
    font-size: .6rem;
  }
}

/* =========================================================================
   GENERIC CARD / PANEL
   ========================================================================= */
.card {
  border-radius: var(--r-md);
  border: 1px solid var(--line-soft);
  box-shadow: var(--shadow-sm);
  background: var(--surface);
}

.card .card-body {
  padding: 18px;
}

.card-title {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--brand-dark);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.card-title::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  display: inline-block;
}

/* =========================================================================
   PASSBOOK HERO (dashboard summary)
   ========================================================================= */
.passbook-hero {
  background: linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 78%);
  border-radius: var(--r-lg);
  color: #fff;
  padding: 20px 20px 16px;
  margin-top: 16px;
  position: relative;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.passbook-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(115deg, rgba(255, 255, 255, .05) 0 2px, transparent 2px 26px);
  pointer-events: none;
}

.passbook-hero .ph-eyebrow {
  font-size: .68rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .68);
  font-weight: 700;
}

.passbook-hero .ph-net {
  font-family: var(--font-display);
  font-size: 2.1rem;
  font-weight: 600;
  line-height: 1.15;
  margin: 2px 0 12px;
}

.passbook-hero .ph-stitch {
  border-top: 1.5px dashed rgba(255, 255, 255, .35);
  margin: 10px 0 12px;
}

.passbook-hero .ph-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.passbook-hero .ph-item {
  font-size: .8rem;
  color: rgba(255, 255, 255, .9);
}

.passbook-hero .ph-item b {
  display: block;
  font-family: var(--font-mono);
  font-size: 1rem;
}

.passbook-hero .ph-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}

/* =========================================================================
   TABLES
   ========================================================================= */
.table-responsive {
  max-height: 68vh;
  border-radius: var(--r-md);
}

.table {
  margin-bottom: 0;
  font-size: .86rem;
}

.table thead th {
  background: var(--surface-2);
  color: var(--muted);
  text-transform: uppercase;
  font-size: .66rem;
  letter-spacing: .08em;
  font-weight: 700;
  border-bottom: 1px solid var(--line-soft);
  padding: 10px 12px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.table tbody td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--line-soft);
  vertical-align: middle;
  color: var(--ink-soft);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table td.text-end,
.table th.text-end {
  font-family: var(--font-mono);
}

.row-clickable {
  cursor: pointer;
  transition: background .1s ease;
}

.row-clickable:hover {
  background: var(--surface-2);
}

/* badges */
.badge {
  font-weight: 700;
  font-size: .68rem;
  letter-spacing: .02em;
  padding: 5px 9px;
  border-radius: 7px;
}

.badge-ok {
  background: var(--income-bg);
  color: var(--income);
}

.badge-watch {
  background: var(--watch-bg);
  color: var(--watch);
}

.badge-over {
  background: var(--expense-bg);
  color: var(--expense);
}

.badge-set {
  background: var(--surface-2);
  color: var(--muted);
}

/* progress bars */
.progress {
  background: var(--surface-2);
  border-radius: var(--r-pill);
  overflow: hidden;
}

.progress-bar {
  background: var(--brand);
  font-size: .64rem;
  font-weight: 700;
}

.progress-bar.bg-success {
  background: var(--income) !important;
}

/* pagination */
.pagination .page-link {
  border: 1px solid var(--line-soft);
  color: var(--ink-soft);
  border-radius: 8px;
  margin: 0 3px;
  font-size: .8rem;
}

.pagination .page-item.active .page-link {
  background: var(--brand);
  border-color: var(--brand);
}

/* =========================================================================
   FORMS
   ========================================================================= */
.form-label {
  font-size: .72rem;
  font-weight: 700;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: .04em;
  margin-bottom: 4px;
}

.form-control,
.form-select {
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  padding: 9px 12px;
  font-size: .88rem;
  background: var(--surface);
}

.form-control:focus,
.form-select:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-light);
}

.form-control-sm,
.form-select-sm {
  padding: 7px 10px;
  font-size: .82rem;
  border-radius: 8px;
}

/* =========================================================================
   MODALS
   ========================================================================= */
.modal-content {
  border-radius: var(--r-lg);
  border: none;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, var(--brand-dark), var(--brand) 140%);
  color: #fff;
  border-bottom: none;
  padding: 16px 20px;
}

.modal-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.08rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header .btn-close {
  filter: invert(1) grayscale(1) brightness(2);
  opacity: .85;
}

.modal-body {
  padding: 18px 20px;
}

.modal-footer {
  border-top: 1px solid var(--line-soft);
  padding: 14px 20px;
}

.modal-body p.modal-lead {
  color: var(--ink-soft);
  font-size: .9rem;
}

/* settings menu rows used inside Settings page + inside modals */
.menu-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: var(--r-md);
  padding: 13px 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-sm);
  transition: transform .12s ease, box-shadow .12s ease;
}

.menu-row:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.menu-row .menu-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--brand-light);
  color: var(--brand-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.menu-row.danger .menu-icon {
  background: var(--expense-bg);
  color: var(--expense);
}

.menu-row .menu-text {
  flex: 1;
  min-width: 0;
}

.menu-row .menu-title {
  font-weight: 700;
  font-size: .88rem;
  color: var(--ink);
}

.menu-row .menu-sub {
  font-size: .74rem;
  color: var(--muted);
}

.menu-row .bi-chevron-right {
  color: var(--muted);
}

/* =========================================================================
   TOASTS
   ========================================================================= */
.toast-container {
  z-index: 1200;
}

.toast {
  border: none;
  border-radius: var(--r-md);
  box-shadow: var(--shadow-lg);
}

/* =========================================================================
   BOTTOM NAV
   ========================================================================= */
.bottom-nav {
  background: var(--surface);
  border-top: 1px solid var(--line-soft);
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
  box-shadow: 0 -6px 18px rgba(28, 38, 33, .06);
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: .62rem;
  font-weight: 600;
  color: var(--muted);
  border: none;
  background: transparent;
  padding: 6px 2px;
  border-radius: 12px;
}

.nav-btn i {
  font-size: 1.08rem;
  width: 34px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-pill);
  transition: background .15s ease, color .15s ease;
}

.nav-btn.active {
  color: var(--brand-dark);
}

.nav-btn.active i {
  background: var(--brand-light);
  color: var(--brand);
}

/* =========================================================================
   EMPTY / MISC
   ========================================================================= */
.text-muted {
  color: var(--muted) !important;
}

.atome-card-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--accent-light);
  color: var(--accent-dark);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: .95rem;
}

@media (max-width: 576px) {
  .container-fluid {
    padding-left: 10px;
    padding-right: 10px;
  }

  .card .card-body {
    padding: 14px;
  }

  .passbook-hero .ph-net {
    font-size: 1.7rem;
  }
}

/* =========================================================================
   ADDED: Top Spending Categories mini leaderboard (new dashboard section).
   Purely additive rules — nothing above this block was changed.
   ========================================================================= */
.top-cat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.top-cat-row:last-child {
  margin-bottom: 0;
}

.top-cat-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--brand-light);
  color: var(--brand-dark);
  font-size: .7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-mono);
}

.top-cat-info {
  flex: 1;
  min-width: 0;
}

.top-cat-name-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: .82rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 5px;
}

.top-cat-name-row .amt {
  font-family: var(--font-mono);
  color: var(--expense);
  flex-shrink: 0;
}

/* =========================================================================
   ADDED: prevent iOS/Android auto-zoom when tapping inputs inside modals.
   Mobile browsers (Safari/Chrome) automatically zoom the page in when a
   focused input/select/textarea has a computed font-size under 16px.
   Several existing rules above (.form-control, .form-select,
   .form-control-sm, .form-select-sm) use font sizes below that threshold
   on purpose for desktop density, so instead of changing those rules this
   block only raises the effective size on small screens, purely additive
   and does not modify a single line above.
   ========================================================================= */
@media (max-width: 576px) {

  .form-control,
  .form-select,
  .form-control-sm,
  .form-select-sm,
  input,
  select,
  textarea {
    font-size: 16px !important;
  }
}

/* =========================================================================
   ADDED: Budget Performance report (dashboard). Reuses existing tokens
   and badge/progress classes already defined above; only new selectors
   are introduced here, nothing existing is changed.
   ========================================================================= */
.budget-rep-stat {
  background: var(--surface-2);
  border-radius: var(--r-sm);
  padding: 10px 12px;
  text-align: center;
}

.budget-rep-stat-label {
  font-size: .62rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--muted);
  font-weight: 700;
}

.budget-rep-stat-value {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink);
  margin-top: 3px;
}

.budget-rep-row {
  padding: 10px 0;
  border-bottom: 1px solid var(--line-soft);
}

.budget-rep-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.budget-rep-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: .84rem;
  font-weight: 600;
  color: var(--ink);
}

.budget-rep-cat {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.budget-rep-row-bottom {
  display: flex;
  justify-content: space-between;
  font-size: .74rem;
  color: var(--muted);
  margin-top: 5px;
  font-family: var(--font-mono);
}

app.js:
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
  fillSelect(document.getElementById('dashYear'), yrs, yrs.includes(new Date().getFullYear()) ? new Date().getFullYear() : yrs[yrs.length - 1]);
  fillSelect(document.getElementById('dashMonth'), ['All', ...MONTHS], MONTHS[new Date().getMonth()]);
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
   ADDED: extra dashboard insights — Net Cashflow Trend, Top Spending
   Categories, and Account Balance Distribution.

   This block is appended after everything above and does not modify a
   single existing line, function, or comment. It reuses the existing
   helper functions (getTransactions, deriveYear, deriveMonthName,
   accountBalance, fmt, etc.) and hooks into the dashboard's existing
   render cycle by wrapping it, so it stays in sync with
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
      .filter(t => week === 'All' || String(deriveWeek(t.date)) === String(week))
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

seed-data.js:
// Auto-generated from My_Tracker.xlsx — this is your existing data, loaded once into localStorage on first run.
const SEED_DATA = {"transactions": [{"date": "2026-07-31", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "Coke Contribution", "amount": 20.0, "note": ""}, {"date": "2026-07-31", "type": "Expense", "account": "Atome (Expenses)", "category": "Load", "subcategory": "", "description": "", "amount": 249.0, "note": ""}, {"date": "2026-07-31", "type": "Expense", "account": "Atome (Expenses)", "category": "Date", "subcategory": "", "description": "Grocery", "amount": 503.9, "note": ""}, {"date": "2026-07-31", "type": "Expense", "account": "Atome (Expenses)", "category": "Gas", "subcategory": "", "description": "", "amount": 418.18, "note": ""}, {"date": "2026-07-31", "type": "Income", "account": "Hello Money (Cashflow)", "category": "Work", "subcategory": "Regular Salary", "description": "", "amount": 7800.0, "note": ""}, {"date": "2026-07-31", "type": "Income", "account": "Hello Money (Cashflow)", "category": "Work", "subcategory": "Incentives", "description": "5,831 Student Population - CMC", "amount": 11662.0, "note": ""}, {"date": "2026-07-31", "type": "Income", "account": "Cash", "category": "Work", "subcategory": "Refund", "description": "Gas Allowance", "amount": 100.0, "note": ""}, {"date": "2026-07-31", "type": "Expense", "account": "Hello Money (Cashflow)", "category": "Date", "subcategory": "", "description": "Cebu Ticket", "amount": 1000.0, "note": ""}, {"date": "2026-08-01", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "Bread", "amount": 25.0, "note": ""}, {"date": "2026-08-01", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 25.0, "note": ""}, {"date": "2026-08-02", "type": "Expense", "account": "Cash", "category": "Medicine", "subcategory": "", "description": "Cough", "amount": 138.0, "note": ""}, {"date": "2026-08-02", "type": "Income", "account": "Cash", "category": "Work", "subcategory": "Sideline", "description": "Microsoft Office Activation", "amount": 500.0, "note": ""}, {"date": "2026-08-02", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 20.0, "note": ""}, {"date": "2026-08-02", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 15.0, "note": ""}, {"date": "2026-08-03", "type": "Income", "account": "GCash (E-WALLET)", "category": "Work", "subcategory": "Sideline", "description": "", "amount": 168.0, "note": ""}, {"date": "2026-08-03", "type": "Income", "account": "MariBank (SAVINGS)", "category": "Bank", "subcategory": "", "description": "", "amount": 0.36, "note": ""}, {"date": "2026-08-03", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 30.0, "note": ""}, {"date": "2026-08-03", "type": "Expense", "account": "GCash (E-WALLET)", "category": "Date", "subcategory": "", "description": "Snacks", "amount": 165.0, "note": ""}, {"date": "2026-08-03", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 300.0, "note": ""}, {"date": "2026-08-03", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 20.0, "note": ""}, {"date": "2026-08-04", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 50.0, "note": ""}, {"date": "2026-08-04", "type": "Expense", "account": "Cash", "category": "Personal", "subcategory": "", "description": "Haircut", "amount": 150.0, "note": ""}, {"date": "2026-08-04", "type": "Expense", "account": "Cash", "category": "Grocery", "subcategory": "", "description": "Soap", "amount": 25.0, "note": ""}, {"date": "2026-08-04", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 4.0, "note": ""}, {"date": "2026-08-04", "type": "Expense", "account": "Cash", "category": "Transportation", "subcategory": "", "description": "", "amount": 13.0, "note": ""}, {"date": "2026-08-04", "type": "Expense", "account": "Cash", "category": "Personal", "subcategory": "", "description": "Watch Size Adjustment", "amount": 50.0, "note": ""}, {"date": "2026-08-04", "type": "Expense", "account": "Cash", "category": "Transportation", "subcategory": "", "description": "", "amount": 22.0, "note": ""}, {"date": "2026-08-04", "type": "Income", "account": "Cash", "category": "Work", "subcategory": "Refund", "description": "", "amount": 50.0, "note": ""}, {"date": "2026-08-05", "type": "Income", "account": "Cash", "category": "Family", "subcategory": "", "description": "", "amount": 50.0, "note": ""}, {"date": "2026-08-05", "type": "Expense", "account": "Atome (EXPENSES)", "category": "Gas", "subcategory": "", "description": "", "amount": 342.02, "note": ""}, {"date": "2026-08-05", "type": "Expense", "account": "Cash", "category": "Laundry", "subcategory": "", "description": "", "amount": 160.0, "note": ""}, {"date": "2026-08-05", "type": "Expense", "account": "Cash", "category": "Transportation", "subcategory": "", "description": "", "amount": 11.0, "note": ""}, {"date": "2026-08-05", "type": "Expense", "account": "Cash", "category": "Medicine", "subcategory": "", "description": "", "amount": 60.0, "note": ""}, {"date": "2026-08-05", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 135.0, "note": ""}, {"date": "2026-08-06", "type": "Income", "account": "Cash", "category": "Work", "subcategory": "Other", "description": "", "amount": 535.0, "note": ""}, {"date": "2026-08-06", "type": "Expense", "account": "Cash", "category": "Transportation", "subcategory": "", "description": "", "amount": 11.0, "note": ""}, {"date": "2026-08-06", "type": "Expense", "account": "Cash", "category": "Gas", "subcategory": "", "description": "", "amount": 221.0, "note": ""}, {"date": "2026-08-06", "type": "Expense", "account": "Cash", "category": "Date", "subcategory": "", "description": "", "amount": 32.0, "note": ""}, {"date": "2026-08-06", "type": "Expense", "account": "Cash", "category": "Date", "subcategory": "", "description": "", "amount": 50.0, "note": ""}, {"date": "2026-08-07", "type": "Expense", "account": "Cash", "category": "Date", "subcategory": "", "description": "Flower", "amount": 300.0, "note": ""}, {"date": "2026-08-07", "type": "Expense", "account": "Cash", "category": "Date", "subcategory": "", "description": "Grocery", "amount": 547.0, "note": ""}, {"date": "2026-08-07", "type": "Expense", "account": "Cash", "category": "Date", "subcategory": "", "description": "Drink", "amount": 109.0, "note": ""}, {"date": "2026-08-07", "type": "Expense", "account": "Cash", "category": "Date", "subcategory": "", "description": "Street food", "amount": 75.0, "note": ""}, {"date": "2026-08-07", "type": "Expense", "account": "Cash", "category": "Date", "subcategory": "", "description": "Grocery", "amount": 820.0, "note": ""}, {"date": "2026-08-07", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 38.0, "note": ""}, {"date": "2026-08-07", "type": "Expense", "account": "Cash", "category": "Date", "subcategory": "", "description": "Burger", "amount": 155.0, "note": ""}, {"date": "2026-08-07", "type": "Expense", "account": "Cash", "category": "Date", "subcategory": "", "description": "Bread", "amount": 85.0, "note": ""}, {"date": "2026-08-08", "type": "Expense", "account": "Cash", "category": "Gas", "subcategory": "", "description": "", "amount": 234.0, "note": ""}, {"date": "2026-08-08", "type": "Expense", "account": "Cash", "category": "Gas", "subcategory": "", "description": "", "amount": 185.0, "note": ""}, {"date": "2026-08-08", "type": "Expense", "account": "Cash", "category": "Family", "subcategory": "", "description": "Barge", "amount": 110.0, "note": ""}, {"date": "2026-08-08", "type": "Income", "account": "Cash", "category": "Family", "subcategory": "", "description": "", "amount": 185.0, "note": ""}, {"date": "2026-08-08", "type": "Expense", "account": "GCash (E-WALLET)", "category": "Adventure", "subcategory": "", "description": "", "amount": 500.0, "note": ""}, {"date": "2026-08-08", "type": "Income", "account": "Cash", "category": "Work", "subcategory": "Sideline", "description": "Microsoft Office Activation", "amount": 500.0, "note": ""}, {"date": "2026-08-09", "type": "Expense", "account": "GCash (E-WALLET)", "category": "Family", "subcategory": "", "description": "", "amount": 1.0, "note": ""}, {"date": "2026-08-09", "type": "Expense", "account": "Cash", "category": "Family", "subcategory": "", "description": "Barge", "amount": 135.0, "note": ""}, {"date": "2026-08-09", "type": "Expense", "account": "Atome (EXPENSES)", "category": "Family", "subcategory": "", "description": "", "amount": 170.0, "note": ""}, {"date": "2026-08-10", "type": "Income", "account": "MariBank (SAVINGS)", "category": "Bank", "subcategory": "", "description": "", "amount": 1.52, "note": ""}, {"date": "2026-08-10", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 20.0, "note": ""}, {"date": "2026-08-10", "type": "Expense", "account": "Atome (EXPENSES)", "category": "Date", "subcategory": "", "description": "", "amount": 536.92, "note": ""}, {"date": "2026-08-10", "type": "Expense", "account": "Atome (EXPENSES)", "category": "Family", "subcategory": "", "description": "Mama's Medicine", "amount": 703.0, "note": ""}, {"date": "2026-08-11", "type": "Expense", "account": "Cash", "category": "Food", "subcategory": "", "description": "", "amount": 50.0, "note": ""}, {"date": "2026-08-12", "type": "Expense", "account": "Hello Money (CASHFLOW)", "category": "Adventure", "subcategory": "", "description": "", "amount": 1650.0, "note": ""}, {"date": "2026-08-12", "type": "Expense", "account": "Cash", "category": "Laundry", "subcategory": "", "description": "", "amount": 175.0, "note": ""}], "transfers": [{"date": "2026-07-31", "transferType": "Atome Payment", "fromAccount": "Hello Money (Cashflow)", "toAccount": "Atome (EXPENSES)", "amount": 1171.08, "note": ""}, {"date": "2026-07-31", "transferType": "Account Transfer", "fromAccount": "Hello Money (Cashflow)", "toAccount": "MariBank (SAVINGS)", "amount": 3000.0, "note": ""}, {"date": "2026-07-31", "transferType": "Account Transfer", "fromAccount": "Hello Money (Cashflow)", "toAccount": "GoTyme (EMERGENCY)", "amount": 4280.0, "note": ""}, {"date": "2026-07-31", "transferType": "Account Transfer", "fromAccount": "Hello Money (CASHFLOW)", "toAccount": "BPI (MT03)", "amount": 2000.0, "note": ""}, {"date": "2026-08-01", "transferType": "Account Transfer", "fromAccount": "Hello Money (CASHFLOW)", "toAccount": "Cash", "amount": 2200.0, "note": ""}, {"date": "2026-08-05", "transferType": "Account Transfer", "fromAccount": "Hello Money (CASHFLOW)", "toAccount": "Cash", "amount": 1400.0, "note": ""}, {"date": "2026-08-07", "transferType": "Account Transfer", "fromAccount": "Cash", "toAccount": "GCash (E-WALLET)", "amount": 300.0, "note": ""}, {"date": "2026-08-08", "transferType": "Account Transfer", "fromAccount": "Hello Money (CASHFLOW)", "toAccount": "GCash (E-WALLET)", "amount": 200.0, "note": ""}, {"date": "2026-08-08", "transferType": "Account Transfer", "fromAccount": "Hello Money (CASHFLOW)", "toAccount": "Cash", "amount": 3748.0, "note": ""}, {"date": "2026-08-08", "transferType": "Account Transfer", "fromAccount": "Hello Money (CASHFLOW)", "toAccount": "CIMB (INVESTMENT)", "amount": 512.02, "note": ""}, {"date": "2026-08-10", "transferType": "Account Transfer", "fromAccount": "Cash", "toAccount": "Hello Money (CASHFLOW)", "amount": 4500.0, "note": ""}, {"date": "2026-08-10", "transferType": "Atome Payment", "fromAccount": "CIMB (INVESTMENT)", "toAccount": "Atome (EXPENSES)", "amount": 512.02, "note": ""}, {"date": "2026-08-11", "transferType": "Account Transfer", "fromAccount": "Cash", "toAccount": "Hello Money (CASHFLOW)", "amount": 100.0, "note": ""}], "accounts": [{"account": "Cash", "purpose": "Physical cash", "opening": 324.0, "goal": null}, {"account": "Hello Money (CASHFLOW)", "purpose": "Salary receiving & expense cashflow", "opening": 54.69, "goal": null}, {"account": "GCash (E-WALLET)", "purpose": "E-wallet", "opening": 0.0, "goal": null}, {"account": "Atome (EXPENSES)", "purpose": "Credit card / available limit", "opening": 52548.92, "goal": null}, {"account": "BPI (MT03)", "purpose": "Motorcycle fund", "opening": 0.0, "goal": 180000.0}, {"account": "MariBank (SAVINGS)", "purpose": "Long-term savings", "opening": 4.12, "goal": 25000.0}, {"account": "GoTyme (EMERGENCY)", "purpose": "Emergency fund", "opening": 6738.0, "goal": 100000.0}, {"account": "CIMB (INVESTMENT)", "purpose": "Investment fund", "opening": 1.88, "goal": 50000.0}], "budget": [{"year": 2026, "month": "August", "category": "Adventure", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Date", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Family", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Food", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Friend", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Gas", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Grocery", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Gym Membership", "amount": 1000.0, "note": ""}, {"year": 2026, "month": "August", "category": "Insurance", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Item", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Laundry", "amount": 640.0, "note": ""}, {"year": 2026, "month": "August", "category": "Load", "amount": 250.0, "note": ""}, {"year": 2026, "month": "August", "category": "Medicine", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Motor", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Other", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Personal", "amount": 0.0, "note": ""}, {"year": 2026, "month": "August", "category": "Subscription", "amount": 169.0, "note": ""}, {"year": 2026, "month": "August", "category": "Transportation", "amount": 0.0, "note": ""}], "payroll": [{"payDate": "2026-07-31", "expectedWorkdays": 14.0, "actualWorkdays": 13.0, "expectedSalary": 8400.0}, {"payDate": "2026-08-15", "expectedWorkdays": 13.0, "actualWorkdays": 0, "expectedSalary": 7800.0}, {"payDate": "2026-08-31", "expectedWorkdays": 0, "actualWorkdays": 0, "expectedSalary": 0}, {"payDate": "2026-09-15", "expectedWorkdays": 0, "actualWorkdays": 0, "expectedSalary": 0}, {"payDate": "2026-09-30", "expectedWorkdays": 0, "actualWorkdays": 0, "expectedSalary": 0}, {"payDate": "2026-10-15", "expectedWorkdays": 0, "actualWorkdays": 0, "expectedSalary": 0}, {"payDate": "2026-10-31", "expectedWorkdays": 0, "actualWorkdays": 0, "expectedSalary": 0}, {"payDate": "2026-11-15", "expectedWorkdays": 0, "actualWorkdays": 0, "expectedSalary": 0}, {"payDate": "2026-11-30", "expectedWorkdays": 0, "actualWorkdays": 0, "expectedSalary": 0}, {"payDate": "2026-12-15", "expectedWorkdays": 0, "actualWorkdays": 0, "expectedSalary": 0}, {"payDate": "2026-12-31", "expectedWorkdays": 0, "actualWorkdays": 0, "expectedSalary": 0}], "dropdowns": {"transactionType": ["Income", "Expense"], "account": ["Cash", "Hello Money (CASHFLOW)", "GCash (E-WALLET)", "Atome (EXPENSES)", "BPI (MT03)", "MariBank (SAVINGS)", "GoTyme (EMERGENCY)", "CIMB (INVESTMENT)"], "expenseCategory": ["Adventure", "Date", "Family", "Food", "Friend", "Gas", "Grocery", "Gym Membership", "Insurance", "Item", "Laundry", "Load", "Medicine", "Motor", "Other", "Personal", "Subscription", "Transportation"], "incomeCategory": ["Work", "Family", "Bank", "Excess"], "incomeSubcategory": ["Regular Salary", "Incentives", "Sideline", "Refund", "Other"], "transferType": ["Account Transfer", "Atome Payment"]}, "settings": {"trackerStartDate": "2026-08-01", "firstPayrollDate": "2026-07-31", "atomeStatementDay": 10, "atomeDueDay": 20, "currency": "PHP", "atomeReferenceDate": "2026-08-10"}};

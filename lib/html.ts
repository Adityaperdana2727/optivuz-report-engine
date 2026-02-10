import type { ReportResult, TraceRef } from "./report/types";
import { formatIDR } from "./report/utils";

const BRAND = {
  primary: "#0B4F6C",
  accent: "#F2C94C",
  text: "#0f172a",
  muted: "#64748b",
  line: "#e5e7eb",
  soft: "#f6f8fb",
  card: "#ffffff",
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));
}

function money(n: number): string { return formatIDR(n); }

function fmtDate(d: string | null): string {
  if (!d) return "-";
  const m = String(d).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(d);
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function fmtRange(from: string | null, to: string | null): string {
  return `${fmtDate(from)} → ${fmtDate(to)}`;
}

function tag(label: string, tone = "muted"): string {
  const bg = tone === "ok" ? "rgba(16,185,129,.12)" : tone === "bad" ? "rgba(239,68,68,.12)" : "rgba(148,163,184,.18)";
  const fg = tone === "ok" ? "#065f46" : tone === "bad" ? "#7f1d1d" : BRAND.muted;
  return `<span class="tag" style="background:${bg};color:${fg}">${esc(label)}</span>`;
}

function sectionHeaderHTML(title: string, period: string, reportId: string): string {
  return `
    <div class="sectionHeader">
      <div class="titleWrap">
        <div class="title">${esc(title)}</div>
        <div class="period">${esc(period)}</div>
      </div>
      <button class="btn primary" data-print-action="${esc(reportId)}">Print PDF</button>
    </div>
  `;
}

function auditLink(trace: TraceRef | null, label = "Trace"): string {
  if (!trace || trace.header_ids.length === 0) return "";
  const headers = trace.header_ids.join(",");
  const count = trace.header_ids.length;
  return `<a href="#audit" class="auditLink" data-audit-headers="${esc(headers)}">${esc(label)} (${count})</a>`;
}

export function renderTabbedHTML(report: ReportResult): string {
  const { company, logo, address, contact, periodFrom, periodTo, checks, models } = report;
  const genAt = new Date().toISOString();

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "journal", label: "Journal Register" },
    { id: "gl", label: "General Ledger" },
    { id: "tb", label: "Trial Balance" },
    { id: "pl", label: "Profit & Loss" },
    { id: "bs", label: "Balance Sheet" },
    { id: "cf", label: "Cash Flow" },
    { id: "equity", label: "Changes in Equity" },
    { id: "plc", label: "Comparative P&L" },
    { id: "bsc", label: "Comparative BS" },
    { id: "movement", label: "Account Movement" },
    { id: "audit", label: "Audit Trail" },
    { id: "analytics", label: "Analytics" },
    { id: "data", label: "Raw Data" },
  ];

  const header = `
    <div class="topbar">
      <div class="brand">
        ${logo ? `<img class="logo" src="${esc(logo)}" alt="logo" />` : `<div class="logoPh"></div>`}
        <div>
          <div class="title">${esc(company)}</div>
          <div class="sub muted">${esc(address)} ${address && contact ? "•" : ""} ${esc(contact)}</div>
        </div>
      </div>
      <div class="meta">
        <div class="pill"><span class="muted">Periode</span><b>${esc(fmtDate(periodFrom))}</b> → <b>${esc(fmtDate(periodTo))}</b></div>
        <div class="pill"><span class="muted">Generated</span><b>${esc(genAt.slice(0, 19).replace("T", " "))}Z</b></div>
      </div>
    </div>`;

  const tabsHtml = tabs.map((t) => `<button type="button" class="tab" data-tab="${t.id}">${esc(t.label)}</button>`).join("");

  const body = `
    ${header}
    <div class="tabs">${tabsHtml}</div>
    <div class="content">
      <div class="printHeader">
        <div class="printBrand">${esc(company)}</div>
        <div class="printTitle" id="printTitle"></div>
        <div class="printPeriod" id="printPeriod"></div>
      </div>
      <div class="printFooter">
        <div class="printMeta">Generated ${esc(genAt.slice(0, 19).replace("T", " "))}Z</div>
        <div class="pageNum"></div>
      </div>
      ${sectionDashboard(report)}
      ${sectionJournalRegister(report)}
      ${sectionGeneralLedger(report)}
      ${sectionTrialBalance(report)}
      ${sectionProfitLoss(report)}
      ${sectionBalanceSheet(report)}
      ${sectionCashflow(report)}
      ${sectionEquityChanges(report)}
      ${sectionComparativePL(report)}
      ${sectionComparativeBS(report)}
      ${sectionAccountMovement(report)}
      ${sectionAuditTrail(report)}
      ${sectionAnalytics(report)}
      ${sectionRawData(report)}
    </div>
  `;

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Accounting Reports | ${esc(company)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --brand:${BRAND.primary};
    --accent:${BRAND.accent};
    --text:${BRAND.text};
    --muted:${BRAND.muted};
    --line:${BRAND.line};
    --soft:${BRAND.soft};
    --card:${BRAND.card};
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:"Source Sans 3",system-ui,Segoe UI,Arial,sans-serif;color:var(--text);background:var(--soft)}
  .topbar{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;padding:16px 16px 10px;background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
  .brand{display:flex;gap:12px;align-items:center;min-width:260px}
  .logo{width:44px;height:44px;border-radius:10px;object-fit:cover;border:1px solid var(--line)}
  .logoPh{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg, rgba(11,79,108,.2), rgba(242,201,76,.2));border:1px solid var(--line)}
  .title{font-weight:800;font-size:16px}
  .sub{font-size:12px;max-width:520px}
  .muted{color:var(--muted)}
  .meta{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
  .pill{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;font-size:12px;display:flex;gap:8px;align-items:center}
  .tabs{display:flex;gap:8px;overflow:auto;padding:10px 12px;background:#fff;border-bottom:1px solid var(--line);position:sticky;top:77px;z-index:4}
  .tab{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 12px;font-size:12px;cursor:pointer;white-space:nowrap;text-decoration:none;color:inherit;display:inline-block;transition:all .15s ease}
  .tab:hover{border-color:rgba(11,79,108,.35);background:rgba(11,79,108,.08);color:var(--brand)}
  .tab.active{border-color:rgba(11,79,108,.35);background:rgba(11,79,108,.12);color:var(--brand);font-weight:700}
  .content{padding:14px 12px 80px;max-width:1300px;margin:0 auto}
  .section{display:none}
  .section.active{display:block}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;margin:12px 0}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .kpi{border:1px solid var(--line);border-radius:12px;padding:10px;background:#fff}
  .kpi .label{font-size:11px;color:var(--muted)}
  .kpi .val{font-size:15px;font-weight:800;margin-top:4px}
  h2{margin:6px 0 10px;font-size:15px}
  h3{margin:10px 0 8px;font-size:13px}
  table{width:100%;border-collapse:collapse}
  th,td{border-bottom:1px solid var(--line);padding:8px 10px;font-size:12px;vertical-align:top}
  th{text-align:left;background:#f8fafc;color:#0f172a;position:sticky;top:126px;z-index:3}
  td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
  .tag{display:inline-flex;align-items:center;border:1px solid rgba(148,163,184,.35);padding:2px 8px;border-radius:999px;font-size:11px}
  .toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin:10px 0 0}
  .input{border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:12px;min-width:200px}
  .btn{border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:12px;background:#fff;cursor:pointer}
  .btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
  .note{font-size:12px;color:var(--muted);line-height:1.5}
  .right{display:flex;gap:8px;align-items:center;justify-content:flex-end}
  .section-title{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .divider{height:1px;background:var(--line);margin:10px 0}
  .compact td{padding:6px 8px}
  .auditLink{font-size:11px;color:var(--brand);text-decoration:underline;cursor:pointer}
  .sectionHeader{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
  .sectionHeader .titleWrap{display:flex;flex-direction:column;gap:2px}
  .sectionHeader .title{font-weight:800;font-size:15px}
  .sectionHeader .period{font-size:11px;color:var(--muted)}
  .tableFooter{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px;font-size:11px;color:var(--muted)}
  .tableFooter a{color:var(--brand);text-decoration:none}
  .tableFooter a:hover{text-decoration:underline}
  .audit-table col.date{width:120px}
  .audit-table col.header{width:170px}
  .audit-table col.debit{width:140px}
  .audit-table col.credit{width:140px}
  .audit-table col.status{width:90px}
  .audit-table col.posted{width:140px}
  .audit-detail-cell{padding:0;border-bottom:1px solid var(--line)}
  .audit-detail-wrap{background:#f8fafc;padding:8px 10px}
  .audit-detail{width:100%;border-collapse:collapse}
  .audit-detail th,.audit-detail td{border-bottom:1px dashed #e5e7eb;padding:6px 8px;font-size:11px}
  .audit-detail th{position:static;background:#eef2f7;color:#0f172a}
  .audit-detail .num{text-align:right;font-variant-numeric:tabular-nums}
  .audit-detail tr:last-child td{border-bottom:0}
  .pager{display:flex;align-items:center;gap:8px}
  .pager .btn{padding:6px 10px}
  .pager .count{font-size:12px;color:var(--muted)}
  .printHeader,.printFooter{display:none}
  @media (max-width: 980px){
    .grid{grid-template-columns:repeat(2,1fr)}
    .sub{max-width:340px}
  }
  @media print{
    @page { size: A4; margin: 14mm; }
    body{background:#fff}
    .tabs,.toolbar,.btn,.topbar{display:none !important}
    .content{max-width:none;padding:20mm 0}
    .section{display:none}
    .section[data-print-active="true"]{display:block}
    .section[data-print-active="true"] .card{page-break-inside:avoid}
    .printHeader,.printFooter{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
    .printHeader{position:fixed;top:0;left:0;right:0;padding:0 0 6mm;border-bottom:1px solid var(--line)}
    .printFooter{position:fixed;bottom:0;left:0;right:0;padding:6mm 0 0;border-top:1px solid var(--line);font-size:11px;color:var(--muted)}
    .printBrand{font-weight:800;font-size:14px}
    .printTitle{font-weight:700;font-size:13px}
    .printPeriod{font-size:11px;color:var(--muted)}
    .pageNum::after{content:"Page " counter(page)}
    table thead{display:table-header-group}
    table tfoot{display:table-footer-group}
    th{position:static}
  }
</style>
</head>
<body>
  ${body}
<script>
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section"));

  function activate(id){
    for (var i = 0; i < tabs.length; i++){
      var t = tabs[i];
      var isActive = t.getAttribute("data-tab") === id;
      if (isActive) t.classList.add("active");
      else t.classList.remove("active");
    }
    for (var j = 0; j < sections.length; j++){
      var s = sections[j];
      var isShown = s.getAttribute("data-section") === id;
      if (isShown) s.classList.add("active");
      else s.classList.remove("active");
    }
    if (history && history.replaceState) history.replaceState(null, "", "#" + id);
  }

  for (var k = 0; k < tabs.length; k++){
    (function(tab){
      tab.addEventListener("click", function(e){
        e.preventDefault();
        var id = tab.getAttribute("data-tab") || "dashboard";
        activate(id);
      });
    })(tabs[k]);
  }

  var initial = (location.hash || "#dashboard").slice(1);
  var hasInitial = tabs.some(function(t){ return t.getAttribute("data-tab") === initial; });
  activate(hasInitial ? initial : "dashboard");

  window.addEventListener("hashchange", function(){
    var current = (location.hash || "#dashboard").slice(1);
    var hasCurrent = tabs.some(function(t){ return t.getAttribute("data-tab") === current; });
    activate(hasCurrent ? current : "dashboard");
  });

  var glSearch = document.getElementById("glSearch");
  if (glSearch){
    glSearch.addEventListener("input", function(e){
      var q = String(e.target.value || "").trim().toLowerCase();
      var cards = document.querySelectorAll("[data-gl-account]");
      for (var c = 0; c < cards.length; c++){
        var name = String(cards[c].getAttribute("data-gl-account") || "").toLowerCase();
        cards[c].style.display = (!q || name.indexOf(q) !== -1) ? "" : "none";
      }
    });
  }

  function applyTableFilter(prefix){
    var qInput = document.getElementById(prefix + "Search");
    var fInput = document.getElementById(prefix + "From");
    var tInput = document.getElementById(prefix + "To");
    var q = qInput ? String(qInput.value || "").trim().toLowerCase() : "";
    var from = fInput ? String(fInput.value || "").trim() : "";
    var to = tInput ? String(tInput.value || "").trim() : "";
    var rows = document.querySelectorAll("[data-filter-row='" + prefix + "']");
    for (var r = 0; r < rows.length; r++){
      var row = rows[r];
      var text = String(row.getAttribute("data-text") || "").toLowerCase();
      var date = String(row.getAttribute("data-date") || "");
      var okText = !q || text.indexOf(q) !== -1;
      var okFrom = !from || (date && date >= from);
      var okTo = !to || (date && date <= to);
      row.style.display = (okText && okFrom && okTo) ? "" : "none";
    }
  }

  ["jr", "audit"].forEach(function(prefix){
    var input = document.getElementById(prefix + "Search");
    var from = document.getElementById(prefix + "From");
    var to = document.getElementById(prefix + "To");
    [input, from, to].forEach(function(el){
      if (!el) return;
      el.addEventListener("input", function(){ applyTableFilter(prefix); });
      el.addEventListener("change", function(){ applyTableFilter(prefix); });
    });
  });

  function clearPrintState(){
    var active = document.querySelectorAll(".section[data-print-active='true']");
    for (var i2 = 0; i2 < active.length; i2++){
      active[i2].removeAttribute("data-print-active");
    }
  }

  function printReport(reportId){
    var section = document.querySelector("[data-report='" + reportId + "']");
    if (!section) return;
    clearPrintState();
    section.setAttribute("data-print-active", "true");
    var title = section.getAttribute("data-title") || "Report";
    var period = section.getAttribute("data-period") || "";
    var t = document.getElementById("printTitle");
    var p = document.getElementById("printPeriod");
    if (t) t.textContent = title;
    if (p) p.textContent = period;
    window.print();
  }

  window.addEventListener("afterprint", function(){
    clearPrintState();
  });

  var printBtns = document.querySelectorAll("[data-print-action]");
  for (var pb = 0; pb < printBtns.length; pb++){
    (function(btn){
      btn.addEventListener("click", function(){
        var reportId = btn.getAttribute("data-print-action");
        if (reportId) printReport(reportId);
      });
    })(printBtns[pb]);
  }

  var auditLinks = document.querySelectorAll("[data-audit-headers]");
  for (var al = 0; al < auditLinks.length; al++){
    (function(el){
      el.addEventListener("click", function(){
        var headers = String(el.getAttribute("data-audit-headers") || "").split(",").filter(Boolean);
        var query = headers[0] || "";
        var input = document.getElementById("auditSearch");
        if (input){
          input.value = query;
          input.dispatchEvent(new Event("input"));
        }
        activate("audit");
      });
    })(auditLinks[al]);
  }

  function initRawDataPager(){
    var rows = document.querySelectorAll("[data-raw-row]");
    if (!rows.length) return;
    var pageSize = 50;
    var total = rows.length;
    var pageCount = Math.max(1, Math.ceil(total / pageSize));
    var current = 1;
    var info = document.getElementById("rawPageInfo");
    var prev = document.getElementById("rawPrev");
    var next = document.getElementById("rawNext");
    var count = document.getElementById("rawCount");

    function render(){
      var start = (current - 1) * pageSize;
      var end = start + pageSize;
      for (var i = 0; i < rows.length; i++){
        rows[i].style.display = (i >= start && i < end) ? "" : "none";
      }
      if (info) info.textContent = "Page " + current + " / " + pageCount;
      if (count) count.textContent = total + " rows";
      if (prev) prev.disabled = current <= 1;
      if (next) next.disabled = current >= pageCount;
    }

    if (prev) prev.addEventListener("click", function(){
      if (current > 1){ current -= 1; render(); }
    });
    if (next) next.addEventListener("click", function(){
      if (current < pageCount){ current += 1; render(); }
    });

    render();
  }

  initRawDataPager();

  function addTableFooters(){
    var tables = document.querySelectorAll(".section table");
    for (var i = 0; i < tables.length; i++){
      var table = tables[i];
      var next = table.nextElementSibling;
      if (next && next.classList && next.classList.contains("tableFooter")) continue;
      var footer = document.createElement("div");
      footer.className = "tableFooter";
      footer.innerHTML = '<span>Powered by optivuz-business</span><a href="https://optivuz.pro" target="_blank" rel="noopener">optivuz.pro</a>';
      table.parentNode && table.parentNode.insertBefore(footer, table.nextSibling);
    }
  }

  addTableFooters();
</script>
</body>
</html>`;
}

function sectionDashboard(report: ReportResult): string {
  const { checks, models, periodFrom, periodTo } = report;
  const tb = models.trialBalance;
  const pl = models.profitLoss;
  const bs = models.balanceSheet;
  const cf = models.cashflow;

  const balancedTag = checks.isBalanced ? tag("Balanced", "ok") : tag("Not Balanced", "bad");

  const period = `Period: ${fmtRange(periodFrom, periodTo)}`;
  return `
  <section class="section" id="dashboard" data-section="dashboard" data-report="dashboard" data-title="Dashboard" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Dashboard", period, "dashboard")}
      <div class="toolbar">
        <div class="right">
          ${balancedTag}
          ${tag(`Journal lines: ${checks.rowCount}`)}
          ${checks.missingDates ? tag(`Missing dates: ${checks.missingDates}`, "bad") : tag("Dates OK", "ok")}
        </div>
      </div>
      <div class="grid" style="margin-top:10px">
        <div class="kpi"><div class="label">Total Debit (periode)</div><div class="val">${money(checks.totalDebit)}</div></div>
        <div class="kpi"><div class="label">Total Credit (periode)</div><div class="val">${money(checks.totalCredit)}</div></div>
        <div class="kpi"><div class="label">Net Profit (P&L)</div><div class="val">${money(pl.totals.net_profit)}</div></div>
        <div class="kpi"><div class="label">Net Cash Change</div><div class="val">${money(cf.totals.net_change)}</div></div>
      </div>
      <div class="note" style="margin-top:10px">
        Period range: <b>${esc(fmtDate(periodFrom))}</b> → <b>${esc(fmtDate(periodTo))}</b>.
        Balance Sheet memakai tanggal akhir periode (<b>${esc(fmtDate(periodTo))}</b>).
      </div>
    </div>

    <div class="card">
      <h2>Quick Snapshot</h2>
      <div class="grid">
        <div class="kpi"><div class="label">Total Assets (as-of)</div><div class="val">${money(bs.totals.assets)}</div></div>
        <div class="kpi"><div class="label">Total Liabilities (as-of)</div><div class="val">${money(bs.totals.liabilities)}</div></div>
        <div class="kpi"><div class="label">Total Equity (as-of)</div><div class="val">${money(bs.totals.equity)}</div></div>
        <div class="kpi"><div class="label">Balance Diff</div><div class="val">${money(bs.totals.balance_diff)}</div></div>
      </div>
      <div class="note" style="margin-top:10px">
        Balance validation: ${bs.validations.is_balanced ? tag("Balanced", "ok") : tag("Not Balanced", "bad")}
      </div>
    </div>

    <div class="card">
      <h2>Trial Balance Snapshot</h2>
      <div class="grid">
        <div class="kpi"><div class="label">Opening Balance Total</div><div class="val">${money(tb.totals.opening_balance)}</div></div>
        <div class="kpi"><div class="label">Period Debit</div><div class="val">${money(tb.totals.debit)}</div></div>
        <div class="kpi"><div class="label">Period Credit</div><div class="val">${money(tb.totals.credit)}</div></div>
        <div class="kpi"><div class="label">Closing Dr/Cr</div><div class="val">${money(tb.totals.closing_debit)} / ${money(tb.totals.closing_credit)}</div></div>
      </div>
    </div>
  </section>`;
}

function sectionJournalRegister(report: ReportResult): string {
  const entries = report.models.journalRegister.grouped.entries;
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;

  const rows = entries.map(e => `
    <tr data-filter-row="jr" data-date="${esc(e.date || "")}" data-text="${esc(`${e.journal_header_id} ${e.description}`)}">
      <td>${esc(fmtDate(e.date))}</td>
      <td class="muted"><a class="auditLink" data-audit-headers="${esc(e.journal_header_id)}" href="#audit">${esc(e.journal_header_id)}</a></td>
      <td>${esc(e.description || "")}</td>
      <td class="num">${money(e.total_debit)}</td>
      <td class="num">${money(e.total_credit)}</td>
      <td>${e.is_balanced ? tag("OK", "ok") : tag("NOT OK", "bad")}</td>
    </tr>
  `).join("");

  return `
  <section class="section" id="journal" data-section="journal" data-report="journal-register" data-title="Journal Register" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Journal Register", period, "journal-register")}
      <div class="section-title">
        <div class="right">${tag(`Entries: ${entries.length}`)}</div>
      </div>
      <div class="note">Ringkasan per <b>Journal Header</b> (chronological, filterable).</div>
      <div class="toolbar">
        <div class="right">
          <input id="jrFrom" class="input" type="date" />
          <input id="jrTo" class="input" type="date" />
        </div>
        <input id="jrSearch" class="input" placeholder="Search header/description..." />
      </div>
      <table class="audit-table">
        <colgroup>
          <col class="date" />
          <col class="header" />
          <col />
          <col class="debit" />
          <col class="credit" />
          <col class="status" />
        </colgroup>
        <thead><tr>
          <th>Tanggal</th><th>Journal Header ID</th><th>Deskripsi</th>
          <th class="num">Debit</th><th class="num">Credit</th><th>Status</th>
        </tr></thead>
        <tbody>${rows || ""}</tbody>
      </table>
    </div>
  </section>`;
}

function sectionGeneralLedger(report: ReportResult): string {
  const accounts = report.models.generalLedger.grouped.accounts;
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;

  const glCards = accounts.map(acc => {
    const dayRows = acc.days.map(day => {
      const lines = day.entries.map(r => {
        return `<tr>
          <td>${esc(fmtDate(r.transaction_date))}</td>
          <td class="muted">${esc(r.journal_header_id)}</td>
          <td>${esc(r.description || "")}</td>
          <td class="num">${money(r.debit)}</td>
          <td class="num">${money(r.credit)}</td>
          <td class="num"><b>${money(r.balance)}</b></td>
        </tr>`;
      }).join("");

      return `
        <tr>
          <td colspan="6" class="muted"><b>${esc(fmtDate(day.date || null))}</b> — Day Total: ${money(day.day_debit)} / ${money(day.day_credit)}</td>
        </tr>
        ${lines}
      `;
    }).join("");

    return `
      <div class="card" data-gl-account="${esc(acc.account.account_name)}">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:800">${esc(acc.account.account_name)}</div>
            <div class="muted" style="font-size:12px">
              ${esc(acc.account.account_type)} • ${esc(acc.account.account_category)} • Kelompok: ${esc(acc.account.kelompok_neraca || "-")}
            </div>
          </div>
          <div class="right">
            ${tag(`Opening: ${money(acc.opening_balance)}`)}
            ${tag(`Closing: ${money(acc.closing_balance)}`,"ok")}
          </div>
        </div>

        <table>
          <thead><tr>
            <th>Tanggal</th><th>Ref</th><th>Deskripsi</th>
            <th class="num">Debit</th><th class="num">Credit</th><th class="num">Saldo</th>
          </tr></thead>
          <tbody>${dayRows || ""}</tbody>
          <tfoot>
            <tr>
              <th colspan="3" class="num">Total</th>
              <th class="num">${money(acc.total_debit)}</th>
              <th class="num">${money(acc.total_credit)}</th>
              <th class="num">${money(acc.closing_balance)}</th>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }).join("");

  return `
  <section class="section" id="gl" data-section="gl" data-report="general-ledger" data-title="General Ledger" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("General Ledger", period, "general-ledger")}
      <div class="toolbar">
        <div class="note">Cari akun: ketik sebagian nama akun untuk filter ledger.</div>
        <input id="glSearch" class="input" placeholder="Search account name..." />
      </div>
    </div>
    ${glCards || `<div class="card"><div class="note">No GL data.</div></div>`}
  </section>`;
}

function sectionTrialBalance(report: ReportResult): string {
  const tb = report.models.trialBalance;
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;

  const rows = tb.grouped.rows.map(r => `
    <tr>
      <td>${esc(r.account.account_name)}</td>
      <td class="muted">${esc(r.account.account_type)}</td>
      <td class="muted">${esc(r.account.kelompok_neraca || "-")}</td>
      <td class="num">${money(r.opening_balance)}</td>
      <td class="num">${money(r.debit)}</td>
      <td class="num">${money(r.credit)}</td>
      <td class="num">${money(r.closing_debit)}</td>
      <td class="num">${money(r.closing_credit)}</td>
      <td class="num">${esc(r.journal_lines)}</td>
    </tr>
  `).join("");

  return `
  <section class="section" id="tb" data-section="tb" data-report="trial-balance" data-title="Trial Balance" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Trial Balance", period, "trial-balance")}
      <div class="note">Closing debit/credit disusun dari saldo akhir (balances should match).</div>
      <table>
        <thead><tr>
          <th>Akun</th><th>Tipe</th><th>Kelompok Neraca</th>
          <th class="num">Opening</th><th class="num">Period Debit</th><th class="num">Period Credit</th>
          <th class="num">Closing Debit</th><th class="num">Closing Credit</th><th class="num">Lines</th>
        </tr></thead>
        <tbody>${rows || ""}</tbody>
        <tfoot>
          <tr>
            <th colspan="3" class="num">Total</th>
            <th class="num">${money(tb.totals.opening_balance)}</th>
            <th class="num">${money(tb.totals.debit)}</th>
            <th class="num">${money(tb.totals.credit)}</th>
            <th class="num">${money(tb.totals.closing_debit)}</th>
            <th class="num">${money(tb.totals.closing_credit)}</th>
            <th></th>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>`;
}

function sectionProfitLoss(report: ReportResult): string {
  const pl = report.models.profitLoss;
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;

  const groupBlock = (group: typeof pl.grouped.income) => {
    const cats = group.categories.map(c => {
      const accounts = c.accounts.map(a => `<tr><td class="muted">${esc(a.account.account_name)}</td><td class="num">${money(a.amount)}</td><td>${auditLink(a.trace)}</td></tr>`).join("");
      return `
        <div class="card">
          <div class="section-title">
            <h3>${esc(c.category)}</h3>
            <div class="right">${tag(`Total: ${money(c.amount)}`)} ${auditLink(c.trace)}</div>
          </div>
          <table class="compact"><thead><tr><th>Akun</th><th class="num">Jumlah</th><th>Trace</th></tr></thead><tbody>${accounts || ""}</tbody></table>
        </div>
      `;
    }).join("");

    return `
      <div class="card">
        <div class="section-title">
          <h2>${group.type === "income" ? "Income" : "Expense"}</h2>
          <div class="right">${tag(`Total: ${money(group.total)}`)} ${auditLink(group.trace)}</div>
        </div>
        <div class="note">Multi-level grouping: category → account.</div>
      </div>
      ${cats || ""}
    `;
  };

  return `
  <section class="section" id="pl" data-section="pl" data-report="profit-loss" data-title="Profit & Loss" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Profit & Loss", period, "profit-loss")}
      <div class="grid">
        <div class="kpi"><div class="label">Total Income</div><div class="val">${money(pl.totals.income)}</div></div>
        <div class="kpi"><div class="label">Total Expense</div><div class="val">${money(pl.totals.expense)}</div></div>
        <div class="kpi"><div class="label">Net Profit</div><div class="val">${money(pl.totals.net_profit)}</div></div>
        <div class="kpi"><div class="label">Margin</div><div class="val">${pl.totals.income ? Math.round((pl.totals.net_profit / pl.totals.income) * 100) : 0}%</div></div>
      </div>
    </div>
    ${groupBlock(pl.grouped.income)}
    ${groupBlock(pl.grouped.expense)}
  </section>`;
}

function sectionBalanceSheet(report: ReportResult): string {
  const bs = report.models.balanceSheet;
  const period = `As of: ${fmtDate(report.periodTo)}`;

  const render = (arr: typeof bs.grouped.assets_current) => arr
    .sort((a, b) => (a.account.kelompok_neraca || "").localeCompare(b.account.kelompok_neraca || "") || a.account.account_name.localeCompare(b.account.account_name))
    .map(r => `<tr><td>${esc(r.account.kelompok_neraca || "-")}</td><td>${esc(r.account.account_name)}</td><td class="num">${money(r.balance)}</td><td>${auditLink(r.trace)}</td></tr>`)
    .join("");

  return `
  <section class="section" id="bs" data-section="bs" data-report="balance-sheet" data-title="Balance Sheet" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Balance Sheet (As of)", period, "balance-sheet")}
      <div class="note">Saldo akhir per akun dan validasi Aset = Liabilities + Equity.</div>
      <div class="grid" style="margin-top:10px">
        <div class="kpi"><div class="label">Assets</div><div class="val">${money(bs.totals.assets)}</div></div>
        <div class="kpi"><div class="label">Liabilities</div><div class="val">${money(bs.totals.liabilities)}</div></div>
        <div class="kpi"><div class="label">Equity</div><div class="val">${money(bs.totals.equity)}</div></div>
        <div class="kpi"><div class="label">Balance Diff</div><div class="val">${money(bs.totals.balance_diff)}</div></div>
      </div>
    </div>

    <div class="card">
      <h3>Aset Lancar</h3>
      <table><thead><tr><th>Kelompok</th><th>Akun</th><th class="num">Saldo</th><th>Trace</th></tr></thead><tbody>${render(bs.grouped.assets_current)}</tbody></table>
    </div>

    <div class="card">
      <h3>Aset Tidak Lancar</h3>
      <table><thead><tr><th>Kelompok</th><th>Akun</th><th class="num">Saldo</th><th>Trace</th></tr></thead><tbody>${render(bs.grouped.assets_noncurrent)}</tbody></table>
    </div>

    <div class="card">
      <h3>Aset Lainnya (Unclassified)</h3>
      <table><thead><tr><th>Kelompok</th><th>Akun</th><th class="num">Saldo</th><th>Trace</th></tr></thead><tbody>${render(bs.grouped.assets_uncategorized)}</tbody></table>
    </div>

    <div class="card">
      <h3>Liabilities Jangka Pendek</h3>
      <table><thead><tr><th>Kelompok</th><th>Akun</th><th class="num">Saldo</th><th>Trace</th></tr></thead><tbody>${render(bs.grouped.liabilities_short)}</tbody></table>
    </div>

    <div class="card">
      <h3>Liabilities Jangka Panjang</h3>
      <table><thead><tr><th>Kelompok</th><th>Akun</th><th class="num">Saldo</th><th>Trace</th></tr></thead><tbody>${render(bs.grouped.liabilities_long)}</tbody></table>
    </div>

    <div class="card">
      <h3>Liabilities Lainnya (Unclassified)</h3>
      <table><thead><tr><th>Kelompok</th><th>Akun</th><th class="num">Saldo</th><th>Trace</th></tr></thead><tbody>${render(bs.grouped.liabilities_uncategorized)}</tbody></table>
    </div>

    <div class="card">
      <h3>Equity & Retained Earnings</h3>
      <table><thead><tr><th>Kelompok</th><th>Akun</th><th class="num">Saldo</th><th>Trace</th></tr></thead><tbody>${render(bs.grouped.equity)}</tbody></table>
    </div>
  </section>`;
}

function sectionCashflow(report: ReportResult): string {
  const cf = report.models.cashflow;
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;
  const rows = (title: string, arr: typeof cf.grouped.operating) => `
    <div class="card">
      <h3>${title}</h3>
      <table><thead><tr><th>Activity</th><th class="num">Amount</th><th>Trace</th></tr></thead><tbody>${arr.map(a => `<tr><td>${esc(a.activity)}</td><td class="num">${money(a.amount)}</td><td>${auditLink(a.trace)}</td></tr>`).join("")}</tbody></table>
    </div>
  `;

  return `
  <section class="section" id="cf" data-section="cf" data-report="cash-flow" data-title="Cash Flow (Direct)" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Cash Flow (Direct)", period, "cash-flow")}
      <div class="grid">
        <div class="kpi"><div class="label">Cash Lines</div><div class="val">${esc(cf.raw_rows.length)}</div></div>
        <div class="kpi"><div class="label">Net Cash Change</div><div class="val">${money(cf.totals.net_change)}</div></div>
        <div class="kpi"><div class="label">Method</div><div class="val">Direct</div></div>
        <div class="kpi"><div class="label">Activities</div><div class="val">${esc(cf.grouped.operating.length + cf.grouped.investing.length + cf.grouped.financing.length + cf.grouped.uncategorized.length)}</div></div>
      </div>
      <div class="note" style="margin-top:10px">
        Metode direct mengandalkan flag <b>is_cash_account</b> dan <b>cashflow_activity</b>.
      </div>
    </div>
    ${rows("Operating Activities", cf.grouped.operating)}
    ${rows("Investing Activities", cf.grouped.investing)}
    ${rows("Financing Activities", cf.grouped.financing)}
    ${rows("Uncategorized", cf.grouped.uncategorized)}
  </section>`;
}

function sectionEquityChanges(report: ReportResult): string {
  const eq = report.models.equityChanges;
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;
  const rows = eq.grouped.rows.map(r => `
    <tr><td>${esc(r.account.account_name)}</td><td class="num">${money(r.opening_balance)}</td><td class="num">${money(r.net_change)}</td><td class="num">${money(r.closing_balance)}</td><td>${auditLink(r.trace)}</td></tr>
  `).join("");

  return `
  <section class="section" id="equity" data-section="equity" data-report="equity-changes" data-title="Statement of Changes in Equity" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Statement of Changes in Equity", period, "equity-changes")}
      <div class="grid">
        <div class="kpi"><div class="label">Opening Equity</div><div class="val">${money(eq.totals.opening_equity)}</div></div>
        <div class="kpi"><div class="label">Net Profit</div><div class="val">${money(eq.totals.net_profit)}</div></div>
        <div class="kpi"><div class="label">Equity Increase</div><div class="val">${money(eq.totals.equity_increase)}</div></div>
        <div class="kpi"><div class="label">Equity Decrease</div><div class="val">${money(eq.totals.equity_decrease)}</div></div>
      </div>
      <div class="note" style="margin-top:10px">Closing Equity = Opening + Net Profit + Equity Movements.</div>
      <div class="divider"></div>
      <div class="kpi"><div class="label">Closing Equity</div><div class="val">${money(eq.totals.closing_equity)}</div></div>
    </div>

    <div class="card">
      <h3>Equity Movement by Account</h3>
      <table><thead><tr><th>Akun</th><th class="num">Opening</th><th class="num">Change</th><th class="num">Closing</th><th>Trace</th></tr></thead><tbody>${rows || ""}</tbody></table>
    </div>
  </section>`;
}

function sectionComparativePL(report: ReportResult): string {
  const cmp = report.models.comparativeProfitLoss;
  if (!cmp) {
    return `
    <section class="section" id="plc" data-section="plc" data-report="comparative-pl" data-title="Comparative Profit & Loss" data-period="N/A">
      <div class="card">
        ${sectionHeaderHTML("Comparative Profit & Loss", "N/A", "comparative-pl")}
        <div class="note">Previous period not available.</div>
      </div>
    </section>`;
  }

  const renderSection = (section: typeof cmp.income) => {
    const rows = section.rows.map(r => `
      <tr>
        <td>${esc(r.label)}</td>
        <td class="num">${money(r.current)}</td>
        <td class="num">${money(r.previous)}</td>
        <td class="num">${money(r.variance)}</td>
        <td class="num">${r.variance_pct === null ? "-" : (Math.round(r.variance_pct * 1000) / 10) + "%"}</td>
      </tr>
    `).join("");

    return `
      <div class="card">
        <div class="section-title">
          <h3>${esc(section.label)}</h3>
          <div class="right">${tag(section.total.label)}</div>
        </div>
        <table><thead><tr><th>Category</th><th class="num">Current</th><th class="num">Previous</th><th class="num">Variance</th><th class="num">Var %</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><th>Total</th><th class="num">${money(section.total.current)}</th><th class="num">${money(section.total.previous)}</th><th class="num">${money(section.total.variance)}</th><th class="num">${section.total.variance_pct === null ? "-" : (Math.round(section.total.variance_pct * 1000) / 10) + "%"}</th></tr></tfoot>
        </table>
      </div>
    `;
  };

  return `
  <section class="section" id="plc" data-section="plc" data-report="comparative-pl" data-title="Comparative Profit & Loss" data-period="${esc(fmtRange(cmp.current_period.from || null, cmp.current_period.to || null))}">
    <div class="card">
      ${sectionHeaderHTML("Comparative Profit & Loss", `Current: ${fmtRange(cmp.current_period.from || null, cmp.current_period.to || null)}`, "comparative-pl")}
      <div class="note">Current period: ${esc(fmtRange(cmp.current_period.from || null, cmp.current_period.to || null))} | Previous: ${esc(fmtRange(cmp.previous_period.from || null, cmp.previous_period.to || null))}</div>
    </div>
    ${renderSection(cmp.income)}
    ${renderSection(cmp.expense)}
    <div class="card">
      <h3>Net Profit</h3>
      <table><thead><tr><th></th><th class="num">Current</th><th class="num">Previous</th><th class="num">Variance</th><th class="num">Var %</th></tr></thead>
      <tbody><tr><td>Net Profit</td><td class="num">${money(cmp.net_profit.current)}</td><td class="num">${money(cmp.net_profit.previous)}</td><td class="num">${money(cmp.net_profit.variance)}</td><td class="num">${cmp.net_profit.variance_pct === null ? "-" : (Math.round(cmp.net_profit.variance_pct * 1000) / 10) + "%"}</td></tr></tbody></table>
    </div>
  </section>`;
}

function sectionComparativeBS(report: ReportResult): string {
  const cmp = report.models.comparativeBalanceSheet;
  if (!cmp) {
    return `
    <section class="section" id="bsc" data-section="bsc" data-report="comparative-bs" data-title="Comparative Balance Sheet" data-period="N/A">
      <div class="card">
        ${sectionHeaderHTML("Comparative Balance Sheet", "N/A", "comparative-bs")}
        <div class="note">Previous period not available.</div>
      </div>
    </section>`;
  }

  const renderSection = (section: typeof cmp.assets) => {
    const rows = section.rows.map(r => `
      <tr>
        <td>${esc(r.label)}</td>
        <td class="num">${money(r.current)}</td>
        <td class="num">${money(r.previous)}</td>
        <td class="num">${money(r.variance)}</td>
        <td class="num">${r.variance_pct === null ? "-" : (Math.round(r.variance_pct * 1000) / 10) + "%"}</td>
      </tr>
    `).join("");

    return `
      <div class="card">
        <h3>${esc(section.label)}</h3>
        <table><thead><tr><th>Account</th><th class="num">Current</th><th class="num">Previous</th><th class="num">Variance</th><th class="num">Var %</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><th>Total</th><th class="num">${money(section.total.current)}</th><th class="num">${money(section.total.previous)}</th><th class="num">${money(section.total.variance)}</th><th class="num">${section.total.variance_pct === null ? "-" : (Math.round(section.total.variance_pct * 1000) / 10) + "%"}</th></tr></tfoot>
        </table>
      </div>
    `;
  };

  return `
  <section class="section" id="bsc" data-section="bsc" data-report="comparative-bs" data-title="Comparative Balance Sheet" data-period="${esc(fmtDate(cmp.current_as_of || null))}">
    <div class="card">
      ${sectionHeaderHTML("Comparative Balance Sheet", `As of: ${fmtDate(cmp.current_as_of || null)}`, "comparative-bs")}
      <div class="note">As-of current: ${esc(fmtDate(cmp.current_as_of || null))} | As-of previous: ${esc(fmtDate(cmp.previous_as_of || null))}</div>
    </div>
    ${renderSection(cmp.assets)}
    ${renderSection(cmp.liabilities)}
    ${renderSection(cmp.equity)}
    <div class="card">
      <h3>Totals</h3>
      <table><thead><tr><th></th><th class="num">Current</th><th class="num">Previous</th><th class="num">Variance</th><th class="num">Var %</th></tr></thead>
      <tbody>
        <tr><td>${esc(cmp.totals.assets.label)}</td><td class="num">${money(cmp.totals.assets.current)}</td><td class="num">${money(cmp.totals.assets.previous)}</td><td class="num">${money(cmp.totals.assets.variance)}</td><td class="num">${cmp.totals.assets.variance_pct === null ? "-" : (Math.round(cmp.totals.assets.variance_pct * 1000) / 10) + "%"}</td></tr>
        <tr><td>${esc(cmp.totals.liabilities.label)}</td><td class="num">${money(cmp.totals.liabilities.current)}</td><td class="num">${money(cmp.totals.liabilities.previous)}</td><td class="num">${money(cmp.totals.liabilities.variance)}</td><td class="num">${cmp.totals.liabilities.variance_pct === null ? "-" : (Math.round(cmp.totals.liabilities.variance_pct * 1000) / 10) + "%"}</td></tr>
        <tr><td>${esc(cmp.totals.equity.label)}</td><td class="num">${money(cmp.totals.equity.current)}</td><td class="num">${money(cmp.totals.equity.previous)}</td><td class="num">${money(cmp.totals.equity.variance)}</td><td class="num">${cmp.totals.equity.variance_pct === null ? "-" : (Math.round(cmp.totals.equity.variance_pct * 1000) / 10) + "%"}</td></tr>
        <tr><td>${esc(cmp.totals.liabilities_plus_equity.label)}</td><td class="num">${money(cmp.totals.liabilities_plus_equity.current)}</td><td class="num">${money(cmp.totals.liabilities_plus_equity.previous)}</td><td class="num">${money(cmp.totals.liabilities_plus_equity.variance)}</td><td class="num">${cmp.totals.liabilities_plus_equity.variance_pct === null ? "-" : (Math.round(cmp.totals.liabilities_plus_equity.variance_pct * 1000) / 10) + "%"}</td></tr>
      </tbody>
      </table>
    </div>
  </section>`;
}

function sectionAccountMovement(report: ReportResult): string {
  const mv = report.models.accountMovement;
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;
  const rows = mv.grouped.rows.map(r => `
    <tr>
      <td>${esc(r.account.account_name)}</td>
      <td class="muted">${esc(r.account.account_type)}</td>
      <td class="num">${money(r.opening_balance)}</td>
      <td class="num">${money(r.debit)}</td>
      <td class="num">${money(r.credit)}</td>
      <td class="num">${money(r.net_movement)}</td>
      <td class="num">${money(r.closing_balance)}</td>
      <td>${auditLink(r.trace)}</td>
    </tr>
  `).join("");

  return `
  <section class="section" id="movement" data-section="movement" data-report="account-movement" data-title="Account Movement Summary" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Account Movement Summary", period, "account-movement")}
      <div class="note">Opening + period movement = closing. Useful for audit readiness.</div>
      <table>
        <thead><tr>
          <th>Akun</th><th>Tipe</th><th class="num">Opening</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Net</th><th class="num">Closing</th><th>Trace</th>
        </tr></thead>
        <tbody>${rows || ""}</tbody>
        <tfoot>
          <tr>
            <th colspan="2" class="num">Total</th>
            <th class="num">${money(mv.totals.opening_balance)}</th>
            <th class="num">${money(mv.totals.debit)}</th>
            <th class="num">${money(mv.totals.credit)}</th>
            <th class="num">${money(mv.totals.closing_balance - mv.totals.opening_balance)}</th>
            <th class="num">${money(mv.totals.closing_balance)}</th>
            <th></th>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>`;
}

function sectionAuditTrail(report: ReportResult): string {
  const entries = report.models.auditTrail.grouped.entries;
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;

  const rows = entries.map(e => {
    const posted = Array.from(new Set(e.lines.map(l => l.posted_by).filter(Boolean))).join(", ") || "-";
    return `
    <tr data-filter-row="audit" data-date="${esc(e.date || "")}" data-text="${esc(`${e.journal_header_id} ${e.description}`)}">
      <td>${esc(fmtDate(e.date))}</td>
      <td class="muted">${esc(e.journal_header_id)}</td>
      <td>${esc(e.description || "")}</td>
      <td class="num">${money(e.total_debit)}</td>
      <td class="num">${money(e.total_credit)}</td>
      <td>${esc(posted)}</td>
      <td>${e.is_balanced ? tag("OK", "ok") : tag("NOT OK", "bad")}</td>
    </tr>
    <tr data-filter-row="audit" data-date="${esc(e.date || "")}" data-text="${esc(`${e.journal_header_id} ${e.description}`)}">
      <td colspan="7" class="audit-detail-cell">
        <div class="audit-detail-wrap">
          <table class="audit-detail">
            <colgroup>
              <col style="width:120px" />
              <col style="width:200px" />
              <col />
              <col style="width:140px" />
              <col style="width:140px" />
              <col style="width:140px" />
              <col style="width:90px" />
            </colgroup>
            <thead>
              <tr>
                <th>Tanggal</th><th>Account</th><th>Description</th><th class="num">Debit</th><th class="num">Credit</th><th>Posted By</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${e.lines.map(l => `
                <tr>
                  <td>${esc(fmtDate(l.transaction_date))}</td>
                  <td>${esc(l.account_name)}</td>
                  <td>${esc(l.description || "")}</td>
                  <td class="num">${money(l.debit)}</td>
                  <td class="num">${money(l.credit)}</td>
                  <td>${esc(l.posted_by || "-")}</td>
                  <td>${esc(l.status || "-")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  `;
  }).join("");

  return `
  <section class="section" id="audit" data-section="audit" data-report="audit-trail" data-title="Audit Trail" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Audit Trail", period, "audit-trail")}
      <div class="section-title">
        <div class="right">${tag(`Entries: ${entries.length}`)}</div>
      </div>
      <div class="note">Detail journal per header ID (drill-down lines).</div>
      <div class="toolbar">
        <div class="right">
          <input id="auditFrom" class="input" type="date" />
          <input id="auditTo" class="input" type="date" />
        </div>
        <input id="auditSearch" class="input" placeholder="Search header/description..." />
      </div>
      <table class="audit-table">
        <colgroup>
          <col class="date" />
          <col class="header" />
          <col />
          <col class="debit" />
          <col class="credit" />
          <col class="posted" />
          <col class="status" />
        </colgroup>
        <thead><tr>
          <th>Tanggal</th><th>Journal Header ID</th><th>Deskripsi</th>
          <th class="num">Debit</th><th class="num">Credit</th><th>Posted By</th><th>Status</th>
        </tr></thead>
        <tbody>${rows || ""}</tbody>
      </table>
    </div>
  </section>`;
}

function sectionAnalytics(report: ReportResult): string {
  const a = report.models.activitySummary;
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;

  const byType = a.by_type.map(x => `
    <tr><td>${esc(x.type)}</td><td class="num">${money(x.debit)}</td><td class="num">${money(x.credit)}</td><td class="num">${esc(x.lines)}</td></tr>
  `).join("");

  const byCat = a.by_category.slice(0, 50).map(x => `
    <tr><td>${esc(x.category)}</td><td class="num">${money(x.debit)}</td><td class="num">${money(x.credit)}</td><td class="num">${esc(x.lines)}</td></tr>
  `).join("");

  const top10 = a.top10_lines.map(x => `
    <tr><td>${esc(fmtDate(x.transaction_date))}</td><td>${esc(x.account_name)}</td><td class="muted">${esc(x.account_type)}</td><td>${esc(x.description)}</td><td class="num">${money(Math.max(x.debit, x.credit))}</td></tr>
  `).join("");

  return `
  <section class="section" id="analytics" data-section="analytics" data-report="analytics" data-title="Enterprise Analytics" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Enterprise Analytics", period, "analytics")}
      <div class="grid">
        <div class="kpi"><div class="label">Unique Accounts</div><div class="val">${esc(a.unique_accounts)}</div></div>
        <div class="kpi"><div class="label">Top Transactions Listed</div><div class="val">10</div></div>
        <div class="kpi"><div class="label">Category Rows Shown</div><div class="val">${Math.min(50, report.models.activitySummary.by_category.length)}</div></div>
        <div class="kpi"><div class="label">Notes</div><div class="val">Audit-ready</div></div>
      </div>
    </div>

    <div class="card">
      <h3>By Account Type</h3>
      <table><thead><tr><th>Type</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Lines</th></tr></thead><tbody>${byType}</tbody></table>
    </div>

    <div class="card">
      <h3>By Category (Top 50)</h3>
      <table><thead><tr><th>Category</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Lines</th></tr></thead><tbody>${byCat}</tbody></table>
    </div>

    <div class="card">
      <h3>Top 10 Largest Journal Lines</h3>
      <table><thead><tr><th>Date</th><th>Account</th><th>Type</th><th>Description</th><th class="num">Magnitude</th></tr></thead><tbody>${top10}</tbody></table>
    </div>
  </section>`;
}

function sectionRawData(report: ReportResult): string {
  const period = `Period: ${fmtRange(report.periodFrom, report.periodTo)}`;
  const rows = report.journals.map((r, idx) => `
    <tr data-raw-row="${idx}">
      <td>${esc(fmtDate(r.transaction_date))}</td>
      <td class="muted">${esc(r.journal_header_id)}</td>
      <td>${esc(r.account_name)}</td>
      <td class="num">${money(r.debit)}</td>
      <td class="num">${money(r.credit)}</td>
      <td>${esc(r.is_cash_account ? "true" : "false")}</td>
      <td>${esc(r.cashflow_activity || "")}</td>
      <td>${esc(r.description || "")}</td>
    </tr>
  `).join("");

  return `
  <section class="section" id="data" data-section="data" data-report="raw-data" data-title="Raw Data" data-period="${esc(period)}">
    <div class="card">
      ${sectionHeaderHTML("Raw Data", period, "raw-data")}
      <div class="note">Data mentah jurnal untuk kebutuhan audit dan verifikasi internal. Gunakan pagination untuk melihat data secara bertahap.</div>
      <div class="toolbar">
        <div class="pager">
          <button id="rawPrev" class="btn" type="button">Prev</button>
          <button id="rawNext" class="btn" type="button">Next</button>
          <span id="rawPageInfo" class="count">Page 1 / 1</span>
        </div>
        <div id="rawCount" class="count">0 rows</div>
      </div>
      <table>
        <thead><tr>
          <th>Date</th><th>Header</th><th>Account</th>
          <th class="num">Debit</th><th class="num">Credit</th>
          <th>is_cash</th><th>activity</th><th>Description</th>
        </tr></thead>
        <tbody>${rows || ""}</tbody>
      </table>
    </div>
  </section>`;
}

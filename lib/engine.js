/**
 * Optivuz Business — Accounting Engine (raw journals -> normalized -> report models)
 * Fokus: data mentah dari Glide, engine yang melakukan normalisasi & perhitungan.
 */

export function toNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function toBoolLoose(v) {
  // Glide: "true" atau "" (kosong)
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === "string") return v.trim().toLowerCase() === "true";
  return Boolean(v);
}

export function normalizeKelompok(v) {
  const s = (v ?? "").toString().trim();
  return s ? s : null;
}

/**
 * Glide kadang mengirim: "2026-01-29T00:00:0.Z"
 * Kita norm jadi "YYYY-MM-DD" untuk kebutuhan report.
 */
export function normalizeDate(s) {
  if (!s) return null;
  const str = String(s).trim();
  if (str.length >= 10 && /\d{4}-\d{2}-\d{2}/.test(str.slice(0, 10))) return str.slice(0, 10);
  const t = Date.parse(str);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

export function formatIDR(n) {
  const x = Math.round(n || 0);
  return x.toLocaleString("id-ID");
}

export function accountNormalFromType(accountType) {
  const t = String(accountType || "").toLowerCase();
  if (t === "asset" || t === "expense") return "debit";
  if (t === "liability" || t === "equity" || t === "income") return "credit";
  return "debit";
}

export function normalizePayload(payload) {
  const company = String(payload?.company || "").trim() || "Optivuz Business";
  const logo = String(payload?.logo || "").trim() || "";
  const address = String(payload?.address || "").trim() || "";
  const contact = String(payload?.contact || "").trim() || "";
  const periodFrom = normalizeDate(payload?.period?.from);
  const periodTo = normalizeDate(payload?.period?.to);

  const rows = Array.isArray(payload?.journals) ? payload.journals : [];

  const journals = rows.map((r) => {
    const debit = toNumber(r.debit);
    const credit = toNumber(r.credit);

    return {
      row_id: String(r.row_id || ""),
      journal_header_id: String(r.journal_header_id || ""),
      account_id: String(r.account_id || ""),
      account_name: String(r.account_name || ""),
      account_category: String(r.account_category || ""),
      account_type: String(r.account_type || ""),
      kelompok_neraca: normalizeKelompok(r.kelompok_neraca),
      is_cash_account: toBoolLoose(r.is_cash_account),
      cashflow_activity: String(r.cashflow_activity || "").trim() || null,
      debit,
      credit,
      amount_raw: toNumber(r.amount_raw),
      currency: String(r.currency || "IDR"),
      description: String(r.description || ""),
      transaction_date: normalizeDate(r.transaction_date),
      status: String(r.status || ""),
    };
  });

  return { company, logo, address, contact, periodFrom, periodTo, journals };
}

export function basicChecks(journals) {
  let totalDebit = 0;
  let totalCredit = 0;
  let missingDates = 0;

  for (const r of journals) {
    totalDebit += r.debit;
    totalCredit += r.credit;
    if (!r.transaction_date) missingDates += 1;
  }

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.0001;

  return { totalDebit, totalCredit, isBalanced, missingDates, rowCount: journals.length };
}

export function groupByAccount(journals) {
  const map = new Map();

  for (const r of journals) {
    const key = r.account_id || "(unknown)";
    if (!map.has(key)) {
      map.set(key, {
        account_id: r.account_id,
        account_name: r.account_name || "(Unknown Account)",
        account_category: r.account_category || "",
        account_type: r.account_type || "",
        kelompok_neraca: r.kelompok_neraca,
        normal_balance: accountNormalFromType(r.account_type),
        rows: [],
      });
    }
    map.get(key).rows.push(r);
  }

  for (const acc of map.values()) {
    acc.rows.sort((a, b) => {
      const da = a.transaction_date || "";
      const db = b.transaction_date || "";
      if (da !== db) return da.localeCompare(db);
      if (a.journal_header_id !== b.journal_header_id) return a.journal_header_id.localeCompare(b.journal_header_id);
      return (a.row_id || "").localeCompare(b.row_id || "");
    });
  }

  return Array.from(map.values()).sort((a, b) => (a.account_name || "").localeCompare(b.account_name || ""));
}

export function calcTrialBalance(journals) {
  const byAcc = new Map();

  for (const r of journals) {
    const k = r.account_id || "(unknown)";
    if (!byAcc.has(k)) {
      byAcc.set(k, {
        account_id: r.account_id,
        account_name: r.account_name || "(Unknown Account)",
        account_type: r.account_type || "",
        kelompok_neraca: r.kelompok_neraca,
        debit: 0,
        credit: 0,
        journal_lines: 0,
      });
    }
    const o = byAcc.get(k);
    o.debit += r.debit;
    o.credit += r.credit;
    o.journal_lines += 1;
  }

  const rows = Array.from(byAcc.values()).sort((a, b) => a.account_name.localeCompare(b.account_name));
  const totals = rows.reduce((s, r) => {
    s.debit += r.debit;
    s.credit += r.credit;
    return s;
  }, { debit: 0, credit: 0 });

  return { rows, totals };
}

export function calcProfitLoss(journals) {
  let income = 0;
  let expense = 0;

  const byCategory = new Map(); // breakdown by category
  const byAccount = new Map();

  for (const r of journals) {
    const t = String(r.account_type || "").toLowerCase();
    if (t !== "income" && t !== "expense") continue;

    const net = (t === "income") ? (r.credit - r.debit) : (r.debit - r.credit);

    const catKey = r.account_category || "(Uncategorized)";
    if (!byCategory.has(catKey)) byCategory.set(catKey, { category: catKey, type: t, amount: 0 });
    byCategory.get(catKey).amount += net;

    const accKey = r.account_id || "(unknown)";
    if (!byAccount.has(accKey)) byAccount.set(accKey, { account_id: r.account_id, account_name: r.account_name, type: t, amount: 0 });
    byAccount.get(accKey).amount += net;

    if (t === "income") income += net;
    if (t === "expense") expense += net;
  }

  const netProfit = income - expense;

  return {
    income,
    expense,
    netProfit,
    breakdown_by_category: Array.from(byCategory.values()).sort((a, b) => a.type.localeCompare(b.type) || a.category.localeCompare(b.category)),
    breakdown_by_account: Array.from(byAccount.values()).sort((a, b) => a.type.localeCompare(b.type) || (a.account_name || "").localeCompare(b.account_name || "")),
  };
}

export function calcBalanceSheet(journals) {
  // As-of ending balances per account (using account_type)
  const acc = new Map();

  for (const r of journals) {
    const id = r.account_id || "(unknown)";
    if (!acc.has(id)) {
      acc.set(id, {
        account_id: r.account_id,
        account_name: r.account_name || "(Unknown Account)",
        account_type: r.account_type || "",
        kelompok_neraca: r.kelompok_neraca,
        balance: 0,
      });
    }
    const o = acc.get(id);
    const t = String(r.account_type || "").toLowerCase();
    if (t === "asset" || t === "expense") o.balance += (r.debit - r.credit);
    else o.balance += (r.credit - r.debit); // liability/equity/income
  }

  const rows = Array.from(acc.values());

  const assets = rows.filter(r => String(r.account_type).toLowerCase() === "asset");
  const liabilities = rows.filter(r => String(r.account_type).toLowerCase() === "liability");
  const equity = rows.filter(r => String(r.account_type).toLowerCase() === "equity");

  const sum = (arr) => arr.reduce((s, x) => s + (x.balance || 0), 0);

  return {
    assets,
    liabilities,
    equity,
    totals: {
      assets: sum(assets),
      liabilities: sum(liabilities),
      equity: sum(equity),
      liabilities_plus_equity: sum(liabilities) + sum(equity),
    }
  };
}

export function calcCashflowDirect(journals) {
  // Direct method based on changes in cash/bank accounts
  const cashRows = journals.filter(r => r.is_cash_account);

  const byActivity = new Map();
  let netChange = 0;

  for (const r of cashRows) {
    const delta = r.debit - r.credit; // cash up/down
    netChange += delta;
    const act = r.cashflow_activity || "uncategorized";
    if (!byActivity.has(act)) byActivity.set(act, { activity: act, amount: 0 });
    byActivity.get(act).amount += delta;
  }

  const activities = Array.from(byActivity.values()).sort((a, b) => a.activity.localeCompare(b.activity));
  return { netChange, activities, cash_line_count: cashRows.length };
}

export function calcJournalRegister(journals) {
  // group by journal_header_id (header not included in payload; we reconstruct)
  const map = new Map();
  for (const r of journals) {
    const key = r.journal_header_id || "(no-header)";
    if (!map.has(key)) map.set(key, { journal_header_id: key, date: r.transaction_date, description: r.description, lines: [] });
    map.get(key).lines.push(r);
    // best-effort: set date/desc
    if (!map.get(key).date && r.transaction_date) map.get(key).date = r.transaction_date;
  }

  const entries = Array.from(map.values()).map(e => {
    let td = 0, tc = 0;
    for (const l of e.lines) { td += l.debit; tc += l.credit; }
    return { ...e, total_debit: td, total_credit: tc, is_balanced: Math.abs(td - tc) < 0.0001 };
  }).sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.journal_header_id.localeCompare(b.journal_header_id));

  return entries;
}

export function calcAccountActivitySummary(journals) {
  // enterprise-style analytics summary
  const uniqueAccounts = new Set();
  const byType = new Map();
  const byCategory = new Map();
  const topLines = [];

  for (const r of journals) {
    uniqueAccounts.add(r.account_id || "(unknown)");

    const t = r.account_type || "(unknown)";
    if (!byType.has(t)) byType.set(t, { type: t, debit: 0, credit: 0, lines: 0 });
    const bt = byType.get(t);
    bt.debit += r.debit; bt.credit += r.credit; bt.lines += 1;

    const c = r.account_category || "(Uncategorized)";
    if (!byCategory.has(c)) byCategory.set(c, { category: c, debit: 0, credit: 0, lines: 0, sample_type: t });
    const bc = byCategory.get(c);
    bc.debit += r.debit; bc.credit += r.credit; bc.lines += 1;

    const magnitude = Math.max(r.debit, r.credit);
    topLines.push({ magnitude, ...r });
  }

  topLines.sort((a, b) => b.magnitude - a.magnitude);
  const top10 = topLines.slice(0, 10);

  return {
    unique_accounts: uniqueAccounts.size,
    by_type: Array.from(byType.values()).sort((a, b) => a.type.localeCompare(b.type)),
    by_category: Array.from(byCategory.values()).sort((a, b) => a.category.localeCompare(b.category)),
    top10_lines: top10,
  };
}

export function buildAllReportModels(payload) {
  const normalized = normalizePayload(payload);
  const checks = basicChecks(normalized.journals);

  const byAccount = groupByAccount(normalized.journals);
  const trialBalance = calcTrialBalance(normalized.journals);
  const profitLoss = calcProfitLoss(normalized.journals);
  const balanceSheet = calcBalanceSheet(normalized.journals);
  const cashflow = calcCashflowDirect(normalized.journals);
  const journalRegister = calcJournalRegister(normalized.journals);
  const activitySummary = calcAccountActivitySummary(normalized.journals);

  return {
    ...normalized,
    checks,
    models: {
      byAccount,
      trialBalance,
      profitLoss,
      balanceSheet,
      cashflow,
      journalRegister,
      activitySummary,
    }
  };
}

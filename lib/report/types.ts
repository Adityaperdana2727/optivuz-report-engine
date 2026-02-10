export type JournalRow = {
  row_id: string;
  journal_header_id: string;
  account_id: string;
  account_name: string;
  account_category: string;
  account_type: string;
  kelompok_neraca: string | null;
  is_cash_account: boolean;
  cashflow_activity: string | null;
  debit: number;
  credit: number;
  amount_raw: number;
  currency: string;
  description: string;
  transaction_date: string | null; // YYYY-MM-DD
  status: string;
};

export type Account = {
  account_id: string;
  account_name: string;
  account_category: string;
  account_type: string;
  kelompok_neraca: string | null;
};

export type LedgerEntry = {
  transaction_date: string | null;
  journal_header_id: string;
  row_id: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  trace: TraceRef;
};

export type TrialBalanceRow = {
  account: Account;
  opening_balance: number;
  debit: number;
  credit: number;
  closing_balance: number;
  closing_debit: number;
  closing_credit: number;
  journal_lines: number;
  trace: TraceRef;
};

export type PnLRow = {
  account: Account;
  amount: number;
  trace: TraceRef;
};

export type BalanceSheetRow = {
  account: Account;
  group: string;
  balance: number;
  source: "account" | "retained_earnings";
  trace: TraceRef;
};

export type TraceRef = {
  row_ids: string[];
  header_ids: string[];
};

export type NormalizedPayload = {
  company: string;
  logo: string;
  address: string;
  contact: string;
  periodFrom: string | null;
  periodTo: string | null;
  journals: JournalRow[];
};

export type BasicChecks = {
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  missingDates: number;
  rowCount: number;
};

export type JournalRegisterEntry = {
  journal_header_id: string;
  date: string | null;
  description: string;
  lines: JournalRow[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  trace: TraceRef;
};

export type JournalRegisterReport = {
  raw_rows: JournalRow[];
  grouped: { entries: JournalRegisterEntry[] };
  totals: { total_debit: number; total_credit: number; entry_count: number };
  validations: { is_balanced: boolean };
};

export type LedgerDayGroup = {
  date: string | null;
  entries: LedgerEntry[];
  day_debit: number;
  day_credit: number;
  day_net: number;
  trace: TraceRef;
};

export type GeneralLedgerAccount = {
  account: Account;
  opening_balance: number;
  closing_balance: number;
  total_debit: number;
  total_credit: number;
  days: LedgerDayGroup[];
  trace: TraceRef;
};

export type GeneralLedgerReport = {
  raw_rows: JournalRow[];
  grouped: { accounts: GeneralLedgerAccount[] };
  totals: { total_debit: number; total_credit: number };
  validations: { is_balanced: boolean };
};

export type TrialBalanceReport = {
  raw_rows: JournalRow[];
  grouped: { rows: TrialBalanceRow[] };
  totals: { opening_balance: number; debit: number; credit: number; closing_balance: number; closing_debit: number; closing_credit: number };
  validations: { is_balanced: boolean };
};

export type PnLCategoryGroup = {
  category: string;
  amount: number;
  accounts: PnLRow[];
  trace: TraceRef;
};

export type PnLGroup = {
  type: "income" | "expense";
  total: number;
  categories: PnLCategoryGroup[];
  trace: TraceRef;
};

export type ProfitLossReport = {
  raw_rows: JournalRow[];
  grouped: { income: PnLGroup; expense: PnLGroup };
  totals: { income: number; expense: number; net_profit: number };
  validations: { is_balanced: boolean };
};

export type BalanceSheetReport = {
  raw_rows: JournalRow[];
  grouped: {
    assets_current: BalanceSheetRow[];
    assets_noncurrent: BalanceSheetRow[];
    assets_uncategorized: BalanceSheetRow[];
    liabilities_short: BalanceSheetRow[];
    liabilities_long: BalanceSheetRow[];
    liabilities_uncategorized: BalanceSheetRow[];
    equity: BalanceSheetRow[];
  };
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    liabilities_plus_equity: number;
    balance_diff: number;
  };
  validations: { is_balanced: boolean };
  retained_earnings: { amount: number; trace: TraceRef };
};

export type CashflowActivityRow = {
  activity: string;
  amount: number;
  trace: TraceRef;
};

export type CashflowReport = {
  raw_rows: JournalRow[];
  grouped: {
    operating: CashflowActivityRow[];
    investing: CashflowActivityRow[];
    financing: CashflowActivityRow[];
    uncategorized: CashflowActivityRow[];
  };
  totals: {
    net_change: number;
    operating: number;
    investing: number;
    financing: number;
    uncategorized: number;
  };
  validations: { net_matches: boolean };
};

export type AccountMovementRow = {
  account: Account;
  opening_balance: number;
  debit: number;
  credit: number;
  net_movement: number;
  closing_balance: number;
  journal_lines: number;
  trace: TraceRef;
};

export type AccountMovementReport = {
  raw_rows: JournalRow[];
  grouped: { rows: AccountMovementRow[] };
  totals: { opening_balance: number; debit: number; credit: number; closing_balance: number };
  validations: { is_balanced: boolean };
};

export type EquityChangeRow = {
  account: Account;
  opening_balance: number;
  net_change: number;
  closing_balance: number;
  trace: TraceRef;
};

export type EquityChangesReport = {
  raw_rows: JournalRow[];
  grouped: { rows: EquityChangeRow[] };
  totals: {
    opening_equity: number;
    net_profit: number;
    equity_increase: number;
    equity_decrease: number;
    closing_equity: number;
  };
  validations: { closing_matches: boolean };
};

export type ComparativeRow = {
  key: string;
  label: string;
  current: number;
  previous: number;
  variance: number;
  variance_pct: number | null;
  trace?: { current: TraceRef; previous: TraceRef };
};

export type ComparativeSection = {
  label: string;
  rows: ComparativeRow[];
  total: ComparativeRow;
};

export type ComparativeProfitLossReport = {
  income: ComparativeSection;
  expense: ComparativeSection;
  net_profit: ComparativeRow;
  current_period: { from: string | null; to: string | null };
  previous_period: { from: string | null; to: string | null };
};

export type ComparativeBalanceSheetReport = {
  assets: ComparativeSection;
  liabilities: ComparativeSection;
  equity: ComparativeSection;
  totals: {
    assets: ComparativeRow;
    liabilities: ComparativeRow;
    equity: ComparativeRow;
    liabilities_plus_equity: ComparativeRow;
  };
  current_as_of: string | null;
  previous_as_of: string | null;
};

export type AuditTrailEntry = {
  journal_header_id: string;
  date: string | null;
  description: string;
  lines: JournalRow[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  trace: TraceRef;
};

export type AuditTrailReport = {
  raw_rows: JournalRow[];
  grouped: { entries: AuditTrailEntry[] };
  totals: { total_debit: number; total_credit: number; entry_count: number };
  validations: { is_balanced: boolean };
};

export type ActivitySummary = {
  unique_accounts: number;
  by_type: { type: string; debit: number; credit: number; lines: number }[];
  by_category: { category: string; debit: number; credit: number; lines: number; sample_type: string }[];
  top10_lines: JournalRow[];
};

export type ReportModels = {
  journalRegister: JournalRegisterReport;
  generalLedger: GeneralLedgerReport;
  trialBalance: TrialBalanceReport;
  profitLoss: ProfitLossReport;
  balanceSheet: BalanceSheetReport;
  cashflow: CashflowReport;
  accountMovement: AccountMovementReport;
  equityChanges: EquityChangesReport;
  comparativeProfitLoss: ComparativeProfitLossReport | null;
  comparativeBalanceSheet: ComparativeBalanceSheetReport | null;
  auditTrail: AuditTrailReport;
  activitySummary: ActivitySummary;
};

export type ReportResult = NormalizedPayload & {
  checks: BasicChecks;
  models: ReportModels;
};

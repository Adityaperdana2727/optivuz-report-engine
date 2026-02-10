import type { ReportResult } from "./types";
import { normalizePayload } from "./normalize";
import { basicChecks } from "./checks";
import { filterByPeriod } from "./accounting";
import { calcJournalRegister, calcAuditTrail } from "./journal";
import { calcGeneralLedger } from "./ledger";
import { calcTrialBalance } from "./trialBalance";
import { calcProfitLoss } from "./profitLoss";
import { calcBalanceSheet } from "./balanceSheet";
import { calcCashflowDirect } from "./cashflow";
import { calcAccountMovementSummary } from "./accountMovement";
import { calcEquityChanges } from "./equity";
import { calcComparativeProfitLoss, calcComparativeBalanceSheet } from "./comparative";
import { calcAccountActivitySummary } from "./activitySummary";
import { addDays } from "./utils";
import { derivePreviousPeriod } from "./periods";

export function buildAllReportModels(payload: any): ReportResult {
  const normalized = normalizePayload(payload);
  const checks = basicChecks(normalized.journals);

  const periodFrom = normalized.periodFrom;
  const periodTo = normalized.periodTo;
  const previousPeriod = derivePreviousPeriod(periodFrom, periodTo);

  const currentJournals = filterByPeriod(normalized.journals, periodFrom, periodTo);
  const previousJournals = previousPeriod ? filterByPeriod(normalized.journals, previousPeriod.from, previousPeriod.to) : [];

  const journalRegister = calcJournalRegister(currentJournals);
  const generalLedger = calcGeneralLedger(normalized.journals, periodFrom, periodTo);
  const trialBalance = calcTrialBalance(normalized.journals, periodFrom, periodTo);
  const profitLoss = calcProfitLoss(currentJournals);

  const balanceSheet = calcBalanceSheet(normalized.journals, periodTo);
  const cashflow = calcCashflowDirect(currentJournals);

  const accountMovement = calcAccountMovementSummary(normalized.journals, periodFrom, periodTo);
  const equityChanges = calcEquityChanges(normalized.journals, periodFrom, periodTo, profitLoss.totals.net_profit);

  const comparativeProfitLoss = previousPeriod
    ? calcComparativeProfitLoss(currentJournals, previousJournals, { from: periodFrom, to: periodTo }, previousPeriod)
    : null;

  const previousAsOf = periodFrom ? addDays(periodFrom, -1) : null;
  const comparativeBalanceSheet = previousAsOf
    ? calcComparativeBalanceSheet(normalized.journals, periodTo, previousAsOf)
    : null;

  const auditTrail = calcAuditTrail(currentJournals);
  const activitySummary = calcAccountActivitySummary(currentJournals);

  return {
    ...normalized,
    checks,
    models: {
      journalRegister,
      generalLedger,
      trialBalance,
      profitLoss,
      balanceSheet,
      cashflow,
      accountMovement,
      equityChanges,
      comparativeProfitLoss,
      comparativeBalanceSheet,
      auditTrail,
      activitySummary,
    },
  };
}

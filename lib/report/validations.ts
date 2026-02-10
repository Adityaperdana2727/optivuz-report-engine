export function isCloseToZero(value: number, tolerance = 0.0001): boolean {
  return Math.abs(value) < tolerance;
}

export function isBalanced(totalDebit: number, totalCredit: number, tolerance = 0.0001): boolean {
  return Math.abs(totalDebit - totalCredit) < tolerance;
}

export function validateBalanceSheet(assets: number, liabilities: number, equity: number, tolerance = 0.0001): { is_balanced: boolean; diff: number } {
  const diff = assets - (liabilities + equity);
  return { is_balanced: Math.abs(diff) < tolerance, diff };
}

export function validateCashflow(netChange: number, sumActivities: number, tolerance = 0.0001): { net_matches: boolean; diff: number } {
  const diff = sumActivities - netChange;
  return { net_matches: Math.abs(diff) < tolerance, diff };
}

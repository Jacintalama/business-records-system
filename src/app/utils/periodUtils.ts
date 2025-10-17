// periodUtils.ts

/**
 * Options to control how period end is computed.
 */
export interface PeriodOptions {
  /**
   * "fixed"  = snap to calendar boundaries (quarters, halves, Dec 31).
   * "rolling"= add 3/6/12 months from date, then subtract 1 day.
   */
  rounding?: 'fixed' | 'rolling';
  /**
   * If using fixed rounding, payments made within this many days of the
   * current period end will be credited to the *next* period.
   * Example: 30 → 05/31 rolls from Jun 30 to Dec 31 for semi-annual.
   */
  earlyRolloverDays?: number;
}

/** Flexible date parser for "MM/DD/YYYY" or ISO-ish strings. */
function parseDateFlexible(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  if (dateStr.includes('/')) {
    const [mm, dd, yyyy] = dateStr.split('/').map(Number);
    return new Date(yyyy, (mm || 1) - 1, dd || 1);
  }
  // Fallback: let Date parse (supports "YYYY-MM-DD", ISO, etc.)
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date(NaN) : d;
}

function endOfMonth(year: number, monthIndex: number): Date {
  // monthIndex is 0-based; day 0 of next month gives last day of current
  return new Date(year, monthIndex + 1, 0);
}

function quarterEndFixed(d: Date): Date {
  const y = d.getFullYear();
  const m = d.getMonth();
  if (m <= 2) return endOfMonth(y, 2);  // Mar 31
  if (m <= 5) return endOfMonth(y, 5);  // Jun 30
  if (m <= 8) return endOfMonth(y, 8);  // Sep 30
  return endOfMonth(y, 11);             // Dec 31
}

function halfEndFixed(d: Date): Date {
  const y = d.getFullYear();
  const m = d.getMonth();
  return m <= 5 ? endOfMonth(y, 5) : endOfMonth(y, 11); // Jun 30 or Dec 31
}

function yearEndFixed(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31); // Dec 31 of same year
}

function addMonths(date: Date, months: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const tmp = new Date(y, m + months, 1);
  // clamp to end of month after shifting months
  const last = endOfMonth(tmp.getFullYear(), tmp.getMonth()).getDate();
  return new Date(tmp.getFullYear(), tmp.getMonth(), Math.min(d, last));
}

function rollingEnd(date: Date, months: number): Date {
  // Add N months, then subtract 1 day.
  const plus = addMonths(date, months);
  return new Date(plus.getFullYear(), plus.getMonth(), plus.getDate() - 1);
}

function nextFixedPeriodEnd(currentEnd: Date, frequency: string): Date {
  const y = currentEnd.getFullYear();
  const m = currentEnd.getMonth(); // 2,5,8,11 ↔ quarters; 5,11 ↔ halves
  const f = frequency.toLowerCase();

  if (f === 'quarterly') {
    if (m === 2) return endOfMonth(y, 5);       // -> Jun 30
    if (m === 5) return endOfMonth(y, 8);       // -> Sep 30
    if (m === 8) return endOfMonth(y, 11);      // -> Dec 31
    // m === 11
    return endOfMonth(y + 1, 2);                // -> Mar 31 next year
  }
  if (f === 'semi-annual') {
    if (m === 5) return endOfMonth(y, 11);      // Jun 30 -> Dec 31 same year
    // m === 11
    return endOfMonth(y + 1, 5);                // Dec 31 -> Jun 30 next year
  }
  // annual
  return new Date(y + 1, 11, 31);               // Dec 31 next year
}

/**
 * Compute the end date of the period for a record.
 * Default behavior matches your old logic (fixed calendar boundaries).
 * Use options to support early-rollover and/or rolling coverage.
 */
export const computePeriodEnd = (
  dateStr: string,
  frequency: 'quarterly' | 'semi-annual' | 'annual' | string,
  options?: PeriodOptions
): Date => {
  const rounding = options?.rounding ?? 'fixed';
  const earlyRolloverDays = options?.earlyRolloverDays ?? 0;

  const recordDate = parseDateFlexible(dateStr);
  if (isNaN(recordDate.getTime())) return new Date(NaN);

  const f = (frequency || '').toLowerCase();

  if (rounding === 'rolling') {
    // Coverage ends after N months from *payment* date
    if (f === 'quarterly') return rollingEnd(recordDate, 3);
    if (f === 'semi-annual') return rollingEnd(recordDate, 6);
    return rollingEnd(recordDate, 12);
  }

  // Fixed calendar boundaries (original behavior)
  let end: Date;
  if (f === 'quarterly') end = quarterEndFixed(recordDate);
  else if (f === 'semi-annual') end = halfEndFixed(recordDate);
  else end = yearEndFixed(recordDate);

  if (earlyRolloverDays > 0) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.ceil((end.getTime() - recordDate.getTime()) / msPerDay);
    // If we're within the window, credit to the NEXT period instead
    if (diffDays >= 0 && diffDays <= earlyRolloverDays) {
      return nextFixedPeriodEnd(end, f);
    }
  }

  return end;
};

/** Record interface for evaluating delinquency. */
export interface Record {
  date: string;
  frequency: 'quarterly' | 'semi-annual' | 'annual' | string;
  renewed: boolean;
}

/**
 * A record is delinquent if NOT renewed and today is past the computed period end.
 * Pass the same options you use for computePeriodEnd to keep behavior consistent.
 */
export const isRecordDelinquentExact = (
  record: Record,
  options?: PeriodOptions
): boolean => {
  if (record.renewed) return false;
  const periodEnd = computePeriodEnd(record.date, record.frequency, options);
  return new Date().getTime() > periodEnd.getTime();
};

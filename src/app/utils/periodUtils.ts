
/**
 * Computes the end date of the period for a record based on its frequency.
 * For quarterly, it returns the last day of the quarter.
 * For semi-annual, it returns the last day of the half-year period.
 * For annual, it returns December 31 of the record's year.
 *
 * @param dateStr - The record date in "DD/MM/YYYY" format.
 * @param frequency - The frequency: "quarterly", "semi-annual", or "annual".
 * @returns The end date of the period.
 */
export const computePeriodEnd = (dateStr: string, frequency: string): Date => {
    let recordDate: Date;
  
    // Parse the date string assuming "DD/MM/YYYY" format.
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split("/").map(Number);
      recordDate = new Date(year, month - 1, day);
    } else {
      recordDate = new Date(dateStr);
    }
  
    const year = recordDate.getFullYear();
  
    if (frequency === 'quarterly') {
      const month = recordDate.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
      let quarterEndMonth: number;
      if (month < 3) {
        quarterEndMonth = 2; // Q1 ends in March (index 2)
      } else if (month < 6) {
        quarterEndMonth = 5; // Q2 ends in June (index 5)
      } else if (month < 9) {
        quarterEndMonth = 8; // Q3 ends in September (index 8)
      } else {
        quarterEndMonth = 11; // Q4 ends in December (index 11)
      }
      // The last day of the quarter (month + 1 with day 0 gives the last day of previous month)
      return new Date(year, quarterEndMonth + 1, 0);
    }
  
    if (frequency === 'semi-annual') {
      const month = recordDate.getMonth();
      const periodEndMonth = month < 6 ? 5 : 11; // First half ends in June (index 5), second half in December (index 11)
      return new Date(year, periodEndMonth + 1, 0);
    }
  
    if (frequency === 'annual') {
      // For annual records, the period ends on December 31.
      return new Date(year, 11, 31);
    }
  
    // Fallback: if frequency isn't recognized, return the original record date.
    return recordDate;
  };
  
  /**
   * Record interface for evaluating delinquency.
   */
  export interface Record {
    date: string;
    frequency: 'quarterly' | 'semi-annual' | 'annual' | string;
    renewed: boolean;
  }
  
  /**
   * Checks if a record is delinquent based on its period end date.
   * A record is considered delinquent if it has not been renewed and
   * the current date is past the computed period end.
   *
   * @param record - The record with date, frequency, and renewed flag.
   * @returns True if the record is delinquent; otherwise, false.
   */
  export const isRecordDelinquentExact = (record: Record): boolean => {
    const currentDate = new Date();
    if (record.renewed) return false;
    const periodEnd = computePeriodEnd(record.date, record.frequency);
    return currentDate > periodEnd;
  };
  
export interface BusinessRecord {
  applicant: boolean;
  id: string; // updated for UUID
  applicantName: string;
  applicantAddress: string;
  businessName: string;
  capitalInvestment: string;
  year: number;
  date: string;
  gross: number;
  orNo: string;
  busTax: number;
  mayorsPermit: number;
  sanitaryInps: number;
  policeClearance: number;
  taxClearance: number;
  garbage: number;
  verification: number;
  weightAndMass: number;
  healthClearance: number;
  secFee: number;
  menro: number;
  docTax: number;
  eggsFee: number;
  market: number;
  surcharge25: number;
  surcharge5: number;
  totalPayment: number;
  remarks: string;
}

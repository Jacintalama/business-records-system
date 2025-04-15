export interface BusinessRecord {
  applicant: boolean;
  id: string; // updated for UUID
  applicantName: string;
  applicantAddress: string;
  businessName: string;
  natureOfBusiness: string; // new field: represents Nature of Business
  capitalInvestment: string;
  year: number;
  date: string;
  gross: number;
  orNo: string;
  busTax: number;
  mayorsPermit: number;
  mayorsPermitVideoK: string; // new field: next to mayorsPermit
  mayorsPermitHouseAccommodation: string; // new field: next to mayorsPermit
  sanitaryInps: number;
  policeClearance: number;
  barangayClearance: string; // new field: added after policeClearance
  zoningClearance?: string; // existing new field; adjust optional status as needed
  taxClearance: number;
  garbage: number;
  garbageCollection: string; // new field
  polluters: string;         // new field
  Occupation: string;        // new field
  verification: number;
  weightAndMass: number;
  healthClearance: number;
  secFee: number;
  menro: number;
  docTax: number;
  eggsFee: number;
  marketCertification: string; // new field
  surcharge25: number;
  sucharge2: number; // renamed from surcharge5
  miscellaneous: string; // new field
  totalPayment: number;
  remarks: string;
  frequency: 'quarterly' | 'semi-annual' | 'annual'; // new field for renewal frequency
  renewed: boolean; // new field to indicate if the record has been renewed
  Other?: string; // new field added for additional notes (optional)
}

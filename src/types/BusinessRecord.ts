// types/BusinessRecord.ts

// Represents one permit on a business record, with its amount
export interface BusinessRecordPermit {
  mayorPermitId: number;
  amount: number;
}

// Your main record type
export interface BusinessRecord {
  id: string;                        // UUID
  applicant: boolean;
  applicantName: string;
  applicantAddress: string;
  businessName: string;
  natureOfBusiness: string;          // new
  capitalInvestment: string;
  year: number;
  date: string;                      // ISO “YYYY‑MM‑DD”
  gross: number;
  orNo: string;
  busTax: number;

  // Your MP fields:
  mayorsPermit: number;
  mayorsPermitVideoK: string;                // new
  mayorsPermitHouseAccommodation: string;    // new

  sanitaryInps: number;
  policeClearance: number;
  barangayClearance: string;      // new
  zoningClearance?: string;       // optional
  taxClearance: number;
  garbage: number;
  garbageCollection: string;      // new
  polluters: string;              // new
  Occupation: string;             // new
  verification: number;
  weightAndMass: number;
  healthClearance: number;
  secFee: number;
  menro: number;
  docTax: number;
  eggsFee: number;
  marketCertification: string;    // new
  surcharge25: number;
  sucharge2: number;              // renamed from surcharge5
  miscellaneous: string;          // new
  totalPayment: number;
  remarks: string;
  frequency: 'quarterly' | 'semi-annual' | 'annual';
  renewed: boolean;
  Other?: string;                 // optional notes

  // If you want to include the join‑table entries:
  permits?: BusinessRecordPermit[];
}

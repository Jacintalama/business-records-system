// src/utils/columnGroups.ts

import type { BusinessRecord } from "@/types/BusinessRecord";
import { computePeriodEnd } from "./periodUtils";

// A single column in the print table:
export interface Column {
  key: keyof BusinessRecord | "expiredDate";
  label: string;
  format?: (val: any) => string;
}

// A group of columns under one heading:
export interface ColumnGroup {
  label: string;
  columns: Column[];
}

// Your grouped column definitions:
export const columnGroups: ColumnGroup[] = [
  {
    label: "Basic Info",
    columns: [
      { key: "year", label: "Year" },
      {
        key: "date",
        label: "Date",
        format: (val) => new Date(val as string).toLocaleDateString(),
      },
      { key: "gross", label: "Gross" },
      { key: "orNo", label: "OR No." },
    ],
  },
  {
    label: "Fees & Clearances",
    columns: [
      { key: "busTax", label: "BUS TAX" },
      { key: "mayorsPermit", label: "Mayor's Permit" },
      { key: "sanitaryInps", label: "Sanitary Inps" },
      { key: "policeClearance", label: "Police Clearance" },
      { key: "barangayClearance", label: "Barangay Clearance" },
      { key: "zoningClearance", label: "Zoning Clearance" },
      { key: "taxClearance", label: "Tax Clearance" },
      { key: "garbage", label: "Garbage" },
      { key: "verification", label: "Verification" },
      { key: "weightAndMass", label: "Weight & Mass" },
      { key: "healthClearance", label: "Health Clearance" },
      { key: "secFee", label: "SEC Fee" },
      { key: "menro", label: "MENRO" },
      { key: "docTax", label: "Doc Tax" },
      { key: "eggsFee", label: "Egg's Fee" },
    ],
  },
  {
    label: "Surcharges",
    columns: [
      { key: "surcharge25", label: "25% Surcharge" },
      { key: "sucharge2", label: "2% Month" },
    ],
  },
  {
    label: "Additional Details",
    columns: [
      { key: "garbageCollection", label: "Garbage Collection" },
      { key: "polluters", label: "Polluters" },
      { key: "Occupation", label: "Occupation" },
    ],
  },
  {
    label: "Additional Info",
    columns: [
      { key: "marketCertification", label: "Market Certification" },
      { key: "miscellaneous", label: "Miscellaneous" },
    ],
  },
  {
    label: "Totals & Remarks",
    columns: [
      { key: "totalPayment", label: "Total Payment" },
      { key: "remarks", label: "Remarks" },
      { key: "frequency", label: "Frequency" },
      {
        key: "renewed",
        label: "Renewed",
        format: (val) => (val ? "Yes" : "No"),
      },
    ],
  },
  {
    label: "Others",
    columns: [{ key: "Other", label: "Other" }],
  },
  {
    label: "Expiration",
    columns: [{ key: "expiredDate", label: "Expired Date" }],
  },
];
export { computePeriodEnd };


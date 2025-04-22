// src/components/PrintView.tsx
"use client";

import React from "react";
import Image from "next/image";
import type { BusinessRecord } from "@/types/BusinessRecord";
import type { Column, ColumnGroup } from "../utils/columnGroups"

import { columnGroups, computePeriodEnd } from "../utils/columnGroups"

export interface OwnerInfo {
  applicantName: string;
  address: string;
  businessName: string;
  natureOfBusiness: string;
  capitalInvestment: string;
  applicantId: string;
}

interface PrintViewProps {
  ownerInfo: OwnerInfo | null;
  records: BusinessRecord[];
}

const PrintView: React.FC<PrintViewProps> = ({ ownerInfo, records }) => (
  <div className="print-container p-4">
    {/* Logos */}
    <div className="flex justify-between mb-6">
      <Image src="/Logo1.png" alt="Logo" width={180} height={60} />
      <Image src="/maasenso.png" alt="Maasenso" width={180} height={60} />
    </div>

    {/* Applicant Header */}
    {ownerInfo && (
      <div className="mb-6">
        <p><strong>Name of the Applicant:</strong> {ownerInfo.applicantName}</p>
        <p><strong>Address:</strong> {ownerInfo.address}</p>
        <p><strong>Name of Business:</strong> {ownerInfo.businessName}</p>
        <p><strong>Nature of Business:</strong> {ownerInfo.natureOfBusiness}</p>
        <p><strong>Capital Investment:</strong> {ownerInfo.capitalInvestment}</p>
      </div>
    )}

    {/* Records Table */}
    <table className="w-full border-collapse">
      <thead>
        {/* Group Headers */}
        <tr>
          {columnGroups.map((group: ColumnGroup) => (
            <th
              key={group.label}
              colSpan={group.columns.length}
              className="border px-2 py-1 text-center bg-gray-200"
            >
              {group.label}
            </th>
          ))}
        </tr>
        {/* Column Headers */}
        <tr>
          {columnGroups.flatMap((group: ColumnGroup) =>
            group.columns.map((col: Column) => (
              <th
                key={col.key}
                className="border px-2 py-1 text-left bg-gray-100"
              >
                {col.label}
              </th>
            ))
          )}
        </tr>
      </thead>
      <tbody>
        {records.map((rec) => (
          <tr key={rec.id} className="page-break-inside-avoid">
            {columnGroups.flatMap((group: ColumnGroup) =>
              group.columns.map((col: Column) => {
                let val: any = (rec as any)[col.key] ?? "";
                if (col.key === "expiredDate") {
                  val = computePeriodEnd(rec.date, rec.frequency).toLocaleDateString();
                } else if (col.format) {
                  val = col.format(val);
                }
                return (
                  <td key={col.key} className="border px-2 py-1">
                    {String(val)}
                  </td>
                );
              })
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default PrintView;

"use client";

import React, { useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { FaFilePdf } from "react-icons/fa";

interface TableColumn {
  key: string;
  label: string;
  format?: (val: any) => string;
}

interface BusinessRecordsPdfProps {
  selectedBarangay: string;
  tableColumns: TableColumn[];
  data: any[];
}

const BusinessRecordsPdf: React.FC<BusinessRecordsPdfProps> = ({
  selectedBarangay,
  tableColumns,
  data,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const reactToPrintContent = useCallback(() => printRef.current, []);
  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    contentRef: printRef,
    documentTitle: `Barangay ${selectedBarangay} Business Records`,
  } as any);

  return (
    <div className="mb-4">
      <button
        onClick={() => handlePrint && handlePrint()}
        className="px-4 py-2 bg-purple-600 text-white font-semibold rounded shadow hover:bg-purple-500 transition-colors"
      >
        <FaFilePdf className="inline-block mr-2" /> Print PDF
      </button>

      <div ref={printRef} className="printableContent">
        <h2 className="text-2xl font-bold mb-4">
          Barangay {selectedBarangay} Business Records
        </h2>
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {tableColumns.map((col) => (
                <th key={col.key} className="border px-2 py-1">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length ? (
              data.map((applicant: any) => (
                <tr key={applicant.id}>
                  {tableColumns.map((col) => {
                    let raw = applicant[col.key] ?? "";
                    if (col.key === "date" && col.format) {
                      raw = col.format(applicant.date);
                    }
                    const formatMoney = (val: any) =>
                      `₱${parseFloat(val)
                        .toFixed(2)
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
                    const display =
                      col.key === "gross" || col.key === "totalPayment"
                        ? formatMoney(raw)
                        : col.format
                        ? col.format(raw)
                        : raw;
                    return (
                      <td key={col.key} className="border px-2 py-1">
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableColumns.length} className="text-center py-4">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media screen {
          .printableContent {
            position: absolute;
            top: -1000px;
            left: 0;
            opacity: 0;
            pointer-events: none;
          }
        }

        @media print {
          /* make the hidden container visible */
          .printableContent {
            position: static;
            top: 0;
            left: 0;
            opacity: 1;
            pointer-events: auto;
          }

          /* ensure the table spans full width and header repeats */
          .printableContent table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            page-break-after: auto;
          }

          /* repeat the header on each page */
          .printableContent thead {
            display: table-header-group;
          }

          /* if you have a footer, you can repeat it too */
          .printableContent tfoot {
            display: table-footer-group;
          }

          /* avoid breaking rows across pages */
          .printableContent tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessRecordsPdf;

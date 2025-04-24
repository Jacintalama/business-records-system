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
  data: any[]; // Replace with a proper type for your applicant data if available.
}

const BusinessRecordsPdf: React.FC<BusinessRecordsPdfProps> = ({
  selectedBarangay,
  tableColumns,
  data,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Stable callback returning the print ref.
  const reactToPrintContent = useCallback(() => printRef.current, []);

  // Cast options to any if TypeScript complains.
  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    // Some versions of react-to-print may expect a property named "contentRef".
    contentRef: printRef,
    documentTitle: ` Barangay ${selectedBarangay} Business Records`,
  } as any);

  return (
    <div className="mb-4">
      <button
        onClick={() => handlePrint && handlePrint()}
        className="px-4 py-2 bg-purple-600 text-white font-semibold rounded shadow hover:bg-purple-500 transition-colors"
      >
        <FaFilePdf className="inline-block mr-2" /> Print PDF
      </button>

      {/* 
        The following div contains the printable content.
        It is hidden off-screen during normal viewing (via the CSS class), 
        but is forced to display properly when printing.
      */}
      <div ref={printRef} className="printableContent">
        <h2 className="text-2xl font-bold mb-4">
          Barangay {selectedBarangay} Business Records
        </h2>
        <table className="w-full border-collapse">
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
                    let value: any = applicant[col.key] || "";
                    if (col.key === "date" && col.format) {
                      value = col.format(applicant.date);
                    }
                    return (
                      <td key={col.key} className="border px-2 py-1">
                      {col.key === "totalPayment"
                        ? `₱${parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                        : value}
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

      {/* Global styles to control the visibility of the printable content */}
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
          .printableContent {
            position: static;
            top: 0;
            left: 0;
            opacity: 1;
            pointer-events: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessRecordsPdf;

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface PaymentRecord {
  id: number;
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

interface OwnerInfo {
  applicantName: string;
  address: string;
  businessName: string;
  capitalInvestment: string;
}

// --- Define grouped columns for easier reading ---
const columnGroups = [
  {
    label: 'Basic Info',
    columns: [
      { key: 'year', label: 'Year' },
      {
        key: 'date',
        label: 'Date',
        format: (val: string) => new Date(val).toLocaleDateString(),
      },
      { key: 'gross', label: 'Gross' },
      { key: 'orNo', label: 'OR No.' },
    ],
  },
  {
    label: 'Fees & Clearances',
    columns: [
      { key: 'busTax', label: 'BUS TAX' },
      { key: 'mayorsPermit', label: "Mayor's Permit" },
      { key: 'sanitaryInps', label: 'Sanitary Inps' },
      { key: 'policeClearance', label: 'Police Clearance' },
      { key: 'taxClearance', label: 'Tax Clearance' },
      { key: 'garbage', label: 'Garbage' },
      { key: 'verification', label: 'Verification' },
      { key: 'weightAndMass', label: 'Weight & Mass' },
      { key: 'healthClearance', label: 'Health Clearance' },
      { key: 'secFee', label: 'SEC Fee' },
      { key: 'menro', label: 'MENRO' },
      { key: 'docTax', label: 'Doc Tax' },
      { key: 'eggsFee', label: "Egg's Fee" },
      { key: 'market', label: 'Market' },
    ],
  },
  {
    label: 'Surcharges',
    columns: [
      { key: 'surcharge25', label: '25% Surcharge' },
      { key: 'surcharge5', label: '5% Surcharge' },
    ],
  },
  {
    label: 'Totals & Remarks',
    columns: [
      { key: 'totalPayment', label: 'Total Payment' },
      { key: 'remarks', label: 'Remarks' },
    ],
  },
];

export default function DetailedRecordsPage() {
  const searchParams = useSearchParams();
  const ownerId = searchParams.get('ownerId') || '';
  const barangay = searchParams.get('barangay') || '';

  // States for fetched records and owner info
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function fetchData() {
      const formattedBarangay = barangay.toLowerCase().trim();

      try {
        const res = await fetch(
          `http://localhost:3000/api/business-record?ownerId=${encodeURIComponent(
            ownerId
          )}&barangay=${encodeURIComponent(formattedBarangay)}`
        );

        if (res.ok) {
          const data = await res.json();
          setRecords(data.records);
          setOwnerInfo(data.ownerInfo);
        } else {
          const errorData = await res.json();
          console.error('Response error:', errorData.message);
        }
      } catch (error) {
        console.error('Error fetching records:', error);
      }
    }

    if (ownerId) {
      fetchData();
    }
  }, [ownerId, barangay]);

  // Pagination
  const totalPages = Math.ceil(records.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRecords = records.slice(startIndex, startIndex + pageSize);

  return (
    <div className="w-full p-4">
      {/* Back Link */}
      <div className="mb-4">
        <Link
          href={`/businessrecord?barangay=${barangay}`}
          className="inline-flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200 ease-in-out"
        >
          &larr; Back to Business Records
        </Link>
      </div>

      {/* Centered Logo */}
      <div className="flex justify-center mb-8">
        <Image src="/Logo1.png" alt="Logo" width={180} height={10} className="object-contain" />
      </div>

      {/* Header with Owner Details */}
      <header className="mb-8">
        {ownerInfo ? (
          <div className="flex flex-col md:flex-row justify-between gap-6">
            {/* Left Column */}
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-semibold text-gray-700">
                Name of the Applicant:
              </label>
              <div className="border-b border-gray-400 py-1 text-gray-800">
                {ownerInfo.applicantName}
              </div>

              <label className="block text-sm font-semibold text-gray-700 mt-4">
                Address:
              </label>
              <div className="border-b border-gray-400 py-1 text-gray-800">
                {ownerInfo.address}
              </div>
            </div>
            {/* Right Column */}
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-semibold text-gray-700">
                Name of Business:
              </label>
              <div className="border-b border-gray-400 py-1 text-gray-800">
                {ownerInfo.businessName}
              </div>

              <label className="block text-sm font-semibold text-gray-700 mt-4">
                Capital Investment:
              </label>
              <div className="border-b border-gray-400 py-1 text-gray-800">
                {ownerInfo.capitalInvestment}
              </div>
            </div>
          </div>
        ) : (
          <h1 className="text-3xl font-bold">Detailed Records</h1>
        )}
      </header>

      {/* Records Table */}
      {records.length === 0 ? (
        <p className="text-center text-gray-600">No records found for this owner.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            {/* --- Multi-row header with grouping --- */}
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {columnGroups.map((group) => (
                  <th
                    key={group.label}
                    colSpan={group.columns.length}
                    className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-gray-300"
                  >
                    {group.label}
                  </th>
                ))}
              </tr>
              <tr>
                {columnGroups.map((group) =>
                  group.columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-300"
                    >
                      {col.label}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRecords.map((record) => (
                <tr
                  key={record.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  {columnGroups.map((group) =>
                    group.columns.map((col) => {
                      const rawValue = (record as any)[col.key];
                      const displayValue = col.format ? col.format(rawValue) : rawValue;
                      return (
                        <td key={col.key} className="px-4 py-2 text-gray-700">
                          {displayValue}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded ${page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600'
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

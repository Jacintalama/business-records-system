'use client';

import { useState, useEffect, ChangeEvent } from 'react';
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

export default function DetailedRecordsPage() {
  const searchParams = useSearchParams();
  const ownerId = searchParams.get('ownerId') || '';
  const barangay = searchParams.get('barangay') || '';

  // States for fetched records and owner info
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      const formattedBarangay = barangay.toLowerCase().trim();

      try {
        const res = await fetch(
          `http://localhost:3000/api/business-record?ownerId=${encodeURIComponent(ownerId)}&barangay=${encodeURIComponent(formattedBarangay)}`
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


  // Filter records by search query (searching OR number and remarks here)
  const filteredRecords = records.filter(record =>
    record.orNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.remarks.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto p-4">
      {/* Back Link */}
      <div className="mb-4">
        <Link href={`/businessrecord?barangay=${barangay}`} className="text-blue-600 hover:underline">
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
          <div className="flex flex-col md:flex-row justify-between">
            {/* Left Column */}
            <div className="w-full md:w-1/2 pr-4 mb-4 md:mb-0">
              <label className="block text-sm font-semibold text-gray-700">
                Name of the Applicant:
              </label>
              <div className="border-b border-gray-400 py-1">{ownerInfo.applicantName}</div>
              <label className="block text-sm font-semibold text-gray-700 mt-4">
                Address:
              </label>
              <div className="border-b border-gray-400 py-1">{ownerInfo.address}</div>
            </div>
            {/* Right Column */}
            <div className="w-full md:w-1/2 pl-4">
              <label className="block text-sm font-semibold text-gray-700">
                Name of Business:
              </label>
              <div className="border-b border-gray-400 py-1">{ownerInfo.businessName}</div>
              <label className="block text-sm font-semibold text-gray-700 mt-4">
                Capital Investment:
              </label>
              <div className="border-b border-gray-400 py-1">{ownerInfo.capitalInvestment}</div>
            </div>
          </div>
        ) : (
          <h1 className="text-3xl font-bold">Detailed Records</h1>
        )}
      </header>

      {/* Search Bar */}
      <div className="pb-4 bg-white dark:bg-gray-900 mb-4">
        <label htmlFor="table-search" className="sr-only">Search</label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="text"
            id="table-search"
            placeholder="Search for records..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="block pt-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </div>
      </div>

      {/* Records Table */}
      {filteredRecords.length === 0 ? (
        <p className="text-center text-gray-600">No records found for this owner.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-2 py-1">Year</th>
                <th className="border border-gray-300 px-2 py-1">Date</th>
                <th className="border border-gray-300 px-2 py-1">GROSS</th>
                <th className="border border-gray-300 px-2 py-1">OR No.</th>
                <th className="border border-gray-300 px-2 py-1">BUS TAX</th>
                <th className="border border-gray-300 px-2 py-1">Mayor&apos;s Permit</th>
                <th className="border border-gray-300 px-2 py-1">Sanitary Inps</th>
                <th className="border border-gray-300 px-2 py-1">Police Clearance</th>
                <th className="border border-gray-300 px-2 py-1">Tax Clearance</th>
                <th className="border border-gray-300 px-2 py-1">Garbage</th>
                <th className="border border-gray-300 px-2 py-1">Verification</th>
                <th className="border border-gray-300 px-2 py-1">Weight & Mass</th>
                <th className="border border-gray-300 px-2 py-1">Health Clearance</th>
                <th className="border border-gray-300 px-2 py-1">SEC Fee</th>
                <th className="border border-gray-300 px-2 py-1">MENRO</th>
                <th className="border border-gray-300 px-2 py-1">Doc Tax</th>
                <th className="border border-gray-300 px-2 py-1">Eggs Fee</th>
                <th className="border border-gray-300 px-2 py-1">Market</th>
                <th className="border border-gray-300 px-2 py-1">25% Surcharge</th>
                <th className="border border-gray-300 px-2 py-1">5% Surcharge</th>
                <th className="border border-gray-300 px-2 py-1">Total Payment</th>
                <th className="border border-gray-300 px-2 py-1">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRecords.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1">{record.year}</td>
                  <td className="border border-gray-300 px-2 py-1">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.gross}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.orNo}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.busTax}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.mayorsPermit}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.sanitaryInps}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.policeClearance}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.taxClearance}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.garbage}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.verification}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.weightAndMass}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.healthClearance}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.secFee}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.menro}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.docTax}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.eggsFee}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.market}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.surcharge25}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.surcharge5}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.totalPayment}</td>
                  <td className="border border-gray-300 px-2 py-1">{record.remarks}</td>
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
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

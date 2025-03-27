'use client';

import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash } from 'react-icons/fa';



interface PaymentRecord {
  id: number;
  year: number;
  date: string;
  gross: string;
  orNo: string;
  busTax: string;
  mayorsPermit: string;
  sanitaryInps: string;
  policeClearance: string;
  taxClearance: string;
  garbage: string;
  verification: string;
  weightAndMass: string;
  healthClearance: string;
  secFee: string;
  menro: string;
  docTax: string;
  eggsFee: string;
  market: string;
  surcharge25: string;
  surcharge5: string;
  totalPayment: string;
  remarks: string;
  applicant?: {
    id: number;
    applicantName: string;
    applicantAddress: string;
    businessName: string;
    capitalInvestment: number;
  };
}

interface OwnerInfo {
  applicantName: string;
  address: string;
  businessName: string;
  capitalInvestment: string;
  applicantId: string;
}

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

export default function ReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const applicantIdParam = searchParams.get('applicantId');
  const storedApplicantId = typeof window !== 'undefined' ? localStorage.getItem('applicantId') : '';
  const initialApplicantId =
    applicantIdParam && applicantIdParam !== 'undefined' && applicantIdParam !== 'null'
      ? applicantIdParam
      : storedApplicantId || '';

  const [localApplicantId, setLocalApplicantId] = useState<string>(initialApplicantId);
  const applicantNameParam = searchParams.get('applicantName') || '';
  const applicantAddressParam = searchParams.get('applicantAddress') || '';

  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showForm, setShowForm] = useState(false);

  // State for editing a record
  const [editRecord, setEditRecord] = useState<Partial<PaymentRecord> | null>(null);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    date: '',
    gross: '',
    orNo: '',
    busTax: '',
    mayorsPermit: '',
    sanitaryInps: '',
    policeClearance: '',
    taxClearance: '',
    garbage: '',
    verification: '',
    weightAndMass: '',
    healthClearance: '',
    secFee: '',
    menro: '',
    docTax: '',
    eggsFee: '',
    market: '',
    surcharge25: '',
    surcharge5: '',
    totalPayment: '',
    remarks: '',
  });

  const fetchData = useCallback(async () => {
    try {
      let url = `http://localhost:3000/api/business-record?`;
      if (localApplicantId && localApplicantId !== 'undefined') {
        url += `applicantId=${encodeURIComponent(localApplicantId)}&`;
      }
      if (applicantNameParam) {
        url += `applicantName=${encodeURIComponent(applicantNameParam)}&`;
      }
      if (applicantAddressParam) {
        url += `applicantAddress=${encodeURIComponent(applicantAddressParam)}&`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        if (data.records?.length > 0 && data.records[0].applicant) {
          const app = data.records[0].applicant;
          const info: OwnerInfo = {
            applicantName: app.applicantName,
            address: app.applicantAddress,
            businessName: app.businessName,
            capitalInvestment: String(app.capitalInvestment),
            applicantId: String(app.id),
          };
          setOwnerInfo(info);
        }
      } else {
        const errorData = await res.json();
        setRecords([]);
        setOwnerInfo(null);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  }, [localApplicantId, applicantNameParam, applicantAddressParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!localApplicantId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('applicantId');
      if (stored) {
        setLocalApplicantId(stored);
      }
    }
  }, [localApplicantId]);

  const uniqueRecords = Array.from(new Map(records.map(r => [r.id, r])).values());
  const totalPages = Math.ceil(uniqueRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRecords = uniqueRecords.slice(startIndex, startIndex + pageSize);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // For adding a new record
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        applicantId: localApplicantId,
        ...formData,
      };

      const res = await fetch('http://localhost:3000/api/business-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Record added successfully!', { position: 'top-right', autoClose: 3000 });

        if (!localApplicantId && data.record) {
          // If the applicantId wasn't previously set, update it
          const newInfo: OwnerInfo = {
            applicantName: data.record.applicantName,
            address: data.record.applicantAddress,
            businessName: data.record.businessName,
            capitalInvestment: data.record.capitalInvestment,
            applicantId: data.record.applicantId,
          };
          setOwnerInfo(newInfo);
          setLocalApplicantId(data.record.applicantId);
          localStorage.setItem('applicantId', data.record.applicantId);
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('applicantId', data.record.applicantId);
          window.history.replaceState(null, '', currentUrl.toString());
        }

        // Reset the form
        setFormData({
          year: new Date().getFullYear(),
          date: '',
          gross: '',
          orNo: '',
          busTax: '',
          mayorsPermit: '',
          sanitaryInps: '',
          policeClearance: '',
          taxClearance: '',
          garbage: '',
          verification: '',
          weightAndMass: '',
          healthClearance: '',
          secFee: '',
          menro: '',
          docTax: '',
          eggsFee: '',
          market: '',
          surcharge25: '',
          surcharge5: '',
          totalPayment: '',
          remarks: '',
        });
        setShowForm(false);
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error('Error: ' + errorData.message, { position: 'top-right' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while submitting the form.', { position: 'top-right' });
    }
  };

  // Open the edit modal
  const handleEditRecord = (record: PaymentRecord) => {
    setEditRecord(record);
  };

  // Submit the edit form (update record)
  const handleEditFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    try {
      const res = await fetch(`http://localhost:3000/api/business-record/${editRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRecord),
      });
      if (res.ok) {
        toast.success('Record updated successfully!', { position: 'top-right', autoClose: 3000 });
        setEditRecord(null);
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error('Error: ' + errorData.message, { position: 'top-right' });
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Failed to update record.', { position: 'top-right' });
    }
  };

  // Handle changes in the edit modal form
  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editRecord) return;
    const { name, value } = e.target;
    setEditRecord(prev => ({ ...prev, [name]: value }));
  };

  // Delete a record
  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/business-record/${recordId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Record deleted successfully!', { position: 'top-right', autoClose: 3000 });
        fetchData();
      } else {
        const err = await res.json();
        toast.error('Error: ' + err.message, { position: 'top-right' });
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record.', { position: 'top-right' });
    }
  };

  const barangay = searchParams.get('barangay') || 'defaultBarangay';

  return (
    <div>


      {/* Global print styles with landscape orientation */}
      <style jsx global>{`
        @page {
          size: landscape;
          margin: 1cm; /* Adjust as needed for your desired margins */
        }
        @media print {
          .no-print {
            display: none !important;
          }
          /* Avoid breaking the table across pages */
          table {
            page-break-inside: auto;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          td,
          th {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="w-full p-4">
        <ToastContainer />

        {/* Buttons row (hidden when printing) */}
        <div className="mb-4 no-print flex space-x-4">
          <Link
            href={`/businessrecord?barangay=${encodeURIComponent(barangay)}`}
            className="inline-flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200 ease-in-out"
          >
            &larr; Back to Business Records
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200 ease-in-out"
          >
            Print to PDF
          </button>
        </div>

        {/* Logos */}
        <div className="flex justify-between items-center mb-8">
          <Image src="/Logo1.png" alt="Logo" width={180} height={60} className="object-contain" />
          <Image src="/maasenso.png" alt="Maasenso Logo" width={180} height={60} className="object-contain" />
        </div>

        {/* Applicant/Business Info */}
        <header className="mb-8">
          {ownerInfo ? (
            <div className="flex flex-col md:flex-row justify-between gap-6">
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

        {/* Add New Record button (hidden when printing) */}
        <div className="mb-4 no-print">
          <button
            onClick={() => setShowForm(prev => !prev)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {showForm ? 'Hide Form' : 'Add New Record'}
          </button>
        </div>

        {/* Add New Record Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 overflow-y-auto">
            <div className="relative bg-white shadow-lg rounded max-w-5xl w-full mx-4 my-10 max-h-[90vh] overflow-y-auto p-6">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
              <form onSubmit={handleFormSubmit}>
                <h2 className="text-xl font-bold mb-4">Add New Record</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Year', name: 'year', type: 'text' },
                    { label: 'Date', name: 'date', type: 'date' },
                    { label: 'Gross', name: 'gross', type: 'text' },
                    { label: 'OR No.', name: 'orNo', type: 'text' },
                    { label: 'BUS TAX', name: 'busTax', type: 'text' },
                    { label: "Mayor's Permit", name: 'mayorsPermit', type: 'text' },
                    { label: 'Sanitary Inps', name: 'sanitaryInps', type: 'text' },
                    { label: 'Police Clearance', name: 'policeClearance', type: 'text' },
                    { label: 'Tax Clearance', name: 'taxClearance', type: 'text' },
                    { label: 'Garbage', name: 'garbage', type: 'text' },
                    { label: 'Verification', name: 'verification', type: 'text' },
                    { label: 'Weight & Mass', name: 'weightAndMass', type: 'text' },
                    { label: 'Health Clearance', name: 'healthClearance', type: 'text' },
                    { label: 'SEC Fee', name: 'secFee', type: 'text' },
                    { label: 'MENRO', name: 'menro', type: 'text' },
                    { label: 'Doc Tax', name: 'docTax', type: 'text' },
                    { label: "Egg's Fee", name: 'eggsFee', type: 'text' },
                    { label: 'Market', name: 'market', type: 'text' },
                    { label: '25% Surcharge', name: 'surcharge25', type: 'text' },
                    { label: '5% Surcharge', name: 'surcharge5', type: 'text' },
                    { label: 'Total Payment', name: 'totalPayment', type: 'text' },
                    { label: 'Remarks', name: 'remarks', type: 'text' },
                  ].map((input) => (
                    <div key={input.name}>
                      <label className="block font-medium text-gray-700">{input.label}</label>
                      <input
                        type={input.type}
                        name={input.name}
                        value={(formData as any)[input.name]}
                        onChange={handleInputChange}
                        className="border p-2 w-full"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Record Modal */}
        {editRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 overflow-y-auto">
            <div className="relative bg-white shadow-lg rounded max-w-5xl w-full mx-4 my-10 max-h-[90vh] overflow-y-auto p-6">
              <button
                onClick={() => setEditRecord(null)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
              <form onSubmit={handleEditFormSubmit}>
                <h2 className="text-xl font-bold mb-4">Edit Record</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Year', name: 'year', type: 'text' },
                    { label: 'Date', name: 'date', type: 'date' },
                    { label: 'Gross', name: 'gross', type: 'text' },
                    { label: 'OR No.', name: 'orNo', type: 'text' },
                    { label: 'BUS TAX', name: 'busTax', type: 'text' },
                    { label: "Mayor's Permit", name: 'mayorsPermit', type: 'text' },
                    { label: 'Sanitary Inps', name: 'sanitaryInps', type: 'text' },
                    { label: 'Police Clearance', name: 'policeClearance', type: 'text' },
                    { label: 'Tax Clearance', name: 'taxClearance', type: 'text' },
                    { label: 'Garbage', name: 'garbage', type: 'text' },
                    { label: 'Verification', name: 'verification', type: 'text' },
                    { label: 'Weight & Mass', name: 'weightAndMass', type: 'text' },
                    { label: 'Health Clearance', name: 'healthClearance', type: 'text' },
                    { label: 'SEC Fee', name: 'secFee', type: 'text' },
                    { label: 'MENRO', name: 'menro', type: 'text' },
                    { label: 'Doc Tax', name: 'docTax', type: 'text' },
                    { label: "Egg's Fee", name: 'eggsFee', type: 'text' },
                    { label: 'Market', name: 'market', type: 'text' },
                    { label: '25% Surcharge', name: 'surcharge25', type: 'text' },
                    { label: '5% Surcharge', name: 'surcharge5', type: 'text' },
                    { label: 'Total Payment', name: 'totalPayment', type: 'text' },
                    { label: 'Remarks', name: 'remarks', type: 'text' },
                  ].map((input) => (
                    <div key={input.name}>
                      <label className="block font-medium text-gray-700">{input.label}</label>
                      <input
                        type={input.type}
                        name={input.name}
                        value={(editRecord as any)[input.name] || ''}
                        onChange={handleEditInputChange}
                        className="border p-2 w-full"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        {uniqueRecords.length === 0 ? (
          <p className="text-center text-gray-600">No records found for this applicant.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {columnGroups.map(group => (
                    <th
                      key={group.label}
                      colSpan={group.columns.length}
                      className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-gray-300"
                    >
                      {group.label}
                    </th>
                  ))}
                  {/* Actions column is hidden in print */}
                  <th className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-gray-300 no-print">
                    Actions
                  </th>
                </tr>
                <tr>
                  {columnGroups.map(group =>
                    group.columns.map(col => (
                      <th
                        key={col.key}
                        className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-300"
                      >
                        {col.label}
                      </th>
                    ))
                  )}
                  <th className="px-4 py-2 text-center font-medium text-gray-700 border-b border-gray-300 no-print" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRecords.map(record => (
                  <tr
                    key={record.id}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                  >
                    {columnGroups.map(group =>
                      group.columns.map(col => {
                        const rawValue = (record as any)[col.key];
                        const displayValue = col.format ? col.format(rawValue) : rawValue;
                        return (
                          <td key={col.key} className="px-4 py-2 text-gray-700">
                            {displayValue}
                          </td>
                        );
                      })
                    )}
                    {/* Hide these actions in print */}
                    <td className="px-4 py-2 text-center no-print">
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination (hidden in print) */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2 no-print">
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
                className={`px-3 py-1 border rounded ${
                  page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
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
    </div>
  );
}

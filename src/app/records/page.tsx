  'use client';

  import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
  import { useSearchParams, useRouter } from 'next/navigation';
  import Link from 'next/link';
  import Image from 'next/image';
  import { toast, ToastContainer } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';
  import { FaEdit, FaTrash } from 'react-icons/fa';
  import Topbar from '../components/Topbar';
  import PdfRecordsReports from '../components/PdfRecordsReports'; // New PDF print component

  // Define Column interface for table columns
  interface Column {
    key: keyof PaymentRecord;
    label: string;
    format?: (val: PaymentRecord[keyof PaymentRecord]) => string;
  }

  // Updated PaymentRecord interface including additional fields and the renewed flag
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
    surcharge25: string;
    sucharge2: string;
    totalPayment: string;
    remarks: string;
    frequency: "quarterly" | "semi-annual" | "annual";
    renewed: boolean;
    // Additional fields from your BusinessRecordForm
    marketCertification?: string;
    miscellaneous?: string;
    garbageCollection?: string;
    polluters?: string;
    Occupation?: string;
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

  // Define column groups to display fields logically
  const columnGroups: { label: string; columns: Column[] }[] = [
    {
      label: 'Basic Info',
      columns: [
        { key: 'year', label: 'Year' },
        { key: 'date', label: 'Date', format: (val) => new Date(val as string).toLocaleDateString() },
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
      ],
    },
    {
      label: 'Surcharges',
      columns: [
        { key: 'surcharge25', label: '25% Surcharge' },
        { key: 'sucharge2', label: '2% Month' },
      ],
    },
    {
      label: 'Additional Details',
      columns: [
        { key: 'garbageCollection', label: 'Garbage Collection' },
        { key: 'polluters', label: 'Polluters' },
        { key: 'Occupation', label: 'Occupation' },
      ],
    },
    {
      label: 'Additional Info',
      columns: [
        { key: 'marketCertification', label: 'Market Certification' },
        { key: 'miscellaneous', label: 'Miscellaneous' },
      ],
    },
    {
      label: 'Totals & Remarks',
      columns: [
        { key: 'totalPayment', label: 'Total Payment' },
        { key: 'remarks', label: 'Remarks' },
        { key: 'frequency', label: 'Frequency' },
        { key: 'renewed', label: 'Renewed', format: (val) => (val ? 'Yes' : 'No') },
      ],
    },
  ];
  

  /**
   * computeRenewalDueDate parses a date string (assumed to be in a valid format)
   * and adds the appropriate interval based on the frequency.
   */
  const computeRenewalDueDate = (dateStr: string, frequency: string): Date => {
    const recordDate = new Date(dateStr);
    const dueDate = new Date(recordDate);
    if (frequency === "quarterly") {
      dueDate.setMonth(dueDate.getMonth() + 3);
    } else if (frequency === "semi-annual") {
      dueDate.setMonth(dueDate.getMonth() + 6);
    } else if (frequency === "annual") {
      dueDate.setFullYear(dueDate.getFullYear() + 1);
    }
    return dueDate;
  };

  /**
   * isRecordDelinquent returns true if a record is considered delinquent.
   * A record is NOT delinquent if it is marked as renewed.
   * Otherwise, if the record's year is less than the current year or its computed renewal due date is past, it is delinquent.
   */
  const isRecordDelinquent = (record: PaymentRecord): boolean => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    if (record.renewed) return false;
    if (record.year < currentYear) return true;
    const dueDate = computeRenewalDueDate(record.date, record.frequency);
    return dueDate < currentDate;
  };

  export default function ReportPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
      async function checkAuth() {
        try {
          const res = await fetch("http://192.168.1.107:3000/api/auth/me", {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            setIsAuthenticated(true);
            const fullName = `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`;
            setUserName(fullName);
          } else {
            setIsAuthenticated(false);
            router.push("/auth/login");
          }
        } catch (error) {
          console.error("Auth check error:", error);
          router.push("/auth/login");
        }
      }
      checkAuth();
    }, [router]);

    // Add  helper function 
    const convertDateForInput = (dateStr: string): string => {
      // If the string already uses dashes, assume it's in the correct format.
      if (dateStr.includes('-')) return dateStr;
      const parts = dateStr.split("/");
      if (parts.length !== 3) return dateStr;
      const [day, month, year] = parts;
      // Return in "YYYY-MM-DD" format
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    };

    // Get applicant params from URL or localStorage
    const applicantIdParam = searchParams.get('applicantId');
    const storedApplicantId =
      typeof window !== 'undefined' ? localStorage.getItem('applicantId') : '';
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
    const [editRecord, setEditRecord] = useState<Partial<PaymentRecord> | null>(null);

    // Updated formData including applicant fields for creation if not already set
    const [formData, setFormData] = useState({
      // Applicant fields (only needed if no applicant exists)
      applicantName: '',
      applicantAddress: '',
      businessName: '',
      capitalInvestment: '',
      // Business record fields
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
      marketCertification: '',
      surcharge25: '',
      sucharge2: '',
      miscellaneous: '',
      totalPayment: '',
      remarks: '',
      frequency: 'annual',
      garbageCollection: '',
      polluters: '',
      Occupation: '',
    });

    const fetchData = useCallback(async () => {
      try {
        let url = `http://192.168.1.107:3000/api/business-record?`;
        if (localApplicantId && localApplicantId !== 'undefined') {
          url += `applicantId=${encodeURIComponent(localApplicantId)}&`;
        }
        if (applicantNameParam) {
          url += `applicantName=${encodeURIComponent(applicantNameParam)}&`;
        }
        if (applicantAddressParam) {
          url += `applicantAddress=${encodeURIComponent(applicantAddressParam)}&`;
        }
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }
        const data = await res.json();

        // Sort records by year in descending order (newest first)
        const sortedRecords = data.records.sort((a: PaymentRecord, b: PaymentRecord) => b.year - a.year);
        setRecords(sortedRecords);

        if (sortedRecords?.length > 0 && sortedRecords[0].applicant) {
          const app = sortedRecords[0].applicant;
          const info: OwnerInfo = {
            applicantName: app.applicantName,
            address: app.applicantAddress,
            businessName: app.businessName,
            capitalInvestment: String(app.capitalInvestment),
            applicantId: String(app.id),
          };
          setOwnerInfo(info);
        }
      } catch (error) {
        console.error("Error fetching records:", error);
        toast.error(`Error fetching records: ${(error as Error).message}`);
        setRecords([]);
        setOwnerInfo(null);
      }
    }, [localApplicantId, applicantNameParam, applicantAddressParam]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    // Pagination
    const uniqueRecords = Array.from(new Map(records.map(r => [r.id, r])).values());
    const totalPages = Math.ceil(uniqueRecords.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const currentRecords = uniqueRecords.slice(startIndex, startIndex + pageSize);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.107:3000';

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: FormEvent) => {
      e.preventDefault();
      try {
        const payload = {
          applicantId: localApplicantId, // if this exists, backend can link to existing applicant
          ...formData,
        };
        const res = await fetch(`${API_URL}/api/business-record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          toast.success('Record added successfully!', { position: 'top-right', autoClose: 3000 });
          // If applicant info was not set, use the returned record to set owner info
          if (!localApplicantId && data.record) {
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
          // Reset formData
          setFormData({
            applicantName: '',
            applicantAddress: '',
            businessName: '',
            capitalInvestment: '',
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
            marketCertification: '',
            surcharge25: '',
            sucharge2: '',
            miscellaneous: '',
            totalPayment: '',
            remarks: '',
            frequency: 'annual',
            garbageCollection: '',
            polluters: '',
            Occupation: '',
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

    const handleEditRecord = (record: PaymentRecord) => {
      setEditRecord(record);
    };

    const handleEditFormSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!editRecord) return;
      try {
        const res = await fetch(`http://192.168.1.107:3000/api/business-record/${editRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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

    const handleEditInputChange = (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const target = e.target as HTMLInputElement;
      const { name, type, value } = target;
      const newValue = type === 'checkbox' ? target.checked : value;
      setEditRecord((prev) => ({ ...prev, [name]: newValue }));
    };

    const handleDeleteRecord = async (recordId: number) => {
      if (!confirm('Are you sure you want to delete this record?')) return;
      try {
        const res = await fetch(`http://192.168.1.107:3000/api/business-record/${recordId}`, {
          method: 'DELETE',
          credentials: 'include',
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

    // Helper: determines if a record is delinquent (red background) 
    const isRecordDelinquentHelper = (record: PaymentRecord): boolean => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      if (record.renewed) return false;
      if (record.year < currentYear) return true;
      const dueDate = computeRenewalDueDate(record.date, record.frequency);
      return dueDate < currentDate;
    };

    return (
      <div>
        <Topbar />
        <ToastContainer />
        <div className="w-full p-4 no-print">
          <Link
            href={`/businessrecord?barangay=${encodeURIComponent(
              searchParams.get("barangay") || ""
            )}`}
            className="inline-flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200 ease-in-out"
          >
            &larr; Back to Business Records
          </Link>
          {/* PDF Print Button */}
          <PdfRecordsReports />
        </div>
        <div className="w-[95%] mx-auto my-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Image
                src="/Logo1.png"
                alt="Logo"
                width={180}
                height={60}
                className="object-contain"
              />
            </div>
            <div>
              <Image
                src="/maasenso.png"
                alt="Maasenso Logo"
                width={180}
                height={60}
                className="object-contain"
              />
            </div>
          </div>
          <header className="mb-8">
            {ownerInfo ? (
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Filter Section */}
          </div>

          <div className="mb-4 no-print">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {showForm ? 'Hide Form' : 'Add New Record'}
            </button>
          </div>

          {/* Table */}
          <div className="w-full sm:rounded-lg border border-gray-200 overflow-x-auto">
            <table className="min-w-full table-fixed text-sm text-left text-gray-500">
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
                  <th className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-gray-300 no-print">
                    Actions
                  </th>
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
                  <th className="px-4 py-2 text-center font-medium text-gray-700 border-b border-gray-300 no-print" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRecords.map((record) => {
                  const delinquent = isRecordDelinquentHelper(record);
                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-gray-100 ${delinquent ? "bg-red-300" : "odd:bg-white even:bg-gray-50"}`}
                    >
                      {columnGroups.map((group) =>
                        group.columns.map((col) => {
                          const rawValue = (record as any)[col.key];
                          const displayValue = col.format ? col.format(rawValue) : rawValue;
                          return (
                            <td
                              key={`${record.id}-${col.key}`}
                              className="px-4 py-2 text-gray-700 overflow-hidden whitespace-nowrap text-ellipsis"
                            >
                              {displayValue}
                            </td>
                          );
                        })
                      )}
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2 no-print">
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
                  className={`px-3 py-1 border rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
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

        {/* New Record Modal */}
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
                {/* Applicant Details (if no applicantId) */}
                {!localApplicantId && (
                  <>
                    <h3 className="text-2xl font-semibold my-4">Applicant Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Applicant Name', name: 'applicantName', type: 'text' },
                        { label: 'Applicant Address', name: 'applicantAddress', type: 'text' },
                        { label: 'Business Name', name: 'businessName', type: 'text' },
                        { label: 'Capital Investment', name: 'capitalInvestment', type: 'number' },
                      ].map((input) => (
                        <div key={input.name}>
                          <label className="block font-medium text-gray-700">{input.label}</label>
                          <input
                            type={input.type}
                            name={input.name}
                            value={(formData as any)[input.name]}
                            onChange={handleInputChange}
                            className="border p-2 w-full"
                            placeholder={`Enter ${input.label}`}
                          />
                        </div>
                      ))}
                    </div>
                    <hr className="my-4" />
                  </>
                )}
                {/* Business Record Details */}
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
                    { label: 'Market Certification', name: 'marketCertification', type: 'text' },
                    { label: '25% Surcharge', name: 'surcharge25', type: 'text' },
                    { label: '2% Month', name: 'sucharge2', type: 'text' },
                    { label: 'Garbage Collection', name: 'garbageCollection', type: 'text' },
                    { label: 'Polluters', name: 'polluters', type: 'text' },
                    { label: 'Occupation', name: 'Occupation', type: 'text' },
                    { label: 'Miscellaneous', name: 'miscellaneous', type: 'text' },
                    { label: 'Total Payment', name: 'totalPayment', type: 'text' },
                    { label: 'Remarks', name: 'remarks', type: 'text' },
                    { label: 'Frequency', name: 'frequency', type: 'select' },
                  ].map((input) => (
                    <div key={input.name}>
                      <label className="block font-medium text-gray-700">{input.label}</label>
                      {input.type === 'select' ? (
                        <select
                          name={input.name}
                          value={(formData as any)[input.name]}
                          onChange={handleInputChange}
                          className="border p-2 w-full"
                        >
                          <option value="quarterly">Quarterly</option>
                          <option value="semi-annual">Semi-Annual</option>
                          <option value="annual">Annual</option>
                        </select>
                      ) : (
                        <input
                          type={input.type}
                          name={input.name}
                          value={(formData as any)[input.name]}
                          onChange={handleInputChange}
                          className="border p-2 w-full"
                        />
                      )}
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
                onClick={() => {
                  setEditRecord(null);
                }}
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
                    { label: 'Market Certification', name: 'marketCertification', type: 'text' },
                    { label: '25% Surcharge', name: 'surcharge25', type: 'text' },
                    { label: '2% Month', name: 'sucharge2', type: 'text' },
                    { label: 'Miscellaneous', name: 'miscellaneous', type: 'text' },
                    { label: 'Garbage Collection', name: 'garbageCollection', type: 'text' },
                    { label: 'Polluters', name: 'polluters', type: 'text' },
                    { label: 'Occupation', name: 'Occupation', type: 'text' },
                    { label: 'Total Payment', name: 'totalPayment', type: 'text' },
                    { label: 'Remarks', name: 'remarks', type: 'text' },
                    { label: 'Frequency', name: 'frequency', type: 'select' },
                    { label: 'Renewed', name: 'renewed', type: 'checkbox' },
                  ].map((input) => (
                    <div key={input.name}>
                      <label className="block font-medium text-gray-700">{input.label}</label>
                      {input.type === 'select' ? (
                        <select
                          name={input.name}
                          value={(editRecord as any)[input.name] || ""}
                          onChange={handleEditInputChange}
                          className="border p-2 w-full"
                        >
                          <option value="quarterly">Quarterly</option>
                          <option value="semi-annual">Semi-Annual</option>
                          <option value="annual">Annual</option>
                        </select>
                      ) : input.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          name={input.name}
                          checked={(editRecord as any)[input.name] || false}
                          onChange={handleEditInputChange}
                          className="border p-2"
                        />
                      ) : input.type === 'date' ? (
                        <input
                          type="date"
                          name={input.name}
                          value={
                            (editRecord as any)[input.name]
                              ? convertDateForInput((editRecord as any)[input.name])
                              : ""
                          }
                          onChange={handleEditInputChange}
                          className="border p-2 w-full"
                        />
                      ) : (
                        <input
                          type={input.type}
                          name={input.name}
                          value={(editRecord as any)[input.name] || ""}
                          onChange={handleEditInputChange}
                          className="border p-2 w-full"
                        />
                      )}
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

      </div>
    );
  }

'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Select from 'react-select';
import AddBusinessRecordFormModal from '../components/AddBusinessRecordFormModal';
import { BusinessRecord } from '@/types/BusinessRecord';

// Define the interface for the raw owner record from the API.
interface BackendOwner {
  id: number;
  applicantName: string;
  businessName: string;
  applicantAddress: string;
  businessCategory: string;
}

// Extend the backend type with a computed property.
interface BusinessOwner extends BackendOwner {
  barangay: string;
}

const barangays = [
  "Malbang", "Nomoh", "Seven Hills", "Pananag", "Daliao", "Colon",
  "Amsipit", "Bales", "Kamanga", "Kablacan", "Kanalo",
  "Lumatil", "Lumasal", "Tinoto", "Public Market", "Poblacion", "Kabatiol",
];

// Extract the barangay from an address.
const getBarangayFromAddress = (address: string): string => {
  const normalizedAddress = address.toLowerCase();
  for (const barangay of barangays) {
    const regex = new RegExp(`\\b${barangay.toLowerCase()}\\b`);
    if (regex.test(normalizedAddress)) {
      return barangay;
    }
  }
  return "";
};

// Helper to capitalize words for display.
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function BusinessRecordsPage() {
  const searchParams = useSearchParams();
  const initialBarangay = searchParams.get('barangay') || barangays[0];
  const [selectedBarangay, setSelectedBarangay] = useState(initialBarangay);
  // Default value for searchable Business Name dropdown.
  const [selectedBusinessName, setSelectedBusinessName] = useState("all");

  const [owners, setOwners] = useState<BusinessOwner[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchOwners() {
      try {
        const res = await fetch(
          `http://localhost:3000/api/owners?barangay=${encodeURIComponent(selectedBarangay)}`
        );
        if (res.ok) {
          const data = await res.json();
          const backendOwners: BackendOwner[] = data.owners;
          const ownersWithBarangay: BusinessOwner[] = backendOwners.map((record: BackendOwner) => ({
            ...record,
            barangay: getBarangayFromAddress(record.applicantAddress || "")
          }));
          setOwners(ownersWithBarangay);
          // Reset Business Name filter when data changes.
          setSelectedBusinessName("all");
        } else {
          console.error('Error:', res.statusText);
          setOwners([]);
        }
      } catch (error) {
        console.error('Error fetching owners:', error);
        setOwners([]);
      }
    }
    fetchOwners();
  }, [selectedBarangay]);

  // Filter owners based on the search input.
  const filteredOwners = owners.filter(owner =>
    `${owner.applicantName} ${owner.businessName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get a unique, normalized list of business names.
  const uniqueBusinessNames = Array.from(new Set(filteredOwners.map(owner => owner.businessName.toLowerCase())));

  // Create options for react-select (including a default "All").
  const businessNameOptions = [
    { value: 'all', label: 'All' },
    ...uniqueBusinessNames.map(name => ({
      value: name,
      label: capitalize(name),
    }))
  ];

  // Filter by the selected business name.
  const finalOwners = selectedBusinessName === "all"
    ? filteredOwners 
    : filteredOwners.filter(owner => owner.businessName.toLowerCase() === selectedBusinessName);

  // Pagination.
  const totalPages = Math.ceil(finalOwners.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRecords = finalOwners.slice(startIndex, startIndex + pageSize);

  // Handlers for changes.
  const handleBarangayChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedBarangay(e.target.value);
    setCurrentPage(1);
    setSelectedOwnerIds([]);
  };

  const handleBusinessNameChange = (option: { value: string; label: string } | null) => {
    setSelectedBusinessName(option?.value || 'all');
    setCurrentPage(1);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectOwner = (ownerId: number, checked: boolean) => {
    if (checked) {
      setSelectedOwnerIds(prev => [...prev, ownerId]);
    } else {
      setSelectedOwnerIds(prev => prev.filter(id => id !== ownerId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedOwnerIds(checked ? currentRecords.map(owner => owner.id) : []);
  };

  // Callback for adding a new record.
  const handleNewRecord = (newRecord: BusinessRecord) => {
    console.log("New record:", newRecord);
    async function refetchOwners() {
      try {
        const res = await fetch(
          `http://localhost:3000/api/owners?barangay=${encodeURIComponent(selectedBarangay)}`
        );
        if (res.ok) {
          const data = await res.json();
          const backendOwners: BackendOwner[] = data.owners;
          const ownersWithBarangay: BusinessOwner[] = backendOwners.map((record: BackendOwner) => ({
            ...record,
            barangay: getBarangayFromAddress(record.applicantAddress || "")
          }));
          setOwners(ownersWithBarangay);
          setSelectedBusinessName("all");
        }
      } catch (error) {
        console.error('Refetch error:', error);
      }
    }
    refetchOwners();
  };

  return (
    <div className="container mx-auto p-4">
      {/* Navigation */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Header Section */}
      <div className="text-center mb-10">
        <Image src="/Logo1.png" alt="Logo" width={150} height={150} className="mx-auto mb-4" />
        <h2 className="text-4xl font-bold">BUSINESS RECORD</h2>
        <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Barangay Filter */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">Barangay</label>
          <select
            value={selectedBarangay}
            onChange={handleBarangayChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {barangays.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        {/* Business Name Filter with Searchable Dropdown */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">Business Name</label>
          <Select
            options={businessNameOptions}
            value={businessNameOptions.find(option => option.value === selectedBusinessName)}
            onChange={handleBusinessNameChange}
            isSearchable
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      {/* Modal for Adding New Record */}
      <div className="mb-8">
        <AddBusinessRecordFormModal onFormSubmitSuccess={handleNewRecord} />
      </div>

      {/* Text Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search Owners..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table Section */}
      {currentRecords.length === 0 ? (
        <p className="text-center text-gray-500">No business owners found for {selectedBarangay}.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={currentRecords.every(owner => selectedOwnerIds.includes(owner.id))}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">Owner Name</th>
                <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">Business Name</th>
                <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRecords.map(owner => (
                <tr key={owner.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOwnerIds.includes(owner.id)}
                      onChange={e => handleSelectOwner(owner.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3">{owner.applicantName}</td>
                  <td className="px-4 py-3">{owner.businessName}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/records?ownerId=${owner.id}`}
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      View Records
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-3">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`px-4 py-2 border rounded ${p === currentPage ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

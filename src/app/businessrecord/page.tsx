"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Select from 'react-select';
import AddBusinessRecordFormModal from '../components/AddBusinessRecordFormModal';
import BusinessRecordForm from '../components/BusinessRecordForm';
import { BusinessRecord } from '@/types/BusinessRecord';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEye, FaEdit, FaTrashAlt } from 'react-icons/fa';
import NavBar from '../components/NavBar';

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

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function BusinessRecordsPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState(barangays[0]);
  const [selectedBusinessName, setSelectedBusinessName] = useState("all");
  const [owners, setOwners] = useState<BusinessOwner[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // State for the edit modal.
  const [editingRecord, setEditingRecord] = useState<Partial<BusinessRecord> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // State for the custom delete modal.
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const initialBarangay = searchParams.get('barangay') || barangays[0];
    setSelectedBarangay(initialBarangay);
  }, [searchParams]);

  useEffect(() => {
    if (!mounted) return;
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
  }, [selectedBarangay, mounted]);

  const filteredOwners = owners.filter(owner =>
    `${owner.applicantName} ${owner.businessName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueBusinessNames = Array.from(new Set(filteredOwners.map(owner => owner.businessName.toLowerCase())));
  const businessNameOptions = [
    { value: 'all', label: 'All' },
    ...uniqueBusinessNames.map(name => ({
      value: name,
      label: capitalize(name),
    }))
  ];

  const finalOwners = selectedBusinessName === "all"
    ? filteredOwners
    : filteredOwners.filter(owner => owner.businessName.toLowerCase() === selectedBusinessName);

  const totalPages = Math.ceil(finalOwners.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRecords = finalOwners.slice(startIndex, startIndex + pageSize);

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

  const handleNewRecord = (newRecord: BusinessRecord) => {
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
          -       toast.success("Record added successfully!");
        }
      } catch (error) {
        console.error('Refetch error:', error);
      }
    }
    refetchOwners();
  };

  // Fetch full record details for editing.
  const handleEditRecord = async (recordId: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/business-record?ownerId=${recordId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          setEditingRecord(data.records[0]);
          setShowEditModal(true);
        } else {
          console.error("No record found for editing.");
        }
      } else {
        console.error("Failed to fetch record for editing:", res.statusText);
      }
    } catch (error) {
      console.error("Error fetching record for editing", error);
    }
  };

  const handleUpdateSuccess = (updatedRecord: BusinessRecord) => {
    setOwners(prev =>
      prev.map(owner => owner.id === updatedRecord.id ? { ...owner, ...updatedRecord } : owner)
    );
    setShowEditModal(false);
    setEditingRecord(null);
    // REMOVE or comment out the toast call here if it's duplicated:
    // toast.success("Record updated successfully!");
  };


  const handleDeleteRecord = async (recordId: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/business-record/${recordId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setOwners(prev => prev.filter(owner => owner.id !== recordId));
        toast.success("Record deleted successfully!");
      } else {
        console.error("Error deleting record:", res.statusText);
        toast.error("Failed to delete record.");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("An error occurred while deleting the record.");
    }
  };

  return (
    <div>
      <NavBar />
    <div className="w-[95%] mx-auto my-8"> {/* 95% of screen width, centered, with top/bottom margin */}

      {mounted ? (
        <>
          {/* Navigation */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200 ease-in-out"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
  
          {/* Header Section */}
          <div className="text-center mb-10">
            <Image
              src="/Logo1.png"
              alt="Logo"
              width={200}
              height={150}
              className="mx-auto mb-4"
            />
            <h2 className="text-4xl font-bold">BUSINESS RECORD</h2>
            <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
          </div>
  
          {/* Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Barangay
              </label>
              <select
                value={selectedBarangay}
                onChange={handleBarangayChange}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {barangays.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <Select
                options={businessNameOptions}
                value={businessNameOptions.find(
                  option => option.value === selectedBusinessName
                )}
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
            <p className="text-center text-gray-500">
              No business owners found for {selectedBarangay}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left"> {/* No big label needed here */}
                      <input
                        type="checkbox"
                        checked={currentRecords.every(owner =>
                          selectedOwnerIds.includes(owner.id)
                        )}
                        onChange={e => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">
                      Owner Name
                    </th>
                    <th className="px-4 py-3 text-left text-lg font-semibold text-gray-700">
                      Business Name
                    </th>
                    <th className="px-4 py-6 text-center  text-lg font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map(owner => (
                    <tr
                      key={owner.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOwnerIds.includes(owner.id)}
                          onChange={e =>
                            handleSelectOwner(owner.id, e.target.checked)
                          }
                        />
                      </td>
                      <td className="px-4 py-3">{owner.applicantName}</td>
                      <td className="px-4 py-3">{owner.businessName}</td>
                      <td className="px-4 py-3 text-center">
                        {/* Action Buttons aligned to the right */}
                        <div className="inline-flex space-x-2">
                          <Link
                            href={`/records?ownerId=${owner.id}&barangay=${encodeURIComponent(
                              owner.barangay
                            )}`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
                          >
                            <FaEye className="mr-1 text-md" />
                            <span className="text-sm">View</span>
                          </Link>
                          <button
                            onClick={() => handleEditRecord(owner.id)}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-200"
                          >
                            <FaEdit className="mr-1 text-md" />
                            <span className="text-sm">Edit</span>
                          </button>
                          <button
                            onClick={() => setRecordToDelete(owner.id)}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
                          >
                            <FaTrashAlt className="mr-1 text-md" />
                            <span className="text-sm">Delete</span>
                          </button>
                        </div>
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
                  className={`px-4 py-2 border rounded ${
                    p === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
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
  
          {/* Custom Delete Confirmation Modal */}
          {recordToDelete !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 overflow-y-auto">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 my-4">
                <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
                <p className="mb-6">
                  Are you sure you want to permanently delete this record? This
                  action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    onClick={() => setRecordToDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={async () => {
                      await handleDeleteRecord(recordToDelete);
                      setRecordToDelete(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
  
          {/* Edit Modal */}
          {showEditModal && editingRecord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 overflow-y-auto">
              <div className="bg-white p-6 rounded-lg max-w-6xl w-full mx-4 my-4 max-h-screen overflow-y-auto relative">
                <button
                  className="absolute top-4 right-4 text-3xl text-red-500 font-bold hover:text-red-700 focus:outline-none"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRecord(null);
                  }}
                >
                  &times;
                </button>
                <BusinessRecordForm
                  mode="edit"
                  record={editingRecord}
                  onSubmitSuccess={handleUpdateSuccess}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
    </div>
  );
}
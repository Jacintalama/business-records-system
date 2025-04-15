'use client';

import { useState, useEffect, ChangeEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import NavBar from "../components/NavBar";
import Topbar from "../components/Topbar";
import BoatRecordForm from "../components/BoatRecordForm";

interface BoatRecordDisplay {
  id: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  extension_name: string;
  control_no: number | "";
  fish_registration_no_rsbsa: number | "";
  purok: string;
  barangay: string;
  contact_no: string;  // remains string to preserve formatting
  fishing_boat_name: string;
  make: string;
  engine_sn: number | "";
  no_of_fisher_man: string; // changed to string
  or_no: string;            // changed to string
  amount_paid: number | "";
  status: string;
  date: string;
}

const barangays = [
  "Amsipit",
  "Bales",
  "Colon",
  "Daliao",
  "Kabatiol",
  "Kablacan",
  "Kamanga",
  "Kanalo",
  "Lumatil",
  "Lumasal",
  "Malbang",
  "Nomoh",
  "Pananag",
  "Poblacion",
  "Public Market",
  "Seven Hills",
  "Tinoto",
];

export default function BoatRecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Authentication state (if needed)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("User");

  // Barangay selection and data
  const [selectedBarangay, setSelectedBarangay] = useState<string>(barangays[0]);
  const [boatRecords, setBoatRecords] = useState<BoatRecordDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Searching & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Partial<BoatRecordDisplay> | null>(null);

  // Selected records for multi-select
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Hydration for SSR
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("http://192.168.1.107:3000/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          setUserName(`${data.firstName} ${data.lastName}`);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  // Initialize barangay from URL if present
  useEffect(() => {
    const barangayFromUrl = searchParams.get("barangay");
    if (barangayFromUrl) {
      setSelectedBarangay(barangayFromUrl);
    }
  }, [searchParams]);

  // Fetch boat records with proper conversion
  const fetchBoatRecords = async (barangay: string) => {
    setIsLoading(true);
    try {
      const url = `http://192.168.1.107:3000/api/boatrecords?barangay=${encodeURIComponent(
        barangay
      )}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
        }
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      const data = await res.json();
      const records = data.records || [];

      const allBoatRecords = records.map((rec: any) => ({
        id: String(rec.id),
        last_name: rec.last_name || "",
        first_name: rec.first_name || "",
        middle_name: rec.middle_name || "",
        extension_name: rec.extension_name || "",
        control_no:
          rec.control_no !== undefined && rec.control_no !== null
            ? Number(rec.control_no)
            : "",
        fish_registration_no_rsbsa:
          rec.fish_registration_no_rsbsa !== undefined && rec.fish_registration_no_rsbsa !== null
            ? Number(rec.fish_registration_no_rsbsa)
            : "",
        purok: rec.purok || "",
        barangay: rec.barangay || "",
        // Convert contact_no to a string to avoid dropping leading zeros
        contact_no: rec.contact_no ? String(rec.contact_no) : "",
        fishing_boat_name: rec.fishing_boat_name || "",
        make: rec.make || "",
        engine_sn:
          rec.engine_sn !== undefined && rec.engine_sn !== null
            ? Number(rec.engine_sn)
            : "",
        no_of_fisher_man:
          rec.no_of_fisher_man !== undefined && rec.no_of_fisher_man !== null
            ? String(rec.no_of_fisher_man)
            : "",
        or_no:
          rec.or_no !== undefined && rec.or_no !== null
            ? String(rec.or_no)
            : "",
        amount_paid:
          rec.amount_paid !== undefined && rec.amount_paid !== null
            ? Number(rec.amount_paid)
            : "",
        status: rec.status || "",
        date: rec.date ? new Date(rec.date).toISOString().split("T")[0] : "",
      }));
      setBoatRecords(allBoatRecords);
    } catch (error: any) {
      console.error("Error fetching boat records:", error);
      toast.error(`Error fetching boat records: ${error.message}`);
      setBoatRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch whenever selectedBarangay changes
  useEffect(() => {
    fetchBoatRecords(selectedBarangay);
  }, [selectedBarangay]);

  // Filter by search (owner's name or boat name)
  const filteredRecords = boatRecords.filter((record) => {
    const ownerName = `${record.last_name} ${record.first_name} ${record.middle_name}`.toLowerCase();
    const boatName = record.fishing_boat_name.toLowerCase();
    const query = searchQuery.toLowerCase();
    return ownerName.includes(query) || boatName.includes(query);
  });

  // Pagination
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const indexOfLastRecord = currentPage * itemsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - itemsPerPage;
  const paginatedRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  // Handle select all
  const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelections = paginatedRecords.map((r) => r.id);
      setSelectedRecords((prev) => Array.from(new Set([...prev, ...newSelections])));
    } else {
      setSelectedRecords((prev) => prev.filter((id) => !paginatedRecords.some((r) => r.id === id)));
    }
  };

  // Handle single select
  const handleSelectOneChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords((prev) => [...prev, id]);
    } else {
      setSelectedRecords((prev) => prev.filter((item) => item !== id));
    }
  };

  // Delete record
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this boat record?")) return;
    try {
      const res = await fetch(`http://192.168.1.107:3000/api/boatrecords/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Boat record deleted successfully!");
        fetchBoatRecords(selectedBarangay);
      } else {
        const err = await res.json();
        toast.error(`Error: ${err.message}`);
      }
    } catch (error: any) {
      console.error("Error deleting boat record:", error);
      toast.error("Failed to delete boat record. Please try again.");
    }
  };

  // Edit record
  const openEditModal = (record: BoatRecordDisplay) => {
    setEditRecord(record);
    setIsEditModalOpen(true);
  };

  return (
    <div>
      <ToastContainer />
      <Topbar />
      <NavBar />

      <div className="w-[95%] mx-auto my-8">
        <Link
          href="/"
          className="inline-flex no-underline hover:no-underline bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          &larr; Back to Dashboard
        </Link>

        <div className="text-center my-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            BOAT RECORDS
          </h2>
          <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Barangay
            </label>
            <select
              value={selectedBarangay}
              onChange={(e) => {
                setSelectedBarangay(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {barangays.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Search by owner or boat name"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-4 px-4 py-2 bg-green-600 text-white font-semibold rounded shadow hover:bg-green-500 transition-colors"
        >
          <FaPlus className="inline-block mr-2" /> Add Boat Record
        </button>

        {/* Selected items indicator */}
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">
            Selected: {selectedRecords.length}
          </span>
        </div>

        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="table-fixed w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="w-12 p-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm"
                      onChange={handleSelectAllChange}
                      checked={
                        paginatedRecords.length > 0 &&
                        paginatedRecords.every((r) => selectedRecords.includes(r.id))
                      }
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">Owner Name</th>
                <th scope="col" className="px-6 py-3">Boat Name</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="animate-pulse flex flex-col items-center space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No boat records found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => {
                  const ownerName = [record.last_name, record.first_name, record.middle_name]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="w-12 p-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm"
                            checked={selectedRecords.includes(record.id)}
                            onChange={(e) => handleSelectOneChange(record.id, e.target.checked)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {ownerName}
                      </td>
                      <td className="px-6 py-4">{record.fishing_boat_name}</td>
                      <td className="px-6 py-4">{record.status}</td>
                      <td className="px-6 py-4">{record.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/boatrecords/view?boatRecordId=${record.id}&barangay=${encodeURIComponent(selectedBarangay)}`}
                            className="no-underline hover:no-underline inline-flex items-center bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-500 transition-colors"
                          >
                            <FaEye className="mr-1" /> View
                          </Link>

                          <button
                            onClick={() => openEditModal(record)}
                            className="inline-flex items-center bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-400 transition-colors"
                          >
                            <FaEdit className="mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="inline-flex items-center bg-red-600 text-white py-1 px-3 rounded hover:bg-red-500 transition-colors"
                          >
                            <FaTrash className="mr-1" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg max-w-6xl w-full mx-4 my-4 max-h-screen overflow-y-auto relative">
            <button
              className="text-red-600 text-xl font-bold float-right"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
            <BoatRecordForm
              mode="create"
              onSubmitSuccess={() => {
                setIsModalOpen(false);
                fetchBoatRecords(selectedBarangay);
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg max-w-6xl w-full mx-4 my-4 max-h-screen overflow-y-auto relative">
            <button
              className="text-red-600 text-xl font-bold float-right"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditRecord(null);
              }}
            >
              &times;
            </button>
            <BoatRecordForm
              mode="edit"
              record={editRecord}
              onSubmitSuccess={() => {
                setIsEditModalOpen(false);
                setEditRecord(null);
                fetchBoatRecords(selectedBarangay);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, ChangeEvent } from "react";
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
  contact_no: string;
  fishing_boat_name: string;
  make: string;
  engine_sn: number | "";
  no_of_fisher_man: string;
  or_no: string;
  amount_paid: number | "";
  status: string;
  date: string;
}

// Define the raw shape you get from your API
interface RawBoatRecord {
  id: number;
  last_name?: string;
  first_name?: string;
  middle_name?: string;
  extension_name?: string;
  control_no?: number | null;
  fish_registration_no_rsbsa?: number | null;
  purok?: string;
  barangay?: string;
  contact_no?: string | number;
  fishing_boat_name?: string;
  make?: string;
  engine_sn?: number | null;
  no_of_fisher_man?: string | number | null;
  or_no?: string | number | null;
  amount_paid?: number | null;
  status?: string;
  date?: string;
}

const barangays = [
  "Amsipit", "Bales", "Colon", "Daliao", "Kabatiol", "Kablacan",
  "Kamanga", "Kanalo", "Lumatil", "Lumasal", "Malbang", "Nomoh",
  "Pananag", "Poblacion", "Public Market", "Seven Hills", "Tinoto",
];

export default function BoatRecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected barangay & data
  const [selectedBarangay, setSelectedBarangay] = useState<string>(barangays[0]);
  const [boatRecords, setBoatRecords] = useState<BoatRecordDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<BoatRecordDisplay | null>(null);

  // Multi-select
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Initialize from URL
  useEffect(() => {
    const b = searchParams.get("barangay");
    if (b && barangays.includes(b)) {
      setSelectedBarangay(b);
    }
  }, [searchParams]);

  // Fetcher, wrapped in useCallback so we can add it to deps safely
  const fetchBoatRecords = useCallback(async (barangay: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `http://192.168.1.107:3000/api/boatrecords?barangay=${encodeURIComponent(barangay)}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        if (res.status === 401) router.push("/auth/login");
        throw new Error(res.statusText);
      }
      const data: { records?: RawBoatRecord[] } = await res.json();
      const arr = data.records ?? [];

      const mapped: BoatRecordDisplay[] = arr.map((rec) => ({
        id: String(rec.id),
        last_name: rec.last_name ?? "",
        first_name: rec.first_name ?? "",
        middle_name: rec.middle_name ?? "",
        extension_name: rec.extension_name ?? "",
        control_no:
          rec.control_no != null ? rec.control_no : "",
        fish_registration_no_rsbsa:
          rec.fish_registration_no_rsbsa != null ? rec.fish_registration_no_rsbsa : "",
        purok: rec.purok ?? "",
        barangay: rec.barangay ?? "",
        contact_no: rec.contact_no != null ? String(rec.contact_no) : "",
        fishing_boat_name: rec.fishing_boat_name ?? "",
        make: rec.make ?? "",
        engine_sn:
          rec.engine_sn != null ? rec.engine_sn : "",
        no_of_fisher_man:
          rec.no_of_fisher_man != null ? String(rec.no_of_fisher_man) : "",
        or_no:
          rec.or_no != null ? String(rec.or_no) : "",
        amount_paid:
          rec.amount_paid != null ? rec.amount_paid : "",
        status: rec.status ?? "",
        date: rec.date
          ? new Date(rec.date).toISOString().split("T")[0]
          : "",
      }));

      setBoatRecords(mapped);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error fetching boat records: ${err.message}`);
      setBoatRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Re-fetch whenever barangay changes
  useEffect(() => {
    fetchBoatRecords(selectedBarangay);
  }, [selectedBarangay, fetchBoatRecords]);

  // Filter + paginate
  const filtered = boatRecords.filter((r) => {
    const name = `${r.last_name} ${r.first_name} ${r.middle_name}`.toLowerCase();
    return (
      name.includes(searchQuery.toLowerCase()) ||
      r.fishing_boat_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  const perPage = 15;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Bulk select
  const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRecords((prev) => [
        ...new Set([...prev, ...paginated.map((r) => r.id)]),
      ]);
    } else {
      setSelectedRecords((prev) =>
        prev.filter((id) => !paginated.some((r) => r.id === id))
      );
    }
  };

  // Single select
  const handleSelectOneChange = (id: string, checked: boolean) => {
    setSelectedRecords((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  // Delete
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      const res = await fetch(
        `http://192.168.1.107:3000/api/boatrecords/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message);
      }
      toast.success("Deleted!");
      fetchBoatRecords(selectedBarangay);
    } catch (err: any) {
      console.error(err);
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  // Edit
  const openEditModal = (r: BoatRecordDisplay) => {
    setEditRecord(r);
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
          className="inline-flex bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          &larr; Dashboard
        </Link>

        <header className="text-center my-6">
          <h2 className="text-3xl font-bold text-gray-800">BOAT RECORDS</h2>
          <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
        </header>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-sm font-semibold text-gray-700">Barangay</label>
            <select
              value={selectedBarangay}
              onChange={(e) => {
                setSelectedBarangay(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-600"
            >
              {barangays.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Search</label>
            <input
              type="text"
              placeholder="Owner or boat name"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
        >
          <FaPlus className="inline mr-2" /> Add Boat
        </button>

        <div className="mb-4 text-sm text-gray-700">
          Selected: {selectedRecords.length}
        </div>

        <div className="overflow-x-auto shadow rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="bg-gray-50 uppercase text-gray-700">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={
                      paginated.length > 0 &&
                      paginated.every((r) => selectedRecords.includes(r.id))
                    }
                    onChange={handleSelectAllChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Boat</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto" />
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No records.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => {
                  const owner = [r.last_name, r.first_name, r.middle_name]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(r.id)}
                          onChange={(e) => handleSelectOneChange(r.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{owner}</td>
                      <td className="px-6 py-4">{r.fishing_boat_name}</td>
                      <td className="px-6 py-4">{r.status}</td>
                      <td className="px-6 py-4">{r.date}</td>
                      <td className="px-6 py-4 space-x-2">
                        <Link
                          href={`/boatrecords/view?boatRecordId=${r.id}&barangay=${encodeURIComponent(selectedBarangay)}`}
                          className="inline-flex items-center bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
                        >
                          <FaEye className="mr-1" /> View
                        </Link>
                        <button
                          onClick={() => openEditModal(r)}
                          className="inline-flex items-center bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-400"
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="inline-flex items-center bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
                        >
                          <FaTrash className="mr-1" /> Delete
                        </button>
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
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-6xl w-full overflow-auto relative">
            <button
              className="absolute top-4 right-4 text-red-600 text-xl"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-6xl w-full overflow-auto relative">
            <button
              className="absolute top-4 right-4 text-red-600 text-xl"
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

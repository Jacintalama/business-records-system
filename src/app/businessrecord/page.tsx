'use client';

import { useState, useEffect, ChangeEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import NavBar from "../components/NavBar";
import BusinessRecordForm from "../components/BusinessRecordForm";
import { BusinessRecord } from "@/types/BusinessRecord";
import Topbar from "../components/Topbar";

// Update the interface to include the record year.
interface ApplicantDisplay {
  id: string;
  applicantName: string;
  applicantAddress: string;
  businessName: string;
  capitalInvestment: number;
  recordId?: string;
  year: number;
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

const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export default function BusinessRecordsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string>('User');

  // Check if the user is authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("http://192.168.1.107:3000/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          const fullName = `${data.firstName} ${data.lastName}`;
          setUserName(fullName);
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

  // State for barangay & applicants data
  const [selectedBarangay, setSelectedBarangay] = useState<string>(barangays[0]);
  const [applicants, setApplicants] = useState<ApplicantDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for search and business name filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("all");

  // New state for delinquency filter
  const [onlyDelinquent, setOnlyDelinquent] = useState<boolean>(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Partial<BusinessRecord> | null>(null);

  // Hydration state for SSR
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const handlePageShow = () => {
      fetchApplicants(selectedBarangay);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [selectedBarangay]);

  useEffect(() => {
    const handlePopState = () => {
      fetchApplicants(selectedBarangay);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [selectedBarangay]);

  useEffect(() => {
    if (hydrated) {
      const initialBarangay = searchParams.get("barangay") || barangays[0];
      setSelectedBarangay(initialBarangay);
    }
  }, [hydrated, searchParams]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchApplicants(selectedBarangay);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedBarangay]);

  // Fetch applicants – now including "year" from record if available.
  const fetchApplicants = async (barangay: string) => {
    setIsLoading(true);
    try {
      const url = `http://192.168.1.107:3000/api/business-record?barangay=${encodeURIComponent(barangay)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
        }
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      const data = await res.json();
      const records: BusinessRecord[] = data.records || [];
      const allApplicants: ApplicantDisplay[] = records
        .map((record) => {
          const rec = record as any;
          if (!rec.applicant) return null;
          return {
            id: String(rec.applicant.id),
            applicantName: rec.applicant.applicantName,
            applicantAddress: rec.applicant.applicantAddress,
            businessName: rec.applicant.businessName,
            capitalInvestment: Number(rec.applicant.capitalInvestment),
            recordId: String(rec.id),
            year: rec.year ? Number(rec.year) : new Date().getFullYear(),
          };
        })
        .filter(Boolean) as ApplicantDisplay[];

      // De-duplicate by applicant ID, keeping the record with the highest (most recent) year
      const uniqueMap: Record<string, ApplicantDisplay> = {};
      allApplicants.forEach((a) => {
        if (!uniqueMap[a.id] || a.year > uniqueMap[a.id].year) {
          uniqueMap[a.id] = a;
        }
      });
      const uniqueApplicants = Object.values(uniqueMap);
      setApplicants(uniqueApplicants);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      toast.error(`Error fetching applicants: ${(error as Error).message}`);
      setApplicants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants(selectedBarangay);
  }, [selectedBarangay]);

  // Filter data based on search query
  const filteredApplicants = applicants.filter((a) =>
    `${a.applicantName} ${a.businessName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prepare business name options for the Select component
  const uniqueBusinessNames = Array.from(
    new Set(filteredApplicants.map((a) => a.businessName.toLowerCase()))
  );
  const businessNameOptions = [
    { value: "all", label: "All" },
    ...uniqueBusinessNames.map((name) => ({
      value: name,
      label: capitalize(name),
    })),
  ];

  // Final filtered applicants list:
  let finalApplicants =
    selectedBusinessName === "all"
      ? filteredApplicants
      : filteredApplicants.filter((a) => a.businessName.toLowerCase() === selectedBusinessName);

  // Filter for delinquent records (year less than current year)
  const currentYear = new Date().getFullYear();
  if (onlyDelinquent) {
    finalApplicants = finalApplicants.filter((a) => a.year < currentYear);
  }

  // Pagination state and logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(finalApplicants.length / itemsPerPage);
  const indexOfLastApplicant = currentPage * itemsPerPage;
  const indexOfFirstApplicant = indexOfLastApplicant - itemsPerPage;
  const paginatedApplicants = finalApplicants.slice(indexOfFirstApplicant, indexOfLastApplicant);

  // State for selected applicants (IDs)
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);

  // Handle select all for current page
  const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelections = paginatedApplicants.map((a) => a.id);
      setSelectedApplicants((prev) =>
        Array.from(new Set([...prev, ...newSelections]))
      );
    } else {
      setSelectedApplicants((prev) =>
        prev.filter((id) => !paginatedApplicants.some((a) => a.id === id))
      );
    }
  };

  // Handle individual row checkbox changes
  const handleSelectOneChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplicants((prev) => [...prev, id]);
    } else {
      setSelectedApplicants((prev) => prev.filter((item) => item !== id));
    }
  };

  // Delete applicant
  const handleDeleteApplicant = async (id: string) => {
    if (!confirm("Are you sure you want to delete this applicant?")) return;
    try {
      const res = await fetch(`http://192.168.1.107:3000/api/applicants/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Applicant Records deleted successfully!");
        fetchApplicants(selectedBarangay);
      } else {
        const err = await res.json();
        toast.error(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error("Error deleting applicant:", error);
      toast.error("Failed to delete applicant. Please try again.");
    }
  };

  // Open the edit modal
  const openEditModal = async (applicant: ApplicantDisplay) => {
    try {
      const res = await fetch(
        `http://192.168.1.107:3000/api/business-record?applicantId=${applicant.id}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch record: ${res.statusText}`);
      }
      const data = await res.json();
      let fullRecord: Partial<BusinessRecord>;
      const records = data.records || [];

      if (records.length > 0) {
        const rec = records[0];
        fullRecord = {
          id: rec.id,
          applicantName: rec.applicant.applicantName,
          applicantAddress: rec.applicant.applicantAddress,
          businessName: rec.applicant.businessName,
          capitalInvestment: rec.applicant.capitalInvestment?.toString() || "0",
        };
      } else if (data.applicant) {
        fullRecord = {
          id: data.applicant.id,
          applicantName: data.applicant.applicantName,
          applicantAddress: data.applicant.applicantAddress,
          businessName: data.applicant.businessName,
          capitalInvestment: data.applicant.capitalInvestment?.toString() || "0",
        };
      } else {
        toast.error("No record or applicant found for editing.");
        return;
      }
      setEditRecord(fullRecord);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error loading record for editing:", error);
      toast.error("Failed to load record for editing.");
    }
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
            LEDGERS
          </h2>
          <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
        </div>

        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Barangay
            </label>
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {barangays.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Business Name
            </label>
            {hydrated && (
              <Select
                options={businessNameOptions}
                value={businessNameOptions.find(
                  (opt) => opt.value === selectedBusinessName
                )}
                onChange={(opt) =>
                  setSelectedBusinessName(opt?.value || "all")
                }
                classNamePrefix="react-select"
              />
            )}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-4 px-4 py-2 bg-green-600 text-white font-semibold rounded shadow hover:bg-green-500 transition-colors"
        >
          <FaPlus className="inline-block mr-2" /> Add Record
        </button>

        {/* Search and Delinquent Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-500"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                id="table-search"
                className="block p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search for applicants"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="delinquent-filter"
                checked={onlyDelinquent}
                onChange={(e) => setOnlyDelinquent(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="delinquent-filter" className="ml-2 text-sm font-medium text-gray-700">
                Show only delinquent
              </label>
            </div>
          </div>
        </div>

        {/* Selected items indicator */}
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">
            Selected: {selectedApplicants.length}
          </span>
        </div>

        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="table-fixed w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="w-12 p-4">
                  <div className="flex items-center">
                    <input
                      id="checkbox-all-search"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm"
                      onChange={handleSelectAllChange}
                      checked={
                        paginatedApplicants.length > 0 &&
                        paginatedApplicants.every((app) =>
                          selectedApplicants.includes(app.id)
                        )
                      }
                    />
                  </div>
                </th>
                <th scope="col" className="w-2/12 px-6 py-3">
                  Applicant Name
                </th>
                <th scope="col" className="w-3/12 px-6 py-3">
                  Business Name
                </th>
                <th scope="col" className="w-2/12 px-6 py-3">
                  Capital
                </th>
                <th scope="col" className="w-1/12 px-6 py-3">
                  Year
                </th>
                <th scope="col" className="w-3/12 px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : paginatedApplicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No applicants found.
                  </td>
                </tr>
              ) : (
                paginatedApplicants.map((applicant) => (
                  <tr
                    key={applicant.id}
                    className={`border-b hover:bg-gray-50 ${applicant.year < currentYear ? "bg-red-300" : "bg-white"}`}
                  >
                    <td className="w-12 p-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm"
                          checked={selectedApplicants.includes(applicant.id)}
                          onChange={(e) =>
                            handleSelectOneChange(applicant.id, e.target.checked)
                          }
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {applicant.applicantName}
                    </td>
                    <td className="px-6 py-4">{applicant.businessName}</td>
                    <td className="px-6 py-4">
                      ₱{applicant.capitalInvestment.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{applicant.year}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/records?applicantId=${applicant.id}&barangay=${encodeURIComponent(
                            selectedBarangay
                          )}&applicantName=${encodeURIComponent(
                            applicant.applicantName
                          )}&applicantAddress=${encodeURIComponent(
                            applicant.applicantAddress
                          )}`}
                          className="no-underline hover:no-underline inline-flex items-center bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-500 transition-colors"
                        >
                          <FaEye className="mr-1" /> View
                        </Link>

                        <button
                          onClick={() => openEditModal(applicant)}
                          className="inline-flex items-center bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-400 transition-colors"
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteApplicant(applicant.id)}
                          className="inline-flex items-center bg-red-600 text-white py-1 px-3 rounded hover:bg-red-500 transition-colors"
                        >
                          <FaTrash className="mr-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Navigation */}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg max-w-6xl w-full mx-4 my-4 max-h-screen overflow-y-auto relative">
            <button
              className="text-red-600 text-xl font-bold float-right"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
            <BusinessRecordForm
              mode="create"
              onSubmitSuccess={() => {
                setIsModalOpen(false);
                fetchApplicants(selectedBarangay);
              }}
            />
          </div>
        </div>
      )}

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
            <BusinessRecordForm
              mode="edit"
              record={editRecord}
              onSubmitSuccess={() => {
                setIsEditModalOpen(false);
                setEditRecord(null);
                fetchApplicants(selectedBarangay);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

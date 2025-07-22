"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import { Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaBan, FaCheckCircle, FaEye, FaPlus, FaTimesCircle, FaTrash } from "react-icons/fa";
import NavBar from "../components/NavBar";
import BusinessRecordForm from "../components/BusinessRecordForm";
import { BusinessRecord } from "@/types/BusinessRecord";
import Topbar from "../components/Topbar";
import { isRecordDelinquentExact } from "../utils/periodUtils";
import BusinessRecordsPdf from "../components/BusinessRecordsPdf"; // New PDF printing component

interface ApplicantDisplay {
  id: string;
  applicantName: string;
  applicantAddress: string;
  businessName: string;
  natureOfBusiness: string;
  capitalInvestment: number;
  recordId?: string;
  year: number;
  date: string;
  frequency: "quarterly" | "semi-annual" | "annual";
  renewed: boolean;
  remarks: string;
  gross: string;
  orNo: string;
  totalPayment: string;
  expired: boolean;
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

const frequencyOptions = ["all", "quarterly", "semi-annual", "annual"];


const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Peso sign
const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
// end

// Table columns definition used for both page display and PDF.
export const tableColumns = [
  {
    key: "date",
    label: "Date",
    format: (val: string) => new Date(val).toLocaleDateString(),
  },
  {
    key: "applicantName",
    label: "Name of Applicant",
  },
  {
    key: "businessName",
    label: "Business Name",
  },
  {
    key: "natureOfBusiness",
    label: "Nature of Business",
    format: (val: string) =>
      (val as string).replace(/\b\w/g, (c) => c.toUpperCase()),
  },

  {
    key: "applicantAddress",
    label: "Address",
  },
  {
    key: "remarks",
    label: "Status",
  },
  {
    key: "gross",
    label: "Gross",
    format: (val: string | number) =>
      phpFormatter.format(
        typeof val === "number" ? val : parseFloat(val as string) || 0
      ),
  },
  {
    key: "orNo",
    label: "OR No.",
  },
  {
    key: "totalPayment",
    label: "Amount",
    format: (val: string | number) =>
      phpFormatter.format(
        typeof val === "number" ? val : parseFloat(val as string) || 0
      ),
  },
  {
    key: "frequency",
    label: "Mode of Payment",
    format: (val: string) => capitalize(val),
  },
];

export default function BusinessRecordsPage() {


  // ✅ Activate Function
  const handleActivate = async (recordId: string) => {
    if (!confirm("Are you sure you want to activate this record?")) return;

    try {
      const res = await fetch(`http://192.168.1.107:3000/api/business-record/${recordId}/activate`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(`Error: ${err.message}`);
        return;
      }

      const data = await res.json();

      toast.success("Record activated.");

      // ✅ Update local state with new 'expired' value
      setApplicants(prev =>
        prev.map(app => app.recordId === recordId ? { ...app, expired: data.record.expired } : app)
      );

    } catch (err) {
      console.error(err);
      toast.error("Failed to activate record.");
    }
  };


  // Expired Function Cons
  const handleMarkAsExpired = async (recordId: string) => {
    if (!confirm("Are you sure you want to mark this record as retired?")) return;

    try {
      const res = await fetch(`http://192.168.1.107:3000/api/business-record/${recordId}/expire`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(`Error: ${err.message}`);
        return;
      }

      const data = await res.json();

      toast.success("Record marked as Retired.");

      // ✅ Update local state with new 'expired' value
      setApplicants(prev =>
        prev.map(app =>
          app.recordId === recordId ? { ...app, expired: data.record.expired } : app
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark record as retired.");
    }
  };

  // End


  const searchParams = useSearchParams();
  const router = useRouter();

  // Authentication state.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string>("User");

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
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        router.push("/auth/login");
      }
    }
    checkAuth();
  }, [router]);

  // 🚫 REMOVE useState
  // const [selectedBarangay, setSelectedBarangay] = useState<string>(barangays[0]);

  // ✅ Instead, use a derived constant
  const barangayQuery = searchParams.get("barangay") || "";
  const selectedBarangay = barangays.includes(barangayQuery) ? barangayQuery : barangays[0];




  const [selectedFrequency, setSelectedFrequency] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNature, setSelectedNature] = useState<string>("all");
  const [onlyDelinquent, setOnlyDelinquent] = useState<boolean>(false);
  const [applicants, setApplicants] = useState<ApplicantDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [onlyExpired, setOnlyExpired] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch applicants data.
  const fetchApplicants = async (barangay: string) => {
    setIsLoading(true);
    try {
      const url = `http://192.168.1.107:3000/api/business-record?barangay=${encodeURIComponent(barangay)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) router.push("/auth/login");
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      const data = await res.json();
      const records: BusinessRecord[] = data.records || [];
      const allApplicants = records
        .map((record) => {
          const rec = record as any;
          if (!rec.applicant) return null;
          return {
            id: String(rec.applicant.id),
            applicantName: rec.applicant.applicantName,
            applicantAddress: rec.applicant.applicantAddress,
            businessName: rec.applicant.businessName,
            natureOfBusiness: normalizeNature(rec.applicant.natureOfBusiness || ""),
            capitalInvestment: Number(rec.applicant.capitalInvestment),
            recordId: String(rec.id),
            year: rec.year ? Number(rec.year) : new Date().getFullYear(),
            date: rec.date || new Date().toISOString(),
            frequency: (rec.frequency || "annual").trim().toLowerCase(),
            renewed: rec.renewed || false,
            remarks: rec.remarks || "",
            gross: rec.gross || "",
            orNo: rec.orNo || "",
            totalPayment: rec.totalPayment || "",
            expired: rec.expired || false,
          } as ApplicantDisplay;
        })
        .filter(Boolean) as ApplicantDisplay[];


      // Group all records per applicant
      const applicantGroups: Record<string, ApplicantDisplay[]> = {};
      allApplicants.forEach((a) => {
        if (!applicantGroups[a.id]) {
          applicantGroups[a.id] = [];
        }
        applicantGroups[a.id].push(a);
      });

      let uniqueApplicants: ApplicantDisplay[] = [];

      Object.values(applicantGroups).forEach((records) => {
        // ✅ 1. Find the latest record (will be displayed)
        const latest = records.reduce((prev, curr) =>
          new Date(curr.date) > new Date(prev.date) ? curr : prev
        );

        // ✅ 2. Check if ANY of the records is delinquent
        const hasDelinquent = records.some((r) => isRecordDelinquentExact(r));

        // ✅ 3. Add only if not filtering or if we are filtering AND there's at least one delinquent
        if (!onlyDelinquent || hasDelinquent) {
          uniqueApplicants.push(latest);
        }
      });


      // ✅ expired filter
      if (onlyExpired) {
        uniqueApplicants = uniqueApplicants.filter((a) => a.expired === true);
      }

      const filteredByNature =
        selectedNature === "all"
          ? uniqueApplicants
          : uniqueApplicants.filter(a =>
            a.natureOfBusiness.toLowerCase().includes(selectedNature.toLowerCase())
          );

      // frequency filter
      const filteredByFrequency =
        selectedFrequency === "all"
          ? filteredByNature
          : filteredByNature.filter(
            (a) =>
              a.frequency &&
              a.frequency.trim().toLowerCase() ===
              selectedFrequency.trim().toLowerCase()
          );

      // search
      const searchedApplicants = filteredByFrequency.filter((a) =>
        `${a.applicantName} ${a.businessName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );

      // sort alphabetically
      searchedApplicants.sort((a, b) =>
        a.applicantName.localeCompare(b.applicantName)
      );

      setApplicants(searchedApplicants);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      toast.error(`Error fetching applicants: ${(error as Error).message}`);
      setApplicants([]);
    } finally {
      setIsLoading(false);
    }
  };
  // normalize to a consistent key
  const normalizeNature = (s: string) => s.trim().toLowerCase();

  // pretty-print your dropdown labels
  const capitalizeWords = (s: string) =>
    s
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  useEffect(() => {
    if (!selectedBarangay || !barangays.includes(selectedBarangay)) return;
    fetchApplicants(selectedBarangay);
  }, [
    selectedBarangay,
    onlyDelinquent,
    onlyExpired,
    selectedNature,
    selectedFrequency,
    searchQuery,
  ]);





  const uniqueBusinessNames = Array.from(
    new Set(applicants.map((a) => a.businessName.toLowerCase()))
  );
  const businessNameOptions = [
    { value: "all", label: "All" },
    ...uniqueBusinessNames.map((name) => ({
      value: name,
      label: capitalize(name),
    })),
  ];

  // with a nature-of-business version
const getGroupedNatureOptions = (applicants: any[]) => {
  const keywordsSet = new Set<string>();

  applicants.forEach((a) => {
    const raw = a.natureOfBusiness?.toLowerCase().replace(/[-\s]+/g, " ").trim();
    if (!raw) return;
    const keyword = raw.split(" ")[0]; // Use first word as keyword group
    keywordsSet.add(keyword);
  });

  return [
    { value: "all", label: "All" },
    ...Array.from(keywordsSet).map((kw) => ({
      value: kw,
      label: capitalizeWords(kw),
    })),
  ];
};

const natureOptions = getGroupedNatureOptions(applicants);


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1000;
  const totalPages = Math.ceil(applicants.length / itemsPerPage);
  const indexOfLastApplicant = currentPage * itemsPerPage;
  const indexOfFirstApplicant = indexOfLastApplicant - itemsPerPage;
  function parseDate(dateStr: string): Date {
    if (!dateStr) return new Date(0); // fallback for null/undefined

    // Handles "MM/DD/YYYY" and "M/D/YYYY"
    const parts = dateStr.split("/");
    if (parts.length !== 3) return new Date(dateStr); // fallback

    const [month, day, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  }

  // ✅ Sort applicants by date DESCENDING before slicing
  const sortedApplicants = [...applicants].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return dateB.getTime() - dateA.getTime(); // Descending
  });

  // ✅ Then paginate the sorted list
  const paginatedApplicants = sortedApplicants.slice(
    indexOfFirstApplicant,
    indexOfLastApplicant
  );

  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelections = paginatedApplicants.map((a) => a.id);
      setSelectedApplicants(
        Array.from(new Set([...selectedApplicants, ...newSelections]))
      );
    } else {
      setSelectedApplicants(
        selectedApplicants.filter((id) => !paginatedApplicants.some((a) => a.id === id))
      );
    }
  };
  const handleSelectOneChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplicants([...selectedApplicants, id]);
    } else {
      setSelectedApplicants(selectedApplicants.filter((item) => item !== id));
    }
  };

  // Modal state for adding a new record.
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete a specific business record using its recordId.
  const handleDeleteApplicant = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const url = `http://192.168.1.107:3000/api/business-record/${recordId}`;
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(`Error: ${err.message}`);
        return;
      }
      toast.success("Record deleted successfully!");
      fetchApplicants(selectedBarangay);
    } catch (error) {
      console.error("Deletion error:", error);
      toast.error("Failed to delete record. Please try again.");
    }
  };

  return (
    <div>
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">LEDGERS</h2>
          <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Barangay
            </label>
            <select
              value={selectedBarangay}
              onChange={(e) => {
                const barangay = e.target.value;
                const params = new URLSearchParams(searchParams.toString());
                params.set("barangay", barangay);
                router.replace(`?${params.toString()}`);
              }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 transition"
            >
              {barangays.map((bgy) => (
                <option key={bgy} value={bgy}>
                  {capitalizeWords(bgy)}
                </option>
              ))}
            </select>
          </div>


          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Frequency
            </label>
            <select
              value={selectedFrequency}
              onChange={(e) => setSelectedFrequency(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {frequencyOptions.map((f) => (
                <option key={f} value={f}>
                  {f === "all" ? "All" : capitalize(f)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nature of Business
            </label>
            {hydrated && (
              <Select
                options={natureOptions}
                value={natureOptions.find(opt => opt.value === selectedNature)}
                onChange={opt => setSelectedNature(opt?.value || "all")}
                classNamePrefix="react-select"
              />

            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 space-y-4 sm:space-y-0">
          {/* Search Box */}
          <div className="flex items-center w-full sm:w-auto">
            <input
              type="text"
              id="table-search"
              className="block p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-full sm:w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search for applicants"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* ✅ Filters - tight next to search */}
            <div className="flex items-center ml-4 space-x-4">
              {/* Expired */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="expired-filter"
                  checked={onlyExpired}
                  onChange={(e) => setOnlyExpired(e.target.checked)}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="expired-filter" className="ml-2 text-sm font-medium text-gray-700 whitespace-nowrap">
                  Show only Retired
                </label>
              </div>

              {/* Delinquent */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="delinquent-filter"
                  checked={onlyDelinquent}
                  onChange={(e) => setOnlyDelinquent(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="delinquent-filter" className="ml-2 text-sm font-medium text-gray-700 whitespace-nowrap">
                  Show only Delinquent
                </label>
              </div>
            </div>
          </div>
        </div>


        {/* Action Buttons: Add Record & Print PDF */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() =>
              window.location.href = `http://192.168.1.107:3001/records/new`
            }
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded shadow hover:bg-green-500 transition-colors"
          >
            <FaPlus className="inline-block mr-2" /> Add Record
          </button>



          {/* New PDF printing component */}
          <BusinessRecordsPdf
            selectedBarangay={selectedBarangay}
            tableColumns={tableColumns}
            data={applicants}
          />
        </div>

        {/* Business Records Table */}
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          {/* Legend Indicators */}
          <div className="flex items-center space-x-4 mb-2 px-4 pt-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-300 border border-orange-500 rounded-sm"></div>
              <span className="text-sm text-gray-700">Retired</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-300 border border-red-500 rounded-sm"></div>
              <span className="text-sm text-gray-700">Delinquent</span>
            </div>
          </div>

          <table className="table-fixed w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                {tableColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-2 h-12 font-medium border-b border-gray-300"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-2 font-medium border-b border-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={tableColumns.length + 1} className="px-4 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : paginatedApplicants.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length + 1} className="px-4 py-4 text-center text-gray-500">
                    {onlyExpired
                      ? "No Retired applicants found."
                      : onlyDelinquent
                        ? "No delinquent applicants found."
                        : searchQuery
                          ? "No applicants match your search."
                          : "No applicants found."}
                  </td>
                </tr>

              ) : (
                paginatedApplicants.map((applicant) => (
                  <tr
                    key={applicant.id}
                    className={`hover:bg-gray-100
    ${applicant.expired
                        ? 'bg-orange-200 text-orange-900' // 🟠 Orange if expired
                        : isRecordDelinquentExact(applicant)
                          ? 'bg-red-300'        // 🔴 Red if delinquent
                          : 'odd:bg-white even:bg-gray-50'
                      }`}
                  >
                    {tableColumns.map((col) => {
                      // pull the raw value out
                      const raw = (col.key === "date" && col.format)
                        ? col.format((applicant as any)[col.key])
                        : (applicant as any)[col.key];
                      // if there's a custom formatter, use it; otherwise just show raw
                      const display = col.format && col.key !== "date"
                        ? col.format(raw)
                        : raw;
                      return (
                        <td key={`${applicant.id}-${col.key}`} className="px-4 py-2 h-12 border-b border-gray-200">
                          {display}
                        </td>
                      );
                    })}


                    <td className="px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/records?applicantId=${applicant.id}&barangay=${encodeURIComponent(
                            selectedBarangay
                          )}&applicantName=${encodeURIComponent(
                            applicant.applicantName
                          )}&applicantAddress=${encodeURIComponent(
                            applicant.applicantAddress
                          )}`}
                          className="inline-flex items-center bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-500 transition-colors"
                          title="View"
                        >
                          <FaEye size={14} />
                        </Link>
                        <button
                          onClick={() =>
                            applicant.recordId && handleDeleteApplicant(applicant.recordId)
                          }
                          className="inline-flex items-center bg-red-600 text-white px-2 py-1 rounded hover:bg-red-500 transition-colors"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>

                        {/* Expired */}
                        {applicant.recordId && (
                          <>
                            {applicant.expired ? (
                              <button
                                title="Activate"
                                className="text-green-600 hover:text-green-800 ml-2"
                                onClick={() => handleActivate(applicant.recordId!)} // safe to assert here
                              >
                                <FaCheckCircle className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                title="Mark as Retired"
                                className="text-red-600 hover:text-red-800 ml-2"
                                onClick={() => handleMarkAsExpired(applicant.recordId!)} // safe to assert here
                              >
                                <FaBan className="w-5 h-5" />
                              </button>
                            )}
                          </>
                        )}


                      </div>
                    </td>
                  </tr>
                ))
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

      {/* New Record Modal */}
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

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
        limit={3}
      />
    </div>
  );
}

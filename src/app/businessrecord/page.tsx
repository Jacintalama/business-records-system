  "use client";

  import { useState, useEffect, ChangeEvent } from "react";
  import { useSearchParams, useRouter, usePathname } from "next/navigation";
  import Link from "next/link";
  import Select from "react-select";
  import { toast, ToastContainer } from "react-toastify";
  import { Slide } from "react-toastify";
  import "react-toastify/dist/ReactToastify.css";
  import { FaEye, FaPlus, FaTrash } from "react-icons/fa";
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
    },
  ];


  export default function BusinessRecordsPage() {

    const pathname = usePathname();
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

    const [selectedBarangay, setSelectedBarangay] = useState<string>(barangays[0]);

    // This function use to force refresh
    const [version] = useState(0);

    useEffect(() => {
      fetchApplicants(selectedBarangay);
    }, [pathname, selectedBarangay]);
    


    useEffect(() => {
      const barangayFromQuery = searchParams.get("barangay");
      const initialBarangay = barangayFromQuery && barangays.includes(barangayFromQuery)
        ? barangayFromQuery
        : barangays[0];

      setSelectedBarangay(initialBarangay);
    }, [searchParams]);


    const [selectedFrequency, setSelectedFrequency] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBusinessName, setSelectedBusinessName] = useState<string>("all");
    const [onlyDelinquent, setOnlyDelinquent] = useState<boolean>(false);
    const [applicants, setApplicants] = useState<ApplicantDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
      setHydrated(true);
    }, []);

    // Fetch applicants data.
    const fetchApplicants = async (barangay: string) => {
      setIsLoading(true);
      try {
        const url = `http://192.168.1.107:3000/api/business-record?barangay=${encodeURIComponent(
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
              natureOfBusiness: rec.applicant.natureOfBusiness || "",
              capitalInvestment: Number(rec.applicant.capitalInvestment),
              recordId: String(rec.id),
              year: rec.year ? Number(rec.year) : new Date().getFullYear(),
              date: rec.date ? rec.date : new Date().toISOString(),
              frequency: (rec.frequency || "annual").trim().toLowerCase(),
              renewed: rec.renewed || false,
              remarks: rec.remarks || "",
              gross: rec.gross || "",
              orNo: rec.orNo || "",
              totalPayment: rec.totalPayment || "",
            };
          })
          .filter(Boolean) as ApplicantDisplay[];

        const uniqueMap: Record<string, ApplicantDisplay> = {};
        allApplicants.forEach((a) => {
          if (!uniqueMap[a.id] || a.year > uniqueMap[a.id].year) {
            uniqueMap[a.id] = a;
          }
        });
        let uniqueApplicants = Object.values(uniqueMap);

        if (onlyDelinquent) {
          uniqueApplicants = uniqueApplicants.filter((a) =>
            isRecordDelinquentExact(a)
          );
        }

        const filteredByBusiness =
          selectedBusinessName === "all"
            ? uniqueApplicants
            : uniqueApplicants.filter(
              (a) => a.businessName.toLowerCase() === selectedBusinessName
            );

        const finalApplicants =
          selectedFrequency === "all"
            ? filteredByBusiness
            : filteredByBusiness.filter(
              (a) =>
                a.frequency &&
                a.frequency.trim().toLowerCase() ===
                selectedFrequency.trim().toLowerCase()
            );

        const searchedApplicants = finalApplicants.filter((a) =>
          `${a.applicantName} ${a.businessName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
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

    useEffect(() => {
      if (selectedBarangay) {
        fetchApplicants(selectedBarangay);
      }
    }, [selectedBarangay, onlyDelinquent, selectedBusinessName, selectedFrequency, searchQuery]);


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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;
    const totalPages = Math.ceil(applicants.length / itemsPerPage);
    const indexOfLastApplicant = currentPage * itemsPerPage;
    const indexOfFirstApplicant = indexOfLastApplicant - itemsPerPage;
    const paginatedApplicants = applicants.slice(
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
                  setSelectedBarangay(barangay);
                  router.replace(`?barangay=${encodeURIComponent(barangay)}`);
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

          {/* Search & Delinquent Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-4 space-y-4 sm:space-y-0">
            <div className="relative">
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
            <table className="table-fixed w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-2 font-medium border-b border-gray-300"
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
                      No applicants found.
                    </td>
                  </tr>
                ) : (
                  paginatedApplicants.map((applicant) => (
                    <tr
                      key={applicant.id}
                      className={`hover:bg-gray-100 ${isRecordDelinquentExact(applicant)
                        ? 'bg-red-300'
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
                          <td key={`${applicant.id}-${col.key}`} className="px-4 py-2 border-b border-gray-200">
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

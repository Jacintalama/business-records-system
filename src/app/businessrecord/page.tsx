"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Select from "react-select";
import { toast } from "react-toastify";
import { FaEye, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import NavBar from "../components/NavBar";
import BusinessRecordForm from "../components/BusinessRecordForm";
import { BusinessRecord } from "@/types/BusinessRecord";

interface ApplicantDisplay {
  id: string;
  applicantName: string;
  applicantAddress: string;
  businessName: string;
  capitalInvestment: number;
  recordId?: string;
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

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function BusinessRecordsPage() {
  const searchParams = useSearchParams();

  // State for Barangay & Data
  const [selectedBarangay, setSelectedBarangay] = useState<string>(barangays[0]);
  const [applicants, setApplicants] = useState<ApplicantDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for Search & Business Name filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("all");

  // State for Date Filter (dropdown)
  const [timeFilter, setTimeFilter] = useState("Last day");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Partial<BusinessRecord> | null>(null);

  // For hydration (Next.js SSR)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      const initialBarangay = searchParams.get("barangay") || barangays[0];
      setSelectedBarangay(initialBarangay);
    }
  }, [hydrated, searchParams]);

  // Fetch data
  const fetchApplicants = async (barangay: string) => {
    setIsLoading(true);
    try {
      const url = `http://localhost:3000/api/business-record?barangay=${encodeURIComponent(barangay)}`;
      const res = await fetch(url);
      if (!res.ok) {
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
          };
        })
        .filter(Boolean) as ApplicantDisplay[];

      // De-duplicate by applicant ID
      const uniqueMap: Record<string, ApplicantDisplay> = {};
      allApplicants.forEach((a) => {
        uniqueMap[a.id] = a;
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

  // Filter the data based on search
  const filteredApplicants = applicants.filter((a) =>
    `${a.applicantName} ${a.businessName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // For business name <Select />
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

  // Final list after business name filter
  const finalApplicants =
    selectedBusinessName === "all"
      ? filteredApplicants
      : filteredApplicants.filter((a) => a.businessName.toLowerCase() === selectedBusinessName);

  // Delete applicant
  const handleDeleteApplicant = async (id: string) => {
    if (!confirm("Are you sure you want to delete this applicant?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/applicants/${id}`, {
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
        `http://localhost:3000/api/business-record?applicantId=${applicant.id}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch record: ${res.statusText}`);
      }
      const data = await res.json();
      let fullRecord: Partial<BusinessRecord>;
      const records = data.records || [];

      if (records.length > 0) {
        fullRecord = records[0];
      } else {
        if (data.applicant) {
          fullRecord = {
            id: data.applicant.id,
            applicantName: data.applicant.applicantName,
            applicantAddress: data.applicant.applicantAddress,
            businessName: data.applicant.businessName,
            capitalInvestment: data.applicant.capitalInvestment?.toString() || "0",
            year: 0,
            date: "",
            gross: 0,
            orNo: "",
            busTax: 0,
            mayorsPermit: 0,
            sanitaryInps: 0,
            policeClearance: 0,
            taxClearance: 0,
            garbage: 0,
            verification: 0,
            weightAndMass: 0,
            healthClearance: 0,
            secFee: 0,
            menro: 0,
            docTax: 0,
            eggsFee: 0,
            market: 0,
            surcharge25: 0,
            surcharge5: 0,
            totalPayment: 0,
            remarks: "",
          };
        } else {
          toast.error("No record or applicant found for editing.");
          return;
        }
      }
      setEditRecord(fullRecord);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error loading record for editing:", error);
      toast.error("Failed to load record for editing.");
    }
  };

  // Handle date filter change
  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    setDropdownOpen(false);
    // Here you can update the data filtering by time if needed
  };

  return (
    <div>
      <NavBar />

      <div className="w-[95%] mx-auto my-8">
        {/* Back to Dashboard Link */}
        <Link
          href="/"
          className="inline-flex no-underline hover:no-underline bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          &larr; Back to Dashboard
        </Link>

        {/* Header / Logo */}
        <div className="text-center my-6">
          <Image
            src="/Logo1.png"
            alt="Logo"
            width={200}
            height={150}
            className="mx-auto mb-4"
          />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            BUSINESS RECORD
          </h2>
          <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
        </div>

        {/* Filters (Barangay & Business Name) */}
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
                onChange={(opt) => setSelectedBusinessName(opt?.value || "all")}
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

        {/* Top bar with Date Filter on left and Search on right */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 space-y-4 sm:space-y-0">
          {/* Date Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5"
              type="button"
            >
              <svg
                className="w-3 h-3 text-gray-500 mr-2"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm3.982 13.982a1 1 0 0 1-1.414 0l-3.274-3.274A1.012 1.012 0 0 1 9 10V6a1 1 0 0 1 2 0v3.586l2.982 2.982a1 1 0 0 1 0 1.414Z" />
              </svg>
              {timeFilter}
              <svg
                className="w-2.5 h-2.5 ml-2"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 4 4 4-4"
                />
              </svg>
            </button>
            {dropdownOpen && (
              <div
                className="z-10 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow-sm absolute mt-1"
                style={{ minWidth: "12rem" }}
              >
                <ul className="p-3 space-y-1 text-sm text-gray-700">
                  {[
                    "Last day",
                    "Last 7 days",
                    "Last 30 days",
                    "Last month",
                    "Last year",
                  ].map((label) => (
                    <li key={label}>
                      <div
                        className="flex items-center p-2 rounded-sm hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleTimeFilterChange(label)}
                      >
                        <input
                          type="radio"
                          name="filter-radio"
                          checked={timeFilter === label}
                          onChange={() => handleTimeFilterChange(label)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-900">
                          {label}
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Search Bar on the right */}
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
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 
                    6 0 1110.89 3.476l4.817 
                    4.817a1 1 0 01-1.414 
                    1.414l-4.816-4.816A6 
                    6 0 012 8z"
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
        </div>

        {/* Table Container */}
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
                <th scope="col" className="w-3/12 px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : finalApplicants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No applicants found.
                  </td>
                </tr>
              ) : (
                finalApplicants.map((applicant) => (
                  <tr
                    key={applicant.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="w-12 p-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {applicant.applicantName}
                    </td>
                    <td className="px-6 py-4">{applicant.businessName}</td>
                    <td className="px-6 py-4">
                      {applicant.capitalInvestment.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/records?applicantId=${applicant.id}&barangay=${encodeURIComponent(selectedBarangay)}&applicantName=${encodeURIComponent(applicant.applicantName)}&applicantAddress=${encodeURIComponent(applicant.applicantAddress)}`}
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

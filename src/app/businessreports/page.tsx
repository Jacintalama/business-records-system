"use client";

import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import Topbar from "../components/Topbar";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Register Chart.js components including the DataLabels plugin
ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const barangays = [
  "Overall",
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

const generateYears = (startYear = 2000, extraYears = 10): number[] => {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + extraYears;
  const years: number[] = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years;
};

const years = generateYears();

// Updated PaymentRecord interface without "market" field and with frequency
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
  sucharge2: string; // renamed from surcharge5
  totalPayment: string;
  remarks: string;
  frequency: "quarterly" | "semi-annual" | "annual"; // New field
  applicant?: {
    id: number;
    applicantName: string;
    applicantAddress: string;
    businessName: string;
    capitalInvestment: number;
  };
  marketCertification?: string; // new field
  miscellaneous?: string;       // new field
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
    label: "Basic Info",
    columns: [
      { key: "year", label: "Year" },
      {
        key: "date",
        label: "Date",
        format: (val: string) => new Date(val).toLocaleDateString(),
      },
      { key: "gross", label: "Gross" },
      { key: "orNo", label: "OR No." },
      { key: "frequency", label: "Frequency" },
    ],
  },
  {
    label: "Fees & Clearances",
    columns: [
      { key: "busTax", label: "BUS TAX" },
      { key: "mayorsPermit", label: "Mayor's Permit" },
      { key: "sanitaryInps", label: "Sanitary Inps" },
      { key: "policeClearance", label: "Police Clearance" },
      { key: "taxClearance", label: "Tax Clearance" },
      { key: "garbage", label: "Garbage" },
      { key: "verification", label: "Verification" },
      { key: "weightAndMass", label: "Weight & Mass" },
      { key: "healthClearance", label: "Health Clearance" },
      { key: "secFee", label: "SEC Fee" },
      { key: "menro", label: "MENRO" },
      { key: "docTax", label: "Doc Tax" },
      { key: "eggsFee", label: "Egg's Fee" },
    ],
  },
  {
    label: "Surcharges",
    columns: [
      { key: "surcharge25", label: "25% Surcharge" },
      { key: "sucharge2", label: "2% Month" },
    ],
  },
  {
    label: "Additional Info",
    columns: [
      { key: "marketCertification", label: "Market Certification" },
      { key: "miscellaneous", label: "Miscellaneous" },
    ],
  },
  {
    label: "Totals & Remarks",
    columns: [
      { key: "totalPayment", label: "Total Payment" },
      { key: "remarks", label: "Remarks" },
    ],
  },
];

//
// BusinessReportsPage: Now the report shows the overall Business Tax data alongside a pumpboat count (boat count).
//
export default function BusinessReportsPage() {
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userName, setUserName] = useState("User");

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
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedBarangay, setSelectedBarangay] = useState<string>("Overall");

  // Report data state for overall Business Tax
  const [overallReportData, setOverallReportData] = useState<{
    businessTax: { new: number; renew: number; total: number };
  } | null>(null);

  // State for pumpboat count (the total number of boat records)
  const [pumpboatCount, setPumpboatCount] = useState<number>(0);

  // Fetch Business Tax reports for overall data
  useEffect(() => {
    async function fetchReports() {
      try {
        if (selectedBarangay === "Overall") {
          // Exclude "Overall" from aggregation.
          const individualBarangays = barangays.filter((b) => b !== "Overall");

          // Fetch overall data for each barangay
          const overallPromises = individualBarangays.map((b) => {
            const url = `http://192.168.1.107:3000/api/business-record/reports?year=${selectedYear}&barangay=${encodeURIComponent(
              b
            )}`;
            return fetch(url, { credentials: "include" }).then(async (response) => {
              if (!response.ok) {
                const errorText = await response.text();
                console.error(
                  `Failed to fetch report for ${b}:`,
                  response.status,
                  errorText
                );
                throw new Error(`Failed to fetch report for ${b}`);
              }
              return response.json();
            });
          });
          const overallResults = await Promise.all(overallPromises);
          let overallNew = 0,
            overallRenew = 0;
          overallResults.forEach((result) => {
            overallNew += result.businessTax?.new || 0;
            overallRenew += result.businessTax?.renew || 0;
          });
          setOverallReportData({
            businessTax: {
              new: overallNew,
              renew: overallRenew,
              total: overallNew + overallRenew,
            },
          });
        } else {
          // Fetch for a specific barangay.
          const baseUrl = `http://192.168.1.107:3000/api/business-record/reports?year=${selectedYear}&barangay=${encodeURIComponent(
            selectedBarangay
          )}`;
          const overallRes = await fetch(baseUrl, { credentials: "include" });
          if (!overallRes.ok) {
            const errorText = await overallRes.text();
            console.error(
              "Failed to fetch overall report:",
              overallRes.status,
              errorText
            );
            throw new Error(
              `Failed to fetch overall report: ${overallRes.statusText}`
            );
          }
          const overallData = await overallRes.json();
          const overallNew = overallData.businessTax?.new || 0;
          const overallRenew = overallData.businessTax?.renew || 0;
          setOverallReportData({
            businessTax: {
              new: overallNew,
              renew: overallRenew,
              total: overallNew + overallRenew,
            },
          });
        }
      } catch (error) {
        console.error("Error in fetchReports:", error);
      }
    }
    fetchReports();
  }, [selectedYear, selectedBarangay]);

  // Fetch pumpboat count (boat count) from boat records
  useEffect(() => {
    async function fetchPumpboatCount() {
      try {
        let allRecords: any[] = [];

        if (selectedBarangay === "Overall") {
          const individualBarangays = barangays.filter((b) => b !== "Overall");
          const promises = individualBarangays.map((b) => {
            const url = `http://192.168.1.107:3000/api/boatrecords?barangay=${encodeURIComponent(
              b
            )}`;
            return fetch(url, { credentials: "include" }).then((res) => res.json());
          });
          const results = await Promise.all(promises);
          results.forEach((r) => {
            if (Array.isArray(r.records)) {
              allRecords.push(...r.records);
            }
          });
        } else {
          const url = `http://192.168.1.107:3000/api/boatrecords?barangay=${encodeURIComponent(
            selectedBarangay
          )}`;
          const res = await fetch(url, { credentials: "include" });
          const result = await res.json();
          allRecords = Array.isArray(result.records) ? result.records : [];
        }

        // Filter by selectedYear
        const countThisYear = allRecords.filter((rec) => {
          const recYear = new Date(rec.date).getFullYear();
          return recYear === selectedYear;
        }).length;

        setPumpboatCount(countThisYear);
      } catch (error) {
        console.error("Error fetching pumpboat count:", error);
        setPumpboatCount(0);
      }
    }
    fetchPumpboatCount();
  }, [selectedBarangay, selectedYear]);


  // Pie Chart Data using overall and pumpboat count data
  const chartData = {
    labels: ["New", "Renew", "Pumpboat"],
    datasets: [
      {
        label: `Year ${selectedYear}`,
        data: [
          overallReportData ? overallReportData.businessTax.new : 0,
          overallReportData ? overallReportData.businessTax.renew : 0,
          pumpboatCount,
        ],
        backgroundColor: [
          "rgb(54, 162, 235)", // Blue for New
          "rgb(75, 192, 192)", // Teal for Renew
          "rgb(255, 99, 132)", // Red for Pumpboat
        ],
      },
    ],
  };

  // Pie chart options with DataLabels plugin
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text:
          selectedBarangay === "Overall"
            ? `Overall Business Tax Report - ${selectedYear}`
            : `Business Tax Report - ${selectedYear} - Brgy. ${selectedBarangay}`,
      },
      legend: {
        display: true,
      },
      datalabels: {
        color: "#fff",
        formatter: (value: number) => value,
        font: {
          weight: "bold" as "bold",
          size: 14,
        },
      },
    },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <NavBar />
      <div className="mt-8 mb-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Link
            href="/"
            className="inline-flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200 ease-in-out"
          >
            &larr; Back to Dashboard
          </Link>

          <Link
            href="/businessreports/list"
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition duration-200 ease-in-out"
          >
            View Report List
          </Link>
        </div>
      </div>


      <main className="max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Registered Tax Payers
          </h1>
          <p className="text-gray-600">
            Municipality of Maasim, Sarangani
          </p>
        </header>

        {/* Filter Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Year Dropdown */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          {/* Barangay Dropdown */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Barangay
            </label>
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {barangays.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart Section: Pie Chart */}
        <div className="bg-white rounded shadow p-6 mb-8" style={{ height: "300px" }}>
          <Pie data={chartData} options={chartOptions} />
        </div>

        {/* Overall Business Tax Data Table (now including Pumpboat row) */}
        <div className="overflow-x-auto bg-white rounded shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Overall Business Tax Data
          </h2>
          {overallReportData ? (
            <table className="table-fixed w-full border-collapse">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="w-1/5 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="w-1/5 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Year
                  </th>
                  <th className="w-1/5 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    New
                  </th>
                  <th className="w-1/5 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Renew
                  </th>
                  <th className="w-1/5 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3">Overall Business Tax</td>
                  <td className="px-4 py-3">{selectedYear}</td>
                  <td className="px-4 py-3">{overallReportData.businessTax.new}</td>
                  <td className="px-4 py-3">{overallReportData.businessTax.renew}</td>
                  <td className="px-4 py-3">{overallReportData.businessTax.total}</td>
                </tr>
                {/* New Pumpboat row */}
                <tr>
                  <td className="px-4 py-3">Pumpboat Count</td>
                  <td className="px-4 py-3">{selectedYear}</td>
                  <td className="px-4 py-3" colSpan={2}></td>
                  <td className="px-4 py-3">{pumpboatCount}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p>Loading Overall data...</p>
          )}
        </div>


        {/* Pumpboat Count Data Table
        <div className="overflow-x-auto bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Pumpboat (Boat Count) Data
          </h2>
          <table className="table-fixed w-full border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="w-1/3 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="w-1/3 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Barangay
                </th>
                <th className="w-1/3 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Pumpboat Count
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3">Pumpboat Count</td>
                <td className="px-4 py-3">{selectedBarangay}</td>
                <td className="px-4 py-3">{pumpboatCount}</td>
              </tr>
            </tbody>
          </table>
        </div> */}
      </main>
    </div>
  );
}

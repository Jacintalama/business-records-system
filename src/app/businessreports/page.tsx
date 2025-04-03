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
import { useRouter } from "next/navigation";

// Register Chart.js components required for Pie chart including DataLabels plugin
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

export default function BusinessReportsPage() {
  const router = useRouter();

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
  // Delinquency filter state (this flag now only affects table rows, not chart data)
  const [onlyDelinquent, setOnlyDelinquent] = useState<boolean>(false);

  // Report data states
  const [overallReportData, setOverallReportData] = useState<{
    businessTax: { new: number; renew: number; total: number };
  } | null>(null);
  const [delinquentReportData, setDelinquentReportData] = useState<{
    businessTax: { new: number; renew: number; total: number };
  } | null>(null);

  // Fetch both overall and delinquent data (with aggregation if "Overall" is selected)
  useEffect(() => {
    async function fetchReports() {
      try {
        if (selectedBarangay === "Overall") {
          // Exclude "Overall" from aggregation.
          const individualBarangays = barangays.filter((b) => b !== "Overall");

          // Fetch overall data for each barangay
          const overallPromises = individualBarangays.map((b) => {
            const url = `http://192.168.1.107:3000/api/business-record/reports?year=${selectedYear}&barangay=${encodeURIComponent(b)}`;
            return fetch(url, { credentials: "include" }).then(async (response) => {
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch report for ${b}:`, response.status, errorText);
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
            businessTax: { new: overallNew, renew: overallRenew, total: overallNew + overallRenew },
          });

          // Fetch delinquent data for each barangay
          const delinquentPromises = individualBarangays.map((b) => {
            const url = `http://192.168.1.107:3000/api/business-record/reports?year=${selectedYear}&barangay=${encodeURIComponent(b)}&delinquent=true`;
            return fetch(url, { credentials: "include" }).then(async (response) => {
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch delinquent report for ${b}:`, response.status, errorText);
                throw new Error(`Failed to fetch delinquent report for ${b}`);
              }
              return response.json();
            });
          });
          const delinquentResults = await Promise.all(delinquentPromises);
          let delinquentNew = 0,
            delinquentRenew = 0;
          delinquentResults.forEach((result) => {
            delinquentNew += result.businessTax?.new || 0;
            delinquentRenew += result.businessTax?.renew || 0;
          });
          setDelinquentReportData({
            businessTax: { new: delinquentNew, renew: delinquentRenew, total: delinquentNew + delinquentRenew },
          });
        } else {
          // Fetch for a specific barangay.
          const baseUrl = `http://192.168.1.107:3000/api/business-record/reports?year=${selectedYear}&barangay=${encodeURIComponent(selectedBarangay)}`;
          const overallRes = await fetch(baseUrl, { credentials: "include" });
          if (!overallRes.ok) {
            const errorText = await overallRes.text();
            console.error("Failed to fetch overall report:", overallRes.status, errorText);
            throw new Error(`Failed to fetch overall report: ${overallRes.statusText}`);
          }
          const overallData = await overallRes.json();
          const overallNew = overallData.businessTax?.new || 0;
          const overallRenew = overallData.businessTax?.renew || 0;
          setOverallReportData({
            businessTax: { new: overallNew, renew: overallRenew, total: overallNew + overallRenew },
          });

          const delinquentRes = await fetch(baseUrl + "&delinquent=true", {
            credentials: "include",
          });
          if (!delinquentRes.ok) {
            const errorText = await delinquentRes.text();
            console.error("Failed to fetch delinquent report:", delinquentRes.status, errorText);
            throw new Error(`Failed to fetch delinquent report: ${delinquentRes.statusText}`);
          }
          const delinquentData = await delinquentRes.json();
          const delinquentNew = delinquentData.businessTax?.new || 0;
          const delinquentRenew = delinquentData.businessTax?.renew || 0;
          setDelinquentReportData({
            businessTax: { new: delinquentNew, renew: delinquentRenew, total: delinquentNew + delinquentRenew },
          });
        }
      } catch (error) {
        console.error("Error in fetchReports:", error);
      }
    }
    fetchReports();
  }, [selectedYear, selectedBarangay]);

  // Pie Chart Data: Use the same labels and dataset values.
  const chartData = {
    labels: ["New", "Renew", "Delinquent"],
    datasets: [
      {
        label: `Year ${selectedYear}`,
        data: [
          overallReportData ? overallReportData.businessTax.new : 0,
          overallReportData ? overallReportData.businessTax.renew : 0,
          delinquentReportData ? delinquentReportData.businessTax.total : 0,
        ],
        backgroundColor: [
          "rgb(54, 162, 235)", // Blue for New
          "rgb(75, 192, 192)", // Teal for Renew
          "rgb(255, 99, 132)", // Red for Delinquent
        ],
      },
    ],
  };

  // Pie chart options with datalabels plugin to show numbers on each slice.
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
          weight: "bold" as "bold", // explicitly cast to a literal type
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
      <div className="mt-8 mb-6">
        <Link
          href="/"
          className="inline-flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200 ease-in-out"
        >
          &larr; Back to Dashboard
        </Link>
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

        {/* Overall Business Tax Data Table */}
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
              </tbody>
            </table>
          ) : (
            <p>Loading Overall data...</p>
          )}
        </div>

        {/* Delinquent Business Tax Data Table */}
        <div className="overflow-x-auto bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Delinquent Business Tax Data
          </h2>
          {delinquentReportData ? (
            <table className="table-fixed w-full border-collapse">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="w-1/3 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="w-1/3 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Year
                  </th>
                  <th className="w-1/3 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3">Delinquent Business Tax</td>
                  <td className="px-4 py-3">{selectedYear}</td>
                  <td className="px-4 py-3">{delinquentReportData.businessTax.total}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p>Loading Delinquent data...</p>
          )}
        </div>
      </main>
    </div>
  );
}

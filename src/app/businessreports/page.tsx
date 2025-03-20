"use client";

import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { Bar } from "react-chartjs-2"; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Link from "next/link";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Example barangays. Use your real list here.
const barangays = [
  "Malbang", "Nomoh", "Seven Hills", "Pananag", "Daliao", "Colon",
  "Amsipit", "Bales", "Kamanga", "Kablacan", "Kanalo",
  "Lumatil", "Lumasal", "Tinoto", "Public Market", "Poblacion", "Kabatiol",
];

// Example years to filter. You can expand or change dynamically.
const years = [2023, 2024, 2025];

export default function BusinessReportsPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedBarangay, setSelectedBarangay] = useState<string>("Colon");

  // Example data structure: for demonstration only
  const [reportData, setReportData] = useState<{
    businessTax: { renewal: number; new: number; total: number };
    pumpboat: number;
    tricycle: number;
  } | null>(null);

  // Example: fetch or compute your real data when either filter changes
  useEffect(() => {
    // TODO: Replace with your actual fetch from a real API endpoint
    // This is a dummy example that returns static data
    // based on the year + barangay. You can adapt it to your needs.
    async function fetchReports() {
      // Simulate an API call (replace with real API endpoint):
      const mockResponse = await new Promise((resolve) => {
        setTimeout(() => {
          // For demonstration, we just return some arbitrary numbers
          // that differ by year or barangay:
          const multiplier = selectedYear === 2024 ? 1 : 1.2;
          resolve({
            businessTax: {
              renewal: Math.floor(600 * multiplier),
              new: Math.floor(113 * multiplier),
              total: Math.floor(713 * multiplier),
            },
            pumpboat: Math.floor(631 * multiplier),
            tricycle: Math.floor(517 * multiplier),
          });
        }, 500);
      });

      setReportData(mockResponse as any);
    }

    fetchReports();
  }, [selectedYear, selectedBarangay]);

  // Prepare data for the chart (example with two years).
  // In a real scenario, you might fetch an array of years at once,
  // or let the user compare multiple years. This is just a demonstration.
  const chartData = {
    labels: ["Business Tax (Total)", "Pumpboat", "Tricycle"],
    datasets: [
      {
        label: `Year ${selectedYear}`,
        data: reportData
          ? [
              reportData.businessTax.total,
              reportData.pumpboat,
              reportData.tricycle,
            ]
          : [0, 0, 0],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Tax Payers Report - Year ${selectedYear} - Brgy. ${selectedBarangay}`,
      },
      legend: {
        display: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="mb-6">
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
            Business Reports
          </h1>
          <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
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

        {/* Chart Section */}
        <div className="bg-white rounded shadow p-6 mb-8">
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Table Section (based on your whiteboard example) */}
        <div className="overflow-x-auto bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Detailed Tax Payers Data
          </h2>

          {!reportData ? (
            <p>Loading data...</p>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Renewal
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    New
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Business Tax row */}
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3">Business Tax</td>
                  <td className="px-4 py-3">{reportData.businessTax.renewal}</td>
                  <td className="px-4 py-3">{reportData.businessTax.new}</td>
                  <td className="px-4 py-3">{reportData.businessTax.total}</td>
                </tr>
                {/* Pumpboat row (no renewal/new breakdown in your example, so we just display total) */}
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3">Pumpboat</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">{reportData.pumpboat}</td>
                </tr>
                {/* Tricycle row */}
                <tr>
                  <td className="px-4 py-3">Tricycle</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">{reportData.tricycle}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

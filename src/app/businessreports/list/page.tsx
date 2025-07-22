"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import Topbar from "../../components/Topbar";
import NavBar from "../../components/NavBar";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { FaFilePdf } from "react-icons/fa";

// List of barangays
const barangays = [
    "Overall", "Amsipit", "Bales", "Colon", "Daliao", "Kabatiol", "Kablacan",
    "Kamanga", "Kanalo", "Lumatil", "Lumasal", "Malbang", "Nomoh",
    "Pananag", "Poblacion", "Public Market", "Seven Hills", "Tinoto"
];

// Generate array of years from start up to current + extra
const generateYears = (start = 2000, extra = 10): number[] => {
    const curr = new Date().getFullYear();
    const end = curr + extra;
    const yrs: number[] = [];
    for (let y = start; y <= end; y++) yrs.push(y);
    return yrs;
};
const years = generateYears();

interface ApplicantRecord {
    id: string;
    date: string;
    applicantName: string;
    businessName: string;
    natureOfBusiness: string;
    applicantAddress: string;
    remarks: string;
    gross: string;
    orNo: string;
    totalPayment: string;
    frequency: string; // "quarterly" | "semi-annual" | "annual"
    renewed: boolean; // ✅ add this
}

export default function ReportListPage() {
    // ── Filters ────────────────────────────────────────────────────────
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedBarangay, setSelectedBarangay] = useState<string>(barangays[0]);
    const [selectedStatus, setSelectedStatus] = useState<"all" | "new" | "renew">("all");
    const [selectedNature, setSelectedNature] = useState<string>("all");
    const [selectedFrequency, setSelectedFrequency] = useState<"all" | "quarterly" | "semi-annual" | "annual">("all");

    // ── Data + loading ─────────────────────────────────────────────────
    const [rawRecords, setRawRecords] = useState<ApplicantRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // ── Pagination ─────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;

    useEffect(() => {
        async function fetchList() {
            setLoading(true);
            try {
                let allRecords: any[] = [];

                if (selectedBarangay === "Overall") {
                    // Fetch from all individual barangays
                    const individualBarangays = barangays.filter(b => b !== "Overall");

                    const fetchPromises = individualBarangays.map(b =>
                        fetch(
                            `http://192.168.1.107:3000/api/business-record?barangay=${encodeURIComponent(b)}`,
                            { credentials: "include" }
                        ).then(res => res.json())
                    );

                    const results = await Promise.all(fetchPromises);

                    results.forEach(data => {
                        if (Array.isArray(data.records)) {
                            allRecords.push(...data.records);
                        }
                    });
                } else {
                    // Fetch from selected barangay only
                    const res = await fetch(
                        `http://192.168.1.107:3000/api/business-record?barangay=${encodeURIComponent(selectedBarangay)}`,
                        { credentials: "include" }
                    );
                    if (!res.ok) throw new Error(res.statusText);
                    const data = await res.json();
                    allRecords = Array.isArray(data.records) ? data.records : [];
                }

                // Map and filter the records
                const mapped: ApplicantRecord[] = allRecords.map((r: any) => ({
                    id: String(r.id),
                    date: r.date ?? new Date().toISOString(),
                    applicantName: r.applicant.applicantName,
                    businessName: r.applicant.businessName,
                    natureOfBusiness: r.applicant.natureOfBusiness || "",
                    applicantAddress: r.applicant.applicantAddress,
                    remarks: r.remarks || "",
                    gross: r.gross || "",
                    orNo: r.orNo || "",
                    totalPayment: String(r.totalPayment),
                    frequency: r.frequency,
                    renewed: r.renewed ?? false,
                }));
                const deduped = Array.from(
                    new Map(
                        mapped.map(item => [
                            `${item.applicantName}-${item.businessName}-${item.date}-${item.orNo}-${item.natureOfBusiness}`,
                            item
                        ])
                    ).values()
                );


                setRawRecords(
                    deduped.filter(rec => new Date(rec.date).getFullYear() === selectedYear)
                );
            } catch (error) {
                console.error("Error fetching business records:", error);
                setRawRecords([]);
            } finally {
                setLoading(false);
            }
        }

        fetchList();
    }, [selectedYear, selectedBarangay]);


    // reset to first page when any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [
        selectedYear,
        selectedBarangay,
        selectedStatus,
        selectedNature,
        selectedFrequency,
        rawRecords
    ]);

    // ── Build dynamic nature options ───────────────────────────────────
    const normalizedNatureMap = new Map<string, string>();

    rawRecords.forEach(r => {
        const raw = r.natureOfBusiness?.trim();
        if (raw) {
            const key = raw.toLowerCase(); // normalize
            if (!normalizedNatureMap.has(key)) {
                normalizedNatureMap.set(key, raw); // preserve original casing for display
            }
        }
    });

    const natureOptions = ["all", ...Array.from(normalizedNatureMap.values())];


    // ── Final filtered + paginated records ────────────────────────────
    const filteredRecords = rawRecords.filter(rec => {
        // Status New vs Renew
        if (selectedStatus === "new" && rec.remarks.toLowerCase() === "renew") return false;
        if (selectedStatus === "renew" && rec.remarks.toLowerCase() !== "renew") return false;
        // Nature
        if (
            selectedNature !== "all" &&
            rec.natureOfBusiness.trim().toLowerCase() !== selectedNature.trim().toLowerCase()
        ) return false;

        // Frequency
        if (selectedFrequency !== "all" && rec.frequency !== selectedFrequency) return false;
        return true;
    });

    // ── Analytics for selected nature ────────────────────────
    const selectedNatureLabel = selectedNature === "all" ? null : selectedNature.toLowerCase();

    const natureBreakdown = selectedNatureLabel
        ? barangays
            .filter(b => b !== "Overall")
            .map(brgy => {
                const count = filteredRecords.filter(
                    rec =>
                        rec.applicantAddress.toLowerCase().includes(brgy.toLowerCase()) &&
                        rec.natureOfBusiness.toLowerCase() === selectedNatureLabel
                ).length;
                return { barangay: brgy, count };
            })
            .filter(entry => entry.count > 0)
        : [];

    const totalNatureCount = natureBreakdown.reduce((sum, b) => sum + b.count, 0);

    const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
    const paginated = filteredRecords.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // ── Currency formatter ────────────────────────────────────────────
    const phpFormatter = new Intl.NumberFormat("en-PH", {
        style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2,
    });

    // ── Print-all flag ─────────────────────────
    const [printAll, setPrintAll] = useState(false);
    // ── Hook up the print target ───────────────────────────
    const tableRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: tableRef,                             // points at your <div ref={tableRef}>
        documentTitle: `Report_${selectedBarangay}_${selectedYear}`,
        pageStyle: `
      @page { size: auto; margin: 20mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `,
        onBeforePrint: () => {
            // Flip into “print everything” mode
            setPrintAll(true);
            // Return a promise so react-to-print waits for this state update
            return new Promise<void>(resolve => setTimeout(resolve, 0));
        },
        onAfterPrint: () => {
            // Switch back to “normal pagination” mode
            setPrintAll(false);
        },
    });

    // ── Decide which rows to render ────────────────────────
    // If printing, show the full filtered set; otherwise show only this page
    const rowsToRender = printAll ? filteredRecords : paginated;


    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Topbar />
            <NavBar />

            {/* Back + Print PDF */}
            <div className="mt-8 mb-2 px-4 flex justify-between items-center print:hidden">
                <Link
                    href="/businessreports"
                    className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                    &larr; Back to Reports
                </Link>
                <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
                >
                    <FaFilePdf className="inline-block mr-1" />
                    Print PDF
                </button>
            </div>
            <main className="w-full max-w-screen-xl mx-auto px-4 pb-8 space-y-6">
                {/* Filters row (now 5 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    {/* Year */}
                    <div>
                        <label className="block mb-1 font-medium">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                setSelectedYear(Number(e.target.value))
                            }
                            className="w-full p-2 border rounded"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    {/* Barangay */}
                    <div>
                        <label className="block mb-1 font-medium">Barangay</label>
                        <select
                            value={selectedBarangay}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                setSelectedBarangay(e.target.value)
                            }
                            className="w-full p-2 border rounded"
                        >
                            {barangays.map(b => (
                                <option key={b} value={b}>
                                    {b === "Overall" ? "All Barangays (Overall)" : b}
                                </option>
                            ))}
                        </select>
                    </div>


                    {/* Status */}
                    <div>
                        <label className="block mb-1 font-medium">Status</label>
                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value as any)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="all">All</option>
                            <option value="new">New</option>
                            <option value="renew">Renew</option>
                        </select>
                    </div>

                    {/* Nature */}
                    <div>
                        <label className="block mb-1 font-medium">Nature of Business</label>
                        <select
                            value={selectedNature}
                            onChange={e => setSelectedNature(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            {natureOptions.map(n => (
                                <option key={n} value={n}>{n === "all" ? "All" : n}</option>
                            ))}
                        </select>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block mb-1 font-medium">Frequency</label>
                        <select
                            value={selectedFrequency}
                            onChange={e =>
                                setSelectedFrequency(e.target.value as "all" | "quarterly" | "semi-annual" | "annual")
                            }
                            className="w-full p-2 border rounded"
                        >
                            <option value="all">All</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="semi-annual">Semi-Annual</option>
                            <option value="annual">Annual</option>
                        </select>
                    </div>
                </div>
                {/* Filter for total of barangay business */}
                {selectedBarangay === "Overall" && selectedNature !== "all" && (
                    <div className="p-4 bg-white border rounded shadow-sm text-sm text-gray-800 space-y-2">
                        <div>
                            <strong>Total of "{selectedNature}" Businesses:</strong>{" "}
                            <span className="font-bold">{totalNatureCount}</span>
                        </div>
                        <div className="space-y-1">
                            <strong>Breakdown by Barangay:</strong>
                            {natureBreakdown.map(entry => (
                                <div key={entry.barangay} className="pl-4">
                                    • {entry.barangay}: <strong>{entry.count}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Table + Pagination */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    {/* Pagination controls */}
                    <div className="flex justify-between items-start px-4 py-2 border-b print:hidden">
                        <div className="text-sm text-gray-700">
                            Showing {(currentPage - 1) * rowsPerPage + 1}–
                            {Math.min(currentPage * rowsPerPage, filteredRecords.length)} of {filteredRecords.length}
                        </div>
                        <div className="space-x-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                                <button
                                    key={num}
                                    onClick={() => setCurrentPage(num)}
                                    className={`px-3 py-1 border rounded ${currentPage === num ? 'bg-gray-800 text-white' : ''}`}
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {/* Printable area */}
                    <div ref={tableRef} className="mt-6">
                        {/* Print-only filter header */}
                        <div
                            className="
      hidden
      print:flex print:flex-col sm:print:flex-row print:justify-between
      print:px-6 print:py-4 print:border-b
      print:text-sm print:text-gray-700
    "
                        >
                            <div>
                                <strong>Year:</strong>{" "}
                                <span className="font-semibold">{selectedYear}</span>
                            </div>
                            <div>
                                <strong>Barangay:</strong>{" "}
                                <span className="font-semibold">{selectedBarangay}</span>
                            </div>
                            <div>
                                <strong>Nature of Business:</strong>{" "}
                                <span className="font-semibold">
                                    {selectedNature === "all"
                                        ? "All"
                                        : `${selectedNature} (${selectedBarangay}) total of: ${rawRecords.filter(r =>
                                            r.natureOfBusiness.trim().toLowerCase() === selectedNature.trim().toLowerCase()
                                        ).length
                                        }`
                                    }
                                </span>
                            </div>

                            <div>
                                <strong>Frequency:</strong>{" "}
                                <span className="font-semibold">
                                    {selectedFrequency === "all"
                                        ? "All"
                                        : selectedFrequency === "semi-annual"
                                            ? "Semi-Annual"
                                            : selectedFrequency.charAt(0).toUpperCase() + selectedFrequency.slice(1)}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-sm text-gray-800">
                                <thead className="bg-gray-100">
                                    <tr>
                                        {[
                                            "Date", "Name of Applicant", "Business Name", "Nature of Business",
                                            "Address", "Status", "Gross", "OR No.", "Amount", "Mode of Payment"
                                        ].map(col => (
                                            <th
                                                key={col}
                                                className="px-4 py-2 font-medium border-b text-center"
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={10} className="p-4 text-center">Loading…</td>
                                        </tr>
                                    ) : paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-4 text-center text-gray-500">
                                                No records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map(rec => (
                                            <tr
                                                key={`${rec.id}-${rec.date}`}
                                                className="odd:bg-white even:bg-gray-50"
                                            >
                                                <td className="px-4 py-2 text-center">
                                                    {new Date(rec.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {rec.applicantName}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {rec.businessName}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {rec.natureOfBusiness}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {rec.applicantAddress}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {rec.remarks}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {phpFormatter.format(Number(rec.gross))}
                                                </td>

                                                <td className="px-4 py-2 text-center">
                                                    {rec.orNo.split('/').join(' / ')}

                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {phpFormatter.format(Number(rec.totalPayment))}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {rec.frequency}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

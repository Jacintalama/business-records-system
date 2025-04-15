"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import Topbar from "@/app/components/Topbar";
import NavBar from "@/app/components/NavBar";

interface BoatRecord {
  id: number;
  status: string;
  control_no: string;               // control_no is string now
  fish_registration_no_rsbsa: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  extension_name: string;
  purok: string;
  birthday: string;                 // ← added
  contact_no: string;
  fishing_boat_name: string;
  make: string;
  engine_sn: string;
  no_of_fisher_man: number;
  or_no: number;
  amount_paid: number;
  date: string;
  barangay: string;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString();

export default function BoatRecordViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const boatRecordId = searchParams.get("boatRecordId");
  const barangay = searchParams.get("barangay") || "";
  const backUrl = `/boatrecords${barangay ? `?barangay=${encodeURIComponent(barangay)}` : ""}`;

  const [record, setRecord] = useState<BoatRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!boatRecordId) {
      toast.error("Boat Record ID is missing.");
      router.push(backUrl);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://192.168.1.107:3000/api/boatrecords/${boatRecordId}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch boat record.");
        setRecord(await res.json());
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [boatRecordId, backUrl, router]);

  return (
    <div>
      <ToastContainer />
      <Topbar />
      <NavBar />

      <div className="container mx-auto px-4 py-8">
        <Link
          href={backUrl}
          className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-500 transition-colors mb-6"
        >
          <FaArrowLeft className="mr-2" /> Back to Boat Records
        </Link>

        <h1 className="text-3xl font-bold text-center mb-8">
          Boat Record Details
        </h1>

        {loading ? (
          <div className="text-center">Loading…</div>
        ) : record ? (
          <div className="overflow-x-auto bg-white shadow rounded-lg p-6">
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th
                    colSpan={2}
                    className="text-xl font-semibold text-left pb-4 border-b border-gray-200"
                  >
                    Boat Record Information
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {[
                  { label: "ID", value: record.id },
                  { label: "Status", value: record.status },
                  { label: "Control No", value: record.control_no },
                  { label: "Fish Reg. No", value: record.fish_registration_no_rsbsa },
                  {
                    label: "Owner Name",
                    value: `${record.first_name} ${record.middle_name} ${record.last_name} ${record.extension_name}`,
                  },
                  { label: "Purok", value: record.purok },
                  { label: "Birthday", value: formatDate(record.birthday) },  // ← added
                  { label: "Contact No", value: record.contact_no },
                  { label: "Boat Name", value: record.fishing_boat_name },
                  { label: "Make", value: record.make },
                  { label: "Engine SN", value: record.engine_sn },
                  { label: "No. of Fishermen", value: record.no_of_fisher_man },
                  { label: "OR No", value: record.or_no },
                  { label: "Amount Paid", value: record.amount_paid },
                  { label: "Date", value: formatDate(record.date) },
                  { label: "Barangay", value: record.barangay },
                  { label: "Created At", value: formatDate(record.createdAt) },
                  { label: "Updated At", value: formatDate(record.updatedAt) },
                ].map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="py-2 px-4 font-medium text-gray-600">
                      {item.label}
                    </td>
                    <td className="py-2 px-4 text-gray-900">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center">No record found.</div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, FormEvent } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

// List of barangays (optional)
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

// Helper to format a Date object into "MM/DD/YYYY"
function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// Match these exactly to your Sequelize columns
interface BoatRecordFormData {
  status: string;
  control_no: number | "";
  fish_registration_no_rsbsa: number | "";
  last_name: string;
  first_name: string;
  middle_name: string;
  extension_name: string;
  purok: string;
  birthday: string; // now in MM/DD/YYYY format
  barangay: string;
  contact_no: string;
  fishing_boat_name: string;
  make: string;
  engine_sn: number | "";
  no_of_fisher_man: string;
  or_no: string;
  amount_paid: number | "";
  date: string; // in MM/DD/YYYY format
}

interface BoatRecordFormProps {
  mode: "create" | "edit";
  record?: Partial<BoatRecordFormData> & { id?: string };
  onSubmitSuccess: () => void;
}

export default function BoatRecordForm({
  mode,
  record,
  onSubmitSuccess,
}: BoatRecordFormProps) {
  // Separate state for the react-datepicker fields as Date objects.
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    record && record.date ? new Date(record.date) : null
  );
  const [selectedBirthday, setSelectedBirthday] = useState<Date | null>(
    record && record.birthday ? new Date(record.birthday) : null
  );

  // Main form state; dates stored as formatted strings ("MM/DD/YYYY").
  const [formData, setFormData] = useState<BoatRecordFormData>({
    status: record?.status || "",
    control_no: record?.control_no || "",
    fish_registration_no_rsbsa: record?.fish_registration_no_rsbsa || "",
    last_name: record?.last_name || "",
    first_name: record?.first_name || "",
    middle_name: record?.middle_name || "",
    extension_name: record?.extension_name || "",
    purok: record?.purok || "",
    birthday: record?.birthday || "",
    barangay: record?.barangay || "",
    contact_no: record?.contact_no || "",
    fishing_boat_name: record?.fishing_boat_name || "",
    make: record?.make || "",
    engine_sn: record?.engine_sn || "",
    no_of_fisher_man: 
      record?.no_of_fisher_man !== undefined ? String(record.no_of_fisher_man) : "",
    or_no: record?.or_no !== undefined ? String(record.or_no) : "",
    amount_paid: record?.amount_paid || "",
    date: record?.date || "",
  });

  // Update state when in edit mode and record changes.
  useEffect(() => {
    if (mode === "edit" && record) {
      setSelectedDate(record.date ? new Date(record.date) : null);
      setSelectedBirthday(record.birthday ? new Date(record.birthday) : null);
      setFormData({
        status: record.status || "",
        control_no: record.control_no || "",
        fish_registration_no_rsbsa: record.fish_registration_no_rsbsa || "",
        last_name: record.last_name || "",
        first_name: record.first_name || "",
        middle_name: record.middle_name || "",
        extension_name: record.extension_name || "",
        purok: record.purok || "",
        birthday: record.birthday || "",
        barangay: record.barangay || "",
        contact_no: record.contact_no || "",
        fishing_boat_name: record.fishing_boat_name || "",
        make: record.make || "",
        engine_sn: record.engine_sn || "",
        no_of_fisher_man:
          record?.no_of_fisher_man !== undefined ? String(record.no_of_fisher_man) : "",
        or_no: record?.or_no !== undefined ? String(record.or_no) : "",
        amount_paid: record.amount_paid || "",
        date: record.date || "",
      });
    }
  }, [mode, record]);

  // Update form state on input change.
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle changes from the date picker for "date".
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const formatted = formatDate(date);
      setFormData((prev) => ({
        ...prev,
        date: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        date: "",
      }));
    }
  };

  // Handle changes from the date picker for "birthday".
  const handleBirthdayChange = (date: Date | null) => {
    setSelectedBirthday(date);
    if (date) {
      const formatted = formatDate(date);
      setFormData((prev) => ({
        ...prev,
        birthday: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        birthday: "",
      }));
    }
  };

  // Handle form submission.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };

    try {
      const endpoint =
        mode === "create"
          ? "/api/boatrecords"
          : `/api/boatrecords/${record?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save boat record");
      }

      toast.success(
        `Boat record ${mode === "create" ? "created" : "updated"} successfully`
      );
      onSubmitSuccess();
    } catch (error: any) {
      console.error("Error submitting boat record:", error);
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <input
            type="text"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Control No */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Control No</label>
          <input
            type="text"
            name="control_no"
            value={formData.control_no}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Fish Registration No / RSBSA */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Fish Registration No / RSBSA</label>
          <input
            type="text"
            name="fish_registration_no_rsbsa"
            value={formData.fish_registration_no_rsbsa}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Middle Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Middle Name</label>
          <input
            type="text"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Extension Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Extension Name</label>
          <input
            type="text"
            name="extension_name"
            value={formData.extension_name}
            onChange={handleChange}
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Purok */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Purok</label>
          <input
            type="text"
            name="purok"
            value={formData.purok}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Birthday using react-datepicker */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Birthday</label>
          <DatePicker
            selected={selectedBirthday}
            onChange={handleBirthdayChange}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Barangay */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Barangay</label>
          <select
            name="barangay"
            value={formData.barangay}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          >
            <option value="">Select Barangay</option>
            {barangays.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Contact No */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact No</label>
          <input
            type="tel"
            name="contact_no"
            value={formData.contact_no}
            onChange={handleChange}
            required
            maxLength={11}
            pattern="^09\d{9}$"
            placeholder="09171234567"
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Fishing Boat Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Fishing Boat Name</label>
          <input
            type="text"
            name="fishing_boat_name"
            value={formData.fishing_boat_name}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Make */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Make</label>
          <input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Engine Serial Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Engine Serial Number</label>
          <input
            type="text"
            name="engine_sn"
            value={formData.engine_sn}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* No. of Fisher Man */}
        <div>
          <label className="block text-sm font-medium text-gray-700">No. of Fisher Man</label>
          <input
            type="text"
            name="no_of_fisher_man"
            value={formData.no_of_fisher_man}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* OR No */}
        <div>
          <label className="block text-sm font-medium text-gray-700">OR No</label>
          <input
            type="text"
            name="or_no"
            value={formData.or_no}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Amount Paid */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
          <input
            type="number"
            name="amount_paid"
            value={formData.amount_paid}
            onChange={handleChange}
            required
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        {/* Date using react-datepicker */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
        >
          {mode === "create" ? "Create Record" : "Update Record"}
        </button>
      </div>
    </form>
  );
}

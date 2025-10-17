"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
// import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash, FaFilePdf, FaCheck } from "react-icons/fa";
import Topbar from "../components/Topbar";
import { computePeriodEnd } from "../utils/periodUtils";
import Select, { MultiValue } from "react-select";
import RecordViewModal from "../components/RecordViewModal";

// ----------------- Utils -----------------
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const collapseLines = (val: any): string =>
  String(val)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s*\(\s*/g, " (")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s{2,}/g, " ")
    .trim();

// ----------------- Types -----------------
interface MPOption {
  value: number;
  label: string;
}
interface SelectedPermit {
  mayorPermitId: number;
  amount: string | number;
}

interface OwnerInfo {
  applicantName: string;
  address: string;
  businessName: string;
  natureOfBusiness: string;
  capitalInvestment: string;
  applicantId: string;
}

interface PaymentRecord {
  [key: string]: any;
  id: number | string; // ⬅️ allow both
  year: number;
  date: string;
  gross: string;
  orNo: string;
  busTax: string;
  mayorsPermit: string;
  sanitaryInps: string;
  policeClearance: string;
  zoningClearance?: string;
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
  sucharge2: string;
  expired: boolean;
  totalPayment: string;
  remarks: string;
  frequency: "quarterly" | "semi-annual" | "annual";
  renewed: boolean;
  marketCertification?: string;
  miscellaneous?: string;
  garbageCollection?: string;
  polluters?: string;
  Occupation?: string;
  applicant?: {
    id: number;
    applicantName: string;
    applicantAddress: string;
    businessName: string;
    natureOfBusiness?: string;
    capitalInvestment: number;
  };
  barangayClearance?: string;
  Other?: string;
  permits?: Array<{
    id: number;
    name: string;
    BusinessRecordPermit: { amount: number };
  }>;
}

interface Column {
  key: keyof PaymentRecord | "expiredDate" | "permits";
  label: string;
  format?: (val: any) => string | number | React.ReactNode;
  sorter?: (a: PaymentRecord, b: PaymentRecord) => number;
  defaultSortOrder?: "ascend" | "descend";
}

// ----------------- Columns -----------------
const columnGroups: { label: string; columns: Column[] }[] = [
  {
    label: "Basic Info",
    columns: [
      { key: "year", label: "Year" },
      {
        key: "date",
        label: "Date",
        format: (v) => new Date(v).toLocaleDateString(),
        sorter: (a: PaymentRecord, b: PaymentRecord) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
        defaultSortOrder: "ascend",
      },
      { key: "gross", label: "Gross", format: (v) => phpFormatter.format(Number(v)) },
      {
        key: "orNo",
        label: "OR No.",
        format: (raw: any) =>
          String(raw)
            .split(/\r?\n+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .join(" / "),
      },
    ],
  },
  {
    label: "Permits",
    columns: [
      {
        key: "permits",
        label: "Others Mayor’s Permits",
        format: (perms: PaymentRecord["permits"]) => {
          if (!Array.isArray(perms) || perms.length === 0) return "—";
          const text = perms
            .map((p) => `${p.name} (${phpFormatter.format(p.BusinessRecordPermit.amount)})`)
            .join(", ");
          return collapseLines(text);
        },
      },
    ],
  },
  {
    label: "Fees & Clearances",
    columns: [
      { key: "busTax", label: "BUS TAX", format: (v) => phpFormatter.format(Number(v)) },
      { key: "mayorsPermit", label: "Mayor's Permit", format: (v) => phpFormatter.format(Number(v)) },
      { key: "sanitaryInps", label: "Sanitary Inps", format: (v) => phpFormatter.format(Number(v)) },
      { key: "policeClearance", label: "Police Clearance", format: (v) => phpFormatter.format(Number(v)) },
      { key: "barangayClearance", label: "Barangay Clearance", format: (v) => phpFormatter.format(Number(v)) },
      { key: "zoningClearance", label: "Zoning Clearance", format: (v) => phpFormatter.format(Number(v)) },
      { key: "taxClearance", label: "Tax Clearance", format: (v) => phpFormatter.format(Number(v)) },
      { key: "garbage", label: "Garbage", format: (v) => phpFormatter.format(Number(v)) },
      { key: "verification", label: "Verification", format: (v) => phpFormatter.format(Number(v)) },
      { key: "weightAndMass", label: "Weight & Mass", format: (v) => phpFormatter.format(Number(v)) },
      { key: "healthClearance", label: "Health Clearance", format: (v) => phpFormatter.format(Number(v)) },
      { key: "secFee", label: "SEC Fee", format: (v) => phpFormatter.format(Number(v)) },
      { key: "menro", label: "MENRO", format: (v) => phpFormatter.format(Number(v)) },
      { key: "docTax", label: "Doc Tax", format: (v) => phpFormatter.format(Number(v)) },
      { key: "eggsFee", label: "Egg's Fee", format: (v) => phpFormatter.format(Number(v)) },
    ],
  },
  {
    label: "Surcharges",
    columns: [
      { key: "surcharge25", label: "25% Surcharge", format: (v) => phpFormatter.format(Number(v)) },
      { key: "sucharge2", label: "2% Month", format: (v) => phpFormatter.format(Number(v)) },
    ],
  },
  {
    label: "Additional Details",
    columns: [
      { key: "garbageCollection", label: "Garbage Collection", format: (v) => phpFormatter.format(Number(v)) },
      { key: "polluters", label: "Polluters", format: (v) => phpFormatter.format(Number(v)) },
      { key: "Occupation", label: "Occupation", format: (v) => phpFormatter.format(Number(v)) },
    ],
  },
  {
    label: "Additional Info",
    columns: [
      { key: "marketCertification", label: "Market Certification", format: (v) => phpFormatter.format(Number(v)) },
      { key: "miscellaneous", label: "Miscellaneous", format: (v) => phpFormatter.format(Number(v)) },
    ],
  },
  {
    label: "Totals & Remarks",
    columns: [
      {
        key: "totalPayment",
        label: "Total Payment",
        format: (val) => phpFormatter.format(Number(val)),
      },
      { key: "remarks", label: "Remarks", format: collapseLines },
      {
        key: "frequency",
        label: "Frequency",
        format: (val: any) => (typeof val === "string" ? capitalize(val) : val),
      },
      { key: "renewed", label: "Tax Paid", format: (val) => (val ? "Yes" : "No") },
    ],
  },
  {
    label: "Others",
    columns: [{ key: "Other", label: "Other", format: collapseLines }],
  },
  {
    label: "Expiration",
    columns: [{ key: "expiredDate", label: "Expired Date" }],
  },
];

// ----------------- Helpers -----------------
const computeRenewalDueDate = (dateInput: string | Date, frequency: string): Date => {
  const recordDate = new Date(dateInput);
  const year = recordDate.getFullYear();
  const month = recordDate.getMonth();
  const normalized = frequency.toLowerCase();

  if (normalized === "quarterly") {
    if (month <= 2) return new Date(year, 2, 31);
    if (month <= 5) return new Date(year, 5, 30);
    if (month <= 8) return new Date(year, 8, 30);
    return new Date(year, 11, 31);
  }
  if (normalized === "semi-annual") {
    if (month <= 5) return new Date(year, 5, 30);
    return new Date(year, 11, 31);
  }
  if (normalized === "annual") {
    return new Date(year + 1, month, recordDate.getDate());
  }
  return new Date(recordDate);
};

const isRecordDelinquent = (record: PaymentRecord): boolean => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  if (record.renewed) return false;
  if (record.year < currentYear) return true;
  const dueDate = computeRenewalDueDate(record.date, record.frequency);
  return dueDate < currentDate;
};

const parseNumber = (value: string) => parseFloat(value.replace(/,/g, ""));
const parseNum = (v: string) => parseFloat(v.replace(/,/g, "")) || 0;
const extractNumber = (s: string): number => {
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? parseNum(m[0]) : 0;
};

// ----------------- Row (memoized) -----------------
const TableRow: React.FC<{
  record: PaymentRecord & { _expiredDate?: string; _delinquent?: boolean };
  groups: typeof columnGroups;
  onEdit: (r: PaymentRecord) => void;
  onDelete: (id: number | string) => void; // ⬅️ allow both
  onView: (r: PaymentRecord) => void;
}> = memo(({ record, groups, onEdit, onDelete, onView }) => {
  const delinquent = record._delinquent ?? isRecordDelinquent(record);

  const handleView = () => onView(record);
  const handleKey = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onView(record);
    }
  };

  return (
    <tr
      className={`hover:bg-gray-100 ${delinquent ? "bg-red-300" : "odd:bg-white even:bg-gray-50"} cursor-pointer`}
      onClick={handleView}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
      title="Click to view details"
    >
      {groups.flatMap((group) =>
        group.columns.map((col) => {
          let displayValue: React.ReactNode;
          if (col.key === "expiredDate") {
            displayValue =
              (record as any)._expiredDate ||
              computePeriodEnd(record.date, record.frequency, {
                earlyRolloverDays: 30,
              }).toLocaleDateString();
          } else if (col.key === "permits") {
            const raw = (record as any)[col.key] ?? [];
            displayValue = col.format ? col.format(raw) : raw;
          } else {
            const raw = (record as any)[col.key] ?? "";
            displayValue = col.format ? col.format(raw) : raw;
          }

          const isNoWrap = ["orNo", "permits", "Other", "remarks"].includes(
            col.key as string
          );
          const tdClass = [
            "px-4 py-2 h-12 text-gray-700",
            isNoWrap ? "whitespace-nowrap" : "overflow-hidden whitespace-normal",
          ].join(" ");

          return (
            <td key={`${record.id}-${String(col.key)}`} className={tdClass}>
              <span className="inline-block w-full">{displayValue}</span>
            </td>
          );
        })
      )}
      <td className="px-4 py-2 text-center no-print">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(record);
          }}
          className="text-blue-600 hover:text-blue-800 mr-2"
          title="Edit"
        >
          <FaEdit />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(record.id);
          }}
          className="text-red-600 hover:text-red-800"
          title="Delete"
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
});
TableRow.displayName = "TableRow";

// ----------------- Main Component -----------------
export default function ReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.236:3000";

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("User");

  // Inline editing states for owner information
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [tempOwnerInfo, setTempOwnerInfo] = useState<OwnerInfo | null>(null);
  const [editingFields, setEditingFields] = useState({
    applicantName: false,
    address: false,
    businessName: false,
    natureOfBusiness: false,
    capitalInvestment: false,
  });

  // Permits
  const [mpOptions, setMpOptions] = useState<MPOption[]>([]);
  const [selectedPermits, setSelectedPermits] = useState<SelectedPermit[]>([]);

  // Records & paging
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // ↓ smaller default for speed

  // Forms / View modal
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<Partial<PaymentRecord> | null>(null);
  const [viewRecord, setViewRecord] = useState<PaymentRecord | null>(null);

  // ----------------- Auth -----------------
  useEffect(() => {
    (async function checkAuth() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          const fullName = `${data.firstName} ${data.middleName ? data.middleName + " " : ""}${data.lastName}`;
          setUserName(fullName);
        } else {
          setIsAuthenticated(false);
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/auth/login");
      }
    })();
  }, [router, API_URL]);

  // ----------------- URL params / Applicant -----------------
  const applicantIdParam = searchParams.get("applicantId");
  const storedApplicantId = typeof window !== "undefined" ? localStorage.getItem("applicantId") : "";
  const initialApplicantId =
    applicantIdParam && applicantIdParam !== "undefined" && applicantIdParam !== "null"
      ? applicantIdParam
      : storedApplicantId || "";
  const [localApplicantId, setLocalApplicantId] = useState<string>(initialApplicantId);

  useEffect(() => {
    const param = searchParams.get("applicantId");
    if (param && param !== "undefined" && param !== "null" && param !== localApplicantId) {
      setLocalApplicantId(param);
      localStorage.setItem("applicantId", param);
    }
  }, [searchParams, localApplicantId]);

  const applicantNameParam = searchParams.get("applicantName") || "";
  const applicantAddressParam = searchParams.get("applicantAddress") || "";

  // ----------------- Permit master list -----------------
  useEffect(() => {
    fetch(`${API_URL}/api/business-record/mp`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { id: number; name: string }[]) =>
        setMpOptions(data.map((mp) => ({ value: mp.id, label: mp.name })))
      )
      .catch((err) => {
        console.error("Failed loading MP:", err);
        toast.error("Could not load permit options");
      });
  }, [API_URL]);

  const handlePermitsChange = useCallback((opts: MultiValue<MPOption>) => {
    setSelectedPermits((prev) => {
      const next = opts.map((o) => {
        const existing = prev.find((p) => p.mayorPermitId === o.value);
        return existing || { mayorPermitId: o.value, amount: "" };
      });
      return next;
    });
  }, []);

  const handlePermitAmountChange = useCallback((id: number, val: string) => {
    setSelectedPermits((ps) => ps.map((p) => (p.mayorPermitId === id ? { ...p, amount: val } : p)));
  }, []);

  // When Edit modal opens, hydrate selected permits once
  const hasInitializedPermits = useRef(false);
  useEffect(() => {
    if (editRecord && (editRecord as any).permits && !hasInitializedPermits.current) {
      const mappedPermits = (editRecord as any).permits.map((permit: any) => ({
        mayorPermitId: permit.id,
        amount: String(permit.BusinessRecordPermit?.amount || "0"),
      }));
      setSelectedPermits(mappedPermits);
      hasInitializedPermits.current = true;
    }
  }, [editRecord]);

  // If editRecord id changes (new click), reset the guard
  useEffect(() => {
    hasInitializedPermits.current = false;
  }, [editRecord?.id]);

  // ----------------- Fetch data (memo-friendly) -----------------
  const fetchData = useCallback(async () => {
    try {
      let url = `${API_URL}/api/business-record?`;
      if (localApplicantId && localApplicantId !== "undefined") {
        url += `applicantId=${encodeURIComponent(localApplicantId)}&`;
      }
      if (applicantNameParam) url += `applicantName=${encodeURIComponent(applicantNameParam)}&`;
      if (applicantAddressParam) url += `applicantAddress=${encodeURIComponent(applicantAddressParam)}&`;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
      const data = await res.json();

      // Sort once (newest year, then newest date)
      const sortedRecords: PaymentRecord[] = data.records.sort(
        (a: PaymentRecord, b: PaymentRecord) => {
          if (b.year !== a.year) return b.year - a.year;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      );

      setRecords(sortedRecords);

      if (sortedRecords.length > 0 && sortedRecords[0].applicant) {
        const app = sortedRecords[0].applicant;
        const info: OwnerInfo = {
          applicantName: app.applicantName,
          address: app.applicantAddress,
          businessName: app.businessName,
          natureOfBusiness: app.natureOfBusiness || "",
          capitalInvestment: String(app.capitalInvestment),
          applicantId: String(app.id),
        };
        setOwnerInfo(info);
      } else {
        setOwnerInfo(null);
      }
    } catch (error: any) {
      console.error("Error fetching records:", error);
      toast.error(`Error fetching records: ${error.message}`);
      setRecords([]);
      setOwnerInfo(null);
    }
  }, [localApplicantId, applicantNameParam, applicantAddressParam, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData, searchParams]);

  // ----------------- Memoized derivations -----------------
  const uniqueRecords = useMemo(() => {
    const map = new Map<string | number, PaymentRecord>(); // ⬅️ support both
    for (const r of records) map.set(r.id, r);
    return Array.from(map.values());
  }, [records]);

  // Precompute light view fields (avoid recomputing in cells)
  const viewRecords = useMemo(() => {
    return uniqueRecords.map((r) => ({
      ...r,
      _expiredDate: computePeriodEnd(r.date, r.frequency).toLocaleDateString(),
      _delinquent: isRecordDelinquent(r),
    }));
  }, [uniqueRecords]);

  const totalPages = useMemo(
    () => Math.ceil(viewRecords.length / pageSize),
    [viewRecords.length, pageSize]
  );
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
  const currentRecords = useMemo(
    () => viewRecords.slice(startIndex, startIndex + pageSize),
    [viewRecords, startIndex, pageSize]
  );

  const flatCols = useMemo(() => columnGroups.flatMap((g) => g.columns), []);
  const printCols = useMemo(() => flatCols.filter((c) => c.key !== "expiredDate"), [flatCols]);
  const colsPerPage = 8;
  const pages = useMemo(() => {
    const res: typeof printCols[] = [];
    for (let i = 0; i < printCols.length; i += colsPerPage) res.push(printCols.slice(i, i + colsPerPage));
    return res;
  }, [printCols]);

  // ----------------- Owner inline edit -----------------
  const startEditing = useCallback((field: keyof OwnerInfo) => {
    setEditingFields((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleOwnerInfoInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempOwnerInfo((prev) => (prev ? { ...prev, [name]: value } : prev));
  }, []);

  useEffect(() => {
    if (ownerInfo) setTempOwnerInfo(ownerInfo);
  }, [ownerInfo]);

  const saveField = useCallback(
    async (field: keyof OwnerInfo) => {
      if (!tempOwnerInfo || !ownerInfo) return;
      try {
        const res = await fetch(`${API_URL}/api/applicants/${ownerInfo.applicantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ [field]: (tempOwnerInfo as any)[field] }),
        });
        if (res.ok) {
          toast.success(`${String(field)} updated successfully!`, { autoClose: 2000 });
          setOwnerInfo({ ...ownerInfo, [field]: (tempOwnerInfo as any)[field] });
          setEditingFields((prev) => ({ ...prev, [field]: false }));
        } else {
          const errorData = await res.json();
          toast.error("Error: " + errorData.message);
        }
      } catch (error) {
        console.error("Error updating owner info:", error);
        toast.error("Failed to update owner info.");
      }
    },
    [API_URL, tempOwnerInfo, ownerInfo]
  );

  // ----------------- Add form -----------------
  const [formData, setFormData] = useState({
    applicantName: "",
    applicantAddress: "",
    businessName: "",
    natureOfBusiness: "",
    capitalInvestment: "",
    year: new Date().getFullYear(),
    date: "",
    gross: "",
    orNo: "",
    busTax: "",
    mayorsPermit: "",
    sanitaryInps: "",
    policeClearance: "",
    barangayClearance: "",
    zoningClearance: "",
    taxClearance: "",
    garbage: "",
    verification: "",
    weightAndMass: "",
    healthClearance: "",
    secFee: "",
    menro: "",
    docTax: "",
    eggsFee: "",
    marketCertification: "",
    surcharge25: "",
    sucharge2: "",
    miscellaneous: "",
    totalPayment: "",
    remarks: "",
    frequency: "annual" as "quarterly" | "semi-annual" | "annual",
    garbageCollection: "",
    polluters: "",
    Occupation: "",
    Other: "",
  });

  useEffect(() => {
    if (showForm && ownerInfo) {
      setFormData((prev) => ({
        ...prev,
        applicantName: ownerInfo.applicantName,
        applicantAddress: ownerInfo.address,
        businessName: ownerInfo.businessName,
        natureOfBusiness: ownerInfo.natureOfBusiness,
        capitalInvestment: ownerInfo.capitalInvestment,
      }));
    }
  }, [showForm, ownerInfo]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type, checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    },
    []
  );

  const calculateTotalPayment = useCallback((): number => {
    const source: any = editRecord ?? formData;
    const feeKeys: string[] = [
      "busTax",
      "mayorsPermit",
      "sanitaryInps",
      "policeClearance",
      "barangayClearance",
      "zoningClearance",
      "taxClearance",
      "garbage",
      "verification",
      "weightAndMass",
      "healthClearance",
      "secFee",
      "menro",
      "docTax",
      "eggsFee",
      "marketCertification",
      "garbageCollection",
      "polluters",
      "Occupation",
      "miscellaneous",
      "surcharge25",
      "sucharge2",
      "Other",
    ];

    const feesSum = feeKeys.reduce((sum: number, key) => {
      const rawValue = source[key];
      const rawString = typeof rawValue === "string" ? rawValue : "";
      const numbersInString = rawString.match(/-?\d+(\.\d+)?/g) ?? [];
      const subtotal = numbersInString.reduce((subSum, n) => subSum + parseFloat(n), 0);
      return sum + subtotal;
    }, 0);

    const permitsSum = selectedPermits.reduce((sum: number, permit) => {
      const amount =
        typeof permit.amount === "number" ? permit.amount : parseFloat(String(permit.amount)) || 0;
      return sum + amount;
    }, 0);

    return feesSum + permitsSum;
  }, [editRecord, formData, selectedPermits]);

  // Auto-recalc total for Add form
  useEffect(() => {
    const newTotal = calculateTotalPayment();
    const oldMatch = String(formData.totalPayment).match(/-?\d+(\.\d+)?/g);
    const oldTotal = oldMatch ? oldMatch.reduce((s, num) => s + parseFloat(num), 0) : 0;
    if (oldTotal !== newTotal)
      setFormData((f) => ({ ...f, totalPayment: String(newTotal.toFixed(2)) }));
  }, [formData, selectedPermits, calculateTotalPayment]);

  const handleFormSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      try {
        const payload = {
          applicantId: localApplicantId,
          ...formData,
          gross: parseNumber(formData.gross || "0"),
          permits: selectedPermits.map((p) => ({
            mayorPermitId: p.mayorPermitId,
            amount: parseNumber(String(p.amount)) || 0,
          })),
        };

        const res = await fetch(`${API_URL}/api/business-record`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          toast.success("Record added successfully!", {
            position: "top-right",
            autoClose: 2000,
          });

          if (data.record) {
            const newInfo: OwnerInfo = {
              applicantName: data.record.applicantName,
              address: data.record.applicantAddress,
              businessName: data.record.businessName,
              natureOfBusiness: data.record.natureOfBusiness || "",
              capitalInvestment: String(data.record.capitalInvestment),
              applicantId: data.record.applicantId,
            };
            setOwnerInfo(newInfo);

            if (!localApplicantId) {
              setLocalApplicantId(data.record.applicantId);
              localStorage.setItem("applicantId", data.record.applicantId);
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.set("applicantId", data.record.applicantId);
              window.history.replaceState(null, "", currentUrl.toString());
            }
          }

          // Reset
          setFormData((prev) => ({
            ...prev,
            date: "",
            gross: "",
            orNo: "",
            busTax: "",
            mayorsPermit: "",
            sanitaryInps: "",
            policeClearance: "",
            barangayClearance: "",
            zoningClearance: "",
            taxClearance: "",
            garbage: "",
            verification: "",
            weightAndMass: "",
            healthClearance: "",
            secFee: "",
            menro: "",
            docTax: "",
            eggsFee: "",
            marketCertification: "",
            surcharge25: "",
            sucharge2: "",
            miscellaneous: "",
            totalPayment: "",
            remarks: "",
            garbageCollection: "",
            polluters: "",
            Occupation: "",
            Other: "",
          }));

          setSelectedPermits([]);
          setShowForm(false);
          fetchData();
        } else {
          const errorData = await res.json();
          toast.error("Error: " + errorData.message, { position: "top-right" });
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("An error occurred while submitting the form.", {
          position: "top-right",
        });
      }
    },
    [API_URL, formData, localApplicantId, selectedPermits, fetchData]
  );

  // ----------------- Edit form -----------------
  const feeFields = useMemo(
    () => [
      "busTax",
      "mayorsPermit",
      "sanitaryInps",
      "policeClearance",
      "barangayClearance",
      "zoningClearance",
      "taxClearance",
      "garbage",
      "verification",
      "weightAndMass",
      "healthClearance",
      "secFee",
      "menro",
      "docTax",
      "eggsFee",
      "marketCertification",
      "surcharge25",
      "sucharge2",
      "miscellaneous",
      "garbageCollection",
      "polluters",
    ],
    []
  );

  const handleEditRecord = useCallback((record: PaymentRecord) => {
    setEditRecord(record);
    setSelectedPermits(
      (record.permits ?? []).map((p) => ({
        mayorPermitId: p.id,
        amount: String(p.BusinessRecordPermit.amount),
      }))
    );
  }, []);

  const handleEditInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = e.target as HTMLInputElement;
      const name = target.name;
      const newValue = target.type === "checkbox" ? target.checked : target.value;

      setEditRecord((prev: any) => {
        if (!prev) return prev;
        const updatedRecord: any = { ...prev, [name]: newValue };
        if (feeFields.includes(name)) {
          const newTotal = feeFields.reduce(
            (sum, field) => sum + (parseFloat(updatedRecord[field]) || 0),
            0
          );
          updatedRecord.totalPayment = newTotal.toFixed(2);
        }
        return updatedRecord;
      });
    },
    [feeFields]
  );

  const handleEditFormSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!editRecord) return;

      const payload = {
        ...editRecord,
        permits: selectedPermits.map((p) => ({
          mayorPermitId: p.mayorPermitId,
          amount: parseFloat(String(p.amount)) || 0,
        })),
      };

      try {
        const res = await fetch(
          `${API_URL}/api/business-record/${encodeURIComponent(String((editRecord as any).id))}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        if (res.ok) {
          toast.success("Record updated successfully!", {
            position: "top-right",
            autoClose: 2000,
          });
          setEditRecord(null);
          fetchData();
        } else {
          const errorData = await res.json();
          toast.error("Error: " + errorData.message, { position: "top-right" });
        }
      } catch (error) {
        console.error("Error updating record:", error);
        toast.error("Failed to update record.", { position: "top-right" });
      }
    },
    [API_URL, editRecord, selectedPermits, fetchData]
  );

  const handleDeleteRecord = useCallback(
    async (recordId: number | string) => {
      if (!confirm("Are you sure you want to delete this record?")) return;
      try {
        const res = await fetch(
          `${API_URL}/api/business-record/${encodeURIComponent(String(recordId))}`,
          { method: "DELETE", credentials: "include" }
        );
        if (res.ok) {
          toast.success("Record deleted successfully!", {
            position: "top-right",
            autoClose: 2000,
          });
          fetchData();
        } else {
          const err = await res.json();
          toast.error("Error: " + err.message, { position: "top-right" });
        }
      } catch (error) {
        console.error("Error deleting record:", error);
        toast.error("Failed to delete record.", { position: "top-right" });
      }
    },
    [API_URL, fetchData]
  );

  const handlePdfPrint = useCallback(() => window.print(), []);

  // ----------------- Render -----------------
  return (
    <div>
      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: 13in 8.5in;
            margin: 1cm;
          }
          .no-print,
          .top-bar {
            display: none !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
          body,
          table,
          th,
          td {
            font-family: Arial, "Segoe UI", sans-serif !important;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
          }
          .print-container {
            width: 100%;
            transform: scale(0.98);
            transform-origin: top left;
          }
          .print-page {
            page-break-after: always;
          }
          table {
            width: 100% !important;
            border-collapse: collapse;
            table-layout: auto;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          th,
          td {
            border: 1px solid #000 !important;
            padding: 6px !important;
            white-space: normal !important;
            word-wrap: break-word;
          }
        }
      `}</style>

      <div className="no-print">
        <Topbar />
      </div>

      <ToastContainer />

      {/* Back Button */}
      <div className="w-full p-4 no-print">
        <Link
          href={`/businessrecord?barangay=${encodeURIComponent(
            searchParams.get("barangay") || ""
          )}`}
          className="inline-flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200 ease-in-out"
        >
          &larr; Back to Business Records
        </Link>
      </div>

      <div className="w-[95%] mx-auto my-8 print-container">
        {/* Header Logos */}
        <div className="flex justify-between items-center mb-8">
          <Image src="/Logo1.png" alt="Logo" width={180} height={60} className="object-contain" />
          <Image src="/maasenso.png" alt="Maasenso Logo" width={180} height={60} className="object-contain" />
        </div>

        {/* Applicant Info Header with Inline Editing */}
        <header className="mb-8">
          {ownerInfo ? (
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Name of the Applicant:
                </label>
                <div className="flex items-center border-b border-gray-400 py-1">
                  {editingFields.applicantName ? (
                    <input
                      type="text"
                      name="applicantName"
                      value={tempOwnerInfo?.applicantName || ""}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.applicantName}</span>
                  )}
                  {editingFields.applicantName ? (
                    <button onClick={() => saveField("applicantName")} className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing("applicantName")} className="ml-2 no-print">
                      <FaEdit />
                    </button>
                  )}
                </div>
                <label className="block text-sm font-semibold text-gray-700 mt-4">Address:</label>
                <div className="flex items-center border-b border-gray-400 py-1">
                  {editingFields.address ? (
                    <input
                      type="text"
                      name="address"
                      value={tempOwnerInfo?.address || ""}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.address}</span>
                  )}
                  {editingFields.address ? (
                    <button onClick={() => saveField("address")} className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing("address")} className="ml-2 no-print">
                      <FaEdit />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-semibold text-gray-700">Name of Business:</label>
                <div className="flex items-center border-b border-gray-400 py-1">
                  {editingFields.businessName ? (
                    <input
                      type="text"
                      name="businessName"
                      value={tempOwnerInfo?.businessName || ""}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.businessName}</span>
                  )}
                  {editingFields.businessName ? (
                    <button onClick={() => saveField("businessName")} className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing("businessName")} className="ml-2 no-print">
                      <FaEdit />
                    </button>
                  )}
                </div>
                <label className="block text-sm font-semibold text-gray-700 mt-4">
                  Nature of Business:
                </label>
                <div className="flex items-center border-b border-gray-400 py-1">
                  {editingFields.natureOfBusiness ? (
                    <input
                      type="text"
                      name="natureOfBusiness"
                      value={tempOwnerInfo?.natureOfBusiness || ""}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.natureOfBusiness}</span>
                  )}
                  {editingFields.natureOfBusiness ? (
                    <button onClick={() => saveField("natureOfBusiness")} className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing("natureOfBusiness")} className="ml-2 no-print">
                      <FaEdit />
                    </button>
                  )}
                </div>
                <label className="block text-sm font-semibold text-gray-700 mt-4">
                  Capital Investment:
                </label>
                <div className="flex items-center border-b border-gray-400 py-1">
                  {editingFields.capitalInvestment ? (
                    <input
                      type="text"
                      name="capitalInvestment"
                      value={tempOwnerInfo?.capitalInvestment || ""}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.capitalInvestment}</span>
                  )}
                  {editingFields.capitalInvestment ? (
                    <button onClick={() => saveField("capitalInvestment")} className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing("capitalInvestment")} className="ml-2 no-print">
                      <FaEdit />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <h1 className="text-3xl font-bold">Detailed Records</h1>
          )}
        </header>

        {/* Actions Row */}
        <div className="mb-4 no-print flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowForm((s) => !s)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {showForm ? "Hide Form" : "Add New Record"}
            </button>
            <button
              onClick={handlePdfPrint}
              className="bg-gray-200 text-gray-700 p-2 rounded hover:bg-gray-300"
              title="Print PDF"
            >
              <FaFilePdf size={20} />
            </button>
          </div>
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              className="border rounded px-2 py-1"
              value={pageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPageSize(next);
                setCurrentPage(1); // reset
              }}
            >
              {[25, 50, 100, 250].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Watermark on screen/print if any expired */}
        {currentRecords.some((r) => r.expired) && <div className="watermark-print">RETIRED</div>}

        {/* Main Table (screen) */}
        <div className="w-full sm:rounded-lg border border-gray-200 overflow-x-auto print:hidden">
          <table className="min-w-full table-auto text-sm text-left text-gray-500">
            <thead className="bg-gray-50">
              <tr>
                {columnGroups.map((group) => (
                  <th
                    key={group.label}
                    colSpan={group.columns.length}
                    className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-gray-300"
                  >
                    {group.label}
                  </th>
                ))}
                <th className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-gray-300 no-print">
                  Actions
                </th>
              </tr>
              <tr>
                {columnGroups.map((group) =>
                  group.columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-300"
                    >
                      {col.label}
                    </th>
                  ))
                )}
                <th className="px-4 py-2 text-center font-medium text-gray-700 border-b border-gray-300 no-print" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRecords.map((record) => (
                <TableRow
                  key={String(record.id)}
                  record={record as any}
                  groups={columnGroups}
                  onEdit={handleEditRecord}
                  onDelete={handleDeleteRecord}
                  onView={(r) => setViewRecord(r)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* PRINT (render columns in chunks) */}
        <div className="print-container hidden print:block">
          {pages.map((cols, pageIdx) => (
            <div key={pageIdx} className="print-page">
              <table className="min-w-full table-auto text-sm text-left text-gray-500">
                <thead className="bg-gray-50">
                  <tr>
                    {cols.map((col) => (
                      <th key={String(col.key)} className="px-4 py-2 border-b border-gray-300">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentRecords.map((record) => (
                    <tr
                      key={`${record.id}-${pageIdx}`}
                      className={`relative ${record._delinquent ? "expired-row" : ""}`}
                    >
                      {cols.map((col) => {
                        const raw =
                          (record as any)[col.key] ??
                          (col.key === "expiredDate" ? (record as any)._expiredDate : "");
                        const val = (col as any).format ? (col as any).format(raw) : raw;
                        return (
                          <td key={`${record.id}-${String(col.key)}`} className="px-4 py-2">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2 no-print">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded ${
                  page === currentPage ? "bg-blue-600 text-white" : "bg-white text-blue-600"
                }`}
              >
                {page}
              </button>
            ))}
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

      {/* ADD RECORD MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 overflow-y-auto no-print">
          <div className="relative bg-white shadow-lg rounded max-w-5xl w-full mx-4 my-10 max-h-[90vh] overflow-y-auto p-6">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <form onSubmit={handleFormSubmit}>
              <h2 className="text-xl font-bold mb-4">Add New Record</h2>
              {!localApplicantId && (
                <>
                  <h3 className="text-2xl font-semibold my-4">Applicant Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* FIXED: previously these inputs incorrectly showed totalPayment */}
                    <div>
                      <label className="block font-medium text-gray-700">Applicant Name</label>
                      <input
                        type="text"
                        name="applicantName"
                        value={formData.applicantName}
                        onChange={handleInputChange}
                        className="border p-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Applicant Address</label>
                      <input
                        type="text"
                        name="applicantAddress"
                        value={formData.applicantAddress}
                        onChange={handleInputChange}
                        className="border p-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Business Name</label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className="border p-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Nature of Business</label>
                      <input
                        type="text"
                        name="natureOfBusiness"
                        value={formData.natureOfBusiness}
                        onChange={handleInputChange}
                        className="border p-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Capital Investment</label>
                      <input
                        type="number"
                        name="capitalInvestment"
                        value={formData.capitalInvestment}
                        onChange={handleInputChange}
                        className="border p-2 w-full"
                      />
                    </div>
                  </div>
                  <hr className="my-4" />
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Year", name: "year", type: "text" },
                  { label: "Date", name: "date", type: "date" },
                  { label: "Gross", name: "gross", type: "text" },
                  { label: "OR No.", name: "orNo", type: "text" },
                  { label: "BUS TAX", name: "busTax", type: "text" },
                  { label: "Mayor's Permit", name: "mayorsPermit", type: "text" },
                  { label: "Sanitary Inps", name: "sanitaryInps", type: "text" },
                  { label: "Police Clearance", name: "policeClearance", type: "text" },
                  { label: "Barangay Clearance", name: "barangayClearance", type: "text" },
                  { label: "Zoning Clearance", name: "zoningClearance", type: "text" },
                  { label: "Tax Clearance", name: "taxClearance", type: "text" },
                  { label: "Garbage", name: "garbage", type: "text" },
                  { label: "Verification", name: "verification", type: "text" },
                  { label: "Weight & Mass", name: "weightAndMass", type: "text" },
                  { label: "Health Clearance", name: "healthClearance", type: "text" },
                  { label: "SEC Fee", name: "secFee", type: "text" },
                  { label: "MENRO", name: "menro", type: "text" },
                  { label: "Doc Tax", name: "docTax", type: "text" },
                  { label: "Egg's Fee", name: "eggsFee", type: "text" },
                  { label: "Market Certification", name: "marketCertification", type: "text" },
                  { label: "25% Surcharge", name: "surcharge25", type: "text" },
                  { label: "2% Month", name: "sucharge2", type: "text" },
                  { label: "Garbage Collection", name: "garbageCollection", type: "text" },
                  { label: "Polluters", name: "polluters", type: "text" },
                  { label: "Occupation", name: "Occupation", type: "text" },
                  { label: "Other", name: "Other", type: "textarea" as const },
                  { label: "Miscellaneous", name: "miscellaneous", type: "text" },
                  { label: "Total Payment", name: "totalPayment", type: "text" },
                  { label: "Remarks", name: "remarks", type: "text" },
                  { label: "Frequency", name: "frequency", type: "select" as const },
                ].map((input) => (
                  <div key={input.name}>
                    <label className="block font-medium text-gray-700">{input.label}</label>
                    {input.name === "totalPayment" ? (
                      <input
                        type="text"
                        name="totalPayment"
                        value={(formData as any).totalPayment}
                        readOnly
                        className="border p-2 w-full bg-gray-100 cursor-not-allowed"
                      />
                    ) : input.type === "select" ? (
                      <select
                        name={input.name}
                        value={(formData as any)[input.name]}
                        onChange={handleInputChange}
                        className="border p-2 w-full"
                      >
                        <option value="quarterly">Quarterly</option>
                        <option value="semi-annual">Semi-Annual</option>
                        <option value="annual">Annual</option>
                      </select>
                    ) : input.type === "textarea" ? (
                      <textarea
                        name={input.name}
                        value={(formData as any)[input.name]}
                        onChange={handleInputChange}
                        className="border p-2 w-full"
                        placeholder={`Enter ${input.label}`}
                      />
                    ) : (
                      <input
                        type={input.type}
                        name={input.name}
                        value={(formData as any)[input.name]}
                        onChange={handleInputChange}
                        className="border p-2 w-full"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Mayor’s Permits & Fees */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold my-4">Mayor’s Permits & Fees</h3>
                <Select
                  isMulti
                  options={mpOptions}
                  value={mpOptions.filter((o) =>
                    selectedPermits.some((p) => p.mayorPermitId === o.value)
                  )}
                  onChange={(opts) => handlePermitsChange(opts as MultiValue<MPOption>)}
                  placeholder="Type to search permits..."
                  className="w-full mb-2"
                  classNamePrefix="react-select"
                  styles={{ control: (base) => ({ ...base, borderRadius: "0.5rem", padding: "2px" }) }}
                />
                {selectedPermits.length > 0 && (
                  <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Permit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Amount (₱)
                          </th>
                          <th className="px-6 py-3 w-24 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Remove
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {selectedPermits.map((p) => {
                          const label =
                            mpOptions.find((o) => o.value === p.mayorPermitId)?.label || "";
                          return (
                            <tr key={p.mayorPermitId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {label}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={String(p.amount)}
                                  onChange={(e) =>
                                    handlePermitAmountChange(p.mayorPermitId, e.target.value)
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPermits((old) =>
                                      old.filter((item) => item.mayorPermitId !== p.mayorPermitId)
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  &times;
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECORD MODAL */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 overflow-y-auto no-print">
          <div className="relative bg-white shadow-lg rounded max-w-5xl w-full mx-4 my-10 max-h-[90vh] overflow-y-auto p-6">
            <button
              onClick={() => setEditRecord(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <form onSubmit={handleEditFormSubmit}>
              <h2 className="text-xl font-bold mb-4">Edit Record</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Year", name: "year", type: "text" },
                  { label: "Date", name: "date", type: "date" },
                  { label: "Gross", name: "gross", type: "text" },
                  { label: "OR No.", name: "orNo", type: "text" },
                  { label: "BUS TAX", name: "busTax", type: "text" },
                  { label: "Mayor's Permit", name: "mayorsPermit", type: "text" },
                  { label: "Sanitary Inps", name: "sanitaryInps", type: "text" },
                  { label: "Police Clearance", name: "policeClearance", type: "text" },
                  { label: "Barangay Clearance", name: "barangayClearance", type: "text" },
                  { label: "Zoning Clearance", name: "zoningClearance", type: "text" },
                  { label: "Tax Clearance", name: "taxClearance", type: "text" },
                  { label: "Garbage", name: "garbage", type: "text" },
                  { label: "Verification", name: "verification", type: "text" },
                  { label: "Weight & Mass", name: "weightAndMass", type: "text" },
                  { label: "Health Clearance", name: "healthClearance", type: "text" },
                  { label: "SEC Fee", name: "secFee", type: "text" },
                  { label: "MENRO", name: "menro", type: "text" },
                  { label: "Doc Tax", name: "docTax", type: "text" },
                  { label: "Egg's Fee", name: "eggsFee", type: "text" },
                  { label: "Market Certification", name: "marketCertification", type: "text" },
                  { label: "25% Surcharge", name: "surcharge25", type: "text" },
                  { label: "2% Month", name: "sucharge2", type: "text" },
                  { label: "Miscellaneous", name: "miscellaneous", type: "text" },
                  { label: "Garbage Collection", name: "garbageCollection", type: "text" },
                  { label: "Polluters", name: "polluters", type: "text" },
                  { label: "Occupation", name: "Occupation", type: "text" },
                  { label: "Other", name: "Other", type: "textarea" as const },
                  { label: "Total Payment", name: "totalPayment", type: "text" },
                  { label: "Remarks", name: "remarks", type: "text" },
                  { label: "Frequency", name: "frequency", type: "select" as const },
                  { label: "Renewed", name: "renewed", type: "checkbox" as const },
                ].map((input) => (
                  <div key={input.name}>
                    <label className="block font-medium text-gray-700">{input.label}</label>
                    {input.name === "totalPayment" ? (
                      <input
                        type="text"
                        name="totalPayment"
                        value={(editRecord as any).totalPayment || ""}
                        readOnly
                        disabled
                        className="border p-2 w-full bg-gray-100 cursor-not-allowed"
                      />
                    ) : input.type === "select" ? (
                      <select
                        name={input.name}
                        value={(editRecord as any)[input.name] || ""}
                        onChange={handleEditInputChange}
                        className="border p-2 w-full"
                      >
                        <option value="quarterly">Quarterly</option>
                        <option value="semi-annual">Semi-Annual</option>
                        <option value="annual">Annual</option>
                      </select>
                    ) : input.type === "checkbox" && input.name === "renewed" ? (
                      <input
                        type="checkbox"
                        name={input.name}
                        checked={Boolean((editRecord as any)[input.name])}
                        onChange={handleEditInputChange}
                        className="border p-2"
                      />
                    ) : input.type === "date" ? (
                      <input
                        type="date"
                        name={input.name}
                        value={
                          (editRecord as any)?.date
                            ? String((editRecord as any).date).split("T")[0]
                            : ""
                        }
                        onChange={handleEditInputChange}
                        className="border p-2 w-full"
                      />
                    ) : input.type === "textarea" ? (
                      <textarea
                        name={input.name}
                        value={(editRecord as any)[input.name] || ""}
                        onChange={handleEditInputChange}
                        className="border p-2 w-full"
                      />
                    ) : (
                      <input
                        type={input.type}
                        name={input.name}
                        value={(editRecord as any)[input.name] || ""}
                        onChange={handleEditInputChange}
                        className="border p-2 w-full"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Mayor’s Permits & Fees (Edit) */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold my-4">Mayor’s Permits & Fees</h3>
                <Select
                  isMulti
                  options={mpOptions}
                  value={mpOptions.filter((o) =>
                    selectedPermits.some((p) => p.mayorPermitId === o.value)
                  )}
                  onChange={(opts) => handlePermitsChange(opts as MultiValue<MPOption>)}
                  placeholder="Type to search permits..."
                  className="w-full mb-2"
                  classNamePrefix="react-select"
                  styles={{ control: (base) => ({ ...base, borderRadius: "0.5rem", padding: "2px" }) }}
                />
                {selectedPermits.length > 0 && (
                  <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Permit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Amount (₱)
                          </th>
                          <th className="px-6 py-3 w-24 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Remove
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {selectedPermits.map((p) => {
                          const label =
                            mpOptions.find((o) => o.value === p.mayorPermitId)?.label || "";
                          return (
                            <tr key={p.mayorPermitId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {label}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={String(p.amount)}
                                  onChange={(e) =>
                                    handlePermitAmountChange(p.mayorPermitId, e.target.value)
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPermits((old) =>
                                      old.filter((item) => item.mayorPermitId !== p.mayorPermitId)
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  &times;
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW RECORD MODAL */}
      <RecordViewModal
        open={!!viewRecord}
        record={viewRecord}
        groups={columnGroups as any}
        onClose={() => setViewRecord(null)}
        onEdit={(r) => {
          setEditRecord(r);
          setViewRecord(null);
          setSelectedPermits(
            (r?.permits ?? []).map((p: any) => ({
              mayorPermitId: p.id,
              amount: String(p.BusinessRecordPermit.amount),
            }))
          );
        }}
      />
    </div>
  );
}

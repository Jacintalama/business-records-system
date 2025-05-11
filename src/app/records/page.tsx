"use client";

import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash, FaFilePdf, FaCheck } from 'react-icons/fa';
import Topbar from '../components/Topbar';
import { computePeriodEnd } from '../utils/periodUtils';
import Select, { MultiValue } from 'react-select'

interface MPOption { value: number; label: string }
interface SelectedPermit { mayorPermitId: number; amount: string }

/** 
 * Update the OwnerInfo interface to include natureOfBusiness.
 */
interface OwnerInfo {
  applicantName: string;
  address: string;
  businessName: string;
  natureOfBusiness: string;
  capitalInvestment: string;
  applicantId: string;
}

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
  totalPayment: string;
  remarks: string;
  frequency: 'quarterly' | 'semi-annual' | 'annual';
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
    natureOfBusiness?: string;  // New field included in applicant details
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
  key: keyof PaymentRecord | 'expiredDate' | 'permits';
  label: string;
  format?: (val: any) => string;
  sorter?: (a: PaymentRecord, b: PaymentRecord) => number;
  defaultSortOrder?: 'ascend' | 'descend';
}
// Money sign peso
const phpFormatter = new Intl.NumberFormat('en-PH', {     // <- notice plain '-' here
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
// end

// at top of your file, above columnGroups
const collapseLines = (val: any): string =>
  String(val)
    .split(/\r?\n+/)      // split on any line‐break
    .map(s => s.trim())   // trim each piece
    .filter(Boolean)      // drop empty
    .join(' / ')          // rejoin with “ / ”

const columnGroups: { label: string; columns: Column[] }[] = [
  {
    label: 'Basic Info',
    columns: [
      { key: 'year', label: 'Year' },
      {
        key: 'date',
        label: 'Date',
        format: v => new Date(v).toLocaleDateString(),
        sorter: (a: PaymentRecord, b: PaymentRecord) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
        defaultSortOrder: 'ascend',
      },
      { key: 'gross', label: 'Gross', format: v => phpFormatter.format(Number(v)) },
      {
        key: 'orNo',
        label: 'OR No.',
        // 1) collapse any new-lines into a single " / "
        format: (raw: any) =>
          String(raw)
            .split(/\r?\n+/)            // break on any line-break
            .map(s => s.trim())         // trim each piece
            .filter(Boolean)            // drop empty strings
            .join(' / '),               // re-join with a space-slash-space
      },
    ]
  },
  // ← New “Permits” group:
  {
    label: 'Permits',
    columns: [
      {
        key: 'permits',
        label: 'Mayor’s Permits',
        format: (perms: PaymentRecord['permits']) => {
          if (!Array.isArray(perms) || perms.length === 0) return '—'
          // build your comma‐list
          const text = perms
            .map(p => `${p.name} (${phpFormatter.format(p.BusinessRecordPermit.amount)})`)
            .join(', ')
          // then collapse any accidental line‐breaks
          return collapseLines(text)
        }
      }
    ]
  },
  {
    label: 'Fees & Clearances',
    columns: [
      { key: 'busTax', label: 'BUS TAX', format: v => phpFormatter.format(Number(v)) },
      { key: 'mayorsPermit', label: "Mayor's Permit", format: v => phpFormatter.format(Number(v)) },
      { key: 'sanitaryInps', label: 'Sanitary Inps', format: v => phpFormatter.format(Number(v)) },
      { key: 'policeClearance', label: 'Police Clearance', format: v => phpFormatter.format(Number(v)) },
      { key: 'barangayClearance', label: 'Barangay Clearance', format: v => phpFormatter.format(Number(v)) },
      { key: 'zoningClearance', label: 'Zoning Clearance', format: v => phpFormatter.format(Number(v)) },
      { key: 'taxClearance', label: 'Tax Clearance', format: v => phpFormatter.format(Number(v)) },
      { key: 'garbage', label: 'Garbage', format: v => phpFormatter.format(Number(v)) },
      { key: 'verification', label: 'Verification', format: v => phpFormatter.format(Number(v)) },
      { key: 'weightAndMass', label: 'Weight & Mass', format: v => phpFormatter.format(Number(v)) },
      { key: 'healthClearance', label: 'Health Clearance', format: v => phpFormatter.format(Number(v)) },
      { key: 'secFee', label: 'SEC Fee', format: v => phpFormatter.format(Number(v)) },
      { key: 'menro', label: 'MENRO', format: v => phpFormatter.format(Number(v)) },
      { key: 'docTax', label: 'Doc Tax', format: v => phpFormatter.format(Number(v)) },
      { key: 'eggsFee', label: "Egg's Fee", format: v => phpFormatter.format(Number(v)) },
    ],
  },
  {
    label: 'Surcharges',
    columns: [
      { key: 'surcharge25', label: '25% Surcharge', format: v => phpFormatter.format(Number(v)) },
      { key: 'sucharge2', label: '2% Month', format: v => phpFormatter.format(Number(v)) },
    ],
  },
  {
    label: 'Additional Details',
    columns: [
      { key: 'garbageCollection', label: 'Garbage Collection', format: v => phpFormatter.format(Number(v)) },
      { key: 'polluters', label: 'Polluters', format: v => phpFormatter.format(Number(v)) },
      { key: 'Occupation', label: 'Occupation', format: v => phpFormatter.format(Number(v)) },
    ],
  },
  {
    label: 'Additional Info',
    columns: [
      { key: 'marketCertification', label: 'Market Certification', format: v => phpFormatter.format(Number(v)) },
      { key: 'miscellaneous', label: 'Miscellaneous', format: v => phpFormatter.format(Number(v)) },
    ],
  },
  {
    label: 'Totals & Remarks',
    columns: [
      {
        key: 'totalPayment',
        label: 'Total Payment',
        format: (val) => phpFormatter.format(Number(val)),
      },
      { key: 'remarks', label: 'Remarks' },
      { key: 'frequency', label: 'Frequency' },
      {
        key: 'renewed',
        label: 'Renewed',
        format: (val) => (val ? 'Yes' : 'No'),
      },
    ],
  },
  {
    label: 'Others',
    columns: [
      {
        key: 'Other',
        label: 'Other',
        format: collapseLines
      }
    ],
  },

  {
    label: 'Expiration',
    columns: [
      { key: 'expiredDate', label: 'Expired Date' },
    ],
  },
];

const computeRenewalDueDate = (dateStr: string, frequency: string): Date => {
  const recordDate = new Date(dateStr);
  const dueDate = new Date(recordDate);
  if (frequency === 'quarterly') {
    dueDate.setMonth(dueDate.getMonth() + 3);
  } else if (frequency === 'semi-annual') {
    dueDate.setMonth(dueDate.getMonth() + 6);
  } else if (frequency === 'annual') {
    dueDate.setFullYear(dueDate.getFullYear() + 1);
  }
  return dueDate;
};

const isRecordDelinquent = (record: PaymentRecord): boolean => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  if (record.renewed) return false;
  if (record.year < currentYear) return true;
  const dueDate = computeRenewalDueDate(record.date, record.frequency);
  return dueDate < currentDate;
};

export default function ReportPage() {

  const searchParams = useSearchParams();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.107:3000';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('User');

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

  // ─── MP: master list + selection state ─────────────────────────────
  const [mpOptions, setMpOptions] = useState<MPOption[]>([])
  const [selectedPermits, setSelectedPermits] = useState<SelectedPermit[]>([])
  const [showEdit, setShowEdit] = useState(false);


  useEffect(() => {
    fetch(`${API_URL}/api/business-record/mp`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { id: number; name: string }[]) =>
        setMpOptions(data.map(mp => ({ value: mp.id, label: mp.name })))
      )
      .catch(err => {
        console.error('Failed loading MP:', err)
        toast.error('Could not load permit options')
      })
  }, [API_URL])



  const handlePermitsChange = (opts: MultiValue<MPOption>) => {
    setSelectedPermits(opts.map(o => {
      const existing = selectedPermits.find(p => p.mayorPermitId === o.value)
      return existing || { mayorPermitId: o.value, amount: '' }
    }))
  }

  const handlePermitAmountChange = (id: number, val: string) => {
    setSelectedPermits(ps =>
      ps.map(p => p.mayorPermitId === id ? { ...p, amount: val } : p)
    )
  }
  // ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          const fullName = `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`;
          setUserName(fullName);
        } else {
          setIsAuthenticated(false);
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login');
      }
    }
    checkAuth();
  }, [router, API_URL]);

  function convertDateForInput(dateStr: string): string {
    if (dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const applicantIdParam = searchParams.get('applicantId');
  const storedApplicantId = typeof window !== 'undefined'
    ? localStorage.getItem('applicantId')
    : '';
  const initialApplicantId =
    applicantIdParam &&
      applicantIdParam !== 'undefined' &&
      applicantIdParam !== 'null'
      ? applicantIdParam
      : storedApplicantId || '';

  const [localApplicantId, setLocalApplicantId] = useState<string>(initialApplicantId);
  // ─── sync localApplicantId with any URL changes ────────────────────
  useEffect(() => {
    const param = searchParams.get('applicantId');
    if (
      param &&
      param !== 'undefined' &&
      param !== 'null' &&
      param !== localApplicantId
    ) {
      setLocalApplicantId(param);
      localStorage.setItem('applicantId', param);
    }
  }, [searchParams.toString(), localApplicantId]);
  // ──────────────────────────────────────────────────────────────────

  const applicantNameParam = searchParams.get('applicantName') || '';
  const applicantAddressParam = searchParams.get('applicantAddress') || '';

  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<Partial<PaymentRecord> | null>(null);

  // ─── 3) **Here**: seed selectedPermits when editRecord changes ───
  useEffect(() => {
    if (editRecord?.permits?.length) {
      setSelectedPermits(
        editRecord.permits.map(p => ({
          mayorPermitId: p.id,
          amount: String(p.BusinessRecordPermit.amount)
        }))
      );
    } else {
      setSelectedPermits([]);
    }
  }, [editRecord]);
  // ─── Auto-recalculate totalPayment in Edit form ─────────────────
  useEffect(() => {
    if (!editRecord) return;

    // same fee-fields you use in calculateTotalPayment
    const feeKeys: Array<keyof PaymentRecord> = [
      'busTax', 'sanitaryInps', 'policeClearance', 'barangayClearance',
      'zoningClearance', 'taxClearance', 'garbage', 'verification',
      'weightAndMass', 'healthClearance', 'secFee', 'menro', 'docTax',
      'eggsFee', 'marketCertification', 'garbageCollection',
      'polluters', 'Occupation', 'miscellaneous', 'surcharge25', 'sucharge2',
      'Other'
    ];

    // sum all numbers found in each fee-field
    const feesSum = feeKeys.reduce((sum, key) => {
      const raw = String((editRecord as any)[key] ?? '');
      const nums = raw.match(/-?\d+(\.\d+)?/g) ?? [];
      return sum + nums.reduce((s, n) => s + parseFloat(n), 0);
    }, 0);

    // sum up the edited permits
    const permitsSum = selectedPermits.reduce(
      (s, p) => s + (parseFloat(p.amount) || 0),
      0
    );

    const newTotal = feesSum + permitsSum;

    // only update if it really changed
    if (parseFloat(editRecord.totalPayment as string) !== newTotal) {
      setEditRecord(prev => prev
        ? { ...prev, totalPayment: String(newTotal) }
        : prev
      );
    }
  }, [
    editRecord,
    // individually watch each fee-field so TS/Hooks know when it changes:
    editRecord?.busTax, editRecord?.sanitaryInps, editRecord?.policeClearance,
    editRecord?.barangayClearance, editRecord?.zoningClearance,
    editRecord?.taxClearance, editRecord?.garbage, editRecord?.verification,
    editRecord?.weightAndMass, editRecord?.healthClearance,
    editRecord?.secFee, editRecord?.menro, editRecord?.docTax,
    editRecord?.eggsFee, editRecord?.marketCertification,
    editRecord?.garbageCollection, editRecord?.polluters,
    editRecord?.Occupation, editRecord?.miscellaneous,
    editRecord?.surcharge25, editRecord?.sucharge2, editRecord?.Other,
    selectedPermits
  ]);
  // ────────────────────────────────────────────────────────────────

  // Updated initial form data now includes natureOfBusiness
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantAddress: '',
    businessName: '',
    natureOfBusiness: '',
    capitalInvestment: '',
    year: new Date().getFullYear(),
    date: '',
    gross: '',
    orNo: '',
    busTax: '',
    mayorsPermit: '',
    sanitaryInps: '',
    policeClearance: '',
    barangayClearance: '',
    zoningClearance: '',
    taxClearance: '',
    garbage: '',
    verification: '',
    weightAndMass: '',
    healthClearance: '',
    secFee: '',
    menro: '',
    docTax: '',
    eggsFee: '',
    marketCertification: '',
    surcharge25: '',
    sucharge2: '',
    miscellaneous: '',
    totalPayment: '',
    remarks: '',
    frequency: 'annual',
    garbageCollection: '',
    polluters: '',
    Occupation: '',
    Other: '',
  });
  // whenever we open the “Add New Record” form, pre-fill it
  useEffect(() => {
    if (showForm && ownerInfo) {
      setFormData(prev => ({
        ...prev,
        applicantName: ownerInfo.applicantName,
        applicantAddress: ownerInfo.address,
        businessName: ownerInfo.businessName,
        natureOfBusiness: ownerInfo.natureOfBusiness,
        capitalInvestment: ownerInfo.capitalInvestment,
      }));
    }
  }, [showForm, ownerInfo]);
  // When ownerInfo changes, copy it to tempOwnerInfo for inline editing
  useEffect(() => {
    if (ownerInfo) {
      setTempOwnerInfo(ownerInfo);
    }
  }, [ownerInfo]);

  // Inline editing handlers for owner info
  const startEditing = (field: keyof OwnerInfo) => {
    setEditingFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleOwnerInfoInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (tempOwnerInfo) {
      setTempOwnerInfo({ ...tempOwnerInfo, [name]: value });
    }
  };

  // Updated to use the /api/applicant endpoint
  const saveField = async (field: keyof OwnerInfo) => {
    if (!tempOwnerInfo || !ownerInfo) return;
    try {
      const res = await fetch(
        `${API_URL}/api/applicants/${ownerInfo.applicantId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ [field]: tempOwnerInfo[field] }),
        }
      );
      if (res.ok) {
        toast.success(`${field} updated successfully!`, { autoClose: 3000 });
        setOwnerInfo({ ...ownerInfo, [field]: tempOwnerInfo[field] });
        setEditingFields((prev) => ({ ...prev, [field]: false }));
      } else {
        const errorData = await res.json();
        toast.error('Error: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error updating owner info:', error);
      toast.error('Failed to update owner info.');
    }
  };


  const fetchData = useCallback(async () => {
    try {
      let url = `${API_URL}/api/business-record?`;
      if (localApplicantId && localApplicantId !== 'undefined') {
        url += `applicantId=${encodeURIComponent(localApplicantId)}&`;
      }
      if (applicantNameParam) {
        url += `applicantName=${encodeURIComponent(applicantNameParam)}&`;
      }
      if (applicantAddressParam) {
        url += `applicantAddress=${encodeURIComponent(applicantAddressParam)}&`;
      }

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      const data = await res.json();

      // ─── Sort logic changed ENTIRELY ─────────────────────────────────────
      const sortedRecords = data.records.sort((a: PaymentRecord, b: PaymentRecord) => {
        // 1) newest year first
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        // 2) within same year, newest date first
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      // ────────────────────────────────────────────────────────────────────

      setRecords(sortedRecords);

      if (sortedRecords.length > 0 && sortedRecords[0].applicant) {
        const app = sortedRecords[0].applicant;
        const info: OwnerInfo = {
          applicantName: app.applicantName,
          address: app.applicantAddress,
          businessName: app.businessName,
          natureOfBusiness: app.natureOfBusiness || '',
          capitalInvestment: String(app.capitalInvestment),
          applicantId: String(app.id),
        };
        setOwnerInfo(info);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error(`Error fetching records: ${(error as Error).message}`);
      setRecords([]);
      setOwnerInfo(null);
    }
  }, [localApplicantId, applicantNameParam, applicantAddressParam, API_URL]);



  useEffect(() => {
    fetchData();
  }, [fetchData, searchParams.toString()]);


  const uniqueRecords = Array.from(new Map(records.map((r) => [r.id, r])).values());
  const totalPages = Math.ceil(uniqueRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRecords = uniqueRecords.slice(startIndex, startIndex + pageSize);

  // ←—— 
  const tableColumns = columnGroups.flatMap(group =>
    group.columns.map(col => ({
      title: col.label,
      dataIndex: col.key,
      render: col.format,
      sorter: col.sorter,
      defaultSortOrder: col.defaultSortOrder
    }))
  );
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // helper to turn "14,240.15" → 14240.15
  const parseNumber = (value: string) =>
    parseFloat(value.replace(/,/g, ''));

  // ─── Helpers ──────────────────────────────────────────────────────
  // fallback-friendly parse
  const parseNum = (v: string) => parseFloat(v.replace(/,/g, "")) || 0;

  // pull the first numeric substring out of any string
  const extractNumber = (s: string): number => {
    const m = s.match(/-?\d+(\.\d+)?/);
    return m ? parseNum(m[0]) : 0;
  };

  // ─── Calculate totalPayment ───────────────────────────────────────
  const calculateTotalPayment = (): number => {
    const feeKeys: Array<keyof typeof formData> = [
      'busTax', 'mayorsPermit', 'sanitaryInps', 'policeClearance',
      'barangayClearance', 'zoningClearance', 'taxClearance', 'garbage',
      'verification', 'weightAndMass', 'healthClearance', 'secFee',
      'menro', 'docTax', 'eggsFee', 'marketCertification',
      'garbageCollection', 'polluters', 'Occupation', 'miscellaneous',
      'surcharge25', 'sucharge2',
      'Other'     // ← now pick up every number inside “Other”
    ];

    // sum every number found in each field
    const feesSum = feeKeys.reduce((sum, key) => {
      const raw = String(formData[key] ?? '');
      // find **all** numbers, including decimals or negatives
      const matches = raw.match(/-?\d+(\.\d+)?/g);
      // parse & sum them, or 0 if none
      const fieldTotal = matches
        ? matches.reduce((s, num) => s + parseFloat(num), 0)
        : 0;
      return sum + fieldTotal;
    }, 0);

    // your permits are already numeric, so just sum them
    const permitsSum = selectedPermits.reduce((sum, p) => {
      const n = parseFloat(p.amount) || 0;
      return sum + n;
    }, 0);

    return feesSum + permitsSum;
  };

  // ―― watch every field (including “Other”) ――
  useEffect(() => {
    const newTotal = calculateTotalPayment();
    // extract old total’s number too
    const oldMatch = String(formData.totalPayment).match(/-?\d+(\.\d+)?/g);
    const oldTotal = oldMatch
      ? oldMatch.reduce((s, num) => s + parseFloat(num), 0)
      : 0;

    if (oldTotal !== newTotal) {
      setFormData(f => ({ ...f, totalPayment: String(newTotal) }));
    }
  }, [
    formData.busTax, formData.mayorsPermit, formData.sanitaryInps,
    formData.policeClearance, formData.barangayClearance,
    formData.zoningClearance, formData.taxClearance, formData.garbage,
    formData.verification, formData.weightAndMass, formData.healthClearance,
    formData.secFee, formData.menro, formData.docTax, formData.eggsFee,
    formData.marketCertification, formData.garbageCollection,
    formData.polluters, formData.Occupation, formData.miscellaneous,
    formData.surcharge25, formData.sucharge2, formData.Other,
    selectedPermits
  ]);


  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        applicantId: localApplicantId,
        // copy all your formData fields:
        ...formData,
        // ALWAYS include gross (even if empty):
        gross: parseNumber(formData.gross || "0"),
        // map your selected permits into the shape your API expects:
        permits: selectedPermits.map(p => ({
          mayorPermitId: p.mayorPermitId,
          amount: parseNumber(p.amount) || 0,
        })),
      };

      const res = await fetch(`${API_URL}/api/business-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Record added successfully!', { position: 'top-right', autoClose: 3000 });

        if (data.record) {
          const newInfo: OwnerInfo = {
            applicantName: data.record.applicantName,
            address: data.record.applicantAddress,
            businessName: data.record.businessName,
            natureOfBusiness: data.record.natureOfBusiness || '',
            capitalInvestment: String(data.record.capitalInvestment),
            applicantId: data.record.applicantId,
          };
          setOwnerInfo(newInfo);

          if (!localApplicantId) {
            setLocalApplicantId(data.record.applicantId);
            localStorage.setItem('applicantId', data.record.applicantId);
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('applicantId', data.record.applicantId);
            window.history.replaceState(null, '', currentUrl.toString());
          }
        }


        setFormData({
          applicantName: '',
          applicantAddress: '',
          businessName: '',
          natureOfBusiness: '',
          capitalInvestment: '',
          year: new Date().getFullYear(),
          date: '',
          gross: '',
          orNo: '',
          busTax: '',
          mayorsPermit: '',
          sanitaryInps: '',
          policeClearance: '',
          barangayClearance: '',
          zoningClearance: '',
          taxClearance: '',
          garbage: '',
          verification: '',
          weightAndMass: '',
          healthClearance: '',
          secFee: '',
          menro: '',
          docTax: '',
          eggsFee: '',
          marketCertification: '',
          surcharge25: '',
          sucharge2: '',
          miscellaneous: '',
          totalPayment: '',
          remarks: '',
          frequency: 'annual',
          garbageCollection: '',
          polluters: '',
          Occupation: '',
          Other: '',
        });
        setShowForm(false);
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error('Error: ' + errorData.message, { position: 'top-right' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while submitting the form.', { position: 'top-right' });
    }
  };

  const handleEditRecord = (record: PaymentRecord) => {
    setEditRecord(record);
  };

  const handleEditFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;

    // Build a payload that merges in the permits array
    const payload = {
      ...editRecord,
      permits: selectedPermits.map(p => ({
        mayorPermitId: p.mayorPermitId,
        amount: parseFloat(p.amount) || 0
      }))
    };

    try {
      const res = await fetch(
        `${API_URL}/api/business-record/${editRecord.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        }
      );
      if (res.ok) {
        toast.success('Record updated successfully!', {
          position: 'top-right',
          autoClose: 3000
        });
        setEditRecord(null);
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error('Error: ' + errorData.message, {
          position: 'top-right'
        });
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Failed to update record.', {
        position: 'top-right'
      });
    }
  };


  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, type, value } = target;
    const newValue = type === 'checkbox' ? target.checked : value;
    setEditRecord((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API_URL}/api/business-record/${recordId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Record deleted successfully!', { position: 'top-right', autoClose: 3000 });
        fetchData();
      } else {
        const err = await res.json();
        toast.error('Error: ' + err.message, { position: 'top-right' });
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record.', { position: 'top-right' });
    }
  };

  const handlePdfPrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Global Print Styles */}
      <style jsx global>{`
            @media print {
              .no-print {
                display: none !important;
              }
              html, body {
                margin: 0;
                padding: 0;
                font-size: 11px;
              }
              .print-container {
                width: 100%;
              }
              table {
                width: 100% !important;
                border-collapse: collapse;
                table-layout: auto;
              }
              table, th, td {
                border: 1px solid #000;
              }
              th, td {
                padding: 6px;
                text-align: left;
                white-space: normal !important;
                word-wrap: break-word;
              }
              td:nth-child(1),
              td:nth-child(2),
              td:nth-child(3) {
                font-size: 13px !important;
                font-weight: 600;
              }
              .overflow-x-auto {
                overflow: visible !important;
              }
              thead {
                position: static !important;
                display: table-header-group;
              }
              tr {
                page-break-inside: avoid;
              }
            }
          `}</style>

      {/* Topbar hidden during print */}
      <div className="no-print">
        <Topbar />
      </div>

      <ToastContainer />

      {/* Back Button */}
      <div className="w-full p-4 no-print">
        <Link
          href={`/businessrecord?barangay=${encodeURIComponent(
            searchParams.get('barangay') || ''
          )}`}
          className="inline-flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200 ease-in-out"
        >
          &larr; Back to Business Records
        </Link>
      </div>

      <div className="w-[95%] mx-auto my-8 print-container">
        {/* Header / Logo */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Image src="/Logo1.png" alt="Logo" width={180} height={60} className="object-contain" />
          </div>
          <div>
            <Image src="/maasenso.png" alt="Maasenso Logo" width={180} height={60} className="object-contain" />
          </div>
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
                      value={tempOwnerInfo?.applicantName || ''}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.applicantName}</span>
                  )}
                  {editingFields.applicantName ? (
                    <button onClick={() => saveField('applicantName')} className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing('applicantName')} className="ml-2 no-print">
                      <FaEdit />
                    </button>
                  )}
                </div>
                <label className="block text-sm font-semibold text-gray-700 mt-4">
                  Address:
                </label>
                <div className="flex items-center border-b border-gray-400 py-1">
                  {editingFields.address ? (
                    <input
                      type="text"
                      name="address"
                      value={tempOwnerInfo?.address || ''}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.address}</span>
                  )}
                  {editingFields.address ? (
                    <button onClick={() => saveField('address')} className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing('address')} className="ml-2 no-print">
                      <FaEdit />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-semibold text-gray-700">
                  Name of Business:
                </label>
                <div className="flex items-center border-b border-gray-400 py-1">
                  {editingFields.businessName ? (
                    <input
                      type="text"
                      name="businessName"
                      value={tempOwnerInfo?.businessName || ''}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.businessName}</span>
                  )}
                  {editingFields.businessName ? (

                    <button onClick={() => saveField('businessName')}
                      className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing('businessName')}
                      className="ml-2 no-print">
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
                      value={tempOwnerInfo?.natureOfBusiness || ''}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.natureOfBusiness}</span>
                  )}
                  {editingFields.natureOfBusiness ? (
                    <button onClick={() => saveField('natureOfBusiness')} className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing('natureOfBusiness')} className="ml-2 no-print">
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
                      value={tempOwnerInfo?.capitalInvestment || ''}
                      onChange={handleOwnerInfoInputChange}
                      className="flex-1 border-none outline-none"
                    />
                  ) : (
                    <span>{ownerInfo.capitalInvestment}</span>
                  )}
                  {editingFields.capitalInvestment ? (
                    <button onClick={() => saveField('capitalInvestment')} className="ml-2 no-print">
                      <FaCheck />
                    </button>
                  ) : (
                    <button onClick={() => startEditing('capitalInvestment')} className="ml-2 no-print">
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

        {/* Buttons for Add Record & Print (hidden in print) */}
        <div className="mb-4 no-print flex justify-between items-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {showForm ? 'Hide Form' : 'Add New Record'}
          </button>
          <button
            onClick={handlePdfPrint}
            className="bg-gray-200 text-gray-700 p-2 rounded hover:bg-gray-300 transition duration-200 ease-in-out"
            title="Print PDF"
          >
            <FaFilePdf size={20} />
          </button>
        </div>

        {/* Table */}
        <div className="w-full sm:rounded-lg border border-gray-200 overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-left text-gray-500">
            <thead className="bg-gray-50">
              <tr>
                {columnGroups.map(group => (
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
                {columnGroups.map(group =>
                  group.columns.map(col => (
                    <th
                      key={col.key}
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
              {currentRecords.map(record => {
                const delinquent = isRecordDelinquent(record);
                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-gray-100 ${delinquent ? 'bg-red-300' : 'odd:bg-white even:bg-gray-50'
                      }`}
                  >
                    {columnGroups.flatMap(group =>
                      group.columns.map(col => {
                        let displayValue: React.ReactNode;
                        if (col.key === 'expiredDate') {
                          displayValue = computePeriodEnd(record.date, record.frequency)
                            .toLocaleDateString();
                        } else {
                          const raw = (record as any)[col.key] ?? '';
                          displayValue = col.format ? col.format(raw) : raw;
                        }

                        const isNoWrap = ['orNo', 'permits', 'Other'].includes(col.key as string);
                        const tdClass = [
                          'px-4 py-2 text-gray-700',
                          isNoWrap ? 'whitespace-nowrap' : 'overflow-hidden whitespace-normal',
                        ].join(' ');

                        return (
                          <td key={`${record.id}-${col.key}`} className={tdClass}>
                            {displayValue}
                          </td>
                        );
                      })
                    )}





                    {/* Actions column */}
                    <td className="px-4 py-2 text-center no-print">
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>


          </table>
        </div>



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
                className={`px-3 py-1 border rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
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

      {/* NEW RECORD MODAL */}
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
                    {[
                      { label: 'Applicant Name', name: 'applicantName', type: 'text' },
                      { label: 'Applicant Address', name: 'applicantAddress', type: 'text' },
                      { label: 'Business Name', name: 'businessName', type: 'text' },
                      { label: 'Nature of Business', name: 'natureOfBusiness', type: 'text' },
                      { label: 'Capital Investment', name: 'capitalInvestment', type: 'number' },
                    ].map((input) => (
                      <div key={input.name}>
                        <label className="block font-medium text-gray-700">{input.label}</label>
                        <input
                          type="text"
                          name="totalPayment"
                          value={(formData as any).totalPayment}
                          readOnly
                          className="border p-2 w-full bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                    ))}
                  </div>
                  <hr className="my-4" />
                </>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Year', name: 'year', type: 'text' },
                  { label: 'Date', name: 'date', type: 'date' },
                  { label: 'Gross', name: 'gross', type: 'text' },
                  { label: 'OR No.', name: 'orNo', type: 'text' },
                  { label: 'BUS TAX', name: 'busTax', type: 'text' },
                  { label: "Mayor's Permit", name: 'mayorsPermit', type: 'text' },
                  { label: 'Sanitary Inps', name: 'sanitaryInps', type: 'text' },
                  { label: 'Police Clearance', name: 'policeClearance', type: 'text' },
                  { label: 'Barangay Clearance', name: 'barangayClearance', type: 'text' },
                  { label: 'Zoning Clearance', name: 'zoningClearance', type: 'text' },
                  { label: 'Tax Clearance', name: 'taxClearance', type: 'text' },
                  { label: 'Garbage', name: 'garbage', type: 'text' },
                  { label: 'Verification', name: 'verification', type: 'text' },
                  { label: 'Weight & Mass', name: 'weightAndMass', type: 'text' },
                  { label: 'Health Clearance', name: 'healthClearance', type: 'text' },
                  { label: 'SEC Fee', name: 'secFee', type: 'text' },
                  { label: 'MENRO', name: 'menro', type: 'text' },
                  { label: 'Doc Tax', name: 'docTax', type: 'text' },
                  { label: "Egg's Fee", name: 'eggsFee', type: 'text' },
                  { label: 'Market Certification', name: 'marketCertification', type: 'text' },
                  { label: '25% Surcharge', name: 'surcharge25', type: 'text' },
                  { label: '2% Month', name: 'sucharge2', type: 'text' },
                  { label: 'Garbage Collection', name: 'garbageCollection', type: 'text' },
                  { label: 'Polluters', name: 'polluters', type: 'text' },
                  { label: 'Occupation', name: 'Occupation', type: 'text' },
                  { label: 'Other', name: 'Other', type: 'textarea' },
                  { label: 'Miscellaneous', name: 'miscellaneous', type: 'text' },
                  { label: 'Total Payment', name: 'totalPayment', type: 'text', readOnly: true },
                  { label: 'Remarks', name: 'remarks', type: 'text' },
                  { label: 'Frequency', name: 'frequency', type: 'select' },
                ].map((input) => (
                  <div key={input.name}>
                    <label className="block font-medium text-gray-700">{input.label}</label>

                    {/*** Inject this check first ***/}
                    {input.name === 'totalPayment' ? (
                      <input
                        type="text"
                        name="totalPayment"
                        value={(formData as any).totalPayment}
                        readOnly
                        className="border p-2 w-full bg-gray-100 cursor-not-allowed"
                      />
                    ) : input.type === 'select' ? (
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
                    ) : input.type === 'textarea' ? (
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
              {/* ─── Mayor’s Permits & Fees ───────────────────────────────── */}
              <h3 className="text-2xl font-semibold my-4">Mayor’s Permits & Fees</h3>
              <Select
                isMulti
                options={mpOptions}
                value={mpOptions.filter(o =>
                  selectedPermits.some(p => p.mayorPermitId === o.value)
                )}
                onChange={opts => handlePermitsChange(opts as MultiValue<MPOption>)}
                className="w-full mb-4"
              />
              {selectedPermits.map(p => {
                const label = mpOptions.find(o => o.value === p.mayorPermitId)?.label ?? '';
                return (
                  <div key={p.mayorPermitId} className="flex items-center mb-2 space-x-4">
                    <span className="w-1/2">{label}</span>
                    <input
                      type="number"
                      min="0"
                      value={p.amount}
                      onChange={e => handlePermitAmountChange(p.mayorPermitId, e.target.value)}
                      placeholder="Amount"
                      className="w-1/4 p-2 border rounded"
                    />
                  </div>
                );
              })}

              <div className="mt-4 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ───────────────────────────────────────────────────────────── */}
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

              {/* Existing grid of inputs for editing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Year', name: 'year', type: 'text' },
                  { label: 'Date', name: 'date', type: 'date' },
                  { label: 'Gross', name: 'gross', type: 'text' },
                  { label: 'OR No.', name: 'orNo', type: 'text' },
                  { label: 'BUS TAX', name: 'busTax', type: 'text' },
                  { label: "Mayor's Permit", name: 'mayorsPermit', type: 'text' },
                  { label: 'Sanitary Inps', name: 'sanitaryInps', type: 'text' },
                  { label: 'Police Clearance', name: 'policeClearance', type: 'text' },
                  { label: 'Barangay Clearance', name: 'barangayClearance', type: 'text' },
                  { label: 'Zoning Clearance', name: 'zoningClearance', type: 'text' },
                  { label: 'Tax Clearance', name: 'taxClearance', type: 'text' },
                  { label: 'Garbage', name: 'garbage', type: 'text' },
                  { label: 'Verification', name: 'verification', type: 'text' },
                  { label: 'Weight & Mass', name: 'weightAndMass', type: 'text' },
                  { label: 'Health Clearance', name: 'healthClearance', type: 'text' },
                  { label: 'SEC Fee', name: 'secFee', type: 'text' },
                  { label: 'MENRO', name: 'menro', type: 'text' },
                  { label: 'Doc Tax', name: 'docTax', type: 'text' },
                  { label: "Egg's Fee", name: 'eggsFee', type: 'text' },
                  { label: 'Market Certification', name: 'marketCertification', type: 'text' },
                  { label: '25% Surcharge', name: 'surcharge25', type: 'text' },
                  { label: '2% Month', name: 'sucharge2', type: 'text' },
                  { label: 'Miscellaneous', name: 'miscellaneous', type: 'text' },
                  { label: 'Garbage Collection', name: 'garbageCollection', type: 'text' },
                  { label: 'Polluters', name: 'polluters', type: 'text' },
                  { label: 'Occupation', name: 'Occupation', type: 'text' },
                  { label: 'Other', name: 'Other', type: 'textarea' },
                  { label: 'Total Payment', name: 'totalPayment', type: 'text' },
                  { label: 'Remarks', name: 'remarks', type: 'text' },
                  { label: 'Frequency', name: 'frequency', type: 'select' },
                  { label: 'Renewed', name: 'renewed', type: 'checkbox' },
                ].map((input) => (
                  <div key={input.name}>
                    <label className="block font-medium text-gray-700">{input.label}</label>

                    {/* Total Payment should be read-only */}
                    {input.name === 'totalPayment' ? (
                      <input
                        type="text"
                        name="totalPayment"
                        value={(editRecord as any).totalPayment || ''}
                        readOnly
                        disabled
                        className="border p-2 w-full bg-gray-100 cursor-not-allowed"
                      />
                    ) : input.type === 'select' ? (
                      <select
                        name={input.name}
                        value={(editRecord as any)[input.name] || ''}
                        onChange={handleEditInputChange}
                        className="border p-2 w-full"
                      >
                        <option value="quarterly">Quarterly</option>
                        <option value="semi-annual">Semi-Annual</option>
                        <option value="annual">Annual</option>
                      </select>
                    ) : input.type === 'checkbox' && input.name === 'renewed' ? (
                      <input
                        type="checkbox"
                        name={input.name}
                        checked={(editRecord as any)[input.name] || false}
                        onChange={handleEditInputChange}
                        className="border p-2"
                        disabled={
                          new Date() < computeRenewalDueDate(
                            (editRecord as any).date,
                            (editRecord as any).frequency
                          )
                        }
                        title={
                          new Date() < computeRenewalDueDate(
                            (editRecord as any).date,
                            (editRecord as any).frequency
                          )
                            ? 'Cannot renew until expired.'
                            : ''
                        }
                      />
                    ) : input.type === 'date' ? (
                      <input
                        type="date"
                        name={input.name}
                        value={editRecord?.date ? editRecord.date.split('T')[0] : ''}
                        onChange={handleEditInputChange}
                        className="border p-2 w-full"
                      />
                    ) : input.type === 'textarea' ? (
                      <textarea
                        name={input.name}
                        value={(editRecord as any)[input.name] || ''}
                        onChange={handleEditInputChange}
                        className="border p-2 w-full"
                      />
                    ) : (
                      <input
                        type={input.type}
                        name={input.name}
                        value={(editRecord as any)[input.name] || ''}
                        onChange={handleEditInputChange}
                        className="border p-2 w-full"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* ─── Mayor’s Permits & Fees (Edit) ─────────────────────────── */}
              <h3 className="text-2xl font-semibold my-4">Mayor’s Permits & Fees</h3>
              <div className="mb-4">
                <Select
                  isMulti
                  options={mpOptions}
                  value={mpOptions.filter(o =>
                    selectedPermits.some(p => p.mayorPermitId === o.value)
                  )}
                  onChange={opts =>
                    handlePermitsChange(opts as MultiValue<MPOption>)
                  }
                  placeholder="Select permits…"
                  className="w-full"
                />
              </div>
              {selectedPermits.map(p => {
                const label =
                  mpOptions.find(o => o.value === p.mayorPermitId)?.label || '';
                return (
                  <div
                    key={p.mayorPermitId}
                    className="flex items-center mb-2 space-x-4"
                  >
                    <span className="w-1/2">{label}</span>
                    <input
                      type="number"
                      min="0"
                      value={p.amount}
                      onChange={e =>
                        handlePermitAmountChange(p.mayorPermitId, e.target.value)
                      }
                      placeholder="Amount"
                      className="w-1/4 p-2 border rounded"
                    />
                  </div>
                );
              })}
              {/* ───────────────────────────────────────────────────────────── */}

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

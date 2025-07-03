// components/BusinessRecordForm.tsx
"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import Select, { MultiValue } from "react-select";
import { toast } from "react-toastify";
import { BusinessRecord } from "@/types/BusinessRecord";

interface BusinessRecordFormProps {
  onSubmitSuccess?: (record: Partial<BusinessRecord>) => void;
  record?: Partial<BusinessRecord>;
  mode?: "create" | "edit";
  initialApplicantName?: string;
  initialApplicantAddress?: string;
  initialBusinessName?: string;
  initialBarangay?: string;
}

interface MPOption { value: number; label: string }
interface SelectedPermit { mayorPermitId: number; amount: string }

const STEP_TITLES = [
  "Applicant Details",
  "Records",
  "Charge & Fees",
  "Mayors Permits",
  "Additional",
  "Surcharges",
  "Totals",
];

export default function BusinessRecordForm({
  onSubmitSuccess,
  record,
  mode = "create",
  initialApplicantName = "",
  initialApplicantAddress = "",
  initialBusinessName = "",
  initialBarangay = "",
}: BusinessRecordFormProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // ─── Wizard State ───────────────────────────────────────────
  const [step, setStep] = useState(0);
  const maxStep = STEP_TITLES.length - 1;
  const progressPct = (step / maxStep) * 100 + "%";

  // ─── MP Options ─────────────────────────────────────────────
  const [mpOptions, setMpOptions] = useState<MPOption[]>([]);
  const [selectedPermits, setSelectedPermits] = useState<SelectedPermit[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/business-record/mp`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { id: number; name: string }[]) =>
        setMpOptions(data.map((mp) => ({ value: mp.id, label: mp.name })))
      )
      .catch(() => toast.error("Could not load permit options"));
  }, [API_URL]);

  useEffect(() => {
    if (mode === "edit" && (record as any)?.permits) {
      const perms = (record as any).permits as Array<{
        id: number;
        BusinessRecordPermit: { amount: number };
      }>;
      setSelectedPermits(
        perms.map((p) => ({
          mayorPermitId: p.id,
          amount: String(p.BusinessRecordPermit.amount),
        }))
      );
    }
  }, [record, mode]);

  // ─── MP Handlers ───────────────────────────────────────────
  const handlePermitsChange = (opts: MultiValue<MPOption>) => {
    setSelectedPermits(
      opts.map((o) => {
        const existing = selectedPermits.find((p) => p.mayorPermitId === o.value);
        return existing || { mayorPermitId: o.value, amount: "" };
      })
    );
  };

  const handlePermitAmountChange = (permitId: number, amount: string) => {
    setSelectedPermits((old) =>
      old.map((p) =>
        p.mayorPermitId === permitId ? { ...p, amount } : p
      )
    );
  };

  // ─── Field Groups ──────────────────────────────────────────
  const applicantGroup = [
    { label: "Applicant Name", name: "applicantName", type: "text" },
    { label: "Applicant Address", name: "applicantAddress", type: "text" },
    { label: "Business Name", name: "businessName", type: "text" },
    { label: "Nature of Business", name: "natureOfBusiness", type: "text" },
    { label: "Capital Investment", name: "capitalInvestment", type: "number" },
  ];
  const renewalGroup = [
    { label: "Renewal Frequency", name: "frequency", type: "select" },
  ];
  const recordGroup = [
    { label: "Year", name: "year", type: "number" },
    { label: "Date", name: "date", type: "date" },
    { label: "Gross", name: "gross", type: "text" },
    { label: "OR No.", name: "orNo", type: "text" },
  ];
  const feesGroup = [
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
  ];
  const additionalGroup = [
    { label: "Garbage Collection", name: "garbageCollection", type: "text" },
    { label: "Occupation", name: "Occupation", type: "text" },
    { label: "Polluters", name: "polluters", type: "text" },
    { label: "Miscellaneous", name: "miscellaneous", type: "text" },
  ];
  const surchargesGroup = [
    { label: "25% Surcharge", name: "surcharge25", type: "text" },
    { label: "2% Month", name: "sucharge2", type: "text" },
  ];
  const totalsGroup = [
    { label: "Total Payment", name: "totalPayment", type: "text" },
    { label: "Remarks", name: "remarks", type: "text" },
    { label: "Other", name: "Other", type: "textarea" },

  ];

  // ─── Helpers ───────────────────────────────────────────────
  const parseDate = (d: string) => {
    if (d.includes("-")) return d;
    const [day, month, year] = d.split("/");
    const dt = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return dt.toISOString().split("T")[0];
  };
  const parseNum = (v: string) => parseFloat(v.replace(/,/g, ""));


  const getInit = (): Record<string, string> => {
    const rec = record || {};
    if (mode === "edit") {
      return {
        applicantName: (rec.applicantName as string) || initialApplicantName,
        applicantAddress: (rec.applicantAddress as string) || initialApplicantAddress,
        businessName: (rec.businessName as string) || initialBusinessName,
        natureOfBusiness: (rec.natureOfBusiness as string) || "",
        capitalInvestment: rec.capitalInvestment != null ? String(rec.capitalInvestment) : "",
        frequency: rec.frequency ? String(rec.frequency) : "annual",
        renewed: rec.renewed ? "true" : "false",
        year: rec.year ? String(rec.year) : String(new Date().getFullYear()),
        date: rec.date ? parseDate(rec.date as string) : "",
        gross: rec.gross ? String(rec.gross) : "",
        orNo: rec.orNo || "",

        // fees...
        busTax: rec.busTax ? String(rec.busTax) : "",
        mayorsPermit: rec.mayorsPermit ? String(rec.mayorsPermit) : "",
        sanitaryInps: rec.sanitaryInps ? String(rec.sanitaryInps) : "",
        policeClearance: rec.policeClearance ? String(rec.policeClearance) : "",
        barangayClearance: rec.barangayClearance ? String(rec.barangayClearance) : "",
        zoningClearance: rec.zoningClearance ? String(rec.zoningClearance) : "",
        taxClearance: rec.taxClearance ? String(rec.taxClearance) : "",
        garbage: rec.garbage ? String(rec.garbage) : "",
        verification: rec.verification ? String(rec.verification) : "",
        weightAndMass: rec.weightAndMass ? String(rec.weightAndMass) : "",
        healthClearance: rec.healthClearance ? String(rec.healthClearance) : "",
        secFee: rec.secFee ? String(rec.secFee) : "",
        menro: rec.menro ? String(rec.menro) : "",
        docTax: rec.docTax ? String(rec.docTax) : "",
        eggsFee: rec.eggsFee ? String(rec.eggsFee) : "",
        marketCertification: rec.marketCertification ? String(rec.marketCertification) : "",
        // additional...
        garbageCollection: rec.garbageCollection ? String(rec.garbageCollection) : "",
        Occupation: rec.Occupation ? String(rec.Occupation) : "",
        polluters: rec.polluters ? String(rec.polluters) : "",
        // surcharges...
        surcharge25: rec.surcharge25 ? String(rec.surcharge25) : "",
        sucharge2: rec.sucharge2 ? String(rec.sucharge2) : "",
        // totals...
        totalPayment: rec.totalPayment ? String(rec.totalPayment) : "",
        remarks: rec.remarks || "",
        Other: rec.Other ? String(rec.Other) : "",
        miscellaneous: rec.miscellaneous ? String(rec.miscellaneous) : "",
        barangay: initialBarangay || "",
      };
    }
    // create mode
    return {
      applicantName: initialApplicantName,
      applicantAddress: initialApplicantAddress,
      businessName: initialBusinessName,
      natureOfBusiness: "",
      capitalInvestment: "",
      frequency: "annual",
      renewed: "false",
      year: String(new Date().getFullYear()),
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
      garbageCollection: "",
      Occupation: "",
      polluters: "",
      surcharge25: "",
      sucharge2: "",
      totalPayment: "",
      remarks: "",
      Other: "",
      miscellaneous: "",
      barangay: initialBarangay || "",
    };
  };

  const [formData, setFormData] = useState<Record<string, string>>(getInit());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFormData(getInit());
  }, [record]);

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const t = e.target;
    const v = t.type === "checkbox" && "checked" in t ? (t.checked ? "true" : "false") : t.value;
    setFormData((p) => ({ ...p, [t.name]: v }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    const TOTAL_STEPS = STEP_TITLES.length;
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      setBusy(false); // reset busy in case of step skip
      return;
    }

    // Validate required fields
    const required =
      mode === "edit"
        ? ["applicantName", "applicantAddress", "businessName", "capitalInvestment", "frequency"]
        : ["applicantName", "applicantAddress", "businessName", "year", "date", "frequency"];
    const missing = required.find((f) => !formData[f]?.trim());
    if (missing) {
      toast.warning(`Please fill out the ${missing} field.`);
      setBusy(false);
      return;
    }

    // Prepare payload
    const payload: Record<string, any> = {
      renewed: formData.renewed === "true",
      barangay: formData.barangay, // ✅ include barangay
      permits: selectedPermits.map((p) => ({
        mayorPermitId: p.mayorPermitId,
        amount: parseNum(p.amount),
      })),
    };
    // **Always include gross** (even if empty → 0)
    payload.gross = parseNum(formData.gross || "0");
    console.log("🚀 submitting payload:", payload);
    const textSet = new Set([
      "applicantName", "applicantAddress", "businessName",
      "natureOfBusiness", "date", "frequency", "orNo",
      "remarks", "Other"
    ]);

    Object.entries(formData).forEach(([k, v]) => {
      if (k === "gross" || k === "renewed") return;  // already handled
      if (v === undefined || v === "") return;       // truly absent
      if (textSet.has(k)) payload[k] = v;
      else if (k === "year") payload.year = parseInt(v, 10);
      else payload[k] = parseNum(v);
    });

    // ✅ Define URL and Method
    const url =
      mode === "edit" && record?.id
        ? `${API_URL}/api/business-record/${record.id}`
        : `${API_URL}/api/business-record`;

    const method = mode === "edit" ? "PUT" : "POST";

    // ✅ Submit and redirect
    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await r.json();

      if (!r.ok) {
        toast.error(`Error: ${json.message}`);
      } else {
        toast.success(mode === "edit" ? "Updated!" : "Created!");

        // Redirect fast after success
        onSubmitSuccess?.({
          ...json.record,
          barangay: formData.barangay,
        });
      }
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Submission failed.");
    } finally {
      setBusy(false);
    }
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

  // ────────────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
      <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="p-10 sm:p-12">
          {/* Progress bar */}
          <div className="relative mb-10">
            <div className="grid grid-cols-7 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-1 bg-blue-600 col-span-full transition-all duration-300 ease-in-out"
                style={{ gridColumnEnd: `span ${step + 1}` }}
              />
            </div>
            <div className="relative flex justify-between mt-4">
              {STEP_TITLES.map((title, i) => (
                <div key={i} className="flex flex-col items-center text-center w-full">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold ${i <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {i + 1}
                  </div>
                  <span className="mt-2 text-sm text-gray-700">{title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form className="space-y-10">

            {/* Step 0: Applicant */}
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {applicantGroup.map((inp) => (
                  <div key={inp.name} className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-700">{inp.label}</label>
                    <input
                      type={inp.type}
                      name={inp.name}
                      value={formData[inp.name] || ""}
                      onChange={onChange}
                      className="w-full px-5 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    />
                  </div>
                ))}
                {renewalGroup.map((inp) => (
                  <div key={inp.name} className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-700">{inp.label}</label>
                    <select
                      name={inp.name}
                      value={formData[inp.name] || ""}
                      onChange={onChange}
                      className="w-full px-5 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    >
                      <option value="quarterly">Quarterly</option>
                      <option value="semi-annual">Semi-Annual</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Step 1: Record */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {recordGroup.map((inp) => (
                  <div key={inp.name} className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-700">{inp.label}</label>
                    <input
                      type={inp.type}
                      name={inp.name}
                      value={formData[inp.name] || ""}
                      onChange={onChange}
                      className="w-full px-5 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Fees */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {feesGroup.map((inp) => (
                  <div key={inp.name} className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-700">{inp.label}</label>
                    <input
                      type={inp.type}
                      name={inp.name}
                      value={formData[inp.name] || ""}
                      onChange={onChange}
                      className="w-full px-5 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Permits */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Section Label */}
                <label className="block text-gray-700 font-semibold">
                  Search & Add Mayors Permits
                </label>

                {/* Multi-select with search */}
                <Select
                  isMulti
                  options={mpOptions}
                  value={mpOptions.filter(o =>
                    selectedPermits.some(p => p.mayorPermitId === o.value)
                  )}
                  onChange={opts => handlePermitsChange(opts as MultiValue<MPOption>)}
                  placeholder="Type to search permits..."
                  className="mb-2"
                  classNamePrefix="react-select"
                  styles={{
                    control: base => ({ ...base, borderRadius: '0.5rem', padding: '2px' }),
                  }}
                />

                {/* Only show table once at least one permit is selected */}
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
                        {selectedPermits.map(p => {
                          const label = mpOptions.find(o => o.value === p.mayorPermitId)?.label || "";
                          return (
                            <tr key={p.mayorPermitId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {label}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  value={p.amount}
                                  onChange={e => handlePermitAmountChange(p.mayorPermitId, e.target.value)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPermits(old =>
                                      old.filter(item => item.mayorPermitId !== p.mayorPermitId)
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
            )}

            {/* Step 4: Additional */}
            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {additionalGroup.map((inp) => (
                  <div key={inp.name} className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-700">{inp.label}</label>
                    <input
                      type={inp.type}
                      name={inp.name}
                      value={formData[inp.name] || ""}
                      onChange={onChange}
                      className="w-full px-5 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Step 5: Surcharges */}
            {step === 5 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {surchargesGroup.map((inp) => (
                  <div key={inp.name} className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-700">{inp.label}</label>
                    <input
                      type={inp.type}
                      name={inp.name}
                      value={formData[inp.name] || ""}
                      onChange={onChange}
                      className="w-full px-5 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Step 6: Totals */}
            {step === 6 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {totalsGroup.map((inp) => (
                  <div key={inp.name} className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-700">
                      {inp.label}
                    </label>

                    {inp.name === "totalPayment" ? (
                      <input
                        type="text"
                        name="totalPayment"
                        value={formData.totalPayment || ""}
                        readOnly
                        className="w-full px-5 py-3 text-base border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed"
                      />
                    ) : inp.type === "textarea" ? (
                      <textarea
                        name={inp.name}
                        value={formData[inp.name] || ""}
                        onChange={onChange}
                        className="w-full px-5 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                      />
                    ) : (
                      <input
                        type={inp.type}
                        name={inp.name}
                        value={formData[inp.name] || ""}
                        onChange={onChange}
                        className="w-full px-5 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="px-8 py-3 text-base border border-gray-400 text-gray-700 rounded-xl hover:bg-gray-100 transition-all"
                >
                  Previous
                </button>
              ) : (
                <div />
              )}

              {step < maxStep ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(s + 1, maxStep))}
                  className="px-8 py-3 text-base bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit} // manually call it
                  disabled={busy}
                  className="px-8 py-3 text-base bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
                >
                  {mode === "edit" ? "Update" : "Submit"}
                </button>
              )}

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}  
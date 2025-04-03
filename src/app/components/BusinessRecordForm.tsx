'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-toastify';
import { BusinessRecord } from '@/types/BusinessRecord';

interface BusinessRecordFormProps {
  onSubmitSuccess?: (record: BusinessRecord) => void;
  record?: Partial<BusinessRecord>;
  mode?: 'create' | 'edit';
  initialApplicantName?: string;
  initialApplicantAddress?: string;
  initialBusinessName?: string;
}

const BusinessRecordForm: React.FC<BusinessRecordFormProps> = ({
  onSubmitSuccess,
  record,
  mode = 'create',
  initialApplicantName = '',
  initialApplicantAddress = '',
  initialBusinessName = '',
}) => {
  // In edit mode, only show the basic applicant fields.
  const editFields = ['applicantName', 'applicantAddress', 'businessName', 'capitalInvestment'];

  // Build the complete initial state.
  // When in create mode, all fields are included and grouped.
  const getInitialState = (): Record<string, string> => {
    const rec = record || {};
    if (mode === 'edit') {
      return {
        applicantName:
          (rec.applicantName as string) ||
          (rec.applicant && (rec as any).applicant.applicantName) ||
          initialApplicantName,
        applicantAddress:
          (rec.applicantAddress as string) ||
          (rec.applicant && (rec as any).applicant.applicantAddress) ||
          initialApplicantAddress,
        businessName:
          (rec.businessName as string) ||
          (rec.applicant && (rec as any).applicant.businessName) ||
          initialBusinessName,
        capitalInvestment: rec.capitalInvestment
          ? String(rec.capitalInvestment)
          : rec.applicant && (rec as any).applicant.capitalInvestment
          ? String((rec as any).applicant.capitalInvestment)
          : '',
      };
    }
    return {
      applicantName:
        (rec.applicantName as string) ||
        (rec.applicant && (rec as any).applicant.applicantName) ||
        initialApplicantName,
      applicantAddress:
        (rec.applicantAddress as string) ||
        (rec.applicant && (rec as any).applicant.applicantAddress) ||
        initialApplicantAddress,
      businessName:
        (rec.businessName as string) ||
        (rec.applicant && (rec as any).applicant.businessName) ||
        initialBusinessName,
      capitalInvestment: rec.capitalInvestment
        ? String(rec.capitalInvestment)
        : rec.applicant && (rec as any).applicant.capitalInvestment
        ? String((rec as any).applicant.capitalInvestment)
        : '',
      year: rec.year ? String(rec.year) : '',
      date: rec.date ? new Date(rec.date as string).toISOString().split('T')[0] : '',
      gross: rec.gross ? String(rec.gross) : '',
      orNo: rec.orNo || '',
      busTax: rec.busTax ? String(rec.busTax) : '',
      mayorsPermit: rec.mayorsPermit ? String(rec.mayorsPermit) : '',
      sanitaryInps: rec.sanitaryInps ? String(rec.sanitaryInps) : '',
      policeClearance: rec.policeClearance ? String(rec.policeClearance) : '',
      taxClearance: rec.taxClearance ? String(rec.taxClearance) : '',
      garbage: rec.garbage ? String(rec.garbage) : '',
      verification: rec.verification ? String(rec.verification) : '',
      weightAndMass: rec.weightAndMass ? String(rec.weightAndMass) : '',
      healthClearance: rec.healthClearance ? String(rec.healthClearance) : '',
      secFee: rec.secFee ? String(rec.secFee) : '',
      menro: rec.menro ? String(rec.menro) : '',
      docTax: rec.docTax ? String(rec.docTax) : '',
      eggsFee: rec.eggsFee ? String(rec.eggsFee) : '',
      market: rec.market ? String(rec.market) : '',
      marketCertification: rec.marketCertification ? String(rec.marketCertification) : '',
      surcharge25: rec.surcharge25 ? String(rec.surcharge25) : '',
      sucharge2: rec.sucharge2 ? String(rec.sucharge2) : '', // renamed field
      miscellaneous: rec.miscellaneous ? String(rec.miscellaneous) : '',
      totalPayment: rec.totalPayment ? String(rec.totalPayment) : '',
      remarks: rec.remarks || '',
    };
  };

  const [formData, setFormData] = useState<Record<string, string>>(getInitialState());
  const [submitting, setSubmitting] = useState(false);

  // Update formData if the record prop changes.
  useEffect(() => {
    setFormData(getInitialState());
  }, [record]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    // Validate required fields.
    const requiredFields =
      mode === 'edit'
        ? ['applicantName', 'applicantAddress', 'businessName', 'capitalInvestment']
        : ['applicantName', 'applicantAddress', 'businessName', 'year', 'date'];
    const emptyField = requiredFields.find((field) => !formData[field]?.trim());
    if (emptyField) {
      toast.warning(`Please fill out the ${emptyField} field.`);
      setSubmitting(false);
      return;
    }

    // Convert fields that need to be numeric.
    const preparedData = {
      ...formData,
      capitalInvestment: formData.capitalInvestment ? parseInt(formData.capitalInvestment, 10) : 0,
      ...(mode !== 'edit' && { year: formData.year ? parseInt(formData.year, 10) : 0 }),
    };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.107:3000';
      const url =
        mode === 'edit' && record?.id
          ? `${API_URL}/api/business-record/${record.id}`
          : `${API_URL}/api/business-record`;
      const method = mode === 'edit' && record?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preparedData),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(`Error: ${err.message}`);
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      toast.success(
        mode === 'edit'
          ? 'Record updated successfully!'
          : 'Record created successfully!'
      );
      setTimeout(() => {
        onSubmitSuccess?.(data.record);
      }, 100);
    } catch (error) {
      console.error('Submission Error:', error);
      toast.error('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  // Define field groups for clarity.
  const applicantGroup = [
    { label: 'Applicant Name', name: 'applicantName', type: 'text' },
    { label: 'Applicant Address', name: 'applicantAddress', type: 'text' },
    { label: 'Business Name', name: 'businessName', type: 'text' },
    { label: 'Capital Investment', name: 'capitalInvestment', type: 'number' },
  ];

  const recordGroup = [
    { label: 'Year', name: 'year', type: 'number' },
    { label: 'Date', name: 'date', type: 'date' },
    { label: 'Gross', name: 'gross', type: 'text' },
    { label: 'OR No.', name: 'orNo', type: 'text' },
  ];

  const feesGroup = [
    { label: 'BUS TAX', name: 'busTax', type: 'text' },
    { label: "Mayor's Permit", name: 'mayorsPermit', type: 'text' },
    { label: 'Sanitary Inps', name: 'sanitaryInps', type: 'text' },
    { label: 'Police Clearance', name: 'policeClearance', type: 'text' },
    { label: 'Tax Clearance', name: 'taxClearance', type: 'text' },
    { label: 'Garbage', name: 'garbage', type: 'text' },
    { label: 'Verification', name: 'verification', type: 'text' },
    { label: 'Weight & Mass', name: 'weightAndMass', type: 'text' },
    { label: 'Health Clearance', name: 'healthClearance', type: 'text' },
    { label: 'SEC Fee', name: 'secFee', type: 'text' },
    { label: 'MENRO', name: 'menro', type: 'text' },
    { label: 'Doc Tax', name: 'docTax', type: 'text' },
    { label: "Egg's Fee", name: 'eggsFee', type: 'text' },
    { label: 'Market', name: 'market', type: 'text' },
    { label: 'Market Certification', name: 'marketCertification', type: 'text' },
  ];

  const surchargesGroup = [
    { label: '25% Surcharge', name: 'surcharge25', type: 'text' },
    { label: '2% Month', name: 'sucharge2', type: 'text' },
  ];

  const totalsGroup = [
    { label: 'Total Payment', name: 'totalPayment', type: 'text' },
    { label: 'Remarks', name: 'remarks', type: 'text' },
    { label: 'Miscellaneous', name: 'miscellaneous', type: 'text' },
  ];

  // In edit mode, only render the basic applicant fields.
  const fieldsToRender = mode === 'edit'
    ? applicantGroup
    : [
        ...applicantGroup,
        { groupLabel: 'Record Details', fields: recordGroup },
        { groupLabel: 'Fees & Clearances', fields: feesGroup },
        { groupLabel: 'Surcharges', fields: surchargesGroup },
        { groupLabel: 'Totals & Additional Info', fields: totalsGroup },
      ];

  return (
    <div className="max-w-5xl mx-auto my-8 p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">
        {mode === 'edit' ? 'Edit Business Record' : 'Create Business Record'}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* If in edit mode, render the simple applicant group */}
        {mode === 'edit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applicantGroup.map((input) => (
              <div key={input.name} className="flex flex-col">
                <label className="mb-2 text-lg font-medium text-gray-700">
                  {input.label}
                </label>
                <input
                  type={input.type}
                  name={input.name}
                  value={formData[input.name] || ''}
                  onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Enter ${input.label}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* In create mode, render fields grouped by section */}
        {mode !== 'edit' && (
          <>
            {/* Applicant Details */}
            <h3 className="text-2xl font-semibold my-4">Applicant Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applicantGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">
                    {input.label}
                  </label>
                  <input
                    type={input.type}
                    name={input.name}
                    value={formData[input.name] || ''}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${input.label}`}
                  />
                </div>
              ))}
            </div>

            {/* Record Details */}
            <h3 className="text-2xl font-semibold my-4">Record Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recordGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">
                    {input.label}
                  </label>
                  <input
                    type={input.type}
                    name={input.name}
                    value={formData[input.name] || ''}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${input.label}`}
                  />
                </div>
              ))}
            </div>

            {/* Fees & Clearances */}
            <h3 className="text-2xl font-semibold my-4">Fees & Clearances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feesGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">
                    {input.label}
                  </label>
                  <input
                    type={input.type}
                    name={input.name}
                    value={formData[input.name] || ''}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${input.label}`}
                  />
                </div>
              ))}
            </div>

            {/* Surcharges */}
            <h3 className="text-2xl font-semibold my-4">Surcharges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {surchargesGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">
                    {input.label}
                  </label>
                  <input
                    type={input.type}
                    name={input.name}
                    value={formData[input.name] || ''}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${input.label}`}
                  />
                </div>
              ))}
            </div>

            {/* Totals & Additional Info */}
            <h3 className="text-2xl font-semibold my-4">Totals & Additional Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {totalsGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">
                    {input.label}
                  </label>
                  <input
                    type={input.type}
                    name={input.name}
                    value={formData[input.name] || ''}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${input.label}`}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {mode === 'edit' ? 'Update Record' : 'Submit Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessRecordForm;

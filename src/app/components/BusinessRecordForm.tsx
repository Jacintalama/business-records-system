"use client";

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

// Helper function: Convert a date string from "DD/MM/YYYY" to "YYYY-MM-DD"
// If the string already contains a dash, assume it's in the proper format.
const parseDate = (dateStr: string): string => {
  if (dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  // Create a new Date object then convert to ISO string and split out date part
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return d.toISOString().split('T')[0];
};

const BusinessRecordForm: React.FC<BusinessRecordFormProps> = ({
  onSubmitSuccess,
  record,
  mode = 'create',
  initialApplicantName = '',
  initialApplicantAddress = '',
  initialBusinessName = '',
}) => {
  // Define field groups as arrays of field objects.
  const applicantGroup = [
    { label: 'Applicant Name', name: 'applicantName', type: 'text' },
    { label: 'Applicant Address', name: 'applicantAddress', type: 'text' },
    { label: 'Business Name', name: 'businessName', type: 'text' },
    { label: 'Capital Investment', name: 'capitalInvestment', type: 'number' },
  ];

  // For both create and edit, include renewal frequency.
  const renewalFrequencyGroup = [
    { label: 'Renewal Frequency', name: 'frequency', type: 'select' },
  ];

  // For edit mode, we also show a checkbox for renewed status.
  const renewedField = { label: 'Renewed', name: 'renewed', type: 'checkbox' };

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
    { label: 'Market Certification', name: 'marketCertification', type: 'text' },
  ];

  // Define additionalGroup to avoid error (feel free to update as needed)
  const additionalGroup = [
    { label: 'Garbage Collection', name: 'garbageCollection', type: 'text' },
    { label: 'Polluters', name: 'polluters', type: 'text' },
    { label: 'Occupation', name: 'Occupation', type: 'text' },
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

  // Build the initial state. In edit mode, we include renewal frequency and renewed.
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
        frequency: rec.frequency ? String(rec.frequency) : 'annual',
        renewed: rec.renewed ? String(rec.renewed) : 'false',
        // Convert the stored date using parseDate so the input displays properly
        date: rec.date ? parseDate(rec.date as string) : '',
        gross: rec.gross ? String(rec.gross) : '',
        orNo: rec.orNo || '',
        // Other fields will be added when needed
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
      date: rec.date ? parseDate(rec.date as string) : '',
      gross: rec.gross ? String(rec.gross) : '',
      orNo: rec.orNo || '',
      busTax: rec.busTax ? String(rec.busTax) : '',
      mayorsPermit: rec.mayorsPermit ? String(rec.mayorsPermit) : '',
      sanitaryInps: rec.sanitaryInps ? String(rec.sanitaryInps) : '',
      policeClearance: rec.policeClearance ? String(rec.policeClearance) : '',
      taxClearance: rec.taxClearance ? String(rec.taxClearance) : '',
      garbage: rec.garbage ? String(rec.garbage) : '',
      garbageCollection: rec.garbageCollection ? String(rec.garbageCollection) : '',
      polluters: rec.polluters ? String(rec.polluters) : '',
      Occupation: rec.Occupation ? String(rec.Occupation) : '',
      verification: rec.verification ? String(rec.verification) : '',
      weightAndMass: rec.weightAndMass ? String(rec.weightAndMass) : '',
      healthClearance: rec.healthClearance ? String(rec.healthClearance) : '',
      secFee: rec.secFee ? String(rec.secFee) : '',
      menro: rec.menro ? String(rec.menro) : '',
      docTax: rec.docTax ? String(rec.docTax) : '',
      eggsFee: rec.eggsFee ? String(rec.eggsFee) : '',
      marketCertification: rec.marketCertification ? String(rec.marketCertification) : '',
      surcharge25: rec.surcharge25 ? String(rec.surcharge25) : '',
      sucharge2: rec.sucharge2 ? String(rec.sucharge2) : '',
      miscellaneous: rec.miscellaneous ? String(rec.miscellaneous) : '',
      totalPayment: rec.totalPayment ? String(rec.totalPayment) : '',
      remarks: rec.remarks || '',
      frequency: rec.frequency ? String(rec.frequency) : 'annual',
      renewed: rec.renewed ? String(rec.renewed) : 'false',
    };
  };

  const [formData, setFormData] = useState<Record<string, string>>(getInitialState());
  const [submitting, setSubmitting] = useState(false);

  // Update formData if record prop changes.
  useEffect(() => {
    setFormData(getInitialState());
  }, [record]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    let value: string;
    if ('checked' in target && target.type === "checkbox") {
      value = target.checked ? "true" : "false";
    } else {
      value = target.value;
    }
    setFormData((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const requiredFields =
      mode === 'edit'
        ? ['applicantName', 'applicantAddress', 'businessName', 'capitalInvestment', 'frequency']
        : ['applicantName', 'applicantAddress', 'businessName', 'year', 'date', 'frequency'];
    const emptyField = requiredFields.find((field) => !formData[field]?.trim());
    if (emptyField) {
      toast.warning(`Please fill out the ${emptyField} field.`);
      setSubmitting(false);
      return;
    }

    const preparedData = {
      ...formData,
      capitalInvestment: formData.capitalInvestment ? parseInt(formData.capitalInvestment, 10) : 0,
      ...(mode !== 'edit' && { year: formData.year ? parseInt(formData.year, 10) : 0 }),
      renewed: formData.renewed === "true",
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

  return (
    <div className="max-w-5xl mx-auto my-8 p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">
        {mode === 'edit' ? 'Edit Business Record' : 'Create Business Record'}
      </h2>
      <form onSubmit={handleSubmit}>
        {mode === 'edit' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...applicantGroup, ...renewalFrequencyGroup].map((input) => (
              <div key={input.name} className="flex flex-col">
                <label className="mb-2 text-lg font-medium text-gray-700">
                  {input.label}
                </label>
                {input.type === 'select' ? (
                  <select
                    name={input.name}
                    value={formData[input.name] || ''}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {input.name === 'frequency' && (
                      <>
                        <option value="quarterly">Quarterly</option>
                        <option value="semi-annual">Semi-Annual</option>
                        <option value="annual">Annual</option>
                      </>
                    )}
                  </select>
                ) : input.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    name={input.name}
                    checked={formData[input.name] === "true"}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type={input.type}
                    name={input.name}
                    value={formData[input.name] || ''}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${input.label}`}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-semibold my-4">Applicant Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applicantGroup.filter(f => f.name !== 'renewed').map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">{input.label}</label>
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
              {renewalFrequencyGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">{input.label}</label>
                  <select
                    name={input.name}
                    value={formData[input.name] || ''}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-semibold my-4">Record Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recordGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">{input.label}</label>
                  {input.type === 'date' ? (
                    <input
                      type="date"
                      name={input.name}
                      value={formData[input.name] || ''}
                      onChange={handleChange}
                      className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type={input.type}
                      name={input.name}
                      value={formData[input.name] || ''}
                      onChange={handleChange}
                      className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${input.label}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-semibold my-4">Fees & Clearances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feesGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">{input.label}</label>
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

            <h3 className="text-2xl font-semibold my-4">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {additionalGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">{input.label}</label>
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

            <h3 className="text-2xl font-semibold my-4">Surcharges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {surchargesGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">{input.label}</label>
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

            <h3 className="text-2xl font-semibold my-4">Totals & Additional Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {totalsGroup.map((input) => (
                <div key={input.name} className="flex flex-col">
                  <label className="mb-2 text-lg font-medium text-gray-700">{input.label}</label>
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

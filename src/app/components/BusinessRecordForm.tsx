'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  // Build a complete initial state for every field.
  const getInitialState = (): Record<string, string> => {
    const rec = record || {};
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
      surcharge25: rec.surcharge25 ? String(rec.surcharge25) : '',
      surcharge5: rec.surcharge5 ? String(rec.surcharge5) : '',
      totalPayment: rec.totalPayment ? String(rec.totalPayment) : '',
      remarks: rec.remarks || '',
    };
  };

  const [formData, setFormData] = useState<Record<string, string>>(getInitialState());
  const [submitting, setSubmitting] = useState(false);

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

    // Validate that no field is empty.
    const emptyField = Object.entries(formData).find(([_, value]) => value.trim() === '');
    if (emptyField) {
      toast.warning('Please fill out all fields.');
      setSubmitting(false);
      return;
    }
    
    const preparedData = { ...formData };
    if (!preparedData.applicantId) delete preparedData.applicantId;

    try {
      const url =
        mode === 'edit' && record?.id
          ? `http://localhost:3000/api/business-record/${record.id}`
          : 'http://localhost:3000/api/business-record';
      const method = mode === 'edit' && record?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
      // Delay the callback slightly to allow the toast to render before unmounting
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(getInitialState()).map(([key, _]) => (
            <div key={key} className="flex flex-col">
              <label className="mb-2 text-lg font-medium text-gray-700">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type={key === 'date' ? 'date' : (key === 'capitalInvestment' || key === 'year') ? 'number' : 'text'}
                name={key}
                value={formData[key]}
                onChange={handleChange}
                className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1')}`}
              />
            </div>
          ))}
        </div>
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

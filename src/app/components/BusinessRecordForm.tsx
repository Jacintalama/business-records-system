'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BusinessRecord } from '@/types/BusinessRecord';

// Group the form fields into logical sections
const sections = [
  {
    title: 'Applicant Information',
    fields: [
      { key: 'applicantName', label: 'Name of Applicant:', type: 'text' },
      { key: 'applicantAddress', label: 'Address:', type: 'text' },
    ],
  },
  {
    title: 'Business Information',
    fields: [
      { key: 'businessName', label: 'Name of Business:', type: 'text' },
      { key: 'capitalInvestment', label: 'Capital Investment:', type: 'number' },
      { key: 'year', label: 'Year:', type: 'number' },
      { key: 'date', label: 'Date:', type: 'date' },
      { key: 'gross', label: 'GROSS:', type: 'number' },
      { key: 'orNo', label: 'OR No.:', type: 'text' },
    ],
  },
  {
    title: 'Fees and Clearances',
    fields: [
      { key: 'busTax', label: 'BUS TAX:', type: 'number' },
      { key: 'mayorsPermit', label: "Mayor's Permit:", type: 'number' },
      { key: 'sanitaryInps', label: 'Sanitary Inspection:', type: 'number' },
      { key: 'policeClearance', label: 'Police Clearance:', type: 'number' },
      { key: 'taxClearance', label: 'Tax Clearance:', type: 'number' },
      { key: 'garbage', label: 'Garbage:', type: 'number' },
      { key: 'verification', label: 'Verification:', type: 'number' },
      { key: 'weightAndMass', label: 'Weight & Mass:', type: 'number' },
      { key: 'healthClearance', label: 'Health Clearance:', type: 'number' },
      { key: 'secFee', label: 'SEC Fee:', type: 'number' },
      { key: 'menro', label: 'MENRO:', type: 'number' },
      { key: 'docTax', label: 'Doc Tax:', type: 'number' },
      { key: 'eggsFee', label: "Egg's Fee:", type: 'number' },
      { key: 'market', label: 'Market:', type: 'number' },
    ],
  },
  {
    title: 'Surcharges & Payment',
    fields: [
      { key: 'surcharge25', label: '25% Surcharge:', type: 'number' },
      { key: 'surcharge5', label: '5% Surcharge:', type: 'number' },
      { key: 'totalPayment', label: 'Total Payment:', type: 'number' },
    ],
  },
  {
    title: 'Additional Remarks',
    fields: [
      { key: 'remarks', label: 'Remarks:', type: 'text' },
    ],
  },
];

interface BusinessRecordFormProps {
  onSubmitSuccess?: (newRecord: BusinessRecord) => void;
}

export default function BusinessRecordForm({ onSubmitSuccess }: BusinessRecordFormProps) {
  // Flatten all fields to build the initial state
  const initialState = sections
    .flatMap(section => section.fields)
    .reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});

  const [formData, setFormData] = useState<Record<string, string>>(initialState);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Check for empty fields
    const emptyField = Object.entries(formData).find(([_, value]) => !value.trim());
    if (emptyField) {
      // Find label for the missing field
      const missingKey = emptyField[0];
      let missingLabel = '';
      for (const section of sections) {
        const foundField = section.fields.find(field => field.key === missingKey);
        if (foundField) {
          missingLabel = foundField.label;
          break;
        }
      }
      toast.warning(`Please fill out all fields. Missing: ${missingLabel}`);
      return;
    }

    const payload = { ...formData };

    try {
      const res = await fetch('http://localhost:3000/api/business-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Record created successfully!');
        // Reset form
        setFormData(initialState);

        if (onSubmitSuccess) {
          onSubmitSuccess(data.record);
        }
      } else {
        const err = await res.json();
        toast.error(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error('Submission Error:', error);
      toast.error('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto my-8 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-700">
        Business Record Form
      </h2>
      <form onSubmit={handleSubmit}>
        {sections.map((section, index) => (
          <div key={index} className="mb-8 bg-gray-50 p-4 rounded-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              {section.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map(field => (
                <div key={field.key} className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${field.label.replace(':', '')}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit Record
          </button>
        </div>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

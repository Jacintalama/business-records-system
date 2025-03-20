'use client';

import React, { useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import BusinessRecordForm from './BusinessRecordForm';
import { BusinessRecord } from '@/types/BusinessRecord';

interface AddBusinessRecordFormModalProps {
  onFormSubmitSuccess: (newRecord: BusinessRecord) => void;
}

export default function AddBusinessRecordFormModal({ onFormSubmitSuccess }: AddBusinessRecordFormModalProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center bg-gray-600 hover:bg-gray-700 text-white rounded py-2 px-4 transition"
      >
        <AiOutlinePlus className="mr-2" />
        Add Form
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 overflow-y-auto">
          <div className="relative bg-white shadow-lg rounded max-w-5xl w-full mx-4 my-10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-gray-700 font-bold focus:outline-none"
            >
              &times;
            </button>
            <div className="p-6">
              <BusinessRecordForm
                onSubmitSuccess={(newRecord: BusinessRecord) => {
                  onFormSubmitSuccess(newRecord);
                  setShowForm(false);
                }}
              />
            </div>
          </div>
        </div>

      )}
    </div>
  );
}

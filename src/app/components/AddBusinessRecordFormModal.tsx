'use client';

import React, { useState } from 'react';
import BusinessRecordForm from './BusinessRecordForm';
import { AiOutlinePlus } from 'react-icons/ai';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setShowForm(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white shadow-lg rounded max-w-5xl w-full max-h-[90vh] overflow-y-auto z-50">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-4 text-gray-600 hover:text-gray-800 font-bold text-2xl"
            >
              &times;
            </button>

            <div className="p-6 overflow-y-auto max-h-[85vh]">
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

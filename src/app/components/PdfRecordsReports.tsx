import React from 'react'

const PdfRecordsReports = () => {
    const handlePDFPrint = () => {
        window.print();
      };
    return (
        <button
          onClick={handlePDFPrint}
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition duration-200 ease-in-out"
        >
          Print PDF
        </button>
      );
    };
export default PdfRecordsReports
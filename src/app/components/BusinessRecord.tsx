'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';

// Realistic BusinessOwner type definition
interface BusinessOwner {
  id: number;
  applicantName: string;
  businessName: string;
  applicantAddress: string;
  barangay: string;
}

// Barangays list (consistent with backend)
const barangays = [
  "Malbang", "Nomoh", "Seven Hills", "Pananag", "Daliao", "Colon", 
  "Amsipit", "Bales", "Kamanga", "Kablacan", "Kanalo", 
  "Lumatil", "Lumasal", "Tinoto", "Public Market", "Poblacion", "Kabatiol",
];

export default function BusinessRecord() {
  const [selectedBarangay, setSelectedBarangay] = useState(barangays[0]);
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([]);

  useEffect(() => {
    async function fetchBusinessOwners() {
      try {
        const response = await fetch(`/api/owners?barangay=${encodeURIComponent(selectedBarangay)}`);

        if (response.ok) {
          const data = await response.json();
          setBusinessOwners(data.owners);
        } else {
          setBusinessOwners([]);
        }
      } catch (error) {
        console.error('Error fetching business owners:', error);
        setBusinessOwners([]);
      }
    }

    fetchBusinessOwners();
  }, [selectedBarangay]);

  const handleBarangayChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedBarangay(e.target.value);
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto p-4">
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-semibold">Select Barangay</label>
        <select
          value={selectedBarangay}
          onChange={handleBarangayChange}
          className="w-full p-2 border rounded"
        >
          {barangays.map((barangay) => (
            <option key={barangay} value={barangay}>
              {barangay}
            </option>
          ))}
        </select>
      </div>

      {businessOwners.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 px-4 py-2">Owner Name</th>
                <th className="border border-gray-300 px-4 py-2">Business Name</th>
                <th className="border border-gray-300 px-4 py-2">Address</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businessOwners.map((owner) => (
                <tr key={owner.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{owner.applicantName}</td>
                  <td className="border border-gray-300 px-4 py-2">{owner.businessName}</td>
                  <td className="border border-gray-300 px-4 py-2">{owner.applicantAddress}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Link
                      href={`/records?ownerId=${owner.id}&barangay=${encodeURIComponent(selectedBarangay.toLowerCase())}`}
                      className="text-blue-600 hover:underline"
                    >
                      View Records
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No business owners found for {selectedBarangay}.</p>
      )}
    </div>
  );
}

"use client";
import React, { useState } from 'react';
import { computePeriodEnd } from '../utils/periodUtils';


interface TestRecord {
  label: string;
  record: {
    date: string;
    frequency: 'quarterly' | 'semi-annual' | 'annual';
    renewed: boolean;
  };
}

const TestPeriod = () => {
  const testRecords: TestRecord[] = [
    {
      label: "Quarterly - record created on 04/04/2025 (April 4, 2025)",
      record: { date: "04/04/2025", frequency: "quarterly", renewed: false },
    },
    {
      label: "Semi-Annual - record created on 05/05/2025 (May 5, 2025)",
      record: { date: "05/05/2025", frequency: "semi-annual", renewed: false },
    },
    {
      label: "Annual - record created on 06/06/2025 (June 6, 2025)",
      record: { date: "06/06/2025", frequency: "annual", renewed: false },
    },
  ];

  const [simulatedCurrentDate, setSimulatedCurrentDate] = useState<Date>(new Date());

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Period Utils</h1>
      <p>
        Simulated Current Date:{' '}
        <input
          type="date"
          value={simulatedCurrentDate.toISOString().substring(0, 10)}
          onChange={(e) => setSimulatedCurrentDate(new Date(e.target.value))}
        />
      </p>
      {testRecords.map((test, index) => {
        const periodEnd = computePeriodEnd(test.record.date, test.record.frequency);
        const isDelinquent = simulatedCurrentDate > periodEnd && !test.record.renewed;
        return (
          <div key={index} style={{ marginBottom: '1rem', border: '1px solid gray', padding: '1rem' }}>
            <h2>{test.label}</h2>
            <p>Record Date: {test.record.date}</p>
            <p>Frequency: {test.record.frequency}</p>
            <p>Computed Period End: {periodEnd.toLocaleDateString()}</p>
            <p style={{ color: isDelinquent ? 'red' : 'green' }}>
              Delinquent: {isDelinquent ? "Yes" : "No"}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TestPeriod;

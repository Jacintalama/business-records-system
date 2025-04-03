'use client';

import React, { useState, useEffect } from 'react';
import Skyline from './Skyline'; // Import your Skyline component

export default function Footer() {
  // State for current date/time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update the time every second for dynamic seconds display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // update every second

    return () => clearInterval(interval);
  }, []);

  // Format date in Philippine Standard Time
  const dateString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(currentDateTime);

  // Format time in Philippine Standard Time with seconds
  const timeString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric', // added seconds
    hour12: true,
  }).format(currentDateTime);

  return (
    <footer className="bg-gray-900 text-white w-full pt-8">
      
      {/* Footer Content */}
      <div className="px-4 py-8 flex flex-col md:flex-row justify-between">
        {/* Left side: BRS 2025 and statement */}
        <div className="text-left">
          <h2 className="text-xl font-bold">BRS 2025</h2>
          <p className="text-sm">
            All contents in the public domain unless otherwise stated.
          </p>
        </div>
        {/* Right side: Dynamic date/time */}
        <div className="text-right mt-4 md:mt-0">
          <p className="text-sm">
            {dateString} | {timeString}
          </p>
          <p className="text-sm">Philippine Standard Time</p>
        </div>
      </div>
    </footer>
  );
}

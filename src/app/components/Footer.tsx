'use client';

import React, { useState, useEffect } from 'react';
import Skyline from './Skyline'; // Optional decorative graphic

export default function Footer() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(currentDateTime);

  const timeString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  }).format(currentDateTime);

  const currentYear = currentDateTime.getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-200 w-full">
    

      {/* Flex container with items at the extreme edges */}
      <div className="w-full px-6 py-8 flex justify-between items-start">
        {/* Left edge */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Business Records System
          </h2>
          <p className="text-sm">
            Secure and efficient treasury management for the Municipality of Maasim.
          </p>
          <p className="text-xs mt-4">
            © {currentYear} Municipality of Maasim Treasurer System. All rights reserved.
          </p>
        </div>

        {/* Right edge */}
        <div className="text-right space-y-1">
          <p className="text-sm">{dateString}</p>
          <p className="text-sm">{timeString}</p>
          <p className="text-xs">Philippine Standard Time (UTC+8)</p>
        </div>
      </div>
    </footer>
  );
}

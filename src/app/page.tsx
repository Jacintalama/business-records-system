'use client';

import React from 'react';
import Link from 'next/link';
import { FaFileAlt, FaChartBar } from 'react-icons/fa'; // <-- import the new icon
import NavBar from './components/NavBar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            BUSINESS RECORD SYSTEM
          </h1>
          <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
        </header>

        {/* Grid container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Business Records Card */}
          <Link
            href="/businessrecord"
            className="flex flex-col items-center bg-white rounded shadow p-6 hover:shadow-lg transition"
          >
            <FaFileAlt className="mb-3 text-5xl text-gray-700" />
            <span className="font-semibold text-gray-700">Business Records</span>
          </Link>

          {/* Business Reports Card with a different icon */}
          <Link
            href="/businessreports"
            className="flex flex-col items-center bg-white rounded shadow p-6 hover:shadow-lg transition"
          >
            <FaChartBar className="mb-3 text-5xl text-gray-700" />
            <span className="font-semibold text-gray-700">Business Reports</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

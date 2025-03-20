'use client';

import React from 'react';
import Link from 'next/link';
import { FaFileAlt } from 'react-icons/fa';
import NavBar from './components/NavBar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar (Optional) */}
      {/* 
      <nav className="flex items-center justify-between px-6 py-3 bg-white shadow">
        <div className="font-bold text-lg text-blue-800">eLGU</div>
        <div className="text-green-600 text-lg cursor-pointer">LOGIN</div>
      </nav> 
      */}

      {/* Second Navbar */}
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">BUSINESS RECORD SYSTEM</h1>
          <p className="text-gray-600">Municipality of Maasim, Sarangani</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Clickable Business Records Card that links to /businessrecord */}
          <Link
            href="/businessrecord"
            className="flex flex-col items-center bg-white rounded shadow p-6 hover:shadow-lg transition"
          >
            <FaFileAlt className="mb-3 text-5xl text-gray-700" />
            <span className="font-semibold text-gray-700">Business Records</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

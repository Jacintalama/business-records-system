"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaFileAlt, FaChartBar } from 'react-icons/fa';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Skyline from './components/Skyline';
import Topbar from './components/Topbar';

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [showFooter, setShowFooter] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Get the API URL from environment variables
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          const fullName = `${data.firstName} ${
            data.middleName ? data.middleName + ' ' : ''
          }${data.lastName}`;
          setUserName(fullName || 'User');
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth fetch failed:', err);
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, [API_URL]);

  useEffect(() => {
    const handleScroll = () => {
      setShowFooter(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    // Check on mount:
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to handle navigation on protected links
  const handleProtectedNavigation = (e: React.MouseEvent, path: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      router.push('/auth/login');
    }
  };

  return (
    <div
      className={`flex flex-col min-h-screen bg-gray-50 transition-opacity duration-700 ease-out ${
        pageLoaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Top Bar */}
      <Topbar />

      {/* NavBar */}
      <NavBar />

      {/* Main Content */}
      <main className="flex flex-col flex-1 items-center justify-center max-w-7xl mx-auto px-9 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">
            Business Records System
          </h1>
        </header>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8 justify-items-center">
          <Link
            href="/businessrecord"
            onClick={(e) => handleProtectedNavigation(e, '/businessrecord')}
            className="flex flex-col items-center bg-white rounded shadow p-16 hover:shadow-lg transition"
          >
            <FaFileAlt className="mb-4 text-8xl text-gray-700" />
            <span className="font-semibold text-gray-800 text-xl">
              Business Records
            </span>
          </Link>

          <Link
            href="/businessreports"
            onClick={(e) => handleProtectedNavigation(e, '/businessreports')}
            className="flex flex-col items-center bg-white rounded shadow p-16 hover:shadow-lg transition"
          >
            <FaChartBar className="mb-4 text-8xl text-gray-700" />
            <span className="font-semibold text-gray-800 text-xl">
              Business Reports
            </span>
          </Link>

          
        </div>

        {/* Spacer */}
        <div className="h-[45vh]" />
      </main>

      <Skyline />
      {showFooter && <Footer />}
    </div>
  );
}

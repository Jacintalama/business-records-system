'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const Topbar = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Use the API URL from environment variables or fallback
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.236:3000';

  // Debug log the API_URL when the component mounts
  useEffect(() => {
    console.log('API_URL in Topbar is:', API_URL);
  }, [API_URL]);

  useEffect(() => {
    console.log('Attempting to fetch /api/auth/me from:', `${API_URL}/api/auth/me`);
    async function checkAuth() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });
        console.log('Response status from /api/auth/me:', res.status);
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          const fullName = `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`;
          setUserName(fullName || 'User');
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth error in Topbar:', err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [API_URL]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error in Topbar:', err);
    }
    setIsAuthenticated(false);
    setShowDropdown(false);
    router.push('/');
  };

  return (
    <div className="sticky top-0 bg-white p-4 shadow-md flex justify-between items-center z-50 transition-all duration-300">
      <div className="flex items-center space-x-2">
        {/* Optional logo */}
      </div>

      <div className="relative">
        {loading ? (
          <div>Loading...</div>
        ) : isAuthenticated ? (
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="flex items-center space-x-2 text-blue-600 focus:outline-none"
          >
            <span className="font-medium">Hello, {userName}!</span>
            <svg
              className="w-4 h-4 transform transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        ) : (
          <Link
            href="/auth/login"
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors"
          >
            LOGIN
          </Link>
        )}

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10 transition transform duration-200 ease-out origin-top">
            <Link
              href="/profile"
              onClick={() => setShowDropdown(false)}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Update Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;

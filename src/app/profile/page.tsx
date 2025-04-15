'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProfilePage = () => {
  // Use the API URL from environment or fallback
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.107:3000';

  // State for profile information
  const [profile, setProfile] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    extensionName: '',
    email: '',
  });
  // State for password update values
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);

  // Fetch the current user's profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({
            firstName: data.firstName || '',
            middleName: data.middleName || '',
            lastName: data.lastName || '',
            extensionName: data.extensionName || '',
            email: data.email || '',
          });
        } else {
          toast.error('Failed to load profile.');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('An error occurred while loading your profile.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [API_URL]);

  // Handle changes in input fields for both profile and password values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (Object.keys(profile).includes(name)) {
      setProfile((prev) => ({ ...prev, [name]: value }));
    } else if (Object.keys(passwords).includes(name)) {
      setPasswords((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submit handler to update profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...profile, ...passwords };

    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        toast.success('Profile updated successfully.');
        // Optionally, clear password fields after successful update
        setPasswords({ currentPassword: '', password: '', confirmPassword: '' });
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || 'Profile update failed.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('An error occurred during profile update.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ToastContainer for notification toasts */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />
      <div className="max-w-4xl mx-auto p-6">
        {/* Navigation: Back to Home */}
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-6 text-center">Update Profile</h1>
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={profile.middleName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  Extension Name
                </label>
                <input
                  type="text"
                  name="extensionName"
                  value={profile.extensionName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Divider */}
            <hr className="my-6" />

            {/* Password Change Section */}
            <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={passwords.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

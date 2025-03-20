'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';


type Credentials = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    // This effect will run after every render, it logs the readiness of the router
    console.log('Router readiness:', router.isReady);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!router.isReady) {
      console.error("Router is not ready");
      return; // Do not proceed with navigation if the router is not ready
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (res.ok) {
        // Delay navigation until router is confirmed ready
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Username</label>
            <input
              type="text"
              name="username"
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Password</label>
            <input
              type="password"
              name="password"
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

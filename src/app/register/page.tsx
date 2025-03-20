// src/app/auth/register/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

type UserData = {
  firstName: string;
  middleName: string;
  lastName: string;
  extensionName: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    middleName: '',
    lastName: '',
    extensionName: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: keyof UserData, value: string };
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure passwords match before submitting
    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Proceed with the API call if the passwords match
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        // Redirect to the login page on successful registration
        router.push('/login');
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit}>
          {Object.keys(userData).map((field) => (
            <div className="mb-4" key={field}>
              <label htmlFor={field} className="block mb-1 font-semibold">
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type={field.includes('password') ? 'password' : 'text'}
                id={field}
                name={field}
                value={userData[field as keyof UserData]}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required={field !== 'middleName' && field !== 'extensionName'}
              />
            </div>
          ))}
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Register
          </button>
        </form>
        <p className="mt-4 text-center">
          Already registered? <Link href="/login"><a className="text-blue-600 hover:underline">Login here</a></Link>
        </p>
      </div>
    </div>
  );
}

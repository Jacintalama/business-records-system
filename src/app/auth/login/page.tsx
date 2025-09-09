'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";

type Credentials = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credentials>({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Use environment variable for API URL with fallback if not set
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.236:3000";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies in cross-origin requests
        body: JSON.stringify(credentials),
      });
      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.message || "Login failed");
      }
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white">
      {/* Top Logo */}
      <div className="mb-4">
        {/* Replace /logo1.png with your municipality seal or any desired image */}
        <Image src="/logo1.png" alt="Municipality Seal" width={240} height={240} />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
      <p className="text-gray-500">Please sign in to continue</p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-xs flex flex-col">
        {/* Error message */}
        {error && (
          <p className="mb-4 text-center text-red-500 font-semibold">{error}</p>
        )}

        {/* Username field */}
        <div className="relative mb-4">
          <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            placeholder="Username"
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Password field */}
        <div className="relative mb-2">
          <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {/* Show/Hide password toggle */}
          <div
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </div>
        </div>

        {/* Forgot Password link */}
        <div className="mb-4 text-right">
          {/* Adjust this link to match your forgot-password page route */}
          <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Login button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition flex items-center justify-center"
        >
          Login
        </button>
      </form>

      {/* Registration link */}
      <p className="mt-6 text-sm text-gray-600">
        Don&apos;t have an account yet?{" "}
        <Link href="/auth/register" className="text-blue-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

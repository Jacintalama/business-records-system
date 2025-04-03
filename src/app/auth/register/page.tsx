'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaUser, FaKey, FaFileContract, FaCheck, FaPuzzlePiece } from "react-icons/fa";

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

type GapathaCaptchaProps = {
  verified: boolean;
  onVerify: () => void;
};

// Updated GapathaCaptcha now displays a puzzle icon when not verified
const GapathaCaptcha = ({ verified, onVerify }: GapathaCaptchaProps) => {
  return (
    <div
      onClick={() => {
        if (!verified) onVerify();
      }}
      className={`border p-3 cursor-pointer rounded flex items-center justify-center transition-colors ${
        verified ? "bg-green-100 border-green-500" : "bg-gray-100 border-gray-300"
      }`}
    >
      {verified ? (
        <span className="flex items-center space-x-2">
          <FaCheck className="text-green-700" />
          <span className="text-green-700 font-bold">Verified</span>
        </span>
      ) : (
        <span className="flex items-center space-x-2">
          <FaPuzzlePiece className="text-gray-700" />
          <span className="text-gray-700">I'm not a robot</span>
        </span>
      )}
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();

  // Form Data
  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    middleName: "",
    lastName: "",
    extensionName: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });

  // Track which fields have been touched (blurred)
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Real-time field errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // T&C and captcha check (not a robot)
  const [acceptTnC, setAcceptTnC] = useState(false);
  const [notRobot, setNotRobot] = useState(false);

  // Global error (e.g., from server)
  const [error, setError] = useState("");

  // Basic password regex:
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

  // Validate a single field
  const validateField = (name: string, value: string): string => {
    // Optional fields do not require "required" validation
    const optionalFields = ["middleName", "extensionName"];
    const isOptional = optionalFields.includes(name);

    switch (name) {
      case "firstName":
      case "lastName":
      case "username":
        if (!value.trim()) {
          return "This field must not be blank";
        }
        break;
      case "email":
        if (!value.trim()) {
          return "This field must not be blank";
        }
        if (!value.includes("@")) {
          return "Please enter a valid email address";
        }
        break;
      case "password":
        if (!value.trim() || !passwordRegex.test(value)) {
          return "Must be at least 8 characters, including uppercase, lowercase, digits, and special characters.";
        }
        break;
      case "confirmPassword":
        if (value !== userData.password) {
          return "Passwords do not match";
        }
        break;
      default:
        if (!isOptional && !value.trim()) {
          return "This field must not be blank";
        }
    }
    return "";
  };

  // Handle input changes with real-time validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    // If field has been touched, update its error message
    if (touched[name]) {
      const errorMsg = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  // Handle blur to validate on field exit and mark as touched
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  // Helper to determine input classes based on touched and error status
  const getInputClass = (field: string) => {
    if (touched[field]) {
      if (errors[field]) {
        return "border-red-500 focus:ring-red-500";
      } else {
        return "border-green-500 focus:ring-green-500";
      }
    }
    return "border-gray-300 focus:ring-blue-500";
  };

  // Use the API URL from environment variables or fallback
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.107:3000";

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Final check: validate all required fields and mark them as touched
    const newErrors: { [key: string]: string } = {};
    const updatedTouched: { [key: string]: boolean } = {};
    Object.entries(userData).forEach(([key, value]) => {
      if (key !== "middleName" && key !== "extensionName") {
        updatedTouched[key] = true;
        const msg = validateField(key, value);
        if (msg) {
          newErrors[key] = msg;
        }
      }
    });
    setTouched((prev) => ({ ...prev, ...updatedTouched }));

    if (!acceptTnC) {
      setError("You must accept the Terms and Conditions.");
      return;
    }
    if (!notRobot) {
      setError("Please confirm you are not a robot.");
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      if (res.ok) {
        router.push("/auth/login");
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Title / Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo1.png" alt="Logo" width={120} height={120} />
          <h1 className="mt-4 text-3xl font-bold text-gray-800">Register Account</h1>
        </div>

        {/* Global Error message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-4 text-center">
            <p className="text-red-500 font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
          <div className="grid gap-6 md:grid-cols-3">
            {/* REGISTRANT PROFILE */}
            <div className="bg-white rounded shadow p-4">
              <h2 className="flex items-center text-xl font-bold mb-2 border-b pb-2">
                <FaUser className="mr-2 text-blue-600" />
                REGISTRANT PROFILE
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Please provide your personal details below.
              </p>

              {/* First Name */}
              <div className="mb-4">
                <label htmlFor="firstName" className="block mb-1 text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    name="firstName"
                    value={userData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded px-3 py-2 border focus:outline-none focus:ring-1 ${getInputClass("firstName")}`}
                    required
                  />
                  {touched.firstName && !errors.firstName && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>

              {/* Middle Name (Optional) */}
              <div className="mb-4">
                <label htmlFor="middleName" className="block mb-1 text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <div className="relative">
                  <input
                    id="middleName"
                    name="middleName"
                    value={userData.middleName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="(Optional)"
                  />
                  {touched.middleName && !errors.middleName && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
              </div>

              {/* Last Name */}
              <div className="mb-4">
                <label htmlFor="lastName" className="block mb-1 text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    name="lastName"
                    value={userData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded px-3 py-2 border focus:outline-none focus:ring-1 ${getInputClass("lastName")}`}
                    required
                  />
                  {touched.lastName && !errors.lastName && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>

              {/* Extension Name (Optional) */}
              <div className="mb-4">
                <label htmlFor="extensionName" className="block mb-1 text-sm font-medium text-gray-700">
                  Extension Name
                </label>
                <div className="relative">
                  <input
                    id="extensionName"
                    name="extensionName"
                    value={userData.extensionName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Jr., III"
                  />
                  {touched.extensionName && !errors.extensionName && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
              </div>
            </div>

            {/* ACCOUNT DETAILS */}
            <div className="bg-white rounded shadow p-4">
              <h2 className="flex items-center text-xl font-bold mb-2 border-b pb-2">
                <FaKey className="mr-2 text-blue-600" />
                ACCOUNT DETAILS
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Choose a unique username and secure password.
              </p>

              {/* Username */}
              <div className="mb-4">
                <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    value={userData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded px-3 py-2 border focus:outline-none focus:ring-1 ${getInputClass("username")}`}
                    required
                  />
                  {touched.username && !errors.username && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded px-3 py-2 border focus:outline-none focus:ring-1 ${getInputClass("email")}`}
                    required
                  />
                  {touched.email && !errors.email && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={userData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded px-3 py-2 border focus:outline-none focus:ring-1 ${getInputClass("password")}`}
                    required
                  />
                  {touched.password && !errors.password && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded px-3 py-2 border focus:outline-none focus:ring-1 ${getInputClass("confirmPassword")}`}
                    required
                  />
                  {touched.confirmPassword && !errors.confirmPassword && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* TERMS & CONDITIONS */}
            <div className="bg-white rounded shadow p-4">
              <h2 className="flex items-center text-xl font-bold mb-2 border-b pb-2">
                <FaFileContract className="mr-2 text-blue-600" />
                TERMS & CONDITIONS
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Please review and accept the following before registering.
              </p>
              <div className="text-sm text-gray-700 mb-4">
                <p className="mb-2 font-bold">Registration</p>
                <ul className="list-disc ml-5">
                  <li>The information provided is certified as true and correct.</li>
                  <li>
                    Registrant should validate their account by clicking the
                    verification link sent to the supplied email address.
                  </li>
                  <li>Registrant should not create multiple false accounts.</li>
                  <li>
                    Registrant should keep their account credentials and will not
                    share them with anyone.
                  </li>
                </ul>
              </div>
              {/* Disclaimer Section */}
              <h3 className="text-lg font-bold mb-2">Disclaimer</h3>
              <p className="text-sm mb-4">
                1. In accordance with R.A. 10173 (Data Privacy Act), all information will be used for registration purposes only.
              </p>

              <div className="mb-4">
                <input
                  type="checkbox"
                  id="acceptTnC"
                  checked={acceptTnC}
                  onChange={() => setAcceptTnC((prev) => !prev)}
                  className="mr-2"
                />
                <label htmlFor="acceptTnC" className="text-sm text-gray-700">
                  I accept the Terms and Conditions
                </label>
              </div>

              {/* Gapatha Captcha with Puzzle Icon */}
              <div className="mb-4">
                <GapathaCaptcha verified={notRobot} onVerify={() => setNotRobot(true)} />
              </div>
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              BACK
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              REGISTER
            </button>
          </div>
        </form>

        {/* Already registered? */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account yet?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

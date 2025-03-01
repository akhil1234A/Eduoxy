"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignUpMutation } from "@/state/redux";
import { signupSchema } from "@/lib/schema";
import { useRouter } from "next/navigation";
import EnterPasscodeComponent from "./EnterPasscodeComponent";
import { z } from 'zod';


const SignUpComponent = () => {
 
  const [formData, setFormData] = useState<SignUpRequest>({
    name: '',
    email: '',
    password: '',
    userType: 'student',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signUp, { isLoading, error }] = useSignUpMutation();
  const router = useRouter();
  const [showPasscodeStep, setShowPasscodeStep] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    try {
      signupSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.reduce((acc, curr) => ({
          ...acc,
          [curr.path[0]]: curr.message,
        }), {});
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await signUp(formData).unwrap();
      localStorage.setItem('signupEmail', response.email);
      setShowPasscodeStep(true);
    } catch (err) {
      
      console.error('Signup error:', err);
    }
  };

  if (showPasscodeStep) {
    return <EnterPasscodeComponent email={formData.email} />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-[#25262F] p-8 rounded-lg shadow-md w-96">
      <h2 className="text-white text-xl font-semibold text-center mb-6">
          Sign up for Eduoxy
      </h2>

        {/* Google Sign-In Button */}
        <button
          // onClick={handleGoogleSignIn}
          className="w-full bg-white text-white py-2 rounded-md flex items-center justify-center mb-4 border border-gray-300"
        >
          <img src="/google.png" alt="Google" className="w-5 h-5 mr-3" />
          Continue with Google
        </button>

        <div className="text-gray-400 text-center mb-4">or</div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md"
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="mb-4">
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">
              {(error as any)?.data?.error || 'An error occurred'}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Signing up...' : 'Continue'}
          </button>
        </form>


        <p className="text-gray-400 text-center mt-4">
          Already have an account?{' '}
          <Link href="/signin" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpComponent;

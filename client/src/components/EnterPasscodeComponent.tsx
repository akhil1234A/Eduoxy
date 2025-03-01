"use client";

import { useState } from "react";
import { useVerifyOtpMutation } from "@/state/redux";
import { otpSchema } from "@/lib/schema";
import { useRouter } from "next/navigation";
import { z } from 'zod'

interface Props {
  email: string; 
}

const EnterPasscodeComponent = ({ email }: Props) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const router = useRouter();

  const handleVerify = async () => {
    try {
      otpSchema.parse(passcode);
      setError('');
      
      await verifyOtp({ email, otp: passcode }).unwrap();
      localStorage.removeItem('signupEmail');
      router.push('/courses');
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('Invalid passcode. Please try again.');
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-[#25262F] p-8 rounded-lg shadow-md w-96">
        <h2 className="text-white text-xl font-semibold text-center mb-6">
          Enter Passcode
        </h2>

        <p className="text-gray-400 text-sm text-center mb-4">
        We&apos;ve sent a passcode to {email}. Please enter it below.
        </p>

        <input
          type="text"
          placeholder="Enter passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md mb-4 text-center"
        />

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          onClick={handleVerify}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>

        <p className="text-gray-400 text-center mt-4">
          Didn&apos;t receive a code?{' '}
          <button className="text-blue-400 hover:underline">Resend</button>
        </p>
      </div>
    </div>
  );
};

export default EnterPasscodeComponent;

"use client";

import { useState, useEffect } from "react";
import { useVerifyOtpMutation } from "@/state/redux";
import { otpSchema } from "@/lib/schema";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { setToken } from "@/state/reducer/auth.reducer";

interface Props {
  email: string;
  userType: "student" | "teacher"; // Added userType prop
}

const EnterPasscodeComponent = ({ email, userType }: Props) => {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(120); // 2 minutes (120 seconds)
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
  const router = useRouter();
  const dispatch = useDispatch();

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else {
      setCanResend(true); // Enable resend after timer expires
    }
  }, [timer]);

  // Format timer as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      otpSchema.parse(passcode);
      const response = await verifyOtp({ email, otp: passcode }).unwrap();
      if (response.success) {
        setSuccess("OTP verified successfully. Redirecting...");
        localStorage.removeItem("signupEmail");

        const { accessToken, user } = response.data || {}; 
        const targetRoute = userType === "teacher" ? "/teacher/courses" : "/user/courses";

        if (accessToken && user) {
          dispatch(setToken({ token: accessToken, user }));
          setTimeout(() => router.push(targetRoute), 2000);
        } else {
          // Fallback navigation if no tokens
          setTimeout(() => router.push(targetRoute), 2000);
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("Invalid or expired OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("New OTP sent. Check your email.");
        setTimer(120); 
        setCanResend(false); 
        setPasscode(""); 
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-[#25262F] p-8 rounded-lg shadow-md w-96">
        <h2 className="text-white text-xl font-semibold text-center mb-6">
          Enter Passcode
        </h2>
        <p className="text-gray-400 text-sm text-center mb-4">
          We’ve sent a passcode to {email}. Please enter it below.
        </p>
        <input
          type="text"
          placeholder="Enter passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md mb-4 text-center"
          disabled={isLoading || verifying}
        />
        <p className="text-gray-400 text-sm text-center mb-4">
          Time remaining: {formatTime(timer)}
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-400 text-sm mb-4">{success}</p>}
        <button
          onClick={handleVerify}
          disabled={isLoading || verifying}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md disabled:opacity-50 mb-4"
        >
          {verifying ? "Verifying..." : "Verify"}
        </button>
        <p className="text-gray-400 text-sm text-center">
          Didn’t receive a code?{" "}
          <button
            onClick={handleResend}
            disabled={!canResend || isLoading || verifying}
            className={`text-blue-400 hover:underline ${!canResend || isLoading || verifying ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
};

export default EnterPasscodeComponent;
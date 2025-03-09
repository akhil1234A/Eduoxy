"use client";

import { useState } from "react";
import Link from "next/link";
import { useLoginMutation } from "@/state/redux"; 
import { loginSchema } from "@/lib/schema";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import { useDispatch} from "react-redux";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { setToken } from "@/state/reducer/auth.reducer";
import EnterPasscodeComponent from '@/components/EnterPasscodeComponent'

const SignInComponent = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [login, { isLoading, error }] = useLoginMutation();
  const [showPasscodeStep, setShowPasscodeStep] = useState(false);
  const [userType, setUserType] = useState<"student" | "teacher">("student");
  const router = useRouter();
  const dispatch = useDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    try {
      loginSchema.parse(formData);
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
      const response = await login(formData).unwrap();
      if (response.success && response.data) {

        if (response.data?.needsVerification) {
          setUserType(response.data.user?.userType as "student" | "teacher");
          setShowPasscodeStep(true);
          return;
        }
       
        const { accessToken, user } = response.data;
        dispatch(setToken({ token: accessToken, user }));

        const targetRoute =
          user.userType === "admin" ? "/admin/courses" :
          user.userType === "teacher" ? "/teacher/courses" :
          "/user/courses";
        router.push(targetRoute);
      } else {
        throw new Error("Login response missing data");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage =
        err.data?.error ||
        err.data?.message ||
        err.message ||
        "An error occurred during login";
      setErrors((prev) => ({ ...prev, general: errorMessage }));
    }
    }
  

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Send ID token to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        dispatch(setToken({ token: data.data.accessToken, user: data.data.user }));
        const targetRoute =
          data.data.user.userType === "admin" ? "/admin/courses" :
          data.data.user.userType === "teacher" ? "/teacher/courses" :
          "/user/courses";
        router.push(targetRoute);
      } else {
        throw new Error(data.message || "Google sign-in failed");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrors((prev) => ({ ...prev, general: "Google sign-in failed" }));
    }
  };

  if (showPasscodeStep) {
    return <EnterPasscodeComponent email={formData.email} userType={userType} />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-[#25262F] p-8 rounded-lg shadow-md w-96">
        <h2 className="text-white text-xl font-semibold text-center mb-6">
          Sign into Eduoxy
        </h2>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white text-white py-2 rounded-md flex items-center justify-center mb-4 border border-gray-300"
          disabled={isLoading}
        >
          <Image src="/google.png" alt="Google" width={20} height={20} className="mr-3" />
          Continue with Google
        </button>

        <div className="text-gray-400 text-center mb-4">or</div>

        {/* Sign-In Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
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
              placeholder="Enter your password"
              className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md"
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex justify-between items-center text-gray-400 text-sm mb-4">
            <span>Remember me</span>
            <Link href="/forgot-password" className="text-blue-400 hover:underline">
              Forgot Password?
            </Link>
          </div>

          {errors.general && (
            <p className="text-red-400 text-sm mb-4">{errors.general}</p>
          )}
          

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignInComponent;
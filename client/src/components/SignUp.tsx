import { useState } from "react";
import Link from "next/link";
import { useSignUpMutation } from "@/state/redux";
import { signupSchema } from "@/lib/schema";
import EnterPasscodeComponent from "./EnterPasscodeComponent";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { z } from "zod";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

const SignUpSkeleton = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-[#25262F] p-8 rounded-lg shadow-md w-96">
        <Skeleton className="h-8 w-40 mx-auto mb-6" /> 

        <Skeleton className="h-10 w-full mb-4" />

        <div className="text-gray-400 text-center mb-4">
          <Skeleton className="h-4 w-10 mx-auto" /> 
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" /> 
          <Skeleton className="h-10 w-full" /> 
          <Skeleton className="h-10 w-full" /> 
          <Skeleton className="h-10 w-full" /> 
          <Skeleton className="h-10 w-full" /> 
        </div>

        <Skeleton className="h-4 w-60 mt-4 mx-auto" /> 
      </div>
    </div>
  );
};

const SignUpComponent = () => {
  const [formData, setFormData] = useState<SignUpRequest>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "student",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signUp, { isLoading, error }] = useSignUpMutation();
  const [showPasscodeStep, setShowPasscodeStep] = useState(false);
  const router = useRouter();

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
      if (response.success) {
        localStorage.setItem("signupEmail", formData.email);
        localStorage.setItem("userType", formData.userType);
        setShowPasscodeStep(true);
      }
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage =
        (err as { data?: { error?: string; message?: string } }).data?.error ||
        (err as Error).message ||
        "An error occurred during signup";
      setErrors((prev) => ({ ...prev, general: errorMessage }));
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        const userType = data.data.user.userType;
        switch (userType) {
          case "admin":
            router.push("/admin/courses");
            break;
          case "teacher":
            router.push("/teacher/courses");
            break;
          case "student":
            router.push("/user/courses");
            break;
          default:
            router.push("/user/courses");
        }
      } else {
        throw new Error(data.message || "Google sign-up failed");
      }
    } catch (error) {
      console.error("Google sign-up error:", error);
      setErrors((prev) => ({ ...prev, general: "Google sign-up failed" }));
    }
  };

  if (showPasscodeStep) {
    return <EnterPasscodeComponent email={formData.email} userType={formData.userType} />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-[#25262F] p-8 rounded-lg shadow-md w-96">
        <h2 className="text-white text-xl font-semibold text-center mb-6">
          Sign up for Eduoxy
        </h2>

        <button
          onClick={handleGoogleSignUp}
          className="w-full bg-white text-white py-2 rounded-md flex items-center justify-center mb-4 border border-gray-300"
          disabled={isLoading}
        >
          <Image src="/google.png" alt="Google" width={20} height={20} className="mr-3" />
          Continue with Google
        </button>

        <div className="text-gray-400 text-center mb-4">or</div>

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
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md"
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="userType" className="sr-only">User Type:</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {errors.general && (
            <p className="text-red-400 text-sm mb-4">{errors.general}</p>
          )}
          {error && !errors.general && (
            <p className="text-red-400 text-sm mb-4">
              {(error as { data?: { error?: string } })?.data?.error || "An error occurred"}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md disabled:opacity-50"
          >
            {isLoading ? "Signing up..." : "Continue"}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<SignUpSkeleton />}>
      <SignUpComponent />
    </Suspense>
  );
}
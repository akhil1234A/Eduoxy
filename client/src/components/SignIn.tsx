"use client";

import Link from "next/link";
import { useState } from "react";

const SignUpComponent = () => {
  const [user, setUser] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      
    } catch (error) {
      console.error(error);
    }
  };

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
        >
          <img src="/google.png" alt="Google" className="w-5 h-5 mr-3" />
          Continue with Google
        </button>

        <div className="text-gray-400 text-center mb-4">or</div>

        <input
          type="email"
          placeholder="Enter your email address"
          className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md mb-3"
        />
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md mb-4"
        />

        <div className="flex justify-between items-center text-gray-400 text-sm mb-4">
          <span>Remember me</span>
          <a href="/forgot-password" className="text-blue-400 hover:underline">
            Forgot Password?
          </a>
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md">
          Continue
        </button>

        <p className="text-gray-400 text-center mt-4">
          Already have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpComponent;

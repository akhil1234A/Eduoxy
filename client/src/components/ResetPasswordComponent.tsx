"use client";

import { useState } from "react";

const ResetPasswordComponent = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-[#25262F] p-8 rounded-lg shadow-md w-96">
        <h2 className="text-white text-xl font-semibold text-center mb-6">
          Reset Password
        </h2>

        <p className="text-gray-400 text-sm text-center mb-4">
          Enter a new password for your account.
        </p>

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md mb-3"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-[#18181B] text-white px-4 py-2 rounded-md mb-4"
        />

        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md">
          Reset Password
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordComponent;

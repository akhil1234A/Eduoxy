"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SelectRolePage = () => {
  const { isLoaded, user } = useUser();
  const [role, setRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.userType) {
      const userType = user.publicMetadata.userType as string;
      router.push(userType === "teacher" ? "/teacher/courses" : "/user/courses");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return <div className="text-center text-white-50">Loading...</div>;

  const handleRoleSubmit = async () => {
    if (!role) {
      alert("Please select a role");
      return;
    }

    try {
      const response = await fetch("/api/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role }),
      });

      if (!response.ok) throw new Error("Failed to update role");

      router.push(role === "teacher" ? "/teacher/courses" : "/user/courses");
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  return (
    <div className="flex items-center justify-center bg-customgreys-secondarybg">
      <div className="bg-customgreys-primarybg p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-white-50 text-2xl font-semibold mb-6 text-center">Select Your Role</h1>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full bg-customgreys-secondarybg text-white-50 p-3 rounded-md mb-6 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
        >
          <option value="" disabled>Choose a role</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <button
          onClick={handleRoleSubmit}
          className="w-full bg-primary-700 text-white-100 hover:bg-primary-600 p-3 rounded-md transition-colors duration-200"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default SelectRolePage;
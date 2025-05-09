"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";

type UserContextType = {
  userId: string | null;
  userName: string | null;
  userType: string; 
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("student"); 

  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = Cookies.get("userId") || localStorage.getItem("userId");
      const name = Cookies.get("userName") || localStorage.getItem("userName");
      const type = Cookies.get("userType") || localStorage.getItem("userType") || "student";

      setUserId(id);
      setUserName(name);
      setUserType(type);
    }
  }, []);

  return (
    <UserContext.Provider value={{ userId, userName, userType }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

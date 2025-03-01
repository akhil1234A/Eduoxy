import React from "react";
import { Toaster } from "sonner";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="auth-layout">
      <Toaster />
      <main className="auth-layout__main">{children}</main>
    </div>
  );
};

export default Layout;

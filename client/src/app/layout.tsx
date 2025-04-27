import type { Metadata } from "next";
  // import { DM_Sans } from "next/font/google";
import './font.css'
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SocketProvider } from "@/contexts/SocketContext";



export const metadata: Metadata = {
  title: "Eduoxy",
  description: "Eduoxy is a platform for learning and teaching",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-dm-sans">
        <SocketProvider>
          <NotificationProvider>
            <Providers>
              <div className="root-layout">{children}</div>
            </Providers>
          </NotificationProvider>
        </SocketProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
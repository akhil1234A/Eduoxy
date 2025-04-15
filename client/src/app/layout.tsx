import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import { NotificationProvider } from "@/contexts/NotificationContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

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
      <body className={`${dmSans.className}`}>
        <NotificationProvider>
          <Providers>
            <div className="root-layout">{children}</div>
          </Providers>
        </NotificationProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
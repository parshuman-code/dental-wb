import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "@/components/auth/AuthProvider";
import AIChatbot from "@/components/AIChatbot";

export const metadata: Metadata = {
  title: "Luminous Dental | Premium Dental Clinic & Specialist Care",
  description: "Advanced, gentle dental care by certified MDS doctors. Book appointments, view treatment plans, and track your dental records securely.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          {/* Global 24/7 DenTo AI Receptionist - Always fixed at viewport bottom-right corner */}
          <AIChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}


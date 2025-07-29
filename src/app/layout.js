import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ClientNav from "./ClientNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LoanLink - Loan Management System",
  description: "Professional loan management system for lending companies",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <ClientNav />
        {children}
      </body>
    </html>
  );
}

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata = {
  title: {
    default: "LoanLink - Professional Loan Management System",
    template: "%s | LoanLink"
  },
  description: "Professional loan management system for lending companies. Manage loans, payments, and client relationships efficiently.",
  keywords: ["loan management", "lending", "finance", "payments", "business"],
  authors: [{ name: "LoanLink Team" }],
  creator: "LoanLink",
  publisher: "LoanLink",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "LoanLink - Professional Loan Management System",
    description: "Professional loan management system for lending companies",
    url: '/',
    siteName: 'LoanLink',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "LoanLink - Professional Loan Management System",
    description: "Professional loan management system for lending companies",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased min-h-screen bg-slate-950 text-white">
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}

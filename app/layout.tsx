import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-numeric",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grade Optimizer - Academic Performance Management",
  description: "Enterprise-scale Academic Performance Management System for achieving perfect 4.00 GPA",
  authors: [{ name: "Project004 Team" }],
  keywords: ["grade optimizer", "academic performance", "GPA calculator", "student dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable} ${inter.variable}`}>
      <body className="font-body bg-brutal-black text-brutal-text antialiased">
        {children}
      </body>
    </html>
  );
}

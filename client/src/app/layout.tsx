import type { Metadata } from "next";
import { Inter } from "next/font/google";

import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HCP Log Interaction",
  description: "AI-first CRM log interaction screen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="app-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

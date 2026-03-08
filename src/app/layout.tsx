import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHD Planner — Division 2 Build Planner & Database",
  description:
    "Plan, optimize, and share Division 2 builds. Browse gear sets, brand sets, weapons, talents, and skills. Calculate DPS, compare items, and export builds.",
  openGraph: {
    title: "SHD Planner — Division 2 Build Planner & Database",
    description:
      "Plan, optimize, and share Division 2 builds with the community.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}

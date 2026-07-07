import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Playbeat Digital — Where independent sound meets the world",
  description:
    "Stream, distribute, and monetize your music and podcasts across 150+ platforms. Built for independent artists who want full control and 100% of their royalties. Pay in PKR via JazzCash.",
  keywords: [
    "Playbeat Digital",
    "music distribution",
    "podcast hosting",
    "JazzCash payments",
    "Pakistan music",
    "independent artists",
    "royalties",
  ],
  authors: [{ name: "Playbeat Digital" }],
  icons: {
    icon: "/playbeat-logo.png",
  },
  openGraph: {
    title: "Playbeat Digital",
    description:
      "Where independent sound meets the world. Distribute to 150+ stores, keep 100% of royalties.",
    siteName: "Playbeat Digital",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Playbeat Digital",
    description:
      "Where independent sound meets the world. Distribute to 150+ stores, keep 100% of royalties.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

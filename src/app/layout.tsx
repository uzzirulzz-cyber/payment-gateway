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
  title: "PlayBeat — Premium digital products, instantly delivered",
  description:
    "Premium digital products delivered instantly. Secure checkout powered by JazzCash — accepted across Pakistan & worldwide.",
  keywords: [
    "PlayBeat",
    "PlayBeat Digital",
    "digital products",
    "JazzCash payments",
    "Pakistan",
    "instant activation",
    "secure checkout",
  ],
  authors: [{ name: "PlayBeat Digital" }],
  icons: {
    icon: "/playbeat-logo.png",
    apple: "/playbeat-logo.png",
  },
  openGraph: {
    title: "PlayBeat",
    description:
      "Premium digital products delivered instantly. Secure checkout powered by JazzCash.",
    siteName: "PlayBeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayBeat",
    description:
      "Premium digital products delivered instantly. Secure checkout powered by JazzCash.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground pb-page-bg`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

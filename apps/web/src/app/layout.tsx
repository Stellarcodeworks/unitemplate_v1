import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EOP Admin Console",
  description: "Enterprise Operations Platform — Admin Console",
};

/**
 * Root layout — wraps the entire app with providers.
 * Server Component (no 'use client').
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 font-sans text-zinc-50 antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgb(24 24 27)", // zinc-900
                border: "1px solid rgb(39 39 42)", // zinc-800
                color: "rgb(244 244 245)", // zinc-100
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}

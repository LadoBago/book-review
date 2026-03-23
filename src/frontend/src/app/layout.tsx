import type { Metadata } from "next";
import SessionProvider from "@/components/SessionProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Book Review",
    template: "%s | Book Review",
  },
  description: "Discover and share book reviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>
          <ErrorBoundary>
            <Navbar />
            <main>{children}</main>
          </ErrorBoundary>
        </SessionProvider>
      </body>
    </html>
  );
}

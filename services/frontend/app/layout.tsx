import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopHub — Modern E-Commerce",
  description: "The best deals on electronics, clothing, books and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-gray-800 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            © 2024 ShopHub. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}

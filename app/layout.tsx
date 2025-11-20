"use client";

import React, { Component } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar"; // (Code ở phần Bonus bên dưới)
import Footer from "@/components/layout/Footer"; // (Code ở phần Bonus bên dưới)
import { Toaster } from "sonner"; // Hoặc thư viện toast bạn chọn

const inter = Inter({ subsets: ["latin"] });

export default class RootLayout extends Component<{ children: React.ReactNode }> {
  render() {
    const { children } = this.props;
    return (
      <html lang="vi">
        {/* THÊM class "antialiased bg-gray-50 text-gray-900" VÀO ĐÂY */}
        <body className={`${inter.className} min-h-screen flex flex-col antialiased bg-gray-50 text-gray-900`}>
          <Navbar />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <Footer />
          <Toaster position="top-center" richColors />
        </body>
      </html>
    );
  }
}
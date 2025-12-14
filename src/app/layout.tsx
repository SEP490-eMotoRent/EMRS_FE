import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "antd/dist/reset.css";
import HideNotifications from "@/components/HideNotifications";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eMotoRent",
  description: "Hệ thống quản trị eMotoRent",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Ẩn notification button/icon từ browser extensions */
            body > div[style*="position: fixed"][style*="bottom"],
            body > div[style*="position:fixed"][style*="bottom"],
            body > button[style*="position: fixed"],
            body > a[style*="position: fixed"],
            div[class*="notification"][class*="fixed"],
            button[class*="notification"][class*="fixed"],
            a[class*="notification"][class*="fixed"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-800`}
      >
        <HideNotifications />
        {children}
      </body>
    </html>
  );
}

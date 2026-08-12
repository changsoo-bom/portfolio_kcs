import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { IntroCover } from "@/components/common";

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
  title: "World Atlas",
  description: "세계지도에서 나라와 지역을 따라 들어가 주요 명소를 찾는다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-dvh">
        <IntroCover />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "Pulse CRM",
  description: "Enterprise CRM client dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Script
        id="isEmpty-polyfill"
        beforeInteractive={true}
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `if(typeof window!=='undefined'&&!window.isEmpty){window.isEmpty=function(o){if(o==null)return true;if(Array.isArray(o)||typeof o==='string')return o.length===0;if(typeof o==='object')return Object.keys(o).length===0;return false;};}`,
        }}
      />
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

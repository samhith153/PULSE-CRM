import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/ui/Toaster";

const geist = Geist({
  variable: "--font-space", // keep same var name — globals.css references --font-space
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
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
      className={`${geist.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('pulse-crm-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', savedTheme);
                  if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface-0">
        {children}
        <Toaster />
      </body>
    </html>
  );
}


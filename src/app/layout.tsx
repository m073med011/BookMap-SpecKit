import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "@/lib/config/env.server";
import "./globals.css";
import "goey-toast/styles.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "BookMap",
  description: "Multi-vendor book marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${manrope.variable} ${ibmPlexMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body className="bg-background min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

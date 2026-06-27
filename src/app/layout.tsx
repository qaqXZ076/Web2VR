import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Web2VR — Watch Web Videos in SteamVR",
  description: "Capture browser tabs and watch VR180/360 videos in your VR headset via SteamVR. Supports sphere, hemisphere, and cylinder projections.",
  keywords: ["Web2VR", "WebXR", "VR", "VR180", "VR360", "SteamVR", "Side-by-Side", "3D Video"],
  authors: [{ name: "Web2VR" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Web2VR",
    description: "Convert web VR videos for SteamVR viewing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web2VR",
    description: "Convert web VR videos for SteamVR viewing",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}

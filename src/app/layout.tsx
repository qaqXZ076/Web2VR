import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebXR VR Video Player — VR180/360 to SteamVR",
  description: "Convert web-based VR180/360 side-by-side videos into WebXR format for SteamVR viewing. Supports multiple projection types and stereo layouts.",
  keywords: ["WebXR", "VR", "VR180", "VR360", "SteamVR", "Side-by-Side", "3D Video"],
  authors: [{ name: "WebXR VR Player" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "WebXR VR Video Player",
    description: "Convert web VR videos for SteamVR viewing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebXR VR Video Player",
    description: "Convert web VR videos for SteamVR viewing",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

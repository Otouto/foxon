import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Foxon - Workout Tracker",
  description: "Your workout companion with devotion scoring and session tracking",
  keywords: "workout, fitness, exercise, tracking, devotion, training, gym",
  authors: [{ name: "Foxon Team" }],
  creator: "Foxon",
  publisher: "Foxon",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Foxon",
    startupImage: [
      "/icons/apple-touch-startup-image-768x1004.png",
      "/icons/apple-touch-startup-image-1536x2008.png",
    ],
  },
  openGraph: {
    type: "website",
    siteName: "Foxon",
    title: "Foxon - Workout Tracker",
    description: "Your workout companion with devotion scoring and session tracking",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Foxon - Workout Tracker",
    description: "Your workout companion with devotion scoring and session tracking",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/icon-120x120.png", sizes: "120x120" },
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-180x180.png", sizes: "180x180" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icons/safari-pinned-tab.svg",
        color: "#1f2937",
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1f2937" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Foxon" />
        <meta name="application-name" content="Foxon" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-startup-image" href="/icons/apple-touch-startup-image-768x1004.png" />
        <link rel="apple-touch-startup-image" href="/icons/apple-touch-startup-image-1536x2008.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 pb-20">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Session - Foxon",
  description: "Active workout session",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Foxon Session",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1f2937",
};

export default function SessionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="session-layout-wrapper">
      {children}
    </div>
  );
}
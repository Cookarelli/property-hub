import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Property Hub — A place for your kind of living",
    template: "%s | Property Hub",
  },
  description:
    "Discover thoughtful apartment communities and a connected experience for owners, managers, residents, and future neighbors.",
  applicationName: "Property Hub",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Property Hub",
  },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#243e31",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

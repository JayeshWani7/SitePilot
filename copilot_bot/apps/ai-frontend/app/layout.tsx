import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SitePilot Copilot",
  description: "Floating AI copilot chat for SitePilot tenants"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homeview CRM",
  description: "Admin dashboard for Homeview leads, chats, and AI usage."
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

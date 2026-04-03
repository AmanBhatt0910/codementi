import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeMenti – 1-on-1 Mentor-Student Platform",
  description: "Real-time collaborative code editing, video calling, and chat for mentors and students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">{children}</body>
    </html>
  );
}



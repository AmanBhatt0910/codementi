import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
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
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1f2937",
              color: "#f9fafb",
              border: "1px solid #374151",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#6366f1", secondary: "#f9fafb" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#f9fafb" },
            },
          }}
        />
      </body>
    </html>
  );
}



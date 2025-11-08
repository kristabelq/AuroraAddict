import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurora Addict - Plan Your Aurora Hunt",
  description: "Join aurora chasers worldwide to track, plan, and share northern lights sightings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1f2e',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#00ff87',
                  secondary: '#1a1f2e',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff3b30',
                  secondary: '#1a1f2e',
                },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}

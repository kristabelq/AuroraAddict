import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-L7RXJ64XKY";

export const metadata: Metadata = {
  metadataBase: new URL("https://auroraintel.io"),
  title: {
    default: "Aurora Intel - Your Intelligent Aurora Hunting Companion",
    template: "%s | Aurora Intel",
  },
  description: "The ultimate aurora hunting platform with real-time Kp index, solar wind data, aurora forecasts, and community features. Plan your Northern Lights adventure with live space weather intelligence.",
  keywords: [
    "aurora borealis",
    "northern lights",
    "aurora forecast",
    "Kp index",
    "aurora hunting",
    "space weather",
    "solar wind",
    "aurora alert",
    "see northern lights",
    "aurora app",
    "aurora tracker",
    "geomagnetic storm",
    "aurora photography",
    "aurora tour",
    "Iceland aurora",
    "Norway northern lights",
    "Finland aurora",
    "aurora australis",
    "southern lights",
  ],
  authors: [{ name: "Kristabel", url: "https://auroraintel.io" }],
  creator: "Aurora Intel",
  publisher: "Aurora Intel",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aurora Intel",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://auroraintel.io",
    siteName: "Aurora Intel",
    title: "Aurora Intel - Your Intelligent Aurora Hunting Companion",
    description: "The ultimate aurora hunting platform with real-time Kp index, solar wind data, aurora forecasts, and community features. Plan your Northern Lights adventure with live space weather intelligence.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aurora Intel - Real-time aurora forecasts and space weather data",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurora Intel - Your Intelligent Aurora Hunting Companion",
    description: "Real-time aurora forecasts, Kp index, solar wind data & community features. The ultimate tool for seeing the Northern Lights.",
    images: ["/og-image.png"],
    creator: "@auroraintel",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://auroraintel.io",
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f1420",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "@id": "https://auroraintel.io/#app",
                  "name": "Aurora Intel",
                  "url": "https://auroraintel.io",
                  "description": "The ultimate aurora hunting platform with real-time Kp index, solar wind data, aurora forecasts, and community features for seeing the Northern Lights.",
                  "applicationCategory": "WeatherApplication",
                  "operatingSystem": "Web, iOS, Android",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "Kristabel"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "5",
                    "ratingCount": "1"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://auroraintel.io/#organization",
                  "name": "Aurora Intel",
                  "url": "https://auroraintel.io",
                  "logo": "https://auroraintel.io/logo.png",
                  "description": "Aurora Intel is the ultimate aurora hunting platform, providing real-time space weather data and aurora forecasts for enthusiasts worldwide.",
                  "sameAs": [
                    "https://instagram.com/auroraintel.io"
                  ],
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "email": "kristabel@auroraintel.io",
                    "contactType": "customer support"
                  }
                },
                {
                  "@type": "WebSite",
                  "@id": "https://auroraintel.io/#website",
                  "url": "https://auroraintel.io",
                  "name": "Aurora Intel",
                  "publisher": {
                    "@id": "https://auroraintel.io/#organization"
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://auroraintel.io/search?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
      </head>
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

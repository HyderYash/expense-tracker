import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";
const siteName = "Investment Portfolio Dashboard";
const description =
  "Track your investments with real-time updates, comprehensive analytics, and beautiful visualizations. Manage your portfolio across stocks, mutual funds, gold, and more with our intuitive investment tracker.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description,
  keywords: [
    "investment tracker",
    "portfolio management",
    "investment dashboard",
    "stock tracker",
    "mutual fund tracker",
    "investment analytics",
    "portfolio tracker",
    "financial dashboard",
    "investment management",
    "wealth tracker",
  ],
  authors: [{ name: "Investment Tracker" }],
  creator: "Investment Tracker",
  publisher: "Investment Tracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName,
    title: siteName,
    description,
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: [`${baseUrl}/og-image.png`],
    creator: "@investmenttracker",
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
  icons: {
    icon: [
      { url: "/android/mipmap-xxxhdpi/ic_launcher.png", sizes: "192x192", type: "image/png" },
      { url: "/android/ic_launcher-web.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/ios/iTunesArtwork@1x.png", sizes: "180x180", type: "image/png" },
      { url: "/ios/iTunesArtwork@2x.png", sizes: "360x360", type: "image/png" },
      { url: "/ios/iTunesArtwork@3x.png", sizes: "540x540", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Portfolio Tracker",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-orientation": "all",
  },
  alternates: {
    canonical: baseUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#667eea" },
    { media: "(prefers-color-scheme: dark)", color: "#667eea" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    description,
    url: baseUrl,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "100",
    },
    featureList: [
      "Real-time investment tracking",
      "Portfolio analytics",
      "Multiple investment categories",
      "Interactive charts and visualizations",
      "Offline support",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}


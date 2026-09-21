import type { Metadata } from "next";
import "./globals.css";
import { SITE_DESCRIPTION } from "@/data/site";

// Design intent: Open Graph and X deliberately share this static asset. Avoid adding
// app/opengraph-image.tsx alongside it: Next's file convention would override only
// part of this metadata and silently create two different social designs.
export const metadata: Metadata = {
  metadataBase: new URL("https://ryota.onuma.dev"),
  title: "ryota.onuma.dev",
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "ryota.onuma.dev",
    description: SITE_DESCRIPTION,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ryota.onuma.dev" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ryota.onuma.dev",
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

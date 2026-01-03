import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ryota Onuma",
  description: "Ryota Onuma - Stay Curious. Keep Moving.",
  icons: {
    icon: [
      { url: '/site-favicon.ico', sizes: 'any' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-[#fafafa] text-[#1a1a1a] font-sans overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}

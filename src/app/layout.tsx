import type { Metadata, Viewport } from "next";
import { Inconsolata } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "./providers";

const inconsolata = Inconsolata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inconsolata",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Kusari - Web3 Messaging",
  description:
    "Decentralized messaging built on XMTP protocol with Ethos Network reputation",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kusari",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inconsolata.variable}>
      <body className={inconsolata.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

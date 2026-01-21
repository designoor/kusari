import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "./providers";

const inconsolata = Inconsolata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inconsolata",
});

export const metadata: Metadata = {
  title: "Kusari - Web3 Messaging",
  description: "Decentralized messaging built on XMTP protocol with Ethos Network reputation",
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

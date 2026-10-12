import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "GenSecure | Public Covenant & Semantic Assurance Protocol",
  description: "Stake a public promise. Prove when it changes. GenSecure is a GenLayer-native decentralized covenant protocol for autonomous web-state assurance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="ambient-scene" aria-hidden="true">
          <div className="ambient-grid" />
          <div className="ambient-glow-1" />
          <div className="ambient-glow-2" />
          <div className="ambient-glow-3" />
        </div>
        <Providers>
          <div className="app-viewport">
            <Navbar />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

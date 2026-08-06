import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import CartDrawer from "@/components/CartDrawer";
import SmoothScrolling from "@/components/SmoothScrolling";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif — headlines only (see .font-display in globals.css).
// Loaded with axes for optical variation at large sizes; swap avoids
// blocking render on the font request.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ThriftGram | Sustainable Style",
  description: "The marketplace for second-hand fashion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          <ErrorBoundary>
            <SmoothScrolling>
              <Navbar />
              <CartDrawer />
              {/* Every page renders its own single <main> via PageShell —
                  this used to also wrap in <main>, producing an invalid
                  nested-landmark document on every page. */}
              {children}
            </SmoothScrolling>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}

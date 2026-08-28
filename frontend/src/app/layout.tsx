import type { Metadata } from "next";
import { Archivo, Geist_Mono, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import CartDrawer from "@/components/CartDrawer";
import SmoothScrolling from "@/components/SmoothScrolling";

// UI + body grotesk. Variable weight axis so the whole UI ships one file.
// Chosen over a hairline serif specifically because light-on-dark type gains
// optical weight and thin strokes break up — a sturdy grotesk survives that.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display Didone — headlines only (see .font-display in globals.css, which
// enforces the display-only rule). The optical-size axis matters here: at
// display sizes Bodoni's hairlines thin out, and opsz compensates.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  axes: ["opsz"],
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
        className={`${archivo.variable} ${geistMono.variable} ${bodoni.variable} antialiased bg-background text-foreground`}
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

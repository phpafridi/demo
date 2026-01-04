'use client'

import { Providers } from "../../Providers";
import "../../globals.css";
import Assets from "@/components/Assets";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import UserProfile from "@/components/UserProfile";
import { Toaster } from "sonner";
import NextNProgress from "nextjs-progressbar";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then(() => console.log('Service Worker registered'))
        .catch(err => console.warn('SW registration failed:', err));
    }
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <Assets />
      <body className="skin-blue" suppressHydrationWarning>
        {/* Progress bar at top of body */}
        <NextNProgress
          color="linear-gradient(to right, #4facfe, #00f2fe)"
          startPosition={0.2}
          stopDelayMs={200}
          height={4}
          options={{ showSpinner: false }}
        />

        <Providers>
          <div className="wrapper">
            <Header />

            <aside className="main-sidebar">
              <section className="sidebar">
                <UserProfile />
                <Navigation />
              </section>
            </aside>

            {children}
            <Toaster richColors position="top-right" />
          </div>

          {/* Modals */}
          <div
            className="modal fade modal-wide"
            id="myModal"
            role="dialog"
            aria-labelledby="myModalLabel"
            aria-hidden="true"
          >
            <div id="product_modal" className="modal-dialog">
              <div className="modal-content"></div>
            </div>
          </div>

          <div
            className="modal fade modal-small"
            id="modalSmall"
            role="dialog"
            aria-labelledby="myModalLabel"
            aria-hidden="true"
          >
            <div id="product_modal" className="modal-dialog">
              <div className="modal-content"></div>
            </div>
          </div>
        </Providers>

        <Footer />
      </body>
    </html>
  );
}

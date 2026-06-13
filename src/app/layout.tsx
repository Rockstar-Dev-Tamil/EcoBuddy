import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/stores/game-store";
import { Navbar } from "@/components/navbar";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { LeafLoader } from "@/components/leaf-loader";

export const metadata: Metadata = {
  title: "EcoBuddy AI — Your Intelligent Sustainability Companion",
  description:
    "See the future you're creating, and take action to build a greener one. Track carbon footprints, analyze receipts with Gemini Vision, consult your AI Twin, and customize your 3D planet.",
  keywords: [
    "sustainability",
    "carbon footprint tracker",
    "green score",
    "gemini ai",
    "climate change simulation",
    "eco tracker",
    "3d planet",
    "gamified ecology",
  ],
  authors: [{ name: "EcoBuddy AI Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "EcoBuddy AI — Your Intelligent Sustainability Companion",
    description:
      "EcoBuddy AI helps you track, understand, and reduce your carbon footprint with conversational AI, computer vision scanning, future simulations, and an interactive 3D virtual planet.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full font-sans antialiased bg-background text-foreground flex flex-col">
        {/* Futuristic background elements */}
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-950/30 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-950/20 blur-[150px]" />
          <div className="absolute top-[40%] left-[60%] w-[35%] h-[35%] rounded-full bg-green-950/20 blur-[100px]" />
        </div>

        {/* Semantic Content Container */}
        <GameProvider>
          <Navbar>
            <ErrorBoundary>
              <Suspense fallback={<LeafLoader />}>{children}</Suspense>
            </ErrorBoundary>
          </Navbar>
        </GameProvider>

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('PWA ServiceWorker registered successfully:', reg.scope);
                  }).catch(function(err) {
                    console.warn('PWA ServiceWorker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

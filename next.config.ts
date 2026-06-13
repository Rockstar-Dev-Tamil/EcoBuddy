import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * HTTP Security Headers
   * Applied to every response from the Next.js server.
   * Reference: https://nextjs.org/docs/advanced-features/security-headers
   */
  async headers() {
    // Build the Content Security Policy directive string
    const cspDirectives = [
      // Only load scripts from our own origin and Google APIs (Vision AI OAuth)
      "default-src 'self'",
      // Allow inline scripts that Next.js injects (e.g. __NEXT_DATA__)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Allow inline styles that Tailwind / framer-motion inject at runtime
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Allow web fonts from Google Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Allow images from our origin, data URIs (canvas/WebGL snapshots), and blob URLs
      "img-src 'self' data: blob: https:",
      // Allow fetch/XHR to our own origin, Google APIs, and Supabase realtime
      "connect-src 'self' https://oauth2.googleapis.com https://vision.googleapis.com https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com",
      // Allow WebGL and canvas rendering
      "worker-src 'self' blob:",
      // Block all <frame> / <iframe> embeds to prevent clickjacking
      "frame-src 'none'",
      // Block loading objects (Flash, PDF plugins, etc.)
      "object-src 'none'",
      // Restricts the URLs which can be used in a document's base element
      "base-uri 'self'",
      // Prevents form submissions to external URLs
      "form-action 'self'",
    ].join("; ");

    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: cspDirectives,
      },
      {
        // Enforce secure HTTPS connection
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        // Prevent MIME type sniffing
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        // Prevent embedding in iframes (clickjacking protection)
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        // Enable browser XSS filter (legacy browsers)
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        // Don't send the Referer header when navigating to a different origin
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        // Control which browser features/APIs can be used on the page
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

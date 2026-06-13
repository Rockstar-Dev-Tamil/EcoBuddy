# EcoBuddy Security Architecture

This document describes the security implementations, input verification, and defensive practices configured in the EcoBuddy AI platform.

## 1. Input Sanitization & XSS Defense

Cross-Site Scripting (XSS) and injection attacks represent significant risks for web applications that accept unstructured input. We defend against these in multiple layers:

### DOMPurify
We utilize `isomorphic-dompurify` both client-side and server-side to sanitize text parameters.
- **AI Chat Endpoint:** The `src/app/api/chat/route.ts` runs user queries through DOMPurify to strip HTML structures and scripting elements before they are loaded into the Google Gemini LLM context:
  ```ts
  const sanitizedInput = DOMPurify.sanitize(validatedMessage).trim();
  ```

### Filename Sanitization
When users scan receipt or meal images in EcoSnap, the filename is sanitized before processing:
- Special path traversal elements like `..`, `/`, and `\` are replaced with underscores.
- Filename lengths are strictly clamped to 255 characters to prevent buffer overflow attempts on backend operations.

---

## 2. Zod Payload Validations

To prevent processing arbitrary structures, all API endpoints strictly define their request schemas using Zod.

- **Scan Endpoint (`src/app/api/scan/route.ts`):** Validates base64 payloads and limits size to under 5MB (approx 7,000,000 base64 characters) to guard against resource exhaustion.
- **Chat Endpoint (`src/app/api/chat/route.ts`):** Validates chat histories, contexts, and prompt structures, rejecting payload structures that do not match the expected formats.

---

## 3. Serverless Rate Limiting

To prevent API abuse and curb excessive billings on third-party Gemini endpoint queries, we implement an IP-based token-bucket rate limiter.
- Requests are bucketed by the client's IP address (extracted from `x-forwarded-for`).
- Limits are capped at **15 requests per minute** per IP address. Exceeding this triggers a standard HTTP `429 Too Many Requests` status code.

---

## 4. Secure Response Headers

Our `next.config.ts` enforces modern HTTP response security headers for all client connections:

```ts
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];
```

These parameters prevent clickjacking (X-Frame-Options), force secure connections (HSTS), and block unauthorised scripts (CSP).

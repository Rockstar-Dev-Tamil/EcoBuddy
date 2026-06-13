# Security Policy

## Supported Versions

We actively support and patch the latest release of EcoBuddy AI.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please do not open a public GitHub issue. Instead, report it responsibly by emailing the maintainers.

### Email Guidelines

- **Email Address:** security@ecobuddy-sustainability.org
- **Subject:** Security Vulnerability Report: [Brief Summary]
- **Details to Include:**
  - Description of the vulnerability.
  - Detailed steps to reproduce the vulnerability (e.g. proof-of-concept payload, request headers).
  - Potential impact of the vulnerability.
  - Any proposed remediation steps.

We will acknowledge receipt of your report within 48 hours and work with you to coordinate a security patch and release timeline.

## Security Practices

We follow rigorous standards to keep EcoBuddy AI secure:
1. **Input Sanitization:** All text parameters logged or submitted to AI prompt environments are sanitized via DOMPurify to prevent Cross-Site Scripting (XSS) and prompt injection.
2. **Strict Zod Validations:** API routes strictly parse request bodies with schema contracts, validating types, boundaries, and sizes.
3. **Response Security Headers:** CSP, HSTS, frame-guards, and sniffing options are locked on all Next.js responses.
4. **Rate Limiting:** IP-based rate limiting safeguards chatbot paths against denial-of-service and bot farming.

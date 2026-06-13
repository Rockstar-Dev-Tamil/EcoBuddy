/**
 * sanitization.test.ts
 *
 * Unit tests for the server-side input validation logic in /api/scan and /api/chat.
 * We test the validation rules directly without spinning up an HTTP server.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Helper: replicate the scan route validation rules as pure functions so we
// can test them without needing a full Next.js request environment.
// ---------------------------------------------------------------------------

interface ScanValidationResult {
  valid: boolean;
  status?: number;
  error?: string;
  mimeType?: string;
  safeFilename?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const MAX_BASE64_CHARS = 7_000_000;

function validateScanInput(imageBase64: unknown, filename: unknown): ScanValidationResult {
  // 1. Presence + type check
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return { valid: false, status: 400, error: "imageBase64 is required and must be a string" };
  }

  // 2. Size guard
  if (imageBase64.length > MAX_BASE64_CHARS) {
    return { valid: false, status: 413, error: "Image payload exceeds the 5 MB limit" };
  }

  // 3. MIME type validation
  const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+);base64,/);
  if (!mimeMatch) {
    return { valid: false, status: 400, error: "Invalid image data URI format" };
  }

  const mimeType = mimeMatch[1].toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return {
      valid: false,
      status: 415,
      error: `Unsupported image type '${mimeType}'. Allowed: png, jpeg, webp, gif`,
    };
  }

  // 4. Filename sanitization
  const rawFilename: string = typeof filename === "string" ? filename : "upload";
  const safeFilename = rawFilename
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\.\./g, "_")
    .slice(0, 255);

  return { valid: true, mimeType, safeFilename };
}

// ---------------------------------------------------------------------------
// Helper: replicate the chat route sanitization logic
// ---------------------------------------------------------------------------

interface ChatValidationResult {
  valid: boolean;
  status?: number;
  error?: string;
  message?: string;
}

function validateChatInput(rawMessage: unknown): ChatValidationResult {
  if (!rawMessage || typeof rawMessage !== "string") {
    return { valid: false, status: 400, error: "Message is required and must be a string" };
  }

  const stripped = rawMessage.replace(/<[^>]*>/g, "").trim();
  const message = stripped.slice(0, 2_000);

  if (!message) {
    return { valid: false, status: 400, error: "Message cannot be empty after sanitization" };
  }

  return { valid: true, message };
}

// ===========================================================================
// Tests: Scan Route Validation
// ===========================================================================

describe("Scan API — Input Validation", () => {
  const validPng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScAAAAAElFTkSuQmCC";
  const validJpeg =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC";

  it("rejects a missing imageBase64", () => {
    const result = validateScanInput(undefined, "test.png");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it("rejects a non-string imageBase64", () => {
    const result = validateScanInput(12345, "test.png");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it("rejects a payload over 5 MB", () => {
    const oversized = "data:image/png;base64," + "A".repeat(7_000_001);
    const result = validateScanInput(oversized, "huge.png");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(413);
    expect(result.error).toContain("5 MB");
  });

  it("rejects a disallowed MIME type (PDF)", () => {
    const pdf = "data:application/pdf;base64,JVBERi0xLjQ=";
    const result = validateScanInput(pdf, "document.pdf");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(415);
    expect(result.error).toContain("application/pdf");
  });

  it("rejects a malformed data URI with no MIME declaration", () => {
    const result = validateScanInput("not-a-data-uri", "x.png");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it("accepts a valid PNG data URI", () => {
    const result = validateScanInput(validPng, "photo.png");
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/png");
  });

  it("accepts a valid JPEG data URI", () => {
    const result = validateScanInput(validJpeg, "snap.jpg");
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("sanitizes path traversal characters from filename", () => {
    const result = validateScanInput(validPng, "../../etc/passwd.png");
    expect(result.valid).toBe(true);
    expect(result.safeFilename).not.toContain("..");
    expect(result.safeFilename).not.toContain("/");
  });

  it("sanitizes shell-special characters from filename", () => {
    const result = validateScanInput(validPng, "file|name?.png");
    expect(result.valid).toBe(true);
    expect(result.safeFilename).not.toContain("|");
    expect(result.safeFilename).not.toContain("?");
  });

  it("truncates filenames longer than 255 characters", () => {
    const longName = "a".repeat(300) + ".png";
    const result = validateScanInput(validPng, longName);
    expect(result.valid).toBe(true);
    expect(result.safeFilename!.length).toBeLessThanOrEqual(255);
  });
});

// ===========================================================================
// Tests: Chat Route Input Sanitization
// ===========================================================================

describe("Chat API — Input Sanitization", () => {
  it("rejects a missing message", () => {
    const result = validateChatInput(undefined);
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it("rejects a non-string message", () => {
    const result = validateChatInput(42);
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it("strips HTML tags from the message", () => {
    const result = validateChatInput("<script>alert('xss')</script>Hello");
    expect(result.valid).toBe(true);
    expect(result.message).toBe("alert('xss')Hello");
    expect(result.message).not.toContain("<script>");
  });

  it("strips nested HTML without affecting text content", () => {
    const result = validateChatInput("<b>Bold</b> and <i>italic</i> text");
    expect(result.valid).toBe(true);
    expect(result.message).toBe("Bold and italic text");
  });

  it("clamps message to 2000 characters", () => {
    const long = "x".repeat(3_000);
    const result = validateChatInput(long);
    expect(result.valid).toBe(true);
    expect(result.message!.length).toBe(2_000);
  });

  it("accepts a normal message unmodified", () => {
    const msg = "How can I reduce my carbon footprint?";
    const result = validateChatInput(msg);
    expect(result.valid).toBe(true);
    expect(result.message).toBe(msg);
  });

  it("rejects a message that is only HTML tags (empty after strip)", () => {
    const result = validateChatInput("<br/><span></span>");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });
});

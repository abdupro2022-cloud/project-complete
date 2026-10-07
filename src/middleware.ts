/**
 * Access protection.
 *
 * Minimal HTTP Basic Auth, gated on env vars so it stays off by default in
 * local development and on in deployment:
 *
 *   ABDO_ACCESS_USER     required to enable protection
 *   ABDO_ACCESS_PASSWORD required to enable protection
 *
 * When either is missing, the app stays fully open (single-user desktop case).
 * When both are set, every page and API route requires the matching
 * credentials. Use a reverse proxy (or Vercel's password protection) for any
 * serious deployment; this layer is intentionally simple.
 */
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.ABDO_ACCESS_USER;
  const pass = process.env.ABDO_ACCESS_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = "";
    }
    const i = decoded.indexOf(":");
    const gotUser = i >= 0 ? decoded.slice(0, i) : decoded;
    const gotPass = i >= 0 ? decoded.slice(i + 1) : "";
    if (gotUser === user && gotPass === pass) return NextResponse.next();

    // Constant-time compare to avoid leaking which byte was wrong.
    const a = new TextEncoder().encode(decoded);
    const b = new TextEncoder().encode(`${user}:${pass}`);
    if (a.length === b.length && timingSafeEqual(a, b)) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ABDO Creator OS"' },
  });
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export const config = {
  // Apply to every route including API. Static assets are excluded so the
  // favicon and illustrations load without prompting.
  matcher: ["/((?!_next/static|_next/image|illustrations/|icon.svg).*)"],
};
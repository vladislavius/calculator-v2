import type { NextConfig } from "next";

// Derive Supabase hostname from env (falls back to wildcard for build-time safety)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
let supabaseHost = '*.supabase.co';
try {
  if (supabaseUrl) supabaseHost = new URL(supabaseUrl).hostname;
} catch {}

// ─── Content-Security-Policy ──────────────────────────────────────────────────
// Notes:
//  - 'unsafe-inline' in script-src is required by Next.js App Router (inline runtime).
//    A nonce-based strict CSP would be the ideal next step.
//  - img-src uses https: wildcard because boat photos can come from any HTTPS source.
//  - connect-src covers browser→Supabase calls still present in some admin pages.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
].join('; ');

// ─── Security headers applied to every response ───────────────────────────────
const securityHeaders = [
  { key: 'Content-Security-Policy',   value: CSP },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  // HSTS — only meaningful behind real HTTPS (not localhost)
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

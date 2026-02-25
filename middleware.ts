import { NextRequest, NextResponse } from 'next/server';

// ─── CORS middleware for /api/* routes ────────────────────────────────────────
// Allows only same-origin browser requests.
// Server-to-server calls (Vercel cron, internal fetches) carry no Origin header
// and pass through unchanged.

const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // server-to-server / same-origin requests that omit Origin

  const host    = req.headers.get('host') ?? '';
  const allowed = [APP_ORIGIN, `https://${host}`, `http://${host}`].filter(Boolean);
  return allowed.includes(origin);
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '';

  // Block cross-origin requests
  if (!isSameOrigin(req)) {
    console.warn(`[cors] Blocked cross-origin request: origin="${origin}" path="${req.nextUrl.pathname}"`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Handle CORS preflight for same-origin requests
  if (req.method === 'OPTIONS') {
    const host = req.headers.get('host') ?? '';
    const res  = new NextResponse(null, { status: 204 });
    res.headers.set('Access-Control-Allow-Origin',  origin || `https://${host}`);
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-session-token');
    res.headers.set('Access-Control-Max-Age',       '86400');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

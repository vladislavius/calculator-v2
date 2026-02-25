import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Read token from httpOnly cookie (primary) or request body (legacy)
    const cookieToken = req.cookies.get('os_token')?.value;
    let token = cookieToken;
    if (!token) {
      const body = await req.json().catch(() => ({}));
      token = body.token;
    }
    if (token) await sb.from('app_sessions').delete().eq('token', token);
    const response = NextResponse.json({ success: true });
    response.cookies.delete('os_token');
    return response;
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

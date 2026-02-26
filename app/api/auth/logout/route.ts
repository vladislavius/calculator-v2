import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Read token from httpOnly cookie (primary) or request body (legacy)
    const cookieToken = req.cookies.get('os_token')?.value;
    let token = cookieToken;
    if (!token) {
      const body = await req.json().catch(() => ({}));
      token = body.token;
    }
    if (token) await getSupabaseAdmin().from('app_sessions').delete().eq('token', token);
    const response = NextResponse.json({ success: true });
    response.cookies.delete('os_token');
    return response;
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

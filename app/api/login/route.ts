import { NextResponse } from 'next/server';

const PASSWORD = process.env.SITE_PASSWORD || 'calibrate2026!';

export async function POST(request: Request) {
  const { password } = await request.json();
  
  if (password === PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('adp_auth', 'authenticated', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  }
  
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}

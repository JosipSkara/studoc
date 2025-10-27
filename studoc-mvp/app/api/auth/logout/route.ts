
import { NextResponse } from 'next/server';

export async function POST() {
  const resp = NextResponse.redirect('http://localhost/');
  // Clear cookie
  resp.cookies.set('token', '', { httpOnly: true, expires: new Date(0), path: '/' });
  return resp;
}

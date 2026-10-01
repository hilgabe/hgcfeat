import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(`${request.nextUrl.origin}/login`, { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

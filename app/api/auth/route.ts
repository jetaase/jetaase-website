import { NextResponse } from "next/server";
import { signSession } from "@/lib/session";
import { COOKIE_NAME, getSessionTtlMs } from "@/lib/auth-cookie";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const ttl = getSessionTtlMs();
  const token = signSession(process.env.SESSION_SECRET ?? "", ttl);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: ttl / 1000,
  });
  return res;
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-cookie";
import { handleUpload } from "@/lib/admin-api";
import { repoFromEnv } from "@/lib/repo-env";

export async function POST(req: Request) {
  const authed = await requireSession();
  const body = authed ? await req.json().catch(() => null) : null;
  const r = await handleUpload({ fetchImpl: fetch, repo: repoFromEnv(), authed }, body);
  return NextResponse.json(r.body, { status: r.status });
}

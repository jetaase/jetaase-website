import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-cookie";
import { commitFile } from "@/lib/github";
import { EDITABLE_PATHS } from "@/lib/content";

export async function POST(req: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { path, content, message } = await req.json().catch(() => ({}));
  if (!path || typeof content !== "string" || !message) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!EDITABLE_PATHS.includes(path)) {
    return NextResponse.json({ error: "path not editable" }, { status: 403 });
  }
  try {
    const out = await commitFile(fetch, {
      owner: process.env.GITHUB_OWNER!, repo: process.env.GITHUB_REPO!,
      branch: process.env.GITHUB_BRANCH ?? "main", token: process.env.GITHUB_TOKEN!,
      path, contentUtf8: content, message,
    });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

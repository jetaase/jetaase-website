import { cookies } from "next/headers";
import { verifySession } from "./session";

export const COOKIE_NAME = "jetaase_session";
export const getSessionTtlMs = () => 1000 * 60 * 60 * 8; // 8h

export async function requireSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySession(process.env.SESSION_SECRET ?? "", token);
}

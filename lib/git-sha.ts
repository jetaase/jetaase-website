import { createHash } from "node:crypto";

// Git's blob id: sha1 of "blob <byte length>\0" + content. Lets the server
// compare a file it served against the same file on GitHub.
export function gitBlobSha(content: Uint8Array | string): string {
  const bytes = typeof content === "string" ? Buffer.from(content, "utf8") : Buffer.from(content);
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

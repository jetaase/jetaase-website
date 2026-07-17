const API = "https://api.github.com";

type Base = { owner: string; repo: string; path: string; branch: string; token: string };

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function buildPutBody(args: {
  contentUtf8: string; message: string; branch: string; sha?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    message: args.message,
    branch: args.branch,
    content: Buffer.from(args.contentUtf8, "utf8").toString("base64"),
  };
  if (args.sha) body.sha = args.sha;
  return body;
}

export async function getFileSha(
  fetchImpl: typeof fetch, a: Base,
): Promise<string | null> {
  const url = `${API}/repos/${a.owner}/${a.repo}/contents/${a.path}?ref=${a.branch}`;
  const res = await fetchImpl(url, { headers: headers(a.token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getFileSha failed: ${res.status}`);
  const data = await res.json();
  return data.sha as string;
}

export async function commitFile(
  fetchImpl: typeof fetch,
  a: Base & { contentUtf8: string; message: string },
): Promise<{ commitUrl: string }> {
  const sha = await getFileSha(fetchImpl, a);
  const url = `${API}/repos/${a.owner}/${a.repo}/contents/${a.path}`;
  const res = await fetchImpl(url, {
    method: "PUT",
    headers: { ...headers(a.token), "content-type": "application/json" },
    body: JSON.stringify(
      buildPutBody({ contentUtf8: a.contentUtf8, message: a.message, branch: a.branch, sha: sha ?? undefined }),
    ),
  });
  if (!res.ok) throw new Error(`commitFile failed: ${res.status}`);
  const data = await res.json();
  return { commitUrl: data.commit.html_url as string };
}

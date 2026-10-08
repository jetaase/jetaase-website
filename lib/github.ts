const API = "https://api.github.com";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// ── Git Data API: blobs, trees, and fast-forward ref updates ──

export type Repo = { owner: string; repo: string; branch: string; token: string };
export type TreeEntry =
  | { path: string; content: string }
  | { path: string; sha: string }
  | { path: string; sha: null };

const repoUrl = (r: Repo) => `${API}/repos/${r.owner}/${r.repo}`;
const jsonHeaders = (token: string) => ({ ...headers(token), "content-type": "application/json" });

export async function createBlob(fetchImpl: typeof fetch, r: Repo, base64: string): Promise<string> {
  const res = await fetchImpl(`${repoUrl(r)}/git/blobs`, {
    method: "POST", headers: jsonHeaders(r.token),
    body: JSON.stringify({ content: base64, encoding: "base64" }),
  });
  if (!res.ok) throw new Error(`createBlob failed: ${res.status}`);
  return (await res.json()).sha as string;
}

export async function getHeadSha(fetchImpl: typeof fetch, r: Repo): Promise<string> {
  const res = await fetchImpl(`${repoUrl(r)}/git/ref/heads/${r.branch}`, { headers: headers(r.token) });
  if (!res.ok) throw new Error(`getHeadSha failed: ${res.status}`);
  return (await res.json()).object.sha as string;
}

export async function getFileAt(
  fetchImpl: typeof fetch, r: Repo, path: string, ref: string,
): Promise<{ sha: string; text: string } | null> {
  const res = await fetchImpl(`${repoUrl(r)}/contents/${path}?ref=${ref}`, { headers: headers(r.token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getFileAt failed: ${res.status}`);
  const data = await res.json();
  return { sha: data.sha as string, text: Buffer.from(data.content ?? "", "base64").toString("utf8") };
}

export async function commitTree(
  fetchImpl: typeof fetch, r: Repo,
  args: { parent: string; entries: TreeEntry[]; message: string },
): Promise<{ sha: string; commitUrl: string }> {
  const parentRes = await fetchImpl(`${repoUrl(r)}/git/commits/${args.parent}`, { headers: headers(r.token) });
  if (!parentRes.ok) throw new Error(`commitTree parent failed: ${parentRes.status}`);
  const baseTree = (await parentRes.json()).tree.sha as string;

  const tree = args.entries.map((e) =>
    "content" in e
      ? { path: e.path, mode: "100644", type: "blob", content: e.content }
      : { path: e.path, mode: "100644", type: "blob", sha: e.sha },
  );
  const treeRes = await fetchImpl(`${repoUrl(r)}/git/trees`, {
    method: "POST", headers: jsonHeaders(r.token),
    body: JSON.stringify({ base_tree: baseTree, tree }),
  });
  if (!treeRes.ok) throw new Error(`commitTree tree failed: ${treeRes.status}`);
  const treeSha = (await treeRes.json()).sha as string;

  const commitRes = await fetchImpl(`${repoUrl(r)}/git/commits`, {
    method: "POST", headers: jsonHeaders(r.token),
    body: JSON.stringify({ message: args.message, tree: treeSha, parents: [args.parent] }),
  });
  if (!commitRes.ok) throw new Error(`commitTree commit failed: ${commitRes.status}`);
  const c = await commitRes.json();
  return { sha: c.sha as string, commitUrl: c.html_url as string };
}

export async function updateRef(
  fetchImpl: typeof fetch, r: Repo, commitSha: string,
): Promise<"ok" | "not-fast-forward"> {
  const res = await fetchImpl(`${repoUrl(r)}/git/refs/heads/${r.branch}`, {
    method: "PATCH", headers: jsonHeaders(r.token),
    body: JSON.stringify({ sha: commitSha, force: false }),
  });
  if (res.status === 422) return "not-fast-forward";
  if (!res.ok) throw new Error(`updateRef failed: ${res.status}`);
  return "ok";
}

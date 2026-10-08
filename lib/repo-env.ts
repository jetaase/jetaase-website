import type { Repo } from "./github";

export function repoFromEnv(): Repo {
  return {
    owner: process.env.GITHUB_OWNER!, repo: process.env.GITHUB_REPO!,
    branch: process.env.GITHUB_BRANCH ?? "main", token: process.env.GITHUB_TOKEN!,
  };
}

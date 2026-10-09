import { requireSession } from "@/lib/auth-cookie";
import { readElection, readRaw, ELECTIONS_PATH } from "@/lib/content";
import { gitBlobSha } from "@/lib/git-sha";
import ElectionEditor from "../ElectionEditor";

export default async function ElectionsAdminPage() {
  // The layout shows the login form; this guards the data too.
  if (!(await requireSession())) return null;
  return (
    <ElectionEditor
      initial={readElection()} path={ELECTIONS_PATH}
      base={{ [ELECTIONS_PATH]: gitBlobSha(readRaw("elections.json")) }}
    />
  );
}

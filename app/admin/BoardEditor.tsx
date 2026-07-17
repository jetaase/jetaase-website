"use client";
import { useState } from "react";
import type { BoardMember } from "@/lib/content";

export default function BoardEditor({ initial }: { initial: BoardMember[] }) {
  const [members, setMembers] = useState<BoardMember[]>(initial);
  const [status, setStatus] = useState("");

  function addMember() {
    const n = members.length + 1;
    setMembers([...members, {
      id: `m${Date.now()}`, name: "New Member", role: "Member",
      chapter: "GA", bio: "", photo: "/images/board-placeholder.png", order: n,
    }]);
  }
  function removeMember(id: string) {
    setMembers(members.filter((m) => m.id !== id));
  }
  async function save() {
    setStatus("Saving…");
    const res = await fetch("/api/github", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: "content/board.json",
        content: JSON.stringify(members, null, 2) + "\n",
        message: "chore(admin): update board members",
      }),
    });
    const data = await res.json();
    setStatus(res.ok ? `Committed: ${data.commitUrl}` : `Error: ${data.error}`);
  }

  return (
    <div>
      <ul>
        {members.map((m) => (
          <li key={m.id}>
            {m.name} — {m.role} ({m.chapter})
            <button onClick={() => removeMember(m.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={addMember}>Add member</button>
      <button onClick={save}>Save to GitHub</button>
      {status && <p>{status}</p>}
    </div>
  );
}

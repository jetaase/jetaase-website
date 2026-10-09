"use client";
import AdminButton from "./AdminButton";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.refresh();
    else setError("Incorrect password");
  }
  return (
    <form onSubmit={submit}>
      <label htmlFor="admin-password" className="visually-hidden">Admin password</label>
      <input
        id="admin-password" type="password" autoComplete="current-password"
        value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password"
      />
      <AdminButton type="submit" variant="primary" size="md">Sign in</AdminButton>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

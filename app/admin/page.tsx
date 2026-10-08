import { redirect } from "next/navigation";

// Old bookmarks of /admin land on the page used most.
export default function AdminPage() {
  redirect("/admin/events");
}

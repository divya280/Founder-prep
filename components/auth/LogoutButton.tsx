"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="border border-[#d9ded4] bg-white px-4 py-2 text-sm font-medium text-[#17201b] transition hover:border-[#427a5b] hover:text-[#427a5b] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Signing out..." : "Log out"}
    </button>
  );
}

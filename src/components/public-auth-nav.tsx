"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PublicUser = {
  name: string;
  email: string;
  role: string;
};

function toPublicUser(metadata: Record<string, unknown> | undefined, email: string | undefined) {
  if (!email) return null;
  const rawName = typeof metadata?.name === "string" ? metadata.name.trim() : "";
  const rawRole = metadata?.role;
  return {
    name: rawName || email.split("@")[0],
    email,
    role: typeof rawRole === "string" ? rawRole : "READER",
  } satisfies PublicUser;
}

export default function PublicAuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(toPublicUser(data.user?.user_metadata, data.user?.email));
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toPublicUser(session?.user?.user_metadata, session?.user?.email));
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      setSigningOut(false);
      router.refresh();
    }
  };

  if (!ready) {
    return <div className="h-9 w-24 rounded-lg bg-surface-container-low animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          Masuk
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm hover:bg-primary-container transition-colors"
        >
          Daftar
        </Link>
      </div>
    );
  }

  const area = "/katalog";
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Link
        href={area}
        className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
        title={user.email}
      >
        <span className="w-8 h-8 rounded-[999px] bg-primary text-on-primary grid place-items-center text-sm font-semibold">
          {initial}
        </span>
        <span className="hidden sm:inline max-w-[9rem] truncate">{user.name}</span>
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="text-sm text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
      >
        {signingOut ? "Keluar…" : "Keluar"}
      </button>
    </div>
  );
}

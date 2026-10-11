"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button className="button secondary" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </button>
  );
}

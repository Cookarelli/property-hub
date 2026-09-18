"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
export async function signIn(
  _previous: { error: string } | null,
  form: FormData,
): Promise<{ error: string } | null> {
  if (!supabaseConfig())
    return {
      error:
        "Production sign-in is not configured for this demo. You can explore all five demo personas below.",
    };
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(256) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Enter a valid email address and password." };
  const client = await createClient();
  try {
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error)
      return {
        error: "We couldn’t sign you in. Check your credentials and try again.",
      };
  } catch {
    return { error: "Sign-in is temporarily unavailable. Please try again." };
  }
  const next = String(form.get("returnTo") ?? "");
  redirect(/^\/invite\/[a-f0-9]{64}$/.test(next) ? next : "/workspace");
}
export async function signOut() {
  if (supabaseConfig()) {
    const client = await createClient();
    await client.auth.signOut();
  }
  redirect("/sign-in");
}

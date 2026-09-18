"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/components/organizations/action-form";
export async function createInvitedAccount(
  token: string,
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  if (!/^[a-f0-9]{64}$/.test(token))
    return { error: "This invitation link is invalid." };
  const origin = process.env.PROPERTY_HUB_APP_URL;
  if (!origin || !URL.canParse(origin))
    return {
      error:
        "Account creation needs the platform’s public URL configured. Contact your administrator.",
    };
  const parsed = z
    .object({ email: z.email(), password: z.string().min(12).max(128) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: "Enter a valid email and a password of at least 12 characters.",
    };
  const client = await createClient();
  const { error } = await client.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin.replace(/\/$/, "")}/auth/confirm?next=/invite/${token}`,
    },
  });
  if (error)
    return {
      error:
        "The account could not be created. Try signing in if you already have an account, or contact your administrator.",
    };
  return {
    success:
      "Check your email to verify your account, then return to this invitation and sign in. Creating an account alone does not grant organization access.",
  };
}

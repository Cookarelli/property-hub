import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "";
  const target = /^\/invite\/[a-f0-9]{64}$/.test(next) ? next : "/workspace";
  if (code) {
    const client = await createClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(target, url.origin));
  }
  return NextResponse.redirect(new URL("/sign-in", url.origin));
}

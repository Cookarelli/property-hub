"use client";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function SignInForm({
  configured,
  returnTo,
}: {
  configured: boolean;
  returnTo?: string;
}) {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <div className="auth-card">
      <LockKeyhole className="text-primary" size={28} />
      <h1>Welcome back.</h1>
      <p>Sign in to your organization’s secure workspace.</p>
      <form action={action} className="form-grid">
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <label>
          Email address
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
          />
        </label>
        {state?.error && (
          <p className="error-message" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending || !configured}>
          {pending ? "Signing in…" : "Sign in"}
          <ArrowRight size={16} />
        </Button>
      </form>
      {!configured && (
        <p className="auth-note mt-4">
          Production sign-in is not connected in this demo. Explore Property Hub
          with a fictional account below.
        </p>
      )}
      <div className="auth-divider" />
      <p className="mb-4">Just looking around? Make yourself at home.</p>
      <Button asChild variant="outline" className="w-full">
        <Link href="/demo/owner">
          Explore Demo Mode <ArrowRight size={16} />
        </Link>
      </Button>
    </div>
  );
}

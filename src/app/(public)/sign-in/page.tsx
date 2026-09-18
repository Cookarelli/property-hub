import { SignInForm } from "@/components/sign-in-form";
import { supabaseConfig } from "@/lib/supabase/config";
export const metadata = { title: "Sign in" };
export default function SignInPage() {
  return (
    <section className="auth-page">
      <SignInForm configured={Boolean(supabaseConfig())} />
    </section>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { SignInForm } from "@/components/sign-in-form";
import { OrganizationActionForm } from "@/components/organizations/action-form";
import { acceptOrganizationInvitation } from "@/lib/organizations/onboarding-actions";
import { createInvitedAccount } from "@/lib/organizations/invitation-auth";
export const dynamic = "force-dynamic";
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const configured = !!supabaseConfig();
  const user = configured
    ? (await (await createClient()).auth.getUser()).data.user
    : null;
  return (
    <main id="main-content" className="public-section max-w-3xl">
      <h1 className="mb-4 text-3xl">Join your organization</h1>
      <p className="mb-6 text-muted-foreground">
        Use the exact email address that received this invitation. Your email
        must be verified before joining.
      </p>
      {user ? (
        <>
          <p className="mb-5 text-sm">Signed in as {user.email}</p>
          <OrganizationActionForm
            action={acceptOrganizationInvitation.bind(null, token)}
            fields={[]}
            confirmation="Accept the organization membership assigned to this email address."
            submitLabel="Accept invitation"
          />
        </>
      ) : (
        <>
          <SignInForm configured={configured} returnTo={`/invite/${token}`} />
          {configured && (
            <details className="mt-6 rounded-md border p-5">
              <summary className="cursor-pointer py-2 font-medium">
                New here? Create your account
              </summary>
              <div className="mt-5">
                <OrganizationActionForm
                  action={createInvitedAccount.bind(null, token)}
                  fields={[
                    {
                      name: "email",
                      label: "Invited email",
                      type: "email",
                      required: true,
                    },
                    {
                      name: "password",
                      label: "Password (at least 12 characters)",
                      type: "password",
                      required: true,
                    },
                  ]}
                  submitLabel="Create account"
                />
              </div>
            </details>
          )}
        </>
      )}
    </main>
  );
}

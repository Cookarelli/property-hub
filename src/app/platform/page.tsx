import { companyFields } from "@/lib/organizations/setup-fields";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { PageHeading, Panel, Status, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/auth/actions";
import { OrganizationActionForm } from "@/components/organizations/action-form";
import {
  createOrganization,
  updateOrganizationLifecycle,
  savePlatformConfiguration,
} from "@/lib/organizations/actions";
export const dynamic = "force-dynamic";
export default async function PlatformPage() {
  const { client } = await requireSuperAdmin();
  const [orgs, config] = await Promise.all([
    client
      .from("organizations")
      .select("id,name,slug,status,subscription_status")
      .order("name"),
    client
      .from("platform_configuration")
      .select("value")
      .eq("key", "general")
      .maybeSingle(),
  ]);
  if (orgs.error || config.error)
    throw new Error("Platform administration is temporarily unavailable.");
  const general = config.data?.value;
  const values =
    general && typeof general === "object" && !Array.isArray(general)
      ? general
      : {};
  return (
    <>
      <header className="public-header">
        <Brand />
        <Link href="/workspace" className="text-sm underline">
          My organizations
        </Link>
        <form action={signOut}>
          <Button variant="outline">Sign out</Button>
        </form>
      </header>
      <main id="main-content" className="public-section">
        <PageHeading
          eyebrow="Platform administration"
          title="Organizations"
          description="Manage company access and platform configuration."
          action={<Status>super admin</Status>}
        />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="grid content-start gap-4">
            {orgs.data.length ? (
              orgs.data.map((org) => (
                <Panel
                  key={org.id}
                  title={org.name}
                  subtitle={`/${org.slug}`}
                  action={<Status>{org.status}</Status>}
                >
                  <Link
                    className="block p-5 font-medium underline"
                    href={`/platform/${org.id}`}
                  >
                    Open organization setup →
                  </Link>
                  <details className="p-5">
                    <summary className="cursor-pointer py-2 font-medium">
                      Organization access & subscription
                    </summary>
                    <div className="mt-4">
                      <OrganizationActionForm
                        action={updateOrganizationLifecycle.bind(null, org.id)}
                        submitLabel="Save organization status"
                        confirmation="I understand that deactivating this organization immediately removes its members’ access. Records are retained."
                        fields={[
                          {
                            name: "status",
                            label: "Organization access",
                            value: org.status,
                            options: [
                              "draft",
                              "setup",
                              "ready",
                              "active",
                              "suspended",
                            ],
                          },
                          {
                            name: "subscription_status",
                            label: "Subscription status",
                            value: org.subscription_status,
                            options: [
                              "trial",
                              "active",
                              "past_due",
                              "canceled",
                            ],
                          },
                        ]}
                      />
                    </div>
                  </details>
                </Panel>
              ))
            ) : (
              <EmptyState
                title="No organizations yet"
                description="Create the first organization to begin onboarding."
              />
            )}
          </div>
          <div className="grid content-start gap-6">
            <Panel title="Create organization">
              <div className="p-5">
                <OrganizationActionForm
                  action={createOrganization}
                  submitLabel="Create organization"
                  fields={companyFields(undefined, true)}
                />
              </div>
            </Panel>
            <Panel title="Platform configuration">
              <div className="p-5">
                <OrganizationActionForm
                  action={savePlatformConfiguration}
                  submitLabel="Save platform configuration"
                  fields={[
                    {
                      name: "platform_name",
                      label: "Platform name",
                      required: true,
                      value:
                        typeof values.platform_name === "string"
                          ? values.platform_name
                          : "Property Hub",
                    },
                    {
                      name: "support_email",
                      label: "Support email",
                      type: "email",
                      required: true,
                      value:
                        typeof values.support_email === "string"
                          ? values.support_email
                          : "",
                    },
                  ]}
                />
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </>
  );
}

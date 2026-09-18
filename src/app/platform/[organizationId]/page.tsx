import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { PageHeading, Panel, Status } from "@/components/shared";
import { OrganizationActionForm } from "@/components/organizations/action-form";
import { FeatureControls } from "@/components/organizations/feature-controls";
import {
  companyFields,
  propertyFields,
  unitFields,
} from "@/lib/organizations/setup-fields";
import {
  featureEnabled,
  featureKeys,
  lifecycleStatuses,
  type FeatureFlags,
} from "@/lib/organizations/features";
import {
  saveSetupCompany,
  saveSetupProperty,
  saveSetupUnit,
  saveSetupFeatures,
  inviteOrganizationStaff,
  revokeOrganizationInvitation,
  markSetupDecision,
} from "@/lib/organizations/onboarding-actions";
import { updateOrganizationLifecycle } from "@/lib/organizations/actions";
export const dynamic = "force-dynamic";
async function readRequestTime() {
  return Date.now();
}
export default async function OrganizationSetup({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const checkedAt = await readRequestTime();
  const id = (await params).organizationId;
  if (!z.uuid().safeParse(id).success) notFound();
  const { client } = await requireSuperAdmin();
  const [org, properties, units, plans, buildings, invitations, gaps] =
    await Promise.all([
      client.from("organizations").select("*").eq("id", id).single(),
      client
        .from("properties")
        .select("*")
        .eq("organization_id", id)
        .order("name"),
      client
        .from("units")
        .select("*")
        .eq("organization_id", id)
        .order("number"),
      client.from("floor_plans").select("*").eq("organization_id", id),
      client.from("buildings").select("*").eq("organization_id", id),
      client
        .from("organization_invitations")
        .select("id,email,role,accepted_at,revoked_at,expires_at")
        .eq("organization_id", id)
        .order("created_at", { ascending: false }),
      client.rpc("organization_onboarding_gaps", { p_org: id }),
    ]);
  if (org.error || !org.data) notFound();
  if (
    properties.error ||
    units.error ||
    plans.error ||
    buildings.error ||
    invitations.error ||
    gaps.error
  )
    throw new Error("Organization setup could not be loaded.");
  const o = org.data;
  const missing = gaps.data;
  const steps = [
    { label: "Create organization", done: true, anchor: "company" },
    {
      label: "Upload branding",
      done: !missing.includes("Company branding and contacts"),
      anchor: "company",
    },
    {
      label: "Add properties",
      done: !missing.includes("A complete published property"),
      anchor: "properties",
    },
    {
      label: "Add units",
      done: !missing.includes("Units"),
      anchor: "properties",
    },
    {
      label: "Invite staff",
      done: !missing.includes("An accepted owner or admin invitation"),
      anchor: "staff",
    },
    {
      label: "Configure resident portal",
      done: !missing.includes("Resident portal configuration"),
      anchor: "features",
    },
    {
      label: "Configure maintenance",
      done: !missing.includes("Maintenance configuration"),
      anchor: "features",
    },
    {
      label: "Connect payment system",
      done: !!o.payments_deferred_at,
      anchor: "payments",
      note: "Integration unavailable; explicitly defer for now.",
    },
    {
      label: "Review public website",
      done: !missing.includes("Public website review"),
      anchor: "review",
    },
    {
      label: "Activate organization",
      done: o.status === "active",
      anchor: "activation",
    },
  ];
  return (
    <main id="main-content" className="public-section">
      <Link className="mb-5 inline-block underline" href="/platform">
        ← All organizations
      </Link>
      <PageHeading
        eyebrow="Customer onboarding"
        title={o.name}
        description={`/${o.slug} · ${o.plan} plan`}
        action={<Status>{o.status}</Status>}
      />
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside>
          <Panel title="Setup checklist">
            <ol className="p-4 space-y-4">
              {steps.map((step, i) => (
                <li key={step.label} className="text-sm">
                  <Link href={`#${step.anchor}`} className="flex gap-2">
                    <span aria-label={step.done ? "Complete" : "Incomplete"}>
                      {step.done ? "✓" : `${i + 1}.`}
                    </span>
                    <span>
                      {step.label}
                      {step.note && (
                        <span className="block text-xs text-muted-foreground">
                          {step.note}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
        <div className="grid gap-6">
          <div id="company">
            <Panel title="Company & branding">
              <div className="p-6">
                <p className="mb-4 text-sm text-muted-foreground">
                  A logo is optional; your company name serves as a wordmark.
                  The organization address is fixed to preserve links.
                </p>
                <OrganizationActionForm
                  action={saveSetupCompany.bind(null, id)}
                  fields={companyFields(o)}
                  submitLabel="Save company"
                />
              </div>
            </Panel>
          </div>
          <div id="properties">
            <Panel title="Properties & units">
              <div className="p-6 space-y-5">
                {properties.data.map((p) => (
                  <details key={p.id} className="rounded-md border p-4">
                    <summary className="cursor-pointer py-2 font-medium">
                      {p.name} ·{" "}
                      {units.data.filter((u) => u.property_id === p.id).length}{" "}
                      units
                    </summary>
                    <div className="mt-5">
                      <OrganizationActionForm
                        action={saveSetupProperty.bind(null, id, p.id)}
                        fields={propertyFields(id, p)}
                        submitLabel="Save property"
                      />
                    </div>
                    <h3 className="mt-8 mb-4 font-semibold">Units</h3>
                    {units.data
                      .filter((u) => u.property_id === p.id)
                      .map((u) => (
                        <details key={u.id} className="border-t py-3">
                          <summary className="cursor-pointer py-2">
                            Unit {u.number} · {u.status} · $
                            {(u.rent_cents / 100).toLocaleString()}/month
                          </summary>
                          <div className="py-4">
                            <OrganizationActionForm
                              action={saveSetupUnit.bind(null, id, p.id, u.id)}
                              fields={unitFields(
                                id,
                                u,
                                plans.data.find(
                                  (f) => f.id === u.floor_plan_id,
                                ),
                                buildings.data.find(
                                  (b) => b.id === u.building_id,
                                )?.name,
                              )}
                              submitLabel="Save unit"
                            />
                          </div>
                        </details>
                      ))}
                    <details className="mt-4 border-t py-3">
                      <summary className="cursor-pointer py-2 font-medium">
                        Add a unit
                      </summary>
                      <div className="mt-4">
                        <OrganizationActionForm
                          action={saveSetupUnit.bind(null, id, p.id, null)}
                          fields={unitFields(id)}
                          submitLabel="Add unit"
                        />
                      </div>
                    </details>
                  </details>
                ))}
                <details
                  className="rounded-md border p-4"
                  open={!properties.data.length}
                >
                  <summary className="cursor-pointer py-2 font-medium">
                    Add a property
                  </summary>
                  <div className="mt-5">
                    <OrganizationActionForm
                      action={saveSetupProperty.bind(null, id, null)}
                      fields={propertyFields(id)}
                      submitLabel="Add property"
                    />
                  </div>
                </details>
              </div>
            </Panel>
          </div>
          <div id="staff">
            <Panel title="Invite staff">
              <div className="p-6">
                <OrganizationActionForm
                  action={inviteOrganizationStaff.bind(null, id)}
                  fields={[
                    {
                      name: "email",
                      label: "Staff email",
                      type: "email",
                      required: true,
                    },
                    {
                      name: "role",
                      label: "Organization role",
                      value: "owner",
                      options: [
                        "owner",
                        "admin",
                        "property_manager",
                        "maintenance",
                        "leasing",
                        "staff",
                      ],
                    },
                  ]}
                  submitLabel="Create invitation link"
                />
                <p className="my-5 text-sm text-muted-foreground">
                  An owner or admin must accept their invitation before
                  activation. Invitations require the exact verified email,
                  expire after seven days, and work once.
                </p>
                <ul className="space-y-3">
                  {invitations.data.map((invite) => (
                    <li key={invite.id} className="border-t py-3">
                      <p className="text-sm">
                        {invite.email} · {invite.role} ·{" "}
                        {invite.accepted_at
                          ? "Accepted"
                          : invite.revoked_at
                            ? "Revoked"
                            : Date.parse(invite.expires_at) < checkedAt
                              ? "Expired"
                              : "Pending"}
                      </p>
                      {!invite.accepted_at && !invite.revoked_at && (
                        <details className="mt-2 text-sm">
                          <summary className="cursor-pointer py-2">
                            Revoke invitation
                          </summary>
                          <OrganizationActionForm
                            action={revokeOrganizationInvitation.bind(
                              null,
                              id,
                              invite.id,
                            )}
                            fields={[]}
                            submitLabel="Revoke invitation"
                            confirmation="This unused invitation will stop working."
                          />
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </div>
          <div id="features">
            <Panel title="Plan, resident portal & maintenance">
              <div className="p-6">
                <OrganizationActionForm
                  action={saveSetupFeatures.bind(null, id)}
                  fields={[]}
                  submitLabel="Save feature configuration"
                >
                  <FeatureControls
                    initialPlan={o.plan}
                    initialFlags={
                      Object.fromEntries(
                        featureKeys.map((key) => [key, featureEnabled(o, key)]),
                      ) as FeatureFlags
                    }
                  />
                </OrganizationActionForm>
              </div>
            </Panel>
          </div>
          <div id="payments">
            <Panel title="Payment system">
              <div className="p-6">
                <p className="mb-4 text-sm">
                  Payment integration is not yet available. Resident demo
                  payments remain simulated. Record an explicit decision to
                  defer this step; activation will not suggest a provider is
                  connected.
                </p>
                <OrganizationActionForm
                  action={markSetupDecision.bind(
                    null,
                    id,
                    "payments_deferred_at",
                  )}
                  fields={[]}
                  confirmation="Proceed without payment collection. No funds will be processed."
                  submitLabel="Defer payment integration"
                />
              </div>
            </Panel>
          </div>
          <div id="review">
            <Panel title="Review the customer website">
              <div className="p-6">
                <Link className="underline" href={`/platform/${id}/preview`}>
                  Open private website preview →
                </Link>
                <p className="mt-3 text-sm text-muted-foreground">
                  The preview shows the current company, property and unit
                  configuration. It is available only to platform
                  administrators.
                </p>
                <p className="mt-3 text-sm">
                  Public address:{" "}
                  <Link className="underline" href={`/sites/${o.slug}`}>
                    /sites/{o.slug}
                  </Link>
                </p>
              </div>
            </Panel>
          </div>
          <div id="activation">
            <Panel title="Activate organization">
              <div className="p-6">
                {missing.length > 0 ? (
                  <>
                    <p className="mb-2 font-medium">
                      Complete these items first:
                    </p>
                    <ul className="mb-5 list-disc pl-5 text-sm">
                      {missing.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mb-5 text-sm">
                    The onboarding checklist is complete. You can mark this
                    organization ready or activate its workspace and enabled
                    public website.
                  </p>
                )}
                <OrganizationActionForm
                  action={updateOrganizationLifecycle.bind(null, id)}
                  fields={[
                    {
                      name: "status",
                      label: "Organization status",
                      value: o.status,
                      options: [...lifecycleStatuses],
                    },
                    {
                      name: "subscription_status",
                      label: "Subscription status (no billing)",
                      value: o.subscription_status,
                      options: ["trial", "active", "past_due", "canceled"],
                    },
                  ]}
                  confirmation="I reviewed this organization’s configuration and intend to change its access status."
                  submitLabel="Save organization status"
                />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}

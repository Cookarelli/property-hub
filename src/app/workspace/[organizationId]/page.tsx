import { featureEnabled } from "@/lib/organizations/features";
import { getOwnResidentRecords } from "@/lib/organizations/repository";
import { requireMembership } from "@/lib/auth";
import { EmptyState, PageHeading, Panel, Status } from "@/components/shared";
export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const { client, membership } = await requireMembership(organizationId);
  if (membership.role === "resident") {
    const own = await getOwnResidentRecords(organizationId);
    return (
      <>
        <PageHeading
          title={
            own.resident
              ? `Welcome, ${own.resident.name}`
              : "Your resident account"
          }
          description="Your personal records"
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="Payments">
            <div className="p-5 space-y-3">
              {own.payments.length ? (
                own.payments.map((payment) => (
                  <p key={payment.id}>
                    {payment.due_on} ·{" "}
                    {(payment.amount_cents / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}{" "}
                    · {payment.status}
                  </p>
                ))
              ) : (
                <p>No payment records available.</p>
              )}
            </div>
          </Panel>
          {featureEnabled(own.organization, "maintenance_tracking") && (
            <Panel title="Maintenance">
              <div className="p-5 space-y-3">
                {own.requests.length ? (
                  own.requests.map((request) => (
                    <p key={request.id}>
                      {request.title} · {request.status}
                    </p>
                  ))
                ) : (
                  <p>No maintenance requests.</p>
                )}
              </div>
            </Panel>
          )}
        </div>
      </>
    );
  }
  const [
    { data: organization, error: orgError },
    { data: properties, error: propertyError },
  ] = await Promise.all([
    client
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single(),
    client
      .from("properties")
      .select("id,name,address,city,published")
      .eq("organization_id", organizationId)
      .order("name"),
  ]);
  if (orgError || propertyError)
    throw new Error("Could not load this organization.");
  return (
    <>
      <PageHeading
        title={organization.name}
        description="Live organization data, protected by your membership."
        action={<Status>{membership.role}</Status>}
      />
      <p className="auth-note mb-6">
        Your production workspace is connected. This foundation provides
        authenticated organization selection, scoped records, and company
        settings. The full management and resident workflows are available for
        review in Demo Mode while production integrations are completed.
      </p>
      {properties.length ? (
        <div className="property-grid">
          {properties.map((p) => (
            <Panel key={p.id}>
              <div className="p-6">
                <h2 className="text-xl mb-3">{p.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {p.address}, {p.city}
                </p>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No properties available to your account"
          description="Your authorized properties will appear here when your organization adds them."
        />
      )}
    </>
  );
}

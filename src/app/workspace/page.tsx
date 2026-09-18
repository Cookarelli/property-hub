import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageHeading, EmptyState, Panel } from "@/components/shared";
export default async function WorkspacePage() {
  const { client, user } = await requireUser();
  const { data: memberships, error } = await client
    .from("organization_memberships")
    .select("organization_id,role")
    .eq("user_id", user.id);
  if (error) throw new Error("Could not load organization memberships.");
  const { data: organizations, error: orgError } = await client
    .from("organizations")
    .select("id,name")
    .eq("status", "active")
    .in(
      "id",
      (memberships ?? []).map((m) => m.organization_id),
    );
  if (orgError) throw new Error("Could not load organizations.");
  const { data: platformMembership } = await client
    .from("platform_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();
  return (
    <>
      {platformMembership && (
        <Link className="mb-5 block underline" href="/platform">
          Open platform administration →
        </Link>
      )}
      <PageHeading
        title="Your organizations"
        description="Choose the workspace you want to open."
      />
      {organizations?.length ? (
        <div className="grid gap-4">
          {organizations.map((org) => (
            <Panel key={org.id}>
              <Link
                className="block p-6 font-medium"
                href={`/workspace/${org.id}`}
              >
                {org.name} →
              </Link>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            memberships?.length
              ? "Your workspace is not available yet"
              : "Your account is ready"
          }
          description={
            memberships?.length
              ? "Your membership is saved. Your administrator will let you know when the organization is active."
              : "Accept your organization’s staff invitation to join its workspace."
          }
        />
      )}
    </>
  );
}

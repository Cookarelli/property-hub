import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { getOrganizationCatalog } from "@/lib/organizations/catalog";
import { TenantWebsite } from "@/components/organizations/tenant-website";
import { OrganizationActionForm } from "@/components/organizations/action-form";
import { markSetupDecision } from "@/lib/organizations/onboarding-actions";
export const dynamic = "force-dynamic";
export default async function Preview({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId: id } = await params;
  const { client } = await requireSuperAdmin();
  const { data } = await client
    .from("organizations")
    .select("slug")
    .eq("id", id)
    .single();
  if (!data) notFound();
  return (
    <>
      <div className="public-section py-5">
        <Link className="underline" href={`/platform/${id}`}>
          ← Return to setup
        </Link>
      </div>
      <TenantWebsite
        preview
        catalog={await getOrganizationCatalog(data.slug, true)}
      />
      <section className="public-section border-t">
        <h2 className="mb-4 text-xl">Website review</h2>
        <OrganizationActionForm
          action={markSetupDecision.bind(null, id, "public_reviewed_at")}
          fields={[]}
          confirmation="I reviewed the company identity, listings, rent, contact information and enabled features."
          submitLabel="Mark website reviewed"
        />
      </section>
    </>
  );
}

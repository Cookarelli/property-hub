import { getOrganizationCatalog } from "@/lib/organizations/catalog";
import { TenantWebsite } from "@/components/organizations/tenant-website";
export const dynamic = "force-dynamic";
export default async function CustomerWebsite({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  return (
    <TenantWebsite
      catalog={await getOrganizationCatalog((await params).organizationSlug)}
    />
  );
}

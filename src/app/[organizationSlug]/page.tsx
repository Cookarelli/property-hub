import { redirect } from "next/navigation";
import { requireOrganizationSlug } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function OrganizationEntry({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organization } = await requireOrganizationSlug(
    (await params).organizationSlug,
  );
  redirect(`/workspace/${organization.id}`);
}

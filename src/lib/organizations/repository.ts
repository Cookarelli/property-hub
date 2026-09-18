import "server-only";
import { sectionFeatures, featureEnabled } from "./features";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import {
  mayAccessSection,
  scopeToOrganization,
  type OrganizationSection,
} from "./policy";

// Authentication and membership are rechecked for every server request. A URL,
// client-provided role, demo cookie, or organization ID alone grants no access.
export async function getOrganizationRecords(
  organizationId: string,
  section: OrganizationSection,
) {
  const context = await requireMembership(organizationId);
  if (
    !mayAccessSection(context.membership.role, section) ||
    section === "settings" ||
    (sectionFeatures[section] &&
      !featureEnabled(context.organization, sectionFeatures[section]!))
  )
    notFound();
  const table =
    section === "maintenance"
      ? "maintenance_requests"
      : section === "staff"
        ? "organization_memberships"
        : section;
  const query = scopeToOrganization(
    context.client.from(table).select("*"),
    context.organization.id,
  );
  if (section === "staff")
    query.in("role", [
      "owner",
      "admin",
      "property_manager",
      "staff",
      "maintenance",
      "leasing",
    ]);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Could not load organization records.");
  const rows: Record<string, unknown>[] = data ?? [];
  if (section === "staff") {
    const ids = rows.map((row) => String(row.user_id));
    if (ids.length) {
      const { data: profiles, error: profileError } = await context.client
        .from("users")
        .select("id,full_name,email")
        .in("id", ids);
      if (profileError) throw new Error("Could not load the staff directory.");
      for (const row of rows) {
        const profile = profiles?.find((p) => p.id === row.user_id);
        if (profile)
          Object.assign(row, {
            full_name: profile.full_name,
            email: profile.email,
          });
      }
    }
  }
  return { ...context, rows };
}
export async function getOwnResidentRecords(organizationId: string) {
  const context = await requireMembership(organizationId, ["resident"]);
  const { data: resident, error } = await scopeToOrganization(
    context.client.from("residents").select("*"),
    context.organization.id,
  )
    .eq("user_id", context.user.id)
    .maybeSingle();
  if (error) throw new Error("Could not load your resident profile.");
  if (!resident)
    return { ...context, resident: null, payments: [], requests: [] };
  const [payments, requests] = await Promise.all([
    scopeToOrganization(
      context.client.from("payments").select("id,amount_cents,status,due_on"),
      context.organization.id,
    )
      .eq("resident_id", resident.id)
      .order("due_on", { ascending: false })
      .limit(24),
    scopeToOrganization(
      context.client.from("maintenance_requests").select("id,title,status"),
      context.organization.id,
    )
      .eq("resident_id", resident.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (payments.error || requests.error)
    throw new Error("Could not load your resident records.");
  return {
    ...context,
    resident,
    payments: payments.data,
    requests: requests.data,
  };
}

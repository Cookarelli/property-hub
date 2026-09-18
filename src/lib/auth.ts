import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { hasAllowedRole, organizationSlug } from "@/lib/organizations/policy";
import { featureEnabled } from "@/lib/organizations/features";
import type { Role } from "@/lib/types";
export const requireUser = cache(async () => {
  if (!supabaseConfig()) redirect("/sign-in?reason=setup");
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  return { client, user: data.user };
});
export const requireMembership = cache(
  async (organizationId: string, allowedRoles?: Role[]) => {
    if (!z.uuid().safeParse(organizationId).success) notFound();
    const { client, user } = await requireUser();
    const { data: membership, error } = await client
      .from("organization_memberships")
      .select("organization_id,role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();
    if (
      error ||
      !membership ||
      (allowedRoles && !hasAllowedRole(membership.role, allowedRoles))
    )
      notFound();
    const { data: organization, error: orgError } = await client
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .eq("status", "active")
      .single();
    if (orgError || !organization) notFound();
    if (
      membership.role === "resident" &&
      !featureEnabled(organization, "resident_portal")
    )
      notFound();
    return { client, user, membership, organization };
  },
);

export const requireSuperAdmin = cache(async () => {
  const { client, user } = await requireUser();
  const { data, error } = await client
    .from("platform_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .single();
  if (error || !data) notFound();
  return { client, user };
});
export const requireOrganizationSlug = cache(async (slug: string) => {
  if (!organizationSlug.safeParse(slug).success) notFound();
  const { client } = await requireUser();
  const { data, error } = await client
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .eq("status", "active")
    .single();
  if (error || !data) notFound();
  return requireMembership(data.id);
});

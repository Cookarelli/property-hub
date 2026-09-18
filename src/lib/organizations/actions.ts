"use server";
import { companySetupSchema } from "./onboarding-schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMembership, requireSuperAdmin } from "@/lib/auth";
import { brandingSchema, lifecycleSchema, scopeToOrganization } from "./policy";
import type { ActionResult } from "@/components/organizations/action-form";
export async function saveOrganizationBranding(
  id: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, organization } = await requireMembership(id, [
    "owner",
    "admin",
  ]);
  const parsed = brandingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data, error } = await client
    .from("organizations")
    .update(parsed.data)
    .eq("id", organization.id)
    .select("id")
    .single();
  if (error || !data)
    return { error: "Your changes could not be saved. Please try again." };
  revalidatePath(`/workspace/${organization.id}`, "layout");
  return { success: "Organization branding and contact information saved." };
}
export async function saveOrganizationSettings(
  id: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, organization } = await requireMembership(id, [
    "owner",
    "admin",
  ]);
  const timezone = z
    .string()
    .max(80)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid time zone, such as America/Chicago.")
    .safeParse(form.get("timezone"));
  if (!timezone.success) return { error: timezone.error.issues[0].message };
  // The unique organization key makes an authorized upsert safe on a newly provisioned tenant.
  const { error } = await client
    .from("organization_settings")
    .upsert(
      { organization_id: organization.id, timezone: timezone.data },
      { onConflict: "organization_id" },
    );
  if (error) return { error: "Settings could not be saved." };
  revalidatePath(`/workspace/${organization.id}/settings`);
  return { success: "Organization settings saved." };
}
export async function createOrganization(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client } = await requireSuperAdmin();
  const parsed = companySetupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data, error } = await client
    .from("organizations")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error)
    return {
      error:
        error.code === "23505"
          ? "That organization address is already in use."
          : "The organization could not be created.",
    };
  revalidatePath("/platform");
  return {
    success: "Organization created as a private draft. Continue setup below.",
    href: `/platform/${data.id}`,
    linkLabel: "Continue organization setup",
  };
}
export async function updateOrganizationLifecycle(
  id: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client } = await requireSuperAdmin();
  if (!z.uuid().safeParse(id).success || form.get("confirmed") !== "on")
    return { error: "Confirm the organization access change." };
  const parsed = lifecycleSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Choose a valid organization and subscription status." };
  const { data, error } = await client
    .from("organizations")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data)
    return {
      error:
        "Organization status could not be changed. Complete the onboarding checklist before marking it ready or active.",
    };
  revalidatePath("/platform");
  revalidatePath(`/platform/${id}`);
  revalidatePath(`/workspace/${id}`, "layout");
  return { success: "Organization status saved." };
}
export async function savePlatformConfiguration(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client } = await requireSuperAdmin();
  const parsed = z
    .object({
      support_email: z.email().max(254),
      platform_name: z.string().trim().min(2).max(160),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await client
    .from("platform_configuration")
    .upsert({ key: "general", value: parsed.data }, { onConflict: "key" });
  if (error) return { error: "Platform configuration could not be saved." };
  revalidatePath("/platform");
  return { success: "Platform configuration saved." };
}
export async function loadOrganizationSettings(id: string) {
  const { client, organization } = await requireMembership(id, [
    "owner",
    "admin",
  ]);
  const { data, error } = await scopeToOrganization(
    client.from("organization_settings").select("timezone"),
    organization.id,
  ).maybeSingle();
  if (error) throw new Error("Could not load organization settings.");
  return data;
}

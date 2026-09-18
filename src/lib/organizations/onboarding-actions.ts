"use server";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { brandingSchema } from "./policy";
import {
  propertySetupSchema,
  unitSetupSchema,
  featuresSchema,
  inquirySchema,
} from "./onboarding-schema";
import { featureDefinitions, featureKeys } from "./features";
import type { ActionResult } from "@/components/organizations/action-form";
async function setup(id: string) {
  const { client, user } = await requireSuperAdmin();
  if (!z.uuid().safeParse(id).success) throw new Error("Invalid organization.");
  const { data: organization, error } = await client
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !organization) throw new Error("Organization not found.");
  return { client, user, organization };
}
function refresh(id: string, slug: string) {
  revalidatePath(`/platform/${id}`);
  revalidatePath("/platform");
  revalidatePath(`/sites/${slug}`);
  revalidatePath(`/workspace/${id}`, "layout");
}
export async function saveSetupCompany(
  id: string,
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, organization } = await setup(id);
  const parsed = brandingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await client
    .from("organizations")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: "Company details could not be saved." };
  refresh(id, organization.slug);
  return {
    success:
      "Company details saved. Review the website again before publishing.",
  };
}
export async function saveSetupProperty(
  id: string,
  propertyId: string | null,
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, organization } = await setup(id);
  const parsed = propertySetupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const result = propertyId
    ? await client
        .from("properties")
        .update(parsed.data)
        .eq("organization_id", id)
        .eq("id", z.uuid().parse(propertyId))
        .select("id")
        .single()
    : await client
        .from("properties")
        .insert({
          ...parsed.data,
          organization_id: id,
          slug: `property-${randomUUID().slice(0, 8)}`,
        })
        .select("id")
        .single();
  if (result.error)
    return {
      error: "Property could not be saved. Check its details and try again.",
    };
  refresh(id, organization.slug);
  return {
    success:
      "Property saved. It stays private until the organization website is reviewed and activated.",
  };
}
export async function saveSetupUnit(
  id: string,
  propertyId: string,
  unitId: string | null,
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, organization } = await setup(id);
  const parsed = unitSetupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!unitId && parsed.data.status === "occupied")
    return {
      error:
        "Add an available or turnover unit. Occupancy is established through a real lease.",
    };
  const { error } = await client.rpc("configure_organization_unit", {
    p_org: id,
    p_property: z.uuid().parse(propertyId),
    p_unit: unitId ? z.uuid().parse(unitId) : null,
    p_data: parsed.data,
  });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "This unit number already exists in the property."
          : "The unit could not be saved. Occupied units must remain linked to an active lease.",
    };
  refresh(id, organization.slug);
  return { success: "Unit and floor plan saved." };
}
export async function saveSetupFeatures(
  id: string,
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, organization } = await setup(id);
  const parsed = featuresSchema.safeParse({
    plan: form.get("plan"),
    features: Object.fromEntries(
      featureKeys.map((key) => [
        key,
        featureDefinitions[key].available && form.get(key) === "on",
      ]),
    ),
  });
  if (!parsed.success) return { error: "Choose a valid plan and features." };
  const { error } = await client
    .from("organizations")
    .update({
      ...parsed.data,
      portal_configured_at: new Date().toISOString(),
      maintenance_configured_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "Feature configuration could not be saved." };
  refresh(id, organization.slug);
  return { success: "Plan and features saved. No billing has been initiated." };
}
export async function markSetupDecision(
  id: string,
  decision: "payments_deferred_at" | "public_reviewed_at",
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, organization } = await setup(id);
  if (form.get("confirmed") !== "on")
    return { error: "Confirm your decision." };
  // Fixed allowlist: a client cannot choose an arbitrary organization column.
  if (!["payments_deferred_at", "public_reviewed_at"].includes(decision))
    return { error: "Unknown setup step." };
  const { error } = await client
    .from("organizations")
    .update(
      decision === "public_reviewed_at"
        ? { public_reviewed_at: new Date().toISOString() }
        : { payments_deferred_at: new Date().toISOString() },
    )
    .eq("id", id);
  if (error) return { error: "Your decision could not be saved." };
  refresh(id, organization.slug);
  return {
    success:
      decision === "payments_deferred_at"
        ? "Payments are deferred. No provider is connected and no money will be processed."
        : "Website review recorded. Activation remains a separate step.",
  };
}
export async function inviteOrganizationStaff(
  id: string,
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, user, organization } = await setup(id);
  const parsed = z
    .object({
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      role: z.enum([
        "owner",
        "admin",
        "property_manager",
        "maintenance",
        "leasing",
        "staff",
      ]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const token = randomBytes(32).toString("hex");
  const { error } = await client
    .from("organization_invitations")
    .insert({
      organization_id: id,
      ...parsed.data,
      invited_by: user.id,
      token_hash: createHash("sha256").update(token).digest("hex"),
    });
  if (error) return { error: "Invitation could not be created." };
  refresh(id, organization.slug);
  return {
    success:
      "Invitation created for seven days. Share this link with the intended colleague; no email has been sent automatically.",
    href: `/invite/${token}`,
    linkLabel: "Open or copy staff invitation",
  };
}
export async function revokeOrganizationInvitation(
  id: string,
  invitationId: string,
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, organization } = await setup(id);
  if (form.get("confirmed") !== "on")
    return { error: "Confirm revoking this invitation." };
  const { error } = await client
    .from("organization_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("organization_id", id)
    .eq("id", z.uuid().parse(invitationId));
  if (error) return { error: "Invitation could not be revoked." };
  refresh(id, organization.slug);
  return { success: "Invitation revoked." };
}
export async function acceptOrganizationInvitation(
  token: string,
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client } = await requireUser();
  if (form.get("confirmed") !== "on" || !/^[a-f0-9]{64}$/.test(token))
    return { error: "Confirm joining the organization." };
  const { error } = await client.rpc("accept_organization_invitation", {
    p_hash: createHash("sha256").update(token).digest("hex"),
  });
  if (error)
    return {
      error:
        "This invitation is expired, used, revoked, or belongs to another email. Sign in with the invited, verified email address.",
    };
  revalidatePath("/workspace");
  return {
    success:
      "Invitation accepted. Your workspace becomes available when the organization is active.",
    href: "/workspace",
    linkLabel: "View my organizations",
  };
}
export async function uploadOrganizationPhoto(
  id: string,
  form: FormData,
): Promise<{ url?: string; error?: string }> {
  const { client } = await setup(id);
  const file = form.get("photo");
  if (
    !(file instanceof File) ||
    file.size > 2 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    return { error: "Choose a JPEG, PNG or WebP image up to 2 MB." };
  let buffer: Buffer;
  try {
    const input = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 20000000,
    });
    const metadata = await input.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? ""))
      throw new Error();
    buffer = await input
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    if (buffer.byteLength > 2097152) throw new Error();
  } catch {
    return {
      error: "This image could not be read. Try a smaller JPEG, PNG or WebP.",
    };
  }
  const path = `${id}/${randomUUID()}.webp`;
  const { error } = await client.storage
    .from("organization-marketing")
    .upload(path, buffer, { contentType: "image/webp", upsert: false });
  if (error)
    return {
      error:
        "Upload is unavailable. Apply the Storage migration in your configured Supabase project, or use an HTTPS image address.",
    };
  const saved = await client
    .from("organization_assets")
    .insert({ organization_id: id, path });
  if (saved.error) {
    await client.storage.from("organization-marketing").remove([path]);
    return { error: "The image could not be registered. Please try again." };
  }
  return { url: `/api/organization-media/${path}` };
}
export async function submitOrganizationInquiry(
  slug: string,
  propertyId: string,
  requestId: string,
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = inquirySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const client = await createClient();
  const { error } = await client.rpc("capture_organization_lead", {
    p_slug: slug,
    p_property: z.uuid().parse(propertyId),
    p_request: z.uuid().parse(requestId),
    p_payload: parsed.data,
  });
  if (error)
    return {
      error:
        "Your inquiry could not be sent. Please contact the property office or try again later.",
    };
  return {
    success:
      "Thank you. The property team has received your inquiry and will follow up using your contact details.",
  };
}

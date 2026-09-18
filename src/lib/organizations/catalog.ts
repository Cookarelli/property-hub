import "server-only";
import { z } from "zod";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { requireSuperAdmin } from "@/lib/auth";
const catalogSchema = z.object({
  organization: z.object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    logo_url: z.string().nullable(),
    primary_color: z.string(),
    secondary_color: z.string(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    website: z.string().nullable(),
    address: z.string().nullable(),
    features: z.object({
      property_listings: z.boolean(),
      availability: z.boolean(),
      lead_capture: z.boolean(),
      resident_portal: z.boolean(),
    }),
  }),
  properties: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      description: z.string(),
      image: z.string(),
      photos: z.array(z.string()),
      amenities: z.array(z.string()),
      office_hours: z.string(),
      office_phone: z.string(),
      office_email: z.string(),
      emergency_phone: z.string(),
    }),
  ),
  units: z.array(
    z.object({
      id: z.uuid(),
      property_id: z.uuid(),
      number: z.string(),
      rent_cents: z.number(),
      deposit_cents: z.number(),
      available_on: z.string().nullable(),
      photos: z.array(z.string()),
      floor_plan: z.string(),
      bedrooms: z.number(),
      bathrooms: z.number(),
      sqft: z.number(),
    }),
  ),
});
export type OrganizationCatalog = z.infer<typeof catalogSchema>;
export async function getOrganizationCatalog(slug: string, preview = false) {
  if (!supabaseConfig()) notFound();
  if (preview) await requireSuperAdmin();
  const client = await createClient();
  const { data, error } = await client.rpc("organization_catalog", {
    p_slug: slug,
    p_preview: preview,
  });
  if (error) throw new Error("The company website is temporarily unavailable.");
  if (!data) notFound();
  return catalogSchema.parse(data);
}

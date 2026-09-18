import { z } from "zod";
import { brandingSchema, organizationSlug } from "./policy";
import { featureKeys, plans } from "./features";
export const companySetupSchema = brandingSchema.extend({
  slug: organizationSlug,
});
const picture = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) =>
      (/^https:\/\/[^\s]+$/.test(v) && URL.canParse(v)) ||
      /^\/(?!\/)[^\s\\]+$/.test(v),
    "Use an HTTPS image address or an uploaded image.",
  );
export const photoList = z
  .string()
  .max(24000)
  .transform((v) =>
    v
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .pipe(z.array(picture).max(12));
export const propertySetupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(250),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(50),
  zip: z.string().trim().min(3).max(20),
  description: z.string().trim().min(10).max(4000),
  image: picture,
  photos: photoList,
  amenities: z
    .string()
    .max(2000)
    .transform((v) =>
      v
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(100)).max(30)),
  office_hours: z.string().trim().max(250),
  office_phone: z.string().trim().min(7).max(40),
  office_email: z.union([z.email().max(254), z.literal("")]),
  emergency_phone: z.string().trim().min(7).max(40),
  published: z.enum(["true", "false"]).transform((v) => v === "true"),
});
const money = z.coerce
  .number()
  .finite()
  .min(0)
  .max(1000000)
  .transform((v) => Math.round(v * 100));
export const unitSetupSchema = z
  .object({
    number: z.string().trim().min(1).max(30),
    building: z.string().trim().min(1).max(100),
    floor_plan: z.string().trim().min(1).max(100),
    bedrooms: z.coerce.number().int().min(0).max(20),
    bathrooms: z.coerce.number().min(0.5).max(20).multipleOf(0.5),
    sqft: z.coerce.number().int().min(100).max(50000),
    rent_cents: money,
    deposit_cents: money,
    status: z.enum(["available", "turnover", "occupied"]),
    available_on: z.union([z.iso.date(), z.literal("")]),
    photos: photoList,
  })
  .refine((v) => v.status !== "available" || !!v.available_on, {
    message: "Choose an availability date.",
    path: ["available_on"],
  });
export const featuresSchema = z.object({
  plan: z.enum(plans),
  features: z.record(
    z.enum(
      featureKeys as [
        (typeof featureKeys)[number],
        ...(typeof featureKeys)[number][],
      ],
    ),
    z.boolean(),
  ),
});
export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z.string().trim().min(7).max(40),
  message: z.string().trim().max(2000),
  desired_move_in: z.union([z.iso.date(), z.literal("")]),
});

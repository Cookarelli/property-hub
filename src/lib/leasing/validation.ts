import { z } from "zod";
import { floorPlans, properties, units } from "@/lib/demo/data";
import { leasingDate } from "./catalog";

const text = (max: number) => z.string().trim().max(max);
const date = z.iso
  .date()
  .refine(
    (value) => value >= leasingDate && value <= "2027-09-17",
    "Choose a date between September 17, 2026 and September 17, 2027.",
  );
const common = {
  requestId: z.uuid(),
  propertyId: z.uuid(),
  unitId: z.union([z.uuid(), z.literal("")]),
  floorPlanId: z.union([z.uuid(), z.literal("")]),
  firstName: text(60).min(1, "Enter your first name."),
  lastName: text(60).min(1, "Enter your last name."),
  email: z.email("Enter a valid email address.").max(254),
  phone: text(30)
    .regex(/^[+\d().\s-]{7,30}$/, "Enter a valid phone number.")
    .refine(
      (v) => v.replace(/\D/g, "").length >= 7,
      "Enter a valid phone number.",
    ),
  message: text(2000),
  website: z.literal(""),
};
export const intakeSchema = z
  .discriminatedUnion("kind", [
    z
      .object({
        ...common,
        kind: z.literal("application"),
        moveIn: date,
        occupants: z.number().int().min(1).max(12),
        pets: z.enum(["none", "cat", "dog", "multiple", "other"]),
      })
      .strict(),
    z
      .object({
        ...common,
        kind: z.literal("tour"),
        date,
        time: z.enum(["10:00", "12:00", "14:00", "16:00"]),
      })
      .strict(),
  ])
  .superRefine((data, ctx) => {
    if (
      data.kind === "tour" &&
      new Date(`${data.date}T12:00:00Z`).getUTCDay() === 0
    )
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message:
          "Tours are available Monday through Saturday. Please choose another day.",
      });
    const property = properties.find(
      (p) => p.id === data.propertyId && p.published,
    );
    if (!property)
      ctx.addIssue({
        code: "custom",
        path: ["propertyId"],
        message: "Choose a listed community.",
      });
    const unit = units.find(
      (u) =>
        u.id === data.unitId &&
        u.property_id === data.propertyId &&
        u.status === "available",
    );
    if (data.unitId && !unit)
      ctx.addIssue({
        code: "custom",
        path: ["unitId"],
        message: "Choose an available apartment at this community.",
      });
    if (
      data.floorPlanId &&
      !floorPlans.some(
        (p) =>
          p.id === data.floorPlanId &&
          p.property_id === data.propertyId &&
          (!unit || unit.floor_plan_id === p.id),
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["floorPlanId"],
        message: "Choose a floor plan at this community.",
      });
    if (data.kind === "application" && !data.unitId && !data.floorPlanId)
      ctx.addIssue({
        code: "custom",
        path: ["floorPlanId"],
        message: "Choose an apartment or floor plan.",
      });
    if (
      data.kind === "application" &&
      unit?.available_on &&
      data.moveIn < unit.available_on
    )
      ctx.addIssue({
        code: "custom",
        path: ["moveIn"],
        message: `This apartment is available from ${unit.available_on}.`,
      });
  });
export type LeasingIntake = z.infer<typeof intakeSchema>;
export type IntakeRecord = {
  id: string;
  kind: "application" | "tour";
  created_at: string;
  payload: LeasingIntake;
  lead_id: string | null;
  tour_request_id: string | null;
};

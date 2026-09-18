import { z } from "zod";
export const maintenanceStatuses = [
  "open",
  "scheduled",
  "in_progress",
  "completed",
] as const;
export const maintenanceCategories = [
  "Plumbing",
  "Electrical",
  "Heating / Cooling",
  "Appliance",
  "Door / Lock",
  "Laundry",
  "Pest",
  "Common Area",
  "Other",
] as const;
export const statusLabels = {
  open: "Submitted",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
} as const;
export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string().max(255),
  mime: z.string(),
  size: z.number().int().positive(),
  key: z.string(),
});
export const maintenanceEventSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  status: z.enum(maintenanceStatuses),
  body: z.string().max(2000),
  at: z.string(),
  author: z.string(),
  scheduledFor: z.string().optional(),
});
export const requestDetailsSchema = z.object({
  pets: z.boolean().default(false),
  petNotes: z.string().max(300).default(""),
  accessDate: z.string().default(""),
  accessTime: z.string().default("Contact me to arrange"),
  contactPreference: z
    .enum(["Email", "Text message", "Phone", "Portal"])
    .default("Email"),
  attachments: z.array(attachmentSchema).max(5).default([]),
  createdAt: z.string().optional(),
});
export const paymentReceiptSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  amountCents: z.number().int().positive(),
  paidAt: z.string(),
  method: z.string(),
  simulated: z.literal(true),
  status: z.literal("paid"),
});
export type ResidentAttachment = z.infer<typeof attachmentSchema>;
export type MaintenanceEvent = z.infer<typeof maintenanceEventSchema>;
export type RequestDetails = z.infer<typeof requestDetailsSchema>;
export type PaymentReceipt = z.infer<typeof paymentReceiptSchema>;

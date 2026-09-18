import { z } from "zod";
export const leadStatuses = [
  "New",
  "Contacted",
  "Tour Scheduled",
  "Applied",
  "Approved",
  "Leased",
  "Lost",
] as const;
export const applicationStatuses = [
  "draft",
  "submitted",
  "in_review",
  "approved",
  "declined",
  "withdrawn",
] as const;
export const applicationLabels = {
  draft: "Started",
  submitted: "Submitted",
  in_review: "Under Review",
  approved: "Approved",
  declined: "Denied",
  withdrawn: "Withdrawn",
} as const;
export const activitySchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  at: z.string(),
  actor: z.string(),
  propertyId: z.string().nullable().optional(),
  href: z.string().optional(),
});
export const scopedAnnouncementSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(10).max(3000),
  property_id: z.string().nullable().optional(),
  building_id: z.string().nullable().optional(),
  category: z.string().optional(),
  published_at: z.string().optional(),
});
export const managementDocumentSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(2).max(120),
  category: z.string(),
  property_id: z.string().nullable(),
  building_id: z.string().nullable(),
  visibility: z.enum(["staff", "community", "assigned"]),
  residentIds: z.array(z.string()),
  created_at: z.string(),
});
export const managementStateSchema = z.object({
  leadStatuses: z.record(z.string(), z.enum(leadStatuses)).optional(),
  applicationStatuses: z
    .record(z.string(), z.enum(applicationStatuses))
    .optional(),
  maintenanceAssignments: z
    .record(z.string(), z.string().nullable())
    .optional(),
  internalNotes: z
    .array(
      z.object({
        id: z.string(),
        requestId: z.string(),
        body: z.string().trim().min(1).max(2000),
        author: z.string(),
        at: z.string(),
      }),
    )
    .optional(),
  managementDocuments: z.array(managementDocumentSchema).optional(),
  documentAssignments: z.record(z.string(), z.array(z.string())).optional(),
  demoActivity: z.array(activitySchema).optional(),
});
export type DemoActivity = z.infer<typeof activitySchema>;
export type ManagementDocument = z.infer<typeof managementDocumentSchema>;

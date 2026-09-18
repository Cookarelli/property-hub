"use client";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import {
  maintenanceEventSchema,
  maintenanceStatuses,
  paymentReceiptSchema,
  requestDetailsSchema,
} from "@/lib/resident/schema";
import { localAttachmentProvider } from "@/lib/resident/attachments";
import {
  managementStateSchema,
  scopedAnnouncementSchema,
} from "@/lib/management/schema";
import { activityForChange } from "./activity";
import { personas } from "@/lib/navigation";
const key = "property-hub-demo-v1";
const schema = z.object({
  demoGuide: z.boolean().optional(),
  demoVisited: z
    .array(z.enum(["manager-review", "resident-update", "owner-overview"]))
    .optional(),
  demoResetAt: z.iso.datetime().optional(),
  ...managementStateSchema.shape,
  residentReceipts: z.array(paymentReceiptSchema).optional(),
  residentEmail: z.email().optional(),
  residentNotifications: z
    .object({
      community: z.boolean(),
      maintenance: z.boolean(),
      payment: z.boolean(),
    })
    .optional(),
  residentMessages: z
    .array(
      z.object({
        id: z.string(),
        subject: z.string(),
        message: z.string().max(2000),
        preference: z.string(),
        createdAt: z.string(),
      }),
    )
    .optional(),
  requestDetails: z.record(z.string(), requestDetailsSchema).optional(),
  maintenanceEvents: z.array(maintenanceEventSchema).optional(),
  savedUnitId: z.string().optional(),
  applicationSubmitted: z.boolean().optional(),
  tourDate: z.string().optional(),
  application: z
    .object({
      name: z.string(),
      email: z.string(),
      moveIn: z.string(),
      monthlyIncome: z.number().optional(),
      unitId: z.string(),
      phone: z.string().max(30).optional(),
      occupants: z.number().int().min(1).max(12).optional(),
      pets: z.string().max(100).optional(),
    })
    .optional(),
  tourUnitId: z.string().optional(),
  inquiryMessages: z
    .array(
      z.object({
        name: z.string(),
        email: z.string(),
        community: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
  profileName: z.string().optional(),
  maintenanceProfile: z
    .object({ name: z.string(), phone: z.string(), preference: z.string() })
    .optional(),
  profilePhone: z.string().optional(),
  contactPreference: z.string().optional(),
  maintenanceStatuses: z
    .record(z.string(), z.enum(maintenanceStatuses))
    .optional(),
  tickets: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        priority: z.enum(["low", "normal", "high", "urgent"]),
        permission: z.boolean(),
      }),
    )
    .optional(),
  announcements: z.array(scopedAnnouncementSchema).optional(),
  inquiries: z.number().optional(),
  organizationName: z.string().optional(),
});
export type DemoState = z.infer<typeof schema>;
function subscribe(callback: () => void) {
  window.addEventListener(key, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(key, callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot() {
  try {
    return sessionStorage.getItem(key) ?? "{}";
  } catch {
    return "{}";
  }
}
function parse(raw: string): DemoState {
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}
export function useDemoState() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  function update(patch: Partial<DemoState>) {
    const previous = parse(snapshot());
    const next = schema.parse({ ...previous, ...patch });
    const actor =
      personas.find((p) => window.location.pathname.startsWith("/demo/" + p.id))
        ?.name ?? "Demo visitor";
    const events = activityForChange(previous, next, actor);
    if (events.length)
      next.demoActivity = [...events, ...(previous.demoActivity ?? [])].slice(
        0,
        200,
      );
    sessionStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event(key));
  }
  function reset() {
    const attachments = Object.values(
      parse(snapshot()).requestDetails ?? {},
    ).flatMap((detail) => detail.attachments.map((file) => file.key));
    void localAttachmentProvider.remove(attachments).catch(() => {
      /* Browser storage may be unavailable; the demo can still reset. */
    });
    // A tab-local cutoff hides earlier public demo inquiries without deleting
    // database rows, changing another tab, or touching production cookies.
    sessionStorage.setItem(
      key,
      JSON.stringify({ demoResetAt: new Date().toISOString() }),
    );
    window.dispatchEvent(new Event(key));
  }
  return { state: parse(raw), update, reset, hydrated };
}

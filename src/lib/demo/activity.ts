import type { DemoState } from "./store";
import type { DemoActivity } from "@/lib/management/schema";
import {
  applications,
  properties,
  units,
  maintenanceRequests,
  residents,
} from "./data";
export function activityForChange(
  previous: DemoState,
  next: DemoState,
  actor: string,
): DemoActivity[] {
  const result: DemoActivity[] = [];
  const add = (
    type: string,
    title: string,
    description: string,
    href: string,
    propertyId: string | null = properties[0].id,
  ) =>
    result.push({
      id: crypto.randomUUID(),
      type,
      title,
      description,
      href,
      propertyId,
      actor,
      at: new Date().toISOString(),
    });
  for (const ticket of next.tickets ?? [])
    if (!previous.tickets?.some((t) => t.id === ticket.id))
      add(
        "maintenance.created",
        "Maintenance submitted",
        ticket.title,
        "maintenance",
      );
  for (const event of next.maintenanceEvents ?? [])
    if (!previous.maintenanceEvents?.some((e) => e.id === event.id))
      add(
        "maintenance.status_changed",
        "Maintenance status changed",
        event.body,
        "maintenance",
        maintenanceRequests.find((r) => r.id === event.requestId)
          ?.property_id ?? properties[0].id,
      );
  for (const receipt of next.residentReceipts ?? [])
    if (!previous.residentReceipts?.some((r) => r.id === receipt.id))
      add(
        "payment.simulated",
        "Rent payment simulated",
        residents[0].name + " · Fictional payment recorded",
        "residents/" + residents[0].id,
      );
  if (
    next.applicationSubmitted &&
    (!previous.applicationSubmitted ||
      JSON.stringify(next.application) !== JSON.stringify(previous.application))
  )
    add(
      "application.submitted",
      "Application submitted",
      next.application?.name ?? applications[0].name,
      "applications",
      units.find((u) => u.id === next.application?.unitId)?.property_id ??
        properties[0].id,
    );
  if (
    next.tourDate &&
    (next.tourDate !== previous.tourDate ||
      next.tourUnitId !== previous.tourUnitId)
  )
    add(
      "tour.requested",
      "Tour requested",
      next.tourDate,
      "leads",
      units.find((u) => u.id === next.tourUnitId)?.property_id ??
        properties[0].id,
    );
  for (const a of next.announcements ?? [])
    if (!previous.announcements?.some((p) => p.id === a.id))
      add(
        "announcement.created",
        "Announcement created",
        a.title,
        "announcements",
        a.property_id ?? null,
      );
  for (const [id, status] of Object.entries(next.applicationStatuses ?? {}))
    if (status !== previous.applicationStatuses?.[id])
      add(
        "application.status_changed",
        "Application workflow updated",
        (id === applications[0].id
          ? (next.application?.name ?? applications[0].name)
          : (applications.find((a) => a.id === id)?.name ?? "Applicant")) +
          " · " +
          status.replaceAll("_", " "),
        "applications",
        (id === applications[0].id
          ? units.find((u) => u.id === next.application?.unitId)?.property_id
          : undefined) ??
          applications.find((a) => a.id === id)?.property_id ??
          null,
      );
  for (const [id, status] of Object.entries(next.leadStatuses ?? {}))
    if (status !== previous.leadStatuses?.[id])
      add(
        "lead.status_changed",
        "Lead pipeline updated",
        "Stage changed to " + status,
        "leads",
        null,
      );
  return result;
}

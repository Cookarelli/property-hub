import {
  announcementsForResident,
  documentsForResident,
} from "@/lib/management/data";
import {
  documents,
  leases,
  maintenanceUpdates,
  payments,
  properties,
  residents,
  residentUnit,
} from "@/lib/demo/data";
import type { DemoState } from "@/lib/demo/store";
import type { MaintenanceRequest } from "@/lib/types";
import type { MaintenanceEvent, RequestDetails } from "./schema";
export const resident = residents[0];
export const residentLease = leases.find(
  (l) => l.unit_id === residentUnit.id && l.status === "active",
)!;
export const residentProperty = properties.find(
  (p) => p.id === residentUnit.property_id,
)!;
export const residentDocuments = documents.filter(
  (d) =>
    (!d.resident_id || d.resident_id === resident.id) &&
    (!d.property_id || d.property_id === residentProperty.id),
);
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(date.length === 10 ? `${date}T12:00:00Z` : date));
export function residentLedger(state: DemoState) {
  return payments
    .filter((p) => p.resident_id === resident.id)
    .map((p) => {
      const receipt = state.residentReceipts?.find((r) => r.invoiceId === p.id);
      return receipt
        ? {
            ...p,
            status: "paid" as const,
            paid_at: receipt.paidAt,
            method: receipt.method,
          }
        : p;
    })
    .sort((a, b) => b.due_on.localeCompare(a.due_on));
}
export function residentAnnouncements(state: DemoState) {
  return announcementsForResident(state, resident.id);
}
export function getResidentDocuments(state: DemoState) {
  return documentsForResident(state, resident.id);
}
export function requestDetails(
  request: MaintenanceRequest,
  state: DemoState,
): RequestDetails {
  return (
    state.requestDetails?.[request.id] ?? {
      pets: false,
      petNotes: "",
      accessDate: request.status === "completed" ? "" : "2026-09-18",
      accessTime: "10 AM–12 PM",
      contactPreference: "Email",
      attachments: [],
      createdAt: request.created_at,
    }
  );
}
export function requestEvents(
  request: MaintenanceRequest,
  state: DemoState,
): MaintenanceEvent[] {
  const submitted: MaintenanceEvent = {
    id: `${request.id}-submitted`,
    requestId: request.id,
    status: "open",
    body: "Your request was received. The team will review the details and arrange the next step.",
    author: "Property Hub",
    at: request.created_at,
  };
  const seed = maintenanceUpdates
    .filter(
      (u) => u.maintenance_request_id === request.id && u.status !== "open",
    )
    .map((u) => ({
      id: u.id,
      requestId: request.id,
      status: u.status,
      body: u.body,
      at: u.created_at,
      author: "Marcus · Maintenance",
    }));
  const events = [
    submitted,
    ...seed,
    ...(state.maintenanceEvents ?? []).filter(
      (e) => e.requestId === request.id,
    ),
  ];
  if (!events.some((e) => e.status === request.status))
    events.push({
      id: `${request.id}-legacy`,
      requestId: request.id,
      status: request.status,
      body: `The team updated this request.`,
      author: "Management · Demo",
      at: request.updated_at,
    });
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

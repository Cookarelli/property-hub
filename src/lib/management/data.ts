import {
  activityEvents,
  announcements,
  applications,
  base,
  documents,
  leads,
  leases,
  leaseResidents,
  payments,
  properties,
  residents,
  units,
  uuid,
} from "@/lib/demo/data";
import { getMaintenance } from "@/lib/demo/selectors";
import type { DemoState } from "@/lib/demo/store";
import type { IntakeRecord } from "@/lib/leasing/validation";
import type { DemoActivity, ManagementDocument } from "./schema";
import { demoStory } from "@/lib/demo/story";
export const demoPeriod = "2026-09";
export const renewalCutoff = "2026-11-16";
export const leaseForUnit = (id: string) =>
  leases.find((l) => l.unit_id === id && l.status === "active");
export const leaseForResident = (id: string) =>
  leases.find(
    (l) =>
      l.status === "active" &&
      leaseResidents.some(
        (lr) => lr.lease_id === l.id && lr.resident_id === id,
      ),
  );
export const unitForResident = (id: string) =>
  units.find((u) => u.id === leaseForResident(id)?.unit_id);
export const residentsForUnit = (id: string) =>
  residents.filter((r) => leaseForResident(r.id)?.unit_id === id);
export function portfolioPayments(state: DemoState) {
  return payments.map((p) => {
    const receipt = state.residentReceipts?.find((r) => r.invoiceId === p.id);
    return receipt
      ? {
          ...p,
          status: "paid" as const,
          paid_at: receipt.paidAt,
          method: receipt.method,
        }
      : p;
  });
}
export function getApplications(state: DemoState) {
  return applications.map((a, i) => {
    const override = i === 0 ? state.application : undefined;
    const unit = units.find((u) => u.id === (override?.unitId ?? a.unit_id))!;
    return {
      ...a,
      property_id: unit.property_id,
      unit_id: unit.id,
      name: override?.name ?? a.name,
      email: override?.email ?? a.email,
      desired_move_in: override?.moveIn ?? a.desired_move_in,
      phone: override?.phone ?? a.phone,
      occupants: override?.occupants ?? a.occupants,
      pets: override?.pets ?? a.pets,
      status:
        state.applicationStatuses?.[a.id] ??
        (i === 0 && state.applicationSubmitted ? "submitted" : a.status),
    };
  });
}
export function getLeads(state: DemoState, intakes: IntakeRecord[] = []) {
  const applicant = getApplications(state)[0];
  const storyLead =
    state.tourDate || state.applicationSubmitted
      ? [
          {
            ...base(17, 1000),
            id: demoStory.leadId,
            property_id: state.applicationSubmitted
              ? applicant.property_id
              : (units.find((unit) => unit.id === state.tourUnitId)
                  ?.property_id ?? demoStory.unit.property_id),
            unit_id: state.applicationSubmitted
              ? applicant.unit_id
              : (state.tourUnitId ?? demoStory.unit.id),
            name: applicant.name,
            email: applicant.email,
            phone: applicant.phone,
            desired_move_in: applicant.desired_move_in,
            source: "Applicant demo",
            interested_bedrooms: 2,
            status: state.applicationSubmitted
              ? ("Applied" as const)
              : ("New" as const),
          },
        ]
      : [];
  const added = intakes.map((record) => ({
    ...base(17, 0),
    id: record.lead_id ?? record.id,
    property_id: record.payload.propertyId,
    unit_id: record.payload.unitId || null,
    name: record.payload.firstName + " " + record.payload.lastName,
    email: record.payload.email,
    phone: record.payload.phone,
    desired_move_in:
      record.payload.kind === "application" ? record.payload.moveIn : null,
    source:
      record.kind === "tour"
        ? "Website · Tour request"
        : "Website · Application inquiry",
    status: "New" as const,
    interested_bedrooms: 0,
    created_at: record.created_at,
  }));
  return [...storyLead, ...added, ...leads].map((l) => ({
    ...l,
    status: state.leadStatuses?.[l.id] ?? l.status,
  }));
}
export function portfolioMetrics(
  state: DemoState,
  propertyId = "",
  intakes: IntakeRecord[] = [],
) {
  const inventory = units.filter(
    (u) => !propertyId || u.property_id === propertyId,
  );
  const ids = new Set(inventory.map((u) => u.id));
  const active = leases.filter(
    (l) => l.status === "active" && ids.has(l.unit_id),
  );
  const activeIds = new Set(active.map((l) => l.id));
  const ledger = portfolioPayments(state).filter((p) =>
    activeIds.has(p.lease_id),
  );
  const month = ledger.filter((p) => p.due_on.startsWith(demoPeriod));
  const repairs = getMaintenance(state).filter(
    (r) => !propertyId || r.property_id === propertyId,
  );
  const apps = getApplications(state).filter(
    (a) => !propertyId || a.property_id === propertyId,
  );
  const prospects = getLeads(state, intakes).filter(
    (l) => !propertyId || l.property_id === propertyId,
  );
  const occupied = inventory.filter((u) => u.status === "occupied").length;
  return {
    inventory,
    active,
    ledger,
    month,
    repairs,
    apps,
    prospects,
    total: inventory.length,
    occupied,
    vacant: inventory.length - occupied,
    available: inventory.filter((u) => u.status === "available").length,
    turnover: inventory.filter((u) => u.status === "turnover").length,
    occupancy: inventory.length ? (occupied / inventory.length) * 100 : 0,
    scheduled: active.reduce((s, l) => s + l.rent_cents, 0),
    outstanding: ledger
      .filter((p) => p.status !== "paid" && p.due_on <= "2026-09-17")
      .reduce((s, p) => s + p.amount_cents, 0),
    open: repairs.filter((r) => r.status !== "completed").length,
    pending: apps.filter((a) =>
      ["draft", "submitted", "in_review"].includes(a.status),
    ).length,
    expirations: active.filter(
      (l) => l.ends_on >= "2026-09-17" && l.ends_on <= renewalCutoff,
    ).length,
    newLeads: prospects.filter((l) => l.status === "New").length,
  };
}
export function allAnnouncements(state: DemoState) {
  return [
    ...(state.announcements ?? []).map((a) => ({
      ...base(14, 0),
      category: "Community",
      published_at: "2026-09-17T15:00:00Z",
      property_id: null,
      building_id: null,
      ...a,
    })),
    ...announcements,
  ].sort((a, b) => b.published_at.localeCompare(a.published_at));
}
export function announcementsForResident(state: DemoState, residentId: string) {
  const unit = unitForResident(residentId);
  return allAnnouncements(state).filter(
    (a) =>
      (!a.property_id || a.property_id === unit?.property_id) &&
      (!a.building_id || a.building_id === unit?.building_id),
  );
}
export function allDocuments(state: DemoState): ManagementDocument[] {
  return [
    ...(state.managementDocuments ?? []),
    ...documents.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      property_id: d.property_id,
      building_id: d.building_id ?? null,
      visibility: d.visibility ?? (d.resident_id ? "assigned" : "community"),
      residentIds: d.resident_id ? [d.resident_id] : [],
      created_at: d.created_at,
    })),
  ].map((d) => ({
    ...d,
    residentIds: state.documentAssignments?.[d.id] ?? d.residentIds,
  }));
}
export function documentsForResident(state: DemoState, id: string) {
  const unit = unitForResident(id);
  return allDocuments(state).filter(
    (d) =>
      d.visibility !== "staff" &&
      (!d.property_id || d.property_id === unit?.property_id) &&
      (!d.building_id || d.building_id === unit?.building_id) &&
      (d.visibility === "community" || d.residentIds.includes(id)),
  );
}
export function getActivity(
  state: DemoState,
  intakes: IntakeRecord[] = [],
): DemoActivity[] {
  return [
    ...(state.demoActivity ?? []),
    ...intakes.map((r) => ({
      id: "intake-" + r.id,
      type: r.kind === "tour" ? "tour.requested" : "application.inquiry",
      title:
        r.kind === "tour" ? "Tour requested" : "Application inquiry received",
      description:
        r.payload.firstName +
        " " +
        r.payload.lastName +
        " · " +
        properties.find((p) => p.id === r.payload.propertyId)?.name,
      at: r.created_at,
      actor: "Public leasing website",
      propertyId: r.payload.propertyId,
      href: "leads",
    })),
    ...activityEvents.map((e) => ({
      id: e.id,
      type: e.event_type,
      title: e.title,
      description: e.description,
      at: e.created_at,
      actor: "Community team",
      propertyId: properties[0].id,
      href: e.event_type.startsWith("maintenance")
        ? "maintenance"
        : e.event_type.startsWith("application")
          ? "applications"
          : "residents",
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}
export const maintenanceStaff = [
  { id: uuid(7, 102), name: "Marcus Reed · Maintenance" },
  { id: uuid(7, 101), name: "Alex Morgan · Property Manager" },
  { id: uuid(7, 103), name: "Jess Park · Staff" },
];

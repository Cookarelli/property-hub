import type { Role } from "@/lib/types";
export const roleCapabilities: Record<
  Role,
  {
    finance: boolean;
    manageLeasing: boolean;
    manageDocuments: boolean;
    manageAnnouncements: boolean;
    workMaintenance: boolean;
    readInternalNotes: boolean;
  }
> = {
  admin: {
    finance: true,
    manageLeasing: true,
    manageDocuments: true,
    manageAnnouncements: true,
    workMaintenance: true,
    readInternalNotes: true,
  },
  leasing: {
    finance: false,
    manageLeasing: true,
    manageDocuments: false,
    manageAnnouncements: false,
    workMaintenance: false,
    readInternalNotes: false,
  },
  owner: {
    finance: true,
    manageLeasing: true,
    manageDocuments: true,
    manageAnnouncements: true,
    workMaintenance: true,
    readInternalNotes: true,
  },
  property_manager: {
    finance: true,
    manageLeasing: true,
    manageDocuments: true,
    manageAnnouncements: true,
    workMaintenance: true,
    readInternalNotes: true,
  },
  staff: {
    finance: false,
    manageLeasing: false,
    manageDocuments: false,
    manageAnnouncements: false,
    workMaintenance: false,
    readInternalNotes: true,
  },
  maintenance: {
    finance: false,
    manageLeasing: false,
    manageDocuments: false,
    manageAnnouncements: false,
    workMaintenance: true,
    readInternalNotes: true,
  },
  resident: {
    finance: false,
    manageLeasing: false,
    manageDocuments: false,
    manageAnnouncements: false,
    workMaintenance: false,
    readInternalNotes: false,
  },
  applicant: {
    finance: false,
    manageLeasing: false,
    manageDocuments: false,
    manageAnnouncements: false,
    workMaintenance: false,
    readInternalNotes: false,
  },
  platform_admin: {
    finance: false,
    manageLeasing: false,
    manageDocuments: false,
    manageAnnouncements: false,
    workMaintenance: false,
    readInternalNotes: false,
  },
};
// Presentation capabilities mirror server/RLS policy; this map grants no authorization.
export const staffSections = [
  "Properties",
  "Units",
  "Residents",
  "Leads",
  "Applications",
  "Maintenance",
  "Documents",
  "Announcements",
  "Activity",
] as const;

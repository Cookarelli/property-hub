import type { Persona } from "@/lib/types";
export const personas: {
  id: Persona;
  label: string;
  name: string;
  initials: string;
}[] = [
  { id: "owner", label: "Owner", name: "Sam Bennett", initials: "SB" },
  {
    id: "property-manager",
    label: "Property Manager",
    name: "Alex Morgan",
    initials: "AM",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    name: "Marcus Reed",
    initials: "MR",
  },
  { id: "resident", label: "Resident", name: "Alex Rivera", initials: "AR" },
  {
    id: "applicant",
    label: "Applicant",
    name: "Sofia Martinez",
    initials: "SM",
  },
];
export const managementNav = [
  "Dashboard",
  "Properties",
  "Units",
  "Residents",
  "Leads",
  "Applications",
  "Maintenance",
  "Documents",
  "Announcements",
  "Analytics",
  "Activity",
  "Settings",
];
export const residentNav = [
  "Home",
  "Payments",
  "Maintenance",
  "Documents",
  "Announcements",
  "Profile",
  "Lease",
  "Contact",
];
export const applicantNav = [
  "Properties",
  "Saved",
  "Application",
  "Tour",
  "Contact",
];
export const maintenanceNav = [
  "Dashboard",
  "Maintenance",
  "Properties",
  "Announcements",
  "Profile",
];
export function navFor(persona: Persona) {
  return persona === "resident"
    ? residentNav
    : persona === "applicant"
      ? applicantNav
      : persona === "maintenance"
        ? maintenanceNav
        : managementNav;
}
export function demoHref(persona: Persona, section?: string) {
  const nav = navFor(persona);
  return `/demo/${persona}${!section || section.toLowerCase() === nav[0].toLowerCase() ? "" : `/${section.toLowerCase()}`}`;
}
export function isPersona(value: string): value is Persona {
  return personas.some((p) => p.id === value);
}

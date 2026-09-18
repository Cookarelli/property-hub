export type PlatformRole = "super_admin";
export type Role =
  | "platform_admin"
  | "admin"
  | "leasing"
  | "owner"
  | "property_manager"
  | "staff"
  | "maintenance"
  | "resident"
  | "applicant";
export type Persona =
  "owner" | "property-manager" | "maintenance" | "resident" | "applicant";
export type UUID = string;
export interface Entity {
  id: UUID;
  created_at: string;
  updated_at: string;
}
export interface TenantEntity extends Entity {
  organization_id: UUID;
}
export interface Property extends TenantEntity {
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  image: string;
  neighborhood: string;
  amenities: string[];
  published: boolean;
}
export interface Building extends TenantEntity {
  property_id: UUID;
  name: string;
  floors: number;
}
export interface FloorPlan extends TenantEntity {
  property_id: UUID;
  name: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
}
export interface Unit extends TenantEntity {
  property_id: UUID;
  building_id: UUID;
  floor_plan_id: UUID;
  number: string;
  floor: number;
  rent_cents: number;
  status: "occupied" | "available" | "turnover";
  available_on: string | null;
}
export interface Resident extends TenantEntity {
  user_id: UUID;
  name: string;
  email: string;
  phone: string;
}
export interface Lease extends TenantEntity {
  unit_id: UUID;
  starts_on: string;
  ends_on: string;
  rent_cents: number;
  deposit_cents: number;
  status: "active" | "ended" | "draft";
  renewal_status?:
    | "not_started"
    | "eligible"
    | "requested"
    | "offered"
    | "renewed"
    | "not_renewing";
}
export interface MaintenanceRequest extends TenantEntity {
  property_id: UUID;
  unit_id: UUID;
  resident_id: UUID;
  assigned_to: UUID | null;
  title: string;
  description: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "scheduled" | "in_progress" | "completed";
  permission_to_enter: boolean;
}
export interface Payment extends TenantEntity {
  lease_id: UUID;
  resident_id: UUID;
  amount_cents: number;
  due_on: string;
  paid_at: string | null;
  status: "paid" | "pending" | "overdue";
  method: string;
  simulated: boolean;
}
export interface Announcement extends TenantEntity {
  property_id: UUID | null;
  building_id?: UUID | null;
  title: string;
  body: string;
  category: string;
  published_at: string;
}
export interface DemoDocument extends TenantEntity {
  visibility?: "staff" | "community" | "assigned";
  building_id?: UUID | null;
  property_id: UUID | null;
  resident_id: UUID | null;
  title: string;
  category: string;
  content: string;
  storage_path: string | null;
}
export interface Application extends TenantEntity {
  property_id: UUID;
  unit_id: UUID;
  user_id: UUID;
  name: string;
  email: string;
  status:
    "draft" | "submitted" | "in_review" | "approved" | "declined" | "withdrawn";
  desired_move_in: string;
  phone: string;
  occupants: number;
  pets: string;
}
export interface Lead extends TenantEntity {
  unit_id: UUID | null;
  phone: string;
  desired_move_in: string | null;
  property_id: UUID;
  name: string;
  email: string;
  source: string;
  status:
    | "New"
    | "Contacted"
    | "Tour Scheduled"
    | "Applied"
    | "Approved"
    | "Leased"
    | "Lost";
  interested_bedrooms: number;
}
export interface TourRequest extends TenantEntity {
  property_id: UUID;
  unit_id: UUID;
  user_id: UUID;
  scheduled_at: string;
  status: string;
}

import { demoOrganizationBranding } from "./organization";
import type {
  Announcement,
  Application,
  Building,
  DemoDocument,
  FloorPlan,
  Lead,
  Lease,
  MaintenanceRequest,
  Payment,
  Property,
  Resident,
  Role,
  TenantEntity,
  TourRequest,
  Unit,
} from "@/lib/types";

// A fixed clock keeps presentation, seed records and metrics reproducible.
export const DEMO_DATE = "2026-09-17";
export const timestamp = "2026-09-17T09:00:00Z";
export const uuid = (kind: number, n: number) =>
  `${kind.toString(16).padStart(8, "0")}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
export const organizationId = uuid(1, 1);
export const base = (kind: number, n: number): TenantEntity => ({
  id: uuid(kind, n),
  organization_id: organizationId,
  created_at: timestamp,
  updated_at: timestamp,
});
export const organization = {
  id: organizationId,
  ...demoOrganizationBranding,
  created_at: timestamp,
  updated_at: timestamp,
};
export const properties: Property[] = [
  {
    ...base(2, 1),
    name: "The Mercer",
    slug: "the-mercer",
    address: "1840 Mercer Avenue",
    city: "Austin",
    state: "TX",
    zip: "78704",
    neighborhood: "South Lamar",
    description:
      "A quieter kind of city living. Thoughtful interiors, sunlit spaces, and a courtyard made for slowing down — minutes from everything you love about Austin.",
    image: "/images/mercer.jpg",
    amenities: [
      "Resort-style pool",
      "Fitness studio",
      "Coworking lounge",
      "Pet friendly",
      "Covered parking",
      "In-home laundry",
    ],
    published: true,
  },
  {
    ...base(2, 2),
    name: "Juniper Park",
    slug: "juniper-park",
    address: "620 Juniper Walk",
    city: "Austin",
    state: "TX",
    zip: "78702",
    neighborhood: "East Austin",
    description:
      "Rooted in the neighborhood. Contemporary homes meet green courtyards, local coffee, and a little more room to make life your own.",
    image: "/images/juniper.jpg",
    amenities: [
      "Garden courtyard",
      "Bike storage",
      "Pet friendly",
      "Rooftop terrace",
      "In-home laundry",
    ],
    published: true,
  },
  {
    ...base(2, 3),
    name: "Westhaven Lofts",
    slug: "westhaven-lofts",
    address: "310 Westhaven Lane",
    city: "Austin",
    state: "TX",
    zip: "78703",
    neighborhood: "Clarksville",
    description:
      "Character in every corner. Open-plan homes, warm natural finishes, and neighborhood charm come together in an address that feels distinctly yours.",
    image: "/images/westhaven.jpg",
    amenities: [
      "Rooftop terrace",
      "Fitness studio",
      "Resident lounge",
      "Pet friendly",
      "EV charging",
    ],
    published: true,
  },
];
export const buildings: Building[] = properties.flatMap((p, i) =>
  ["A", "B"].map((name, j) => ({
    ...base(3, i * 2 + j + 1),
    property_id: p.id,
    name: `Building ${name}`,
    floors: 3,
  })),
);
export const floorPlans: FloorPlan[] = properties.flatMap((p, i) =>
  [
    { name: "The Studio", bedrooms: 0, bathrooms: 1, sqft: 540 },
    { name: "The One", bedrooms: 1, bathrooms: 1, sqft: 785 },
    { name: "The Two", bedrooms: 2, bathrooms: 2, sqft: 1120 },
  ].map((plan, j) => ({
    ...base(4, i * 3 + j + 1),
    property_id: p.id,
    ...plan,
  })),
);
export const units: Unit[] = properties.flatMap((p, i) =>
  Array.from({ length: 30 }, (_, j) => ({
    ...base(5, i * 30 + j + 1),
    property_id: p.id,
    building_id: buildings[i * 2 + Math.floor(j / 15)].id,
    floor_plan_id: floorPlans[i * 3 + (j % 3)].id,
    number: `${j < 15 ? "A" : "B"}-${Math.floor((j % 15) / 5) + 1}0${(j % 5) + 1}`,
    floor: Math.floor((j % 15) / 5) + 1,
    rent_cents:
      (1550 + i * 125 + (j % 3) * 425 + Math.floor((j % 15) / 5) * 50) * 100,
    status: j < 26 ? "occupied" : j < 29 ? "available" : "turnover",
    available_on: j >= 26 && j < 29 ? "2026-10-01" : null,
  })),
);
const firstNames = [
  "Alex",
  "Jordan",
  "Morgan",
  "Taylor",
  "Casey",
  "Riley",
  "Avery",
  "Jamie",
  "Quinn",
  "Cameron",
  "Drew",
  "Parker",
  "Reese",
];
const lastNames = ["Rivera", "Chen", "Bennett", "Brooks", "Ellis", "Sullivan"];
export const residents: Resident[] = units
  .filter((u) => u.status === "occupied")
  .map((_, i) => ({
    ...base(6, i + 1),
    user_id: uuid(7, i + 1),
    name: `${firstNames[i % 13]} ${lastNames[Math.floor(i / 13)]}`,
    email: `resident${i + 1}@propertyhub.example`,
    phone: `512-555-${(100 + i).toString().padStart(4, "0")}`,
  }));
export const leases: Lease[] = units
  .filter((u) => u.status === "occupied")
  .map((u, i) => ({
    ...base(8, i + 1),
    unit_id: u.id,
    starts_on: "2026-01-01",
    renewal_status: i === 0 ? "eligible" : "not_started",
    ends_on: i % 9 === 0 ? "2026-10-31" : "2026-12-31",
    rent_cents: u.rent_cents,
    deposit_cents: u.rent_cents,
    status: "active",
  }));
export const leaseResidents = leases.map((lease, i) => ({
  ...base(9, i + 1),
  lease_id: lease.id,
  resident_id: residents[i].id,
  is_primary: true,
}));
export const staffUsers = [
  { id: uuid(7, 100), full_name: "Sam Bennett", role: "owner" },
  { id: uuid(7, 101), full_name: "Alex Morgan", role: "property_manager" },
  { id: uuid(7, 102), full_name: "Marcus Reed", role: "maintenance" },
  { id: uuid(7, 103), full_name: "Jess Park", role: "staff" },
  { id: uuid(7, 104), full_name: "Platform Operator", role: "platform_admin" },
] satisfies { id: string; full_name: string; role: Role }[];
export const applicantUsers = [
  "Sofia Martinez",
  "Noah Williams",
  "Emma Clarke",
  "Liam Patel",
  "Olivia Hayes",
  "Ethan Kim",
].map((name, i) => ({
  id: uuid(7, 200 + i),
  full_name: name,
  role: "applicant" as const,
}));
export const users = [
  ...residents.map((r) => ({
    id: r.user_id,
    full_name: r.name,
    role: "resident" as const,
  })),
  ...staffUsers,
  ...applicantUsers,
].map((u) => ({
  id: u.id,
  full_name: u.full_name,
  email: `${u.id.slice(-6)}@propertyhub.example`,
  created_at: timestamp,
  updated_at: timestamp,
}));
export const memberships = [
  ...residents.map((r) => ({ id: r.user_id, role: "resident" as const })),
  ...staffUsers,
  ...applicantUsers,
].map((u, i) => ({ ...base(10, i + 1), user_id: u.id, role: u.role }));
export const payments: Payment[] = leases.flatMap((l, i) =>
  [7, 8, 9].map((month) => ({
    ...base(11, i * 3 + month),
    lease_id: l.id,
    resident_id: residents[i].id,
    amount_cents: l.rent_cents,
    due_on: `2026-0${month}-01`,
    paid_at: month < 9 || i < 70 ? `2026-0${month}-01T10:00:00Z` : null,
    status: month < 9 || i < 70 ? "paid" : i < 74 ? "pending" : "overdue",
    method: "Bank transfer",
    simulated: true,
  })),
);
payments.push({
  ...base(11, 1000),
  lease_id: leases[0].id,
  resident_id: residents[0].id,
  amount_cents: leases[0].rent_cents,
  due_on: "2026-10-01",
  paid_at: null,
  status: "pending",
  method: "Not yet selected",
  simulated: true,
});
const issues = [
  ["Kitchen faucet is leaking", "Plumbing", "high", "open"],
  ["AC not cooling", "HVAC", "urgent", "in_progress"],
  ["Bedroom outlet not working", "Electrical", "normal", "open"],
  ["Dishwasher will not drain", "Appliance", "normal", "in_progress"],
  ["Hallway light flickering", "Electrical", "low", "open"],
  ["Bathroom fan is noisy", "Appliance", "low", "completed"],
  ["Front door lock sticking", "Access", "high", "open"],
  ["Window seal needs repair", "General", "normal", "in_progress"],
  ["Garbage disposal stopped", "Plumbing", "normal", "completed"],
  ["Closet door off track", "General", "low", "open"],
] as const;
export const maintenanceRequests: MaintenanceRequest[] = issues.map(
  ([title, category, priority, status], i) => {
    const index = i === 0 ? 0 : i * 7;
    const l = leases[index];
    const u = units.find((u) => u.id === l.unit_id)!;
    return {
      ...base(12, i + 1),
      property_id: u.property_id,
      unit_id: u.id,
      resident_id: residents[index].id,
      assigned_to: status === "open" ? null : staffUsers[2].id,
      title,
      description: `${title}. Please inspect and arrange a repair. Resident is available after 10 AM.`,
      category,
      priority,
      status,
      permission_to_enter: true,
    };
  },
);
maintenanceRequests.push(
  ...[
    {
      title: "Bathroom fan running quietly again",
      category: "Appliance",
      day: "2026-08-21",
      description:
        "The bathroom fan rattled when switched on. The motor bracket was secured and the fan was tested with Alex.",
    },
    {
      title: "Entry door latch adjusted",
      category: "Door / Lock",
      day: "2026-07-12",
      description:
        "The front door needed an extra push to latch. The strike plate was adjusted and the lock now closes smoothly.",
    },
  ].map((issue, i): MaintenanceRequest => ({
    ...base(12, 11 + i),
    property_id: properties[0].id,
    unit_id: units[0].id,
    resident_id: residents[0].id,
    assigned_to: staffUsers[2].id,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    priority: "normal",
    status: "completed",
    permission_to_enter: true,
    created_at: `${issue.day}T14:00:00Z`,
    updated_at: `${issue.day}T19:00:00Z`,
  })),
);
export const maintenanceUpdates = maintenanceRequests.map((r, i) => ({
  ...base(13, i + 1),
  maintenance_request_id: r.id,
  author_id: staffUsers[2].id,
  status: r.status,
  created_at: r.updated_at,
  body:
    r.status === "completed"
      ? "Repair completed and tested with the resident."
      : r.status === "in_progress"
        ? "Inspection complete. Repair is being coordinated."
        : "Request received. Our team will review and arrange a visit.",
}));
export const announcements: Announcement[] = [
  {
    ...base(14, 1),
    property_id: properties[0].id,
    title: "A little coffee, a little community",
    body: "Join your neighbors in the courtyard on Saturday, September 19, from 9–11 AM. Coffee and pastries are on us. We look forward to seeing you there!",
    category: "Community",
    published_at: "2026-09-16T09:00:00Z",
  },
  {
    ...base(14, 2),
    property_id: null,
    title: "Your fall community update",
    body: "Fall landscaping starts September 21. Our crews will work between 9 AM and 4 PM. All entrances will remain accessible. Thank you for helping us keep your community beautiful.",
    category: "Community",
    published_at: "2026-09-14T09:00:00Z",
  },
  {
    ...base(14, 3),
    property_id: properties[1].id,
    title: "Pool care on September 22",
    body: "The pool will be closed from 8 AM until noon for routine cleaning. The courtyard and fitness studio remain open.",
    category: "Maintenance",
    published_at: "2026-09-15T09:00:00Z",
  },
];
announcements.push(
  {
    ...base(14, 4),
    property_id: properties[0].id,
    title: "A fresh start for the parking lot",
    body: "Parking spaces 1–12 will be resurfaced Tuesday, September 22, between 9 AM and 4 PM. Please use the marked visitor spaces during this time. All building entrances will remain accessible.",
    category: "Maintenance",
    published_at: "2026-09-17T09:00:00Z",
  },
  {
    ...base(14, 5),
    property_id: null,
    title: "A little fall care for your HVAC",
    body: "A clean filter helps your home stay comfortable. If you would like help checking or replacing yours, send a Heating / Cooling maintenance request and our team will arrange a visit.",
    category: "Home care",
    published_at: "2026-09-15T09:00:00Z",
  },
  {
    ...base(14, 6),
    property_id: properties[0].id,
    title: "Office closure on September 25",
    body: "The leasing office will be closed Friday, September 25 for team training. Regular hours resume Monday at 9 AM. You can still leave a portal request; urgent issues should go through the after-hours maintenance line.",
    category: "Office",
    published_at: "2026-09-16T15:00:00Z",
  },
);
export const documents: DemoDocument[] = [
  {
    ...base(15, 1),
    property_id: null,
    resident_id: null,
    title: "Resident welcome guide",
    category: "Community",
    storage_path: null,
    content:
      "WELCOME HOME\n\nThis fictional Property Hub demonstration guide introduces the demo organization.\n\nMaintenance: Submit a request through your resident portal. For immediate danger call local emergency services.\n\nCommunity hours: Quiet hours are 10 PM–8 AM. Fitness studios open 6 AM–10 PM.\n\nPayments: This demo uses simulated payment records. No funds move.\n\nContact: Use the Contact screen to record a demo inquiry.",
  },
  {
    ...base(15, 2),
    property_id: properties[0].id,
    resident_id: residents[0].id,
    title: "Lease Agreement",
    category: "Lease",
    storage_path: null,
    content:
      "DEMO DOCUMENT METADATA ONLY\n\nTitle: Lease Agreement\nResident: Alex Rivera\nCommunity: The Mercer\nApartment: A-101\nNo agreement is attached. This placeholder contains no legal terms, signatures, or enforceable document.",
  },
  {
    ...base(15, 3),
    property_id: null,
    resident_id: null,
    title: "Move-in checklist",
    category: "Operations",
    storage_path: null,
    content:
      "DEMO MOVE-IN CHECKLIST\n\n1. Confirm your move-in appointment.\n2. Review the welcome guide.\n3. Collect keys and parking information.\n4. Walk through your apartment.\n5. Report existing issues through Maintenance.\n6. Update your contact preferences.",
  },
];
documents.push(
  ...[
    ["Community Rules", "Community"],
    ["Parking Policy", "Parking"],
    ["Pet Policy", "Pets"],
  ].map(([title, category], i): DemoDocument => ({
    ...base(15, i + 4),
    property_id: properties[0].id,
    resident_id: null,
    title,
    category,
    storage_path: null,
    content: `DEMO DOCUMENT METADATA ONLY\n\nTitle: ${title}\nCommunity: The Mercer\nNo actual document is attached. This is a download placeholder, not a policy or legal document.`,
  })),
);
for (const doc of documents)
  doc.visibility = doc.resident_id ? "assigned" : "community";
export const applications: Application[] = applicantUsers.map((u, i) => {
  const unit = units.filter((u) => u.status === "available")[i];
  return {
    ...base(16, i + 1),
    property_id: unit.property_id,
    unit_id: unit.id,
    user_id: u.id,
    name: u.full_name,
    email: `applicant${i + 1}@propertyhub.example`,
    status:
      i === 0
        ? "draft"
        : i < 3
          ? "in_review"
          : i === 5
            ? "approved"
            : "submitted",
    desired_move_in: "2026-10-01",
    phone: "512-555-" + String(160 + i).padStart(4, "0"),
    occupants: (i % 2) + 1,
    pets: i % 3 === 0 ? "One cat" : "None",
  };
});
export const leads: Lead[] = [
  "Isabella Grant",
  "Lucas Foster",
  "Mia Davis",
  "Leo Marshall",
  "Amelia Scott",
  "Henry Ross",
  "Harper Blake",
  "Owen Davis",
].map((name, i) => ({
  ...base(17, i + 1),
  property_id: properties[i % 3].id,
  name,
  email: `lead${i + 1}@propertyhub.example`,
  source: ["Website", "Referral", "Walk-in"][i % 3],
  status: (
    [
      "New",
      "Contacted",
      "Tour Scheduled",
      "Applied",
      "Approved",
      "Leased",
      "Lost",
      "New",
    ] as const
  )[i],
  unit_id:
    i === 5
      ? units[60].id
      : units.filter(
          (u) =>
            u.property_id === properties[i % 3].id && u.status === "available",
        )[i % 3].id,
  phone: "512-555-" + String(180 + i).padStart(4, "0"),
  desired_move_in: "2026-10-01",
  interested_bedrooms: i % 3,
}));
export const tours: TourRequest[] = applications.slice(0, 3).map((a, i) => ({
  ...base(18, i + 1),
  property_id: a.property_id,
  unit_id: a.unit_id,
  user_id: a.user_id,
  scheduled_at: `2026-09-${19 + i}T15:00:00Z`,
  status: "confirmed",
}));
export const activityEvents = [
  ["payment.received", "September rent received", "Alex Rivera · The Mercer"],
  [
    "maintenance.created",
    "New maintenance request",
    "Kitchen faucet · The Mercer A-101",
  ],
  [
    "application.submitted",
    "Application ready for review",
    "Emma Clarke · The Mercer",
  ],
  [
    "tour.confirmed",
    "A new tour on the calendar",
    "Sofia Martinez · September 19",
  ],
].map(([event_type, title, description], i) => ({
  ...base(19, i + 1),
  actor_id: staffUsers[1].id,
  event_type,
  title,
  description,
}));
export function propertyFor(id: string) {
  return properties.find((p) => p.id === id)!;
}
export function planFor(unit: Unit) {
  return floorPlans.find((p) => p.id === unit.floor_plan_id)!;
}
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
export const residentUnit = units.find((u) => u.id === leases[0].unit_id)!;
export const availableUnits = units.filter((u) => u.status === "available");

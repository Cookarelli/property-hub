"use client";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shared";
import {
  buildings,
  money,
  planFor,
  properties,
  residents,
  units,
} from "@/lib/demo/data";
import { useDemoState } from "@/lib/demo/store";
import {
  leaseForUnit,
  leaseForResident,
  residentsForUnit,
  unitForResident,
  portfolioPayments,
  portfolioMetrics,
} from "@/lib/management/data";
import { formatDate } from "@/lib/resident/data";
import type { Persona } from "@/lib/types";
import {
  FactList,
  FilterSelect,
  ManagementHeading,
  ManagementTable,
  PropertyFilter,
  RecordLink,
  SearchBox,
  WorkflowStatus,
} from "./common";
import { ResidentMessagesInbox } from "@/components/resident/living";
import { ManagementQueue } from "./repairs";
import { ManagementApplications } from "./leasing";
import { ManagementDocuments, ManagementAnnouncements } from "./communications";
export function PortfolioProperties({ persona }: { persona: Persona }) {
  const { state } = useDemoState();
  const [query, setQuery] = useState("");
  const maintenance = persona === "maintenance";
  return (
    <div className="m-page">
      <ManagementHeading
        title="Properties"
        description={
          maintenance
            ? "Community inventory and maintenance information."
            : "Your communities, with leasing and operating performance side by side."
        }
      />
      <div className="m-filters">
        <SearchBox
          label="Search properties"
          value={query}
          onChange={setQuery}
        />
      </div>
      <ManagementTable
        caption="Portfolio properties"
        headers={
          maintenance
            ? ["Property", "Units", "Open maintenance", "Buildings"]
            : [
                "Property",
                "Units",
                "Occupancy",
                "Available",
                "Scheduled rent",
                "Open maintenance",
                "Pending applications",
              ]
        }
        rows={properties
          .filter((p) =>
            (p.name + " " + p.neighborhood)
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((p) => {
            const m = portfolioMetrics(state, p.id);
            const name = (
              <Link
                key="name"
                className="m-property-name"
                href={"/demo/" + persona + "/properties/" + p.slug}
              >
                <Image src={p.image} alt="" width={64} height={52} />
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.neighborhood} · {p.city}, {p.state}
                  </small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            );
            return {
              id: p.id,
              cells: maintenance
                ? [
                    name,
                    m.total,
                    m.open,
                    buildings.filter((b) => b.property_id === p.id).length,
                  ]
                : [
                    name,
                    m.total,
                    m.occupancy.toFixed(1) + "%",
                    m.available,
                    money(m.scheduled),
                    m.open,
                    m.pending,
                  ],
            };
          })}
      />
    </div>
  );
}
export function ManagementUnits({
  persona,
  propertyId = "",
  embedded = false,
}: {
  persona: Persona;
  propertyId?: string;
  embedded?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [property, setProperty] = useState(propertyId);
  const [status, setStatus] = useState("");
  const [beds, setBeds] = useState("");
  const [building, setBuilding] = useState("");
  const maintenance = persona === "maintenance";
  const filtered = units.filter((u) => {
    const p = properties.find((p) => p.id === u.property_id)!;
    return (
      (!property || u.property_id === property) &&
      (!status || u.status === status) &&
      (!beds || String(planFor(u).bedrooms) === beds) &&
      (!building || u.building_id === building) &&
      (
        u.number +
        " " +
        p.name +
        " " +
        residentsForUnit(u.id)
          .map((r) => r.name)
          .join(" ")
      )
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  return (
    <div className="m-page">
      <ManagementHeading
        title="Units"
        description="Inventory, availability, and the details behind each apartment."
        embedded={embedded}
      />
      <div className="m-filters">
        <SearchBox label="Search units" value={query} onChange={setQuery} />
        {!propertyId && (
          <PropertyFilter
            value={property}
            onChange={(value) => {
              setProperty(value);
              setBuilding("");
            }}
          />
        )}
        <FilterSelect
          label="Building"
          value={building}
          onChange={setBuilding}
          options={[
            { value: "", label: "All buildings" },
            ...buildings
              .filter((b) => !property || b.property_id === property)
              .map((b) => ({
                value: b.id,
                label:
                  properties.find((p) => p.id === b.property_id)!.name +
                  " · " +
                  b.name,
              })),
          ]}
        />
        <FilterSelect
          label="Bedrooms"
          value={beds}
          onChange={setBeds}
          options={[
            { value: "", label: "Any beds" },
            { value: "0", label: "Studio" },
            { value: "1", label: "1 bed" },
            { value: "2", label: "2 beds" },
          ]}
        />
        <FilterSelect
          label="Occupancy status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All statuses" },
            { value: "occupied", label: "Occupied" },
            { value: "available", label: "Available" },
            { value: "turnover", label: "Turnover" },
          ]}
        />
      </div>
      <p className="m-result-count">
        {filtered.length} of {propertyId ? 30 : units.length} units
      </p>
      <ManagementTable
        caption="Unit inventory"
        headers={
          maintenance
            ? [
                "Unit",
                "Property",
                "Building",
                "Beds",
                "Baths",
                "Sq ft",
                "Status",
                "Availability",
              ]
            : [
                "Unit",
                "Property",
                "Building",
                "Beds",
                "Baths",
                "Sq ft",
                "Rent",
                "Status",
                "Resident",
                "Lease expiration",
                "Availability",
              ]
        }
        rows={filtered.map((u) => {
          const plan = planFor(u);
          const lease = leaseForUnit(u.id);
          const res = residentsForUnit(u.id);
          const availability =
            u.status === "occupied"
              ? "Not listed"
              : u.available_on
                ? formatDate(u.available_on)
                : "Preparing for move-in";
          const common = [
            <strong key="unit">{u.number}</strong>,
            properties.find((p) => p.id === u.property_id)!.name,
            buildings.find((b) => b.id === u.building_id)!.name,
            plan.bedrooms || "Studio",
            plan.bathrooms,
            plan.sqft,
          ];
          return {
            id: u.id,
            cells: maintenance
              ? [
                  ...common,
                  <WorkflowStatus key="s">{u.status}</WorkflowStatus>,
                  availability,
                ]
              : [
                  ...common,
                  money(u.rent_cents),
                  <WorkflowStatus key="s">{u.status}</WorkflowStatus>,
                  res.length ? (
                    <RecordLink
                      key="resident"
                      href={"/demo/" + persona + "/residents/" + res[0].id}
                    >
                      {res[0].name}
                    </RecordLink>
                  ) : (
                    "—"
                  ),
                  lease ? formatDate(lease.ends_on) : "—",
                  availability,
                ],
          };
        })}
      />
    </div>
  );
}
export function ManagementResidents({
  persona,
  propertyId = "",
  embedded = false,
}: {
  persona: Persona;
  propertyId?: string;
  embedded?: boolean;
}) {
  const { state } = useDemoState();
  const [query, setQuery] = useState("");
  const [property, setProperty] = useState(propertyId);
  const [account, setAccount] = useState("");
  const ledger = portfolioPayments(state);
  const rows = residents
    .map((r) => {
      const u = unitForResident(r.id)!;
      const l = leaseForResident(r.id)!;
      const outstanding = ledger
        .filter(
          (p) =>
            p.resident_id === r.id &&
            p.status !== "paid" &&
            p.due_on <= "2026-09-17",
        )
        .reduce((s, p) => s + p.amount_cents, 0);
      return { r, u, l, outstanding };
    })
    .filter(
      ({ r, u, outstanding }) =>
        (!property || u.property_id === property) &&
        (!account ||
          (account === "due" ? outstanding > 0 : outstanding === 0)) &&
        (r.name + " " + r.email + " " + u.number + " " + r.phone)
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  return (
    <div className="m-page">
      <ManagementHeading
        title="Residents"
        description="Contact details, lease dates, and account standing for every home."
        embedded={embedded}
      />
      {!embedded && <ResidentMessagesInbox />}
      <div className="m-filters">
        <SearchBox label="Search residents" value={query} onChange={setQuery} />
        {!propertyId && (
          <PropertyFilter value={property} onChange={setProperty} />
        )}
        <FilterSelect
          label="Account status"
          value={account}
          onChange={setAccount}
          options={[
            { value: "", label: "All accounts" },
            { value: "current", label: "Current" },
            { value: "due", label: "Past due" },
          ]}
        />
      </div>
      <p className="m-result-count">{rows.length} residents</p>
      <ManagementTable
        caption="Resident directory"
        headers={[
          "Resident",
          "Property",
          "Unit",
          "Contact information",
          "Lease dates",
          "Rent",
          "Account status",
        ]}
        rows={rows.map(({ r, u, l, outstanding }) => ({
          id: r.id,
          cells: [
            <RecordLink
              key="r"
              href={"/demo/" + persona + "/residents/" + r.id}
            >
              {r.name}
            </RecordLink>,
            properties.find((p) => p.id === u.property_id)!.name,
            u.number,
            <span key="c" className="m-cell-stack">
              {r.id === residents[0].id
                ? (state.residentEmail ?? r.email)
                : r.email}
              <small>
                {r.id === residents[0].id
                  ? (state.profilePhone ?? r.phone)
                  : r.phone}
              </small>
            </span>,
            <span key="d" className="m-cell-stack">
              {formatDate(l.starts_on)}
              <small>to {formatDate(l.ends_on)}</small>
            </span>,
            money(l.rent_cents),
            <span key="s" className="m-cell-stack">
              <WorkflowStatus>
                {outstanding ? "Past due" : "Current"}
              </WorkflowStatus>
              {outstanding > 0 && (
                <small>{money(outstanding)} outstanding</small>
              )}
            </span>,
          ],
        }))}
      />
    </div>
  );
}
export function PropertyDetail({
  persona,
  slug,
  tab = "overview",
}: {
  persona: Persona;
  slug: string;
  tab?: string;
}) {
  const { state } = useDemoState();
  const p = properties.find((p) => p.slug === slug)!;
  const m = portfolioMetrics(state, p.id);
  const maintenance = persona === "maintenance";
  const tabs = maintenance
    ? ["overview", "units", "maintenance", "announcements"]
    : [
        "overview",
        "units",
        "residents",
        "maintenance",
        "applications",
        "documents",
        "announcements",
      ];
  const root = "/demo/" + persona + "/properties/" + slug;
  return (
    <div className="m-page">
      <Link className="m-back" href={"/demo/" + persona + "/properties"}>
        ← Properties
      </Link>
      <div className="m-property-header">
        <Image
          src={p.image}
          alt={"Illustrative architecture for " + p.name}
          width={240}
          height={150}
        />
        <div>
          <p className="eyebrow">COMMUNITY MANAGEMENT</p>
          <h1>{p.name}</h1>
          <p>
            {p.address} · {p.city}, {p.state} {p.zip}
          </p>
          <span>
            {m.total} units ·{" "}
            {buildings.filter((b) => b.property_id === p.id).length} buildings
          </span>
        </div>
      </div>
      <nav className="m-tabs" aria-label="Property sections">
        {tabs.map((t) => (
          <Link
            key={t}
            href={root + (t === "overview" ? "" : "/" + t)}
            aria-current={tab === t ? "page" : undefined}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Link>
        ))}
      </nav>
      {tab === "overview" && (
        <div className="m-detail-columns">
          <Panel title="Community overview">
            <FactList
              items={
                maintenance
                  ? [
                      ["Units", m.total],
                      [
                        "Buildings",
                        buildings.filter((b) => b.property_id === p.id).length,
                      ],
                      ["Open maintenance", m.open],
                    ]
                  : [
                      ["Occupancy", m.occupancy.toFixed(1) + "%"],
                      ["Occupied units", m.occupied],
                      ["Available units", m.available],
                      ["Turnover units", m.turnover],
                      ["Monthly scheduled rent", money(m.scheduled)],
                      ["Outstanding rent", money(m.outstanding)],
                      ["Open maintenance", m.open],
                      ["Pending applications", m.pending],
                    ]
              }
            />
          </Panel>
          <Panel title="Property information">
            <FactList
              items={[
                ["Address", p.address],
                ["Location", p.city + ", " + p.state + " " + p.zip],
                [
                  "Buildings",
                  buildings
                    .filter((b) => b.property_id === p.id)
                    .map((b) => b.name)
                    .join(" · "),
                ],
                ["Community amenities", p.amenities.join(" · ")],
              ]}
            />
            <div className="m-panel-actions">
              <Button variant="outline" asChild>
                <Link href={"/properties/" + p.slug}>
                  View public listing <ArrowUpRight size={15} />
                </Link>
              </Button>
            </div>
          </Panel>
        </div>
      )}
      {tab === "units" && (
        <ManagementUnits persona={persona} propertyId={p.id} embedded />
      )}
      {tab === "residents" && (
        <ManagementResidents persona={persona} propertyId={p.id} embedded />
      )}
      {tab === "maintenance" && (
        <ManagementQueue persona={persona} propertyId={p.id} embedded />
      )}
      {tab === "applications" && (
        <ManagementApplications propertyId={p.id} embedded />
      )}
      {tab === "documents" && (
        <ManagementDocuments propertyId={p.id} embedded />
      )}
      {tab === "announcements" && (
        <ManagementAnnouncements
          propertyId={p.id}
          embedded
          readOnly={maintenance}
        />
      )}
    </div>
  );
}
export function ResidentDetail({
  persona,
  id,
  tab = "profile",
}: {
  persona: Persona;
  id: string;
  tab?: string;
}) {
  const { state } = useDemoState();
  const r = residents.find((r) => r.id === id)!;
  const unit = unitForResident(id)!;
  const lease = leaseForResident(id)!;
  const property = properties.find((p) => p.id === unit.property_id)!;
  const root = "/demo/" + persona + "/residents/" + id;
  const name = id === residents[0].id ? (state.profileName ?? r.name) : r.name;
  return (
    <div className="m-page">
      <Link className="m-back" href={"/demo/" + persona + "/residents"}>
        ← Residents
      </Link>
      <ManagementHeading
        title={name}
        description={property.name + " · Apartment " + unit.number}
      />
      <nav className="m-tabs" aria-label="Resident record sections">
        {["profile", "lease", "payments", "maintenance", "documents"].map(
          (t) => (
            <Link
              key={t}
              href={root + (t === "profile" ? "" : "/" + t)}
              aria-current={tab === t ? "page" : undefined}
            >
              {t === "payments"
                ? "Payment history"
                : t === "maintenance"
                  ? "Maintenance history"
                  : t.charAt(0).toUpperCase() + t.slice(1)}
            </Link>
          ),
        )}
      </nav>
      {tab === "profile" && (
        <div className="m-detail-columns">
          <Panel title="Contact information">
            <FactList
              items={[
                ["Resident", name],
                [
                  "Email",
                  id === residents[0].id
                    ? (state.residentEmail ?? r.email)
                    : r.email,
                ],
                [
                  "Phone",
                  id === residents[0].id
                    ? (state.profilePhone ?? r.phone)
                    : r.phone,
                ],
                [
                  "Contact preference",
                  id === residents[0].id
                    ? (state.contactPreference ?? "Email")
                    : "Email",
                ],
              ]}
            />
          </Panel>
          <Panel title="Current home">
            <FactList
              items={[
                ["Property", property.name],
                ["Apartment", unit.number],
                ["Lease start", formatDate(lease.starts_on)],
                ["Lease end", formatDate(lease.ends_on)],
                ["Rent", money(lease.rent_cents)],
              ]}
            />
          </Panel>
        </div>
      )}
      {tab === "lease" && (
        <Panel title="Active lease">
          <FactList
            items={[
              ["Property", property.name],
              ["Unit", unit.number],
              ["Start", formatDate(lease.starts_on)],
              ["Expiration", formatDate(lease.ends_on)],
              ["Monthly rent", money(lease.rent_cents)],
              ["Deposit", money(lease.deposit_cents)],
              [
                "Occupants",
                residentsForUnit(unit.id)
                  .map((r) => r.name)
                  .join(", "),
              ],
              [
                "Renewal",
                lease.renewal_status?.replaceAll("_", " ") ?? "Not started",
              ],
            ]}
          />
          <p className="m-footnote">
            Fictional lease metadata. No legal agreement is generated.
          </p>
        </Panel>
      )}
      {tab === "payments" && (
        <ManagementTable
          caption="Resident payment history"
          headers={["Charge due", "Amount", "Status", "Paid on", "Method"]}
          rows={portfolioPayments(state)
            .filter((p) => p.resident_id === id)
            .sort((a, b) => b.due_on.localeCompare(a.due_on))
            .map((p) => ({
              id: p.id,
              cells: [
                formatDate(p.due_on),
                money(p.amount_cents),
                <WorkflowStatus key="s">{p.status}</WorkflowStatus>,
                p.paid_at ? formatDate(p.paid_at) : "—",
                p.method + " · Simulated",
              ],
            }))}
        />
      )}
      {tab === "maintenance" && (
        <ManagementQueue persona={persona} residentId={id} embedded />
      )}
      {tab === "documents" && <ManagementDocuments residentId={id} embedded />}
    </div>
  );
}

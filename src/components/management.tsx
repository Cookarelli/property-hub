"use client";
import {
  demoOrganizationBranding as tenantBranding,
  demoOrganizationContacts,
} from "@/lib/demo/organization";
import { LeasingInbox } from "@/components/leasing/inbox";
import {
  MaintenanceTimeline,
  MaintenanceAccess,
  ManagementMaintenanceActions,
} from "@/components/resident/maintenance-shared";
import { ResidentMessagesInbox } from "@/components/resident/living";
import { getMaintenance } from "@/lib/demo/selectors";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  DoorOpen,
  FileCheck2,
  Plus,
  Search,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DetailDialog,
  DocumentButton,
  EmptyState,
  PageHeading,
  Panel,
  Status,
  Success,
  TextLink,
} from "@/components/shared";
import { PropertyCard } from "@/components/marketplace";
import {
  activityEvents,
  announcements,
  applications,
  documents,
  leads,
  leases,
  money,
  payments,
  planFor,
  properties,
  propertyFor,
  residents,
  staffUsers,
  units,
} from "@/lib/demo/data";
import { demoHref } from "@/lib/navigation";
import type { Persona } from "@/lib/types";
import { useDemoState } from "@/lib/demo/store";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Building2;
}) {
  return (
    <div className="stat-card">
      <div>
        <p>{label}</p>
        <span className="stat-icon">
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      <span className="stat-detail">{detail}</span>
    </div>
  );
}
export function ManagementDashboard({ persona }: { persona: Persona }) {
  const { state } = useDemoState();
  const september = payments.filter((p) => p.due_on.startsWith("2026-09"));
  const collected = september
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount_cents, 0);
  const expected = september.reduce((s, p) => s + p.amount_cents, 0);
  const open = getMaintenance(state).filter(
    (request) => request.status !== "completed",
  );
  return (
    <>
      <PageHeading
        eyebrow="THURSDAY, SEPTEMBER 17, 2026"
        title={
          persona === "maintenance"
            ? "Let’s keep things running."
            : `Good morning, ${persona === "owner" ? "Sam" : "Alex"}.`
        }
        description={
          persona === "maintenance"
            ? "A clear view of the work that needs your attention."
            : "Here’s what’s happening across your portfolio today."
        }
        action={
          <Button variant="outline" onClick={() => window.print()}>
            <ArrowDownToLine size={16} />
            Export overview
          </Button>
        }
      />
      <div className="overview-toolbar">
        <div className="flex items-center gap-2">
          <span className="small-square">
            <Building2 size={16} />
          </span>
          <strong>Portfolio overview</strong>
          <span className="text-muted-foreground">/ All 3 communities</span>
        </div>
        <span className="date-label">
          <CalendarDays size={15} />
          September 2026
        </span>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Total apartments"
          value="90"
          detail="Across 3 communities"
          icon={Building2}
        />
        <StatCard
          label="Occupancy rate"
          value={`${((leases.length / units.length) * 100).toFixed(1)}%`}
          detail="78 occupied · 9 available · 3 turnover"
          icon={DoorOpen}
        />
        <StatCard
          label="Rent collected"
          value={money(collected)}
          detail={`${((collected / expected) * 100).toFixed(1)}% of ${money(expected)} expected`}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Open maintenance"
          value={String(open.length)}
          detail={`${open.filter((r) => r.priority === "urgent").length} urgent request needs attention`}
          icon={Wrench}
        />
      </div>
      <div className="dashboard-main-grid">
        <RevenueChart />
        <Panel
          title="Needs your attention"
          subtitle="A few things to keep moving"
          action={<span className="attention-count">3</span>}
        >
          <div className="attention-list">
            <Link href={demoHref(persona, "Maintenance")}>
              <span className="attention-icon red">
                <Wrench size={18} />
              </span>
              <div>
                <strong>
                  {
                    open.filter((request) => request.priority === "urgent")
                      .length
                  }{" "}
                  urgent repairs
                </strong>
                <p>
                  {open.find((request) => request.priority === "urgent")
                    ?.title ?? "No urgent requests remaining"}
                </p>
              </div>
              <ChevronRight size={16} />
            </Link>
            <Link
              href={demoHref(
                persona,
                persona === "maintenance" ? "Maintenance" : "Applications",
              )}
            >
              <span className="attention-icon amber">
                <FileCheck2 size={18} />
              </span>
              <div>
                <strong>
                  {applications.filter((a) => a.status === "in_review").length}{" "}
                  applications in review
                </strong>
                <p>Help the next chapter get started</p>
              </div>
              <ChevronRight size={16} />
            </Link>
            <Link
              href={demoHref(
                persona,
                persona === "maintenance" ? "Properties" : "Residents",
              )}
            >
              <span className="attention-icon green">
                <CalendarDays size={18} />
              </span>
              <div>
                <strong>
                  {leases.filter((l) => l.ends_on === "2026-10-31").length}{" "}
                  upcoming lease expirations
                </strong>
                <p>Plan ahead for October 31</p>
              </div>
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="attention-footer">
            <span className="live-dot" />
            Your communities, all in one place.
          </div>
        </Panel>
      </div>
      <div className="section-title dashboard-section-title">
        <div>
          <h2>Your communities</h2>
          <p>Distinct places. One connected portfolio.</p>
        </div>
        <TextLink href={demoHref(persona, "Properties")}>
          View all properties
        </TextLink>
      </div>
      <div className="property-grid dashboard-property-grid">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} management />
        ))}
      </div>
      <div className="dashboard-bottom-grid">
        <Panel
          title="Recent activity"
          action={
            <span className="text-xs text-muted-foreground">
              Latest in your demo
            </span>
          }
        >
          <div className="activity-list">
            {activityEvents.map((a, i) => (
              <div key={a.id}>
                <span className={`activity-icon activity-${i}`}>
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.description}</p>
                </div>
                <small>Sep 17</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Leasing snapshot"
          subtitle="From first hello to welcome home"
        >
          <div className="leasing-snapshot">
            {[
              ["New leads", String(leads.length), Users],
              ["Active applications", String(applications.length), FileCheck2],
              ["Available apartments", "9", DoorOpen],
            ].map(([label, value, icon]) => {
              const Icon = icon as typeof Users;
              return (
                <div key={String(label)}>
                  <span>
                    <Icon size={17} />
                    {String(label)}
                  </span>
                  <strong>{String(value)}</strong>
                </div>
              );
            })}
          </div>
          <div className="panel-foot">
            <TextLink
              href={demoHref(
                persona,
                persona === "maintenance" ? "Properties" : "Leads",
              )}
            >
              Explore your pipeline
            </TextLink>
          </div>
        </Panel>
      </div>
    </>
  );
}
export function RevenueChart() {
  const monthly = [7, 8, 9].map((month) => {
    const own = payments.filter((p) => p.due_on === `2026-0${month}-01`);
    return {
      label: ["July", "August", "September"][month - 7],
      expected: own.reduce((s, p) => s + p.amount_cents, 0),
      received: own
        .filter((p) => p.status === "paid")
        .reduce((s, p) => s + p.amount_cents, 0),
    };
  });
  const max = Math.max(...monthly.map((m) => m.expected));
  return (
    <Panel
      title="Rent collection"
      subtitle="A clear picture of your portfolio’s income"
      action={<span className="chart-period">Last 3 months</span>}
    >
      <div className="chart-legend">
        <span>
          <i />
          Collected rent
        </span>
        <span>
          <i />
          Expected rent
        </span>
      </div>
      <div
        className="revenue-chart"
        role="img"
        aria-label={monthly
          .map(
            (m) =>
              `${m.label}: ${money(m.received)} collected of ${money(m.expected)} expected`,
          )
          .join(". ")}
      >
        <div className="chart-axis">
          <span>{money(max)}</span>
          <span>{money(max / 2)}</span>
          <span>$0</span>
        </div>
        <div className="chart-plot">
          {monthly.map((m) => (
            <div className="chart-month" key={m.label}>
              <div className="chart-bars">
                <div
                  className="bar bar-collected"
                  style={{ height: `${(m.received / max) * 100}%` }}
                >
                  <span>{money(m.received)}</span>
                </div>
                <div
                  className="bar bar-expected"
                  style={{ height: `${(m.expected / max) * 100}%` }}
                />
              </div>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-footer">
        <TrendingUp size={16} />
        <span>
          September collection: {money(monthly[2].received)}{" "}
          <span className="text-muted-foreground">of {money(max)}</span>
        </span>
      </div>
    </Panel>
  );
}

type TableRow = { id: string; cells: string[]; description: string };
export function RecordTable({
  title,
  description,
  headers,
  rows,
}: {
  title: string;
  description: string;
  headers: string[];
  rows: TableRow[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const statuses = [...new Set(rows.map((r) => r.cells[r.cells.length - 1]))];
  const filtered = rows.filter(
    (r) =>
      r.cells.join(" ").toLowerCase().includes(query.toLowerCase()) &&
      (status === "all" || r.cells[r.cells.length - 1] === status),
  );
  return (
    <>
      <PageHeading title={title} description={description} />
      <Panel>
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={17} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              aria-label={`Search ${title.toLowerCase()}`}
            />
          </div>
          <select
            className="table-select"
            aria-label="Filter status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span>{filtered.length} records</span>
        </div>
        {filtered.length ? (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Scrollable records"
          >
            <table>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                  <th scope="col">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    {r.cells.map((c, i) => (
                      <td key={i}>
                        {i === r.cells.length - 1 ? (
                          <Status>{c}</Status>
                        ) : i === 0 ? (
                          <strong>{c}</strong>
                        ) : (
                          c
                        )}
                      </td>
                    ))}
                    <td>
                      <DetailDialog
                        title={r.cells[0]}
                        description="Record details · Fictional demo organization"
                        trigger={
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`View ${r.cells[0]}`}
                          >
                            <ArrowUpRight size={16} />
                          </Button>
                        }
                      >
                        <dl className="record-detail">
                          {headers.map((h, i) => (
                            <div key={h}>
                              <dt>{h}</dt>
                              <dd>{r.cells[i].replaceAll("_", " ")}</dd>
                            </div>
                          ))}
                        </dl>
                        <p className="text-sm text-muted-foreground leading-6">
                          {r.description}
                        </p>
                      </DetailDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching records"
            description="Try a different search or reset the status filter."
          />
        )}
      </Panel>
    </>
  );
}
export function ManagementRecords({ section }: { section: string }) {
  if (section === "units")
    return (
      <RecordTable
        title="Units"
        description="Every apartment, with the details that make it a home."
        headers={[
          "Apartment",
          "Community",
          "Floor plan",
          "Monthly rent",
          "Status",
        ]}
        rows={units.map((u) => ({
          id: u.id,
          cells: [
            u.number,
            propertyFor(u.property_id).name,
            `${planFor(u).name} · ${planFor(u).sqft} sqft`,
            money(u.rent_cents),
            u.status,
          ],
          description:
            u.status === "occupied"
              ? "This apartment is linked to an active lease and resident."
              : u.status === "available"
                ? "Available October 1, 2026. This apartment has no active lease or resident."
                : "This apartment is being prepared for the next resident. It is not currently listed as available.",
        }))}
      />
    );
  if (section === "residents")
    return (
      <>
        <ResidentMessagesInbox />
        <RecordTable
          title="Residents"
          description="The people at the heart of your communities."
          headers={[
            "Resident",
            "Community",
            "Apartment",
            "Lease ends",
            "Status",
          ]}
          rows={residents.map((r, i) => {
            const u = units.find((u) => u.id === leases[i].unit_id)!;
            return {
              id: r.id,
              cells: [
                r.name,
                propertyFor(u.property_id).name,
                u.number,
                leases[i].ends_on,
                "active",
              ],
              description: `${r.email} · ${r.phone}. Monthly rent ${money(leases[i].rent_cents)}.`,
            };
          })}
        />
      </>
    );
  if (section === "leads")
    return (
      <>
        <LeasingInbox />
        <RecordTable
          title="Leads"
          description="Turn the first hello into a warm welcome."
          headers={["Prospect", "Community", "Source", "Interest", "Status"]}
          rows={leads.map((l) => ({
            id: l.id,
            cells: [
              l.name,
              propertyFor(l.property_id).name,
              l.source,
              l.interested_bedrooms
                ? `${l.interested_bedrooms} bedrooms`
                : "Studio",
              l.status,
            ],
            description: `Contact: ${l.email}. Demo contact details only; no messages are sent.`,
          }))}
        />
      </>
    );
  return <ApplicationsTable />;
}
function ApplicationsTable() {
  const { state } = useDemoState();
  return (
    <RecordTable
      title="Applications"
      description="A clear view of every applicant’s next step."
      headers={[
        "Applicant",
        "Community",
        "Apartment",
        "Move-in date",
        "Status",
      ]}
      rows={applications.map((a, i) => ({
        id: a.id,
        cells: [
          i === 0 && state.application ? state.application.name : a.name,
          propertyFor(
            units.find(
              (u) =>
                u.id ===
                (i === 0 && state.application
                  ? state.application.unitId
                  : a.unit_id),
            )!.property_id,
          ).name,
          units.find(
            (u) =>
              u.id ===
              (i === 0 && state.application
                ? state.application.unitId
                : a.unit_id),
          )?.number ?? "B-302",
          i === 0 && state.application
            ? state.application.moveIn
            : a.desired_move_in,
          i === 0 && state.applicationSubmitted ? "submitted" : a.status,
        ],
        description: `Contact: ${i === 0 && state.application ? state.application.email : a.email}. Fictional application details. No screening or credit check has been performed.`,
      }))}
    />
  );
}
export function MaintenanceBoard({
  resident = false,
  canManage = true,
}: {
  resident?: boolean;
  canManage?: boolean;
}) {
  const { state, update } = useDemoState();
  const [filter, setFilter] = useState("active");
  const [sent, setSent] = useState(false);
  const [adding, setAdding] = useState(false);
  const all = getMaintenance(state).filter(
    (request) => !resident || request.resident_id === residents[0].id,
  );
  const rows = all.filter(
    (r) =>
      filter === "all" ||
      (filter === "active" ? r.status !== "completed" : r.status === filter),
  );
  return (
    <>
      <PageHeading
        title={resident ? "A little help at home." : "Maintenance"}
        description={
          resident
            ? "Tell us what needs attention. We’ll take it from here."
            : "Keep your communities in good working order."
        }
        action={
          <Button onClick={() => setAdding(!adding)}>
            <Plus size={16} />
            {adding ? "Close request form" : "New request"}
          </Button>
        }
      />
      {adding && (
        <Panel
          title="New maintenance request"
          subtitle="Demo request · The Mercer, A-101"
        >
          <form
            className="form-grid p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              update({
                tickets: [
                  {
                    id: crypto.randomUUID(),
                    title: String(data.get("title")).trim(),
                    description: String(data.get("description")).trim(),
                    category: String(data.get("category")),
                    priority: "normal",
                    permission: data.get("permission") === "on",
                  },
                  ...(state.tickets ?? []),
                ],
              });
              setSent(true);
              setAdding(false);
            }}
          >
            <label>
              What needs attention?
              <Input
                name="title"
                required
                minLength={4}
                maxLength={120}
                placeholder="For example, kitchen faucet is leaking"
              />
            </label>
            <label>
              Category
              <select name="category">
                <option>Plumbing</option>
                <option>HVAC</option>
                <option>Electrical</option>
                <option>Appliance</option>
                <option>Access</option>
                <option>General</option>
              </select>
            </label>
            <label className="form-full">
              Tell us a little more
              <Textarea
                name="description"
                required
                minLength={10}
                maxLength={2000}
                placeholder="Where is the issue, and when did it start?"
              />
            </label>
            <label className="checkbox-label form-full">
              <input name="permission" type="checkbox" />
              Our team may enter when I’m away.
            </label>
            <p className="form-full text-sm text-muted-foreground">
              For immediate danger, call local emergency services. This demo
              does not dispatch a maintenance team.
            </p>
            <Button type="submit">Submit demo request</Button>
          </form>
        </Panel>
      )}
      {sent && (
        <Success>
          Your demo request is saved. Switch personas to follow its progress.
        </Success>
      )}
      <div
        className="tabs-row"
        role="group"
        aria-label="Filter maintenance requests"
      >
        {[
          ["active", "Active requests"],
          ["completed", "Completed"],
          ["all", "All requests"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
        <span>{rows.length} requests</span>
      </div>
      {rows.length ? (
        <div className="maintenance-list">
          {rows.map((r) => {
            const u = units.find((u) => u.id === r.unit_id)!;
            return (
              <Panel key={r.id}>
                <div className="maintenance-item">
                  <span
                    className={`maintenance-icon ${r.priority === "urgent" ? "urgent" : ""}`}
                  >
                    <Wrench size={20} />
                  </span>
                  <div className="maintenance-content">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="eyebrow">{r.category}</span>
                      <Status>{r.priority}</Status>
                    </div>
                    <h2>{r.title}</h2>
                    <p>
                      {propertyFor(r.property_id).name} · {u.number} ·{" "}
                      {residents.find((res) => res.id === r.resident_id)?.name}
                    </p>
                    <div className="mt-3">
                      <Status>{r.status}</Status>
                    </div>
                  </div>
                  <DetailDialog
                    title={r.title}
                    description={`${propertyFor(r.property_id).name} · ${u.number}`}
                    trigger={
                      <Button variant="outline" size="sm">
                        View request <ArrowUpRight size={14} />
                      </Button>
                    }
                  >
                    <p className="text-sm leading-6">{r.description}</p>
                    <dl className="record-detail">
                      <div>
                        <dt>Assigned to</dt>
                        <dd>{r.assigned_to ? "Marcus Reed" : "Unassigned"}</dd>
                      </div>
                    </dl>
                    <MaintenanceAccess request={r} />
                    <MaintenanceTimeline request={r} />
                    {canManage && !resident && (
                      <ManagementMaintenanceActions request={r} />
                    )}
                  </DetailDialog>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="All clear"
          description="There are no requests in this view."
        />
      )}
    </>
  );
}
export function DocumentsPage({ resident = false }: { resident?: boolean }) {
  const rows = documents.filter(
    (d) =>
      !resident || d.resident_id === null || d.resident_id === residents[0].id,
  );
  return (
    <>
      <PageHeading
        title="Documents"
        description="The right information, right when you need it."
      />
      <Panel
        title="Your document library"
        subtitle="Readable, downloadable fictional demo documents"
      >
        <div className="documents-list">
          {rows.map((d) => (
            <div key={d.id}>
              <DocumentButton title={d.title} content={d.content} />
              <span className="text-xs text-muted-foreground">
                {d.category} · Updated Sep 17, 2026
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
export function AnnouncementsPage({
  resident = false,
}: {
  resident?: boolean;
}) {
  const { state, update } = useDemoState();
  const [success, setSuccess] = useState(false);
  const [adding, setAdding] = useState(false);
  const rows = announcements.filter(
    (a) => !resident || !a.property_id || a.property_id === properties[0].id,
  );
  return (
    <>
      <PageHeading
        title={resident ? "Around the community" : "Announcements"}
        description="A little news from the places we call home."
        action={
          !resident && (
            <Button onClick={() => setAdding(!adding)}>
              <Plus size={16} />
              Write announcement
            </Button>
          )
        }
      />
      {adding && (
        <Panel title="Share a community update">
          <form
            className="form-grid p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              update({
                announcements: [
                  {
                    id: crypto.randomUUID(),
                    title: String(form.get("title")),
                    body: String(form.get("body")),
                  },
                  ...(state.announcements ?? []),
                ],
              });
              setSuccess(true);
              setAdding(false);
            }}
          >
            <label className="form-full">
              Title
              <Input name="title" required maxLength={120} />
            </label>
            <label className="form-full">
              Message
              <Textarea name="body" required minLength={10} maxLength={3000} />
            </label>
            <Button>Publish to demo</Button>
          </form>
        </Panel>
      )}
      {success && (
        <Success>
          Your announcement is visible to residents in this demo tab.
        </Success>
      )}
      <div className="announcement-grid">
        {[
          ...(state.announcements ?? []).map((a) => ({
            ...announcements[1],
            ...a,
          })),
          ...rows,
        ].map((a) => (
          <article className="announcement-card" key={a.id}>
            <div className="announcement-top">
              <span className="eyebrow">{a.category}</span>
              <span>SEP {a.published_at.slice(8, 10)}</span>
            </div>
            <h2>{a.title}</h2>
            <p>{a.body}</p>
            <div className="announcement-author">
              <span className="avatar small">AS</span>
              <span>
                {tenantBranding.name}
                <br />
                <small>
                  {a.property_id
                    ? propertyFor(a.property_id).name
                    : "All communities"}
                </small>
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
export function SettingsPage({
  profile = false,
  maintenance = false,
}: {
  profile?: boolean;
  maintenance?: boolean;
}) {
  const { state, update } = useDemoState();
  const name = maintenance
    ? (state.maintenanceProfile?.name ?? "Marcus Reed")
    : (state.profileName ?? "Alex Rivera");
  const phone = maintenance
    ? (state.maintenanceProfile?.phone ??
      demoOrganizationContacts.maintenance_phone)
    : (state.profilePhone ?? demoOrganizationContacts.manager_phone);
  const preference = maintenance
    ? (state.maintenanceProfile?.preference ?? "Portal")
    : (state.contactPreference ?? "Portal");
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHeading
        title={profile ? "Your profile" : "Organization settings"}
        description="Keep the everyday details up to date."
      />
      <Panel
        title={profile ? "Personal details" : "Organization details"}
        subtitle="Changes are saved for this demo tab only."
      >
        <form
          className="form-grid p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            update(
              maintenance
                ? {
                    maintenanceProfile: {
                      name: String(data.get("name")),
                      phone: String(data.get("phone")),
                      preference: String(data.get("preference")),
                    },
                  }
                : profile
                  ? {
                      profileName: String(data.get("name")),
                      profilePhone: String(data.get("phone")),
                      contactPreference: String(data.get("preference")),
                    }
                  : { organizationName: String(data.get("name")) },
            );
            setSaved(true);
          }}
        >
          <label>
            {profile ? "Full name" : "Organization name"}
            <Input
              key={state.profileName ?? state.organizationName}
              name="name"
              defaultValue={
                profile ? name : (state.organizationName ?? tenantBranding.name)
              }
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          {profile ? (
            <>
              <label>
                Phone number
                <Input
                  name="phone"
                  type="tel"
                  defaultValue={phone}
                  maxLength={30}
                />
              </label>
              <label>
                Preferred contact method
                <select name="preference" defaultValue={preference}>
                  <option>Portal</option>
                  <option>Email</option>
                  <option>Phone</option>
                </select>
              </label>
            </>
          ) : (
            <label>
              Workspace address
              <Input
                value={tenantBranding.website.replace("https://", "")}
                readOnly
              />
            </label>
          )}
          <div className="form-full">
            <Button type="submit">Save changes</Button>
            {saved && <Success>Your demo details have been updated.</Success>}
          </div>
        </form>
      </Panel>
      {!profile && (
        <Panel
          title="Team & permissions"
          subtitle="Roles are scoped to this organization."
        >
          <div className="team-list">
            {staffUsers.map((u) => (
              <div key={u.id}>
                <span className="avatar">
                  {u.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <strong>{u.full_name}</strong>
                <Status>{u.role}</Status>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
export function ManagementPage({
  persona,
  section,
}: {
  persona: Persona;
  section: string;
}) {
  if (section === "dashboard") return <ManagementDashboard persona={persona} />;
  if (section === "properties")
    return (
      <>
        <PageHeading
          title="Your communities"
          description="Three distinctive places. One connected view."
        />
        <div className="property-grid">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} management />
          ))}
        </div>
      </>
    );
  if (section === "maintenance") return <MaintenanceBoard />;
  if (section === "documents") return <DocumentsPage />;
  if (section === "announcements")
    return <AnnouncementsPage resident={persona === "maintenance"} />;
  if (section === "settings" || section === "profile")
    return (
      <SettingsPage
        profile={section === "profile"}
        maintenance={persona === "maintenance"}
      />
    );
  if (section === "analytics")
    return (
      <>
        <PageHeading
          title="Portfolio analytics"
          description="Turn a clear view of today into better decisions for tomorrow."
        />
        <div className="stats-grid">
          <StatCard
            label="Occupied apartments"
            value="78 / 90"
            detail="86.7% portfolio occupancy"
            icon={Building2}
          />
          <StatCard
            label="Annualized rent roll"
            value={money(leases.reduce((s, l) => s + l.rent_cents * 12, 0))}
            detail="Based on active contracted rents"
            icon={CircleDollarSign}
          />
          <StatCard
            label="Available apartments"
            value="9"
            detail="3 homes in each community"
            icon={DoorOpen}
          />
          <StatCard
            label="Active residents"
            value="78"
            detail="Linked to 78 current leases"
            icon={Users}
          />
        </div>
        <RevenueChart />
        <div className="mt-6">
          <RecordTable
            title="By community"
            description="Occupancy and monthly contracted rent."
            headers={[
              "Community",
              "Occupied",
              "Available",
              "Rent roll",
              "Status",
            ]}
            rows={properties.map((p) => {
              const occupied = units.filter(
                (u) => u.property_id === p.id && u.status === "occupied",
              );
              return {
                id: p.id,
                cells: [
                  p.name,
                  "26 / 30",
                  "3",
                  money(occupied.reduce((s, u) => s + u.rent_cents, 0)),
                  "active",
                ],
                description:
                  "One additional unit is in turnover. Revenue excludes vacant and turnover units.",
              };
            })}
          />
        </div>
      </>
    );
  return <ManagementRecords section={section} />;
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shared";
import { money, properties } from "@/lib/demo/data";
import { useDemoState } from "@/lib/demo/store";
import { useLeasingData } from "@/lib/leasing/use-leasing-data";
import { getActivity, portfolioMetrics } from "@/lib/management/data";
import {
  applicationLabels,
  applicationStatuses,
} from "@/lib/management/schema";
import { statusLabels, maintenanceStatuses } from "@/lib/resident/schema";
import { formatDate } from "@/lib/resident/data";
import type { Persona } from "@/lib/types";
import {
  ManagementHeading,
  PropertyFilter,
  ManagementTable,
  RecordLink,
} from "./common";
export function Distribution({
  items,
  format = (n: number) => String(n),
}: {
  items: { label: string; value: number; color: string }[];
  format?: (n: number) => string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="m-distribution">
      <div className="m-stacked" aria-hidden="true">
        {items
          .filter((i) => i.value > 0)
          .map((i) => (
            <span
              key={i.label}
              style={{
                width: (100 * i.value) / (total || 1) + "%",
                background: i.color,
              }}
            />
          ))}
      </div>
      <dl>
        {items.map((i) => (
          <div key={i.label}>
            <dt>
              <i style={{ background: i.color }} />
              {i.label}
            </dt>
            <dd>{format(i.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
export function ActivityFeed({
  persona,
  full = false,
  propertyId = "",
}: {
  persona: Persona;
  full?: boolean;
  propertyId?: string;
}) {
  const { state } = useDemoState();
  const { data, error, pending, refresh } = useLeasingData(true);
  const [filter, setFilter] = useState("all");
  const all = getActivity(state, data?.records).filter(
    (e) =>
      (!propertyId || e.propertyId === propertyId) &&
      (filter === "all" || e.type.startsWith(filter)),
  );
  return (
    <Panel
      title="Recent activity"
      subtitle="Demo actions and saved public leasing requests"
      action={
        full ? (
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={pending}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
        ) : (
          <Link className="m-text-link" href={"/demo/" + persona + "/activity"}>
            View activity <ArrowUpRight size={14} />
          </Link>
        )
      }
    >
      {full && (
        <div
          className="m-activity-filters"
          role="group"
          aria-label="Activity type"
        >
          {[
            "all",
            "application",
            "tour",
            "maintenance",
            "payment",
            "announcement",
          ].map((type) => (
            <button
              key={type}
              aria-pressed={filter === type}
              onClick={() => setFilter(type)}
            >
              {type === "all" ? "All activity" : type}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="m-inline-error">
          {error} <button onClick={refresh}>Retry</button>
        </p>
      )}
      <ol className="m-activity-list">
        {(full ? all : all.slice(0, 6)).map((e) => (
          <li key={e.id}>
            <span className="m-activity-dot" />
            <div>
              <Link href={"/demo/" + persona + "/" + (e.href ?? "activity")}>
                <strong>{e.title}</strong>
              </Link>
              <p>{e.description}</p>
              <small>
                {e.actor} · {formatDate(e.at)}
              </small>
            </div>
          </li>
        ))}
      </ol>
      {!all.length && (
        <p className="m-empty-inline">No activity in this view yet.</p>
      )}
    </Panel>
  );
}
export function PortfolioDashboard({
  persona,
  analytics = false,
}: {
  persona: Persona;
  analytics?: boolean;
}) {
  const { state } = useDemoState();
  const { data, error, refresh } = useLeasingData(true);
  const [property, setProperty] = useState("");
  const m = portfolioMetrics(state, property, data?.records);
  const root = "/demo/" + persona;
  const selectedProperty = properties.find((p) => p.id === property);
  const destination = (section: string) =>
    selectedProperty
      ? root +
        "/properties/" +
        selectedProperty.slug +
        (section === "properties" ? "" : "/" + section)
      : root + "/" + section;
  const metrics = [
    ["Total Units", String(m.total), "All inventory", "units"],
    ["Occupied Units", String(m.occupied), "Active leases", "units"],
    [
      "Vacant Units",
      String(m.vacant),
      m.available + " available · " + m.turnover + " turnover",
      "units",
    ],
    [
      "Occupancy %",
      m.occupancy.toFixed(1) + "%",
      "Occupied / total units",
      "properties",
    ],
    [
      "Monthly Scheduled Rent",
      money(m.scheduled),
      "Active lease rent · September",
      "residents",
    ],
    [
      "Outstanding Rent",
      money(m.outstanding),
      "Unpaid charges due by Sep 17",
      "residents",
    ],
    [
      "Open Maintenance Requests",
      String(m.open),
      "Submitted, scheduled, in progress",
      "maintenance",
    ],
    [
      "Pending Applications",
      String(m.pending),
      "Started, submitted, under review",
      "applications",
    ],
    [
      "Upcoming Lease Expirations",
      String(m.expirations),
      "Next 60 days · Through Nov 16",
      "residents",
    ],
    [
      "New Leads",
      String(m.newLeads),
      "New stage · Includes website inquiries",
      "leads",
    ],
  ];
  return (
    <div className="m-page">
      <ManagementHeading
        title={
          analytics
            ? "Portfolio analytics"
            : persona === "owner"
              ? "Portfolio overview"
              : "Operations center"
        }
        description={
          persona === "owner"
            ? "A clear view of occupancy, income, and portfolio priorities."
            : "The people, requests, and leasing decisions that need your attention."
        }
        action={
          <Button variant="outline" onClick={() => window.print()}>
            Export overview
          </Button>
        }
      />
      <div className="m-overview-toolbar">
        <PropertyFilter value={property} onChange={setProperty} />
        <span>September 17, 2026 · Fictional portfolio</span>
      </div>
      {error && (
        <p role="alert" className="m-inline-error">
          Saved website inquiries are unavailable; metrics show the seeded demo.{" "}
          <button onClick={refresh}>Retry</button>
        </p>
      )}
      <div className="m-metrics">
        {metrics.map(([label, value, detail, href]) => (
          <Link className="m-metric" key={label} href={destination(href)}>
            <span>
              {label}
              <ArrowUpRight size={13} />
            </span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </Link>
        ))}
      </div>
      {persona === "property-manager" && (
        <div className="m-priorities">
          <strong>Today’s priorities</strong>
          <Link href={root + "/maintenance"}>
            {
              m.repairs.filter(
                (r) => r.priority === "urgent" && r.status !== "completed",
              ).length
            }{" "}
            urgent repairs →
          </Link>
          <Link href={root + "/applications"}>
            {m.apps.filter((a) => a.status === "submitted").length} submitted
            applications →
          </Link>
          <Link href={root + "/residents"}>
            {m.expirations} lease conversations →
          </Link>
        </div>
      )}
      <div className="m-chart-grid">
        <Panel
          title="Occupancy"
          subtitle="Physical inventory across the selected portfolio"
        >
          <Distribution
            items={[
              { label: "Occupied", value: m.occupied, color: "#284d3e" },
              { label: "Available", value: m.available, color: "#86a371" },
              { label: "Turnover", value: m.turnover, color: "#c89f5d" },
            ]}
          />
        </Panel>
        <Panel
          title="Maintenance status"
          subtitle="All requests, including completed history"
        >
          <Distribution
            items={maintenanceStatuses.map((s, i) => ({
              label: statusLabels[s],
              value: m.repairs.filter((r) => r.status === s).length,
              color: ["#b2945e", "#608295", "#355745", "#91a37b"][i],
            }))}
          />
        </Panel>
        <Panel
          title="Application pipeline"
          subtitle="Demo workflow counts; no screening performed"
        >
          <div className="m-pipeline-bars">
            {applicationStatuses.map((s) => {
              const n = m.apps.filter((a) => a.status === s).length;
              return (
                <div key={s}>
                  <span>{applicationLabels[s]}</span>
                  <div aria-hidden="true">
                    <i
                      style={{ width: (100 * n) / (m.apps.length || 1) + "%" }}
                    />
                  </div>
                  <strong>{n}</strong>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel
          title="September rent"
          subtitle="Charges and payments for the current demo month"
        >
          <Distribution
            format={money}
            items={[
              {
                label: "Paid",
                value: m.month
                  .filter((p) => p.status === "paid")
                  .reduce((s, p) => s + p.amount_cents, 0),
                color: "#284d3e",
              },
              {
                label: "Pending",
                value: m.month
                  .filter((p) => p.status === "pending")
                  .reduce((s, p) => s + p.amount_cents, 0),
                color: "#b2945e",
              },
              {
                label: "Overdue",
                value: m.month
                  .filter((p) => p.status === "overdue")
                  .reduce((s, p) => s + p.amount_cents, 0),
                color: "#a05b49",
              },
            ]}
          />
          <p className="m-footnote">
            Future charges and early payments appear in resident ledgers,
            outside this monthly chart.
          </p>
        </Panel>
      </div>
      <div className="m-section-heading">
        <div>
          <h2>Community performance</h2>
          <p>Compare leasing activity and operations in one view.</p>
        </div>
        <Link className="m-text-link" href={root + "/properties"}>
          All properties <ArrowUpRight size={14} />
        </Link>
      </div>
      <ManagementTable
        caption="Community performance"
        headers={[
          "Property",
          "Units",
          "Occupancy",
          "Available",
          "Scheduled rent",
          "Open repairs",
          "Pending apps",
        ]}
        rows={properties
          .filter((p) => !property || p.id === property)
          .map((p) => {
            const pm = portfolioMetrics(state, p.id, data?.records);
            return {
              id: p.id,
              cells: [
                <RecordLink key="name" href={root + "/properties/" + p.slug}>
                  {p.name}
                </RecordLink>,
                pm.total,
                pm.occupancy.toFixed(1) + "%",
                pm.available,
                money(pm.scheduled),
                pm.open,
                pm.pending,
              ],
            };
          })}
      />
      <div className="m-dashboard-activity">
        <ActivityFeed persona={persona} propertyId={property} />
      </div>
    </div>
  );
}

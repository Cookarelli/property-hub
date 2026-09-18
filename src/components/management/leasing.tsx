"use client";
import { useState } from "react";
import { useDemoState } from "@/lib/demo/store";
import { useLeasingData } from "@/lib/leasing/use-leasing-data";
import { getApplications, getLeads } from "@/lib/management/data";
import {
  applicationLabels,
  applicationStatuses,
  leadStatuses,
} from "@/lib/management/schema";
import { properties, units } from "@/lib/demo/data";
import { formatDate } from "@/lib/resident/data";
import { Button } from "@/components/ui/button";
import { DetailDialog } from "@/components/shared";
import { LeasingInbox } from "@/components/leasing/inbox";
import { demoStory } from "@/lib/demo/story";
import {
  DemoSaveNote,
  FactList,
  FilterSelect,
  ManagementHeading,
  ManagementTable,
  PropertyFilter,
  SearchBox,
} from "./common";
export function ManagementLeads() {
  const { state, update } = useDemoState();
  const { data, error: loadError, pending, refresh } = useLeasingData(true);
  const [query, setQuery] = useState("");
  const [property, setProperty] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const all = getLeads(state, data?.records).filter(
    (l) => !property || l.property_id === property,
  );
  const filtered = all.filter(
    (l) =>
      (!status || l.status === status) &&
      (l.name + " " + l.email + " " + l.phone + " " + l.source)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="m-page">
      <ManagementHeading
        title="Leads"
        description="From the first inquiry to a signed lease. Keep the next step visible."
        action={
          <Button variant="outline" onClick={refresh} disabled={pending}>
            Refresh inquiries
          </Button>
        }
      />
      <div className="m-filters">
        <SearchBox label="Search leads" value={query} onChange={setQuery} />
        <PropertyFilter value={property} onChange={setProperty} />
      </div>
      <div className="m-crm-stages" role="group" aria-label="Lead pipeline">
        {["All", ...leadStatuses].map((stage) => (
          <button
            key={stage}
            aria-pressed={stage === "All" ? !status : stage === status}
            onClick={() => setStatus(stage === "All" ? "" : stage)}
          >
            <span>{stage}</span>
            <strong>
              {stage === "All"
                ? all.length
                : all.filter((l) => l.status === stage).length}
            </strong>
          </button>
        ))}
      </div>
      {loadError && (
        <p className="m-inline-error" role="alert">
          {loadError} Seeded prospects remain available.{" "}
          <button onClick={refresh}>Retry</button>
        </p>
      )}
      {error && (
        <p role="alert" className="m-inline-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="m-save-status">
          {notice}
        </p>
      )}
      <ManagementTable
        caption="Lead pipeline records"
        headers={[
          "Name",
          "Interested home",
          "Contact",
          "Desired move",
          "Source",
          "Status",
          "Created",
        ]}
        rows={filtered.map((l) => ({
          id: l.id,
          cells: [
            <strong key="n">{l.name}</strong>,
            <span className="m-cell-stack" key="u">
              {properties.find((p) => p.id === l.property_id)?.name}
              <small>
                {l.unit_id
                  ? "Unit " + units.find((u) => u.id === l.unit_id)?.number
                  : "Community preference"}
              </small>
            </span>,
            <span className="m-cell-stack" key="c">
              {l.email}
              <small>{l.phone || "Not provided"}</small>
            </span>,
            l.desired_move_in ? formatDate(l.desired_move_in) : "Not provided",
            l.source,
            <select
              className="m-inline-select"
              key="s"
              aria-label={"Lead status for " + l.name}
              value={l.status}
              onChange={(e) => {
                try {
                  update({
                    leadStatuses: {
                      ...state.leadStatuses,
                      [l.id]: e.target.value as (typeof leadStatuses)[number],
                    },
                  });
                  setNotice(l.name + " moved to " + e.target.value + ".");
                  setError("");
                } catch {
                  setError("The stage could not be saved. Please try again.");
                }
              }}
            >
              {leadStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>,
            formatDate(l.created_at),
          ],
        }))}
      />
      <DemoSaveNote />
      <p className="m-footnote">
        Leased is a demo CRM outcome. Changing a pipeline stage does not create
        a lease or change unit occupancy.
      </p>
      {state.tourDate && (
        <section className="sales-tour-inbox">
          <h2>Applicant tour requests</h2>
          <p>
            Requested times are awaiting confirmation. No real appointment has
            been booked.
          </p>
          <ManagementTable
            caption="Applicant demo tour requests"
            headers={[
              "Applicant",
              "Interested home",
              "Requested time",
              "Contact",
              "Status",
            ]}
            rows={[
              {
                id: demoStory.applicant.id,
                cells: [
                  getApplications(state)[0].name,
                  properties.find(
                    (property) =>
                      property.id ===
                      units.find((unit) => unit.id === state.tourUnitId)
                        ?.property_id,
                  )?.name +
                    " · " +
                    units.find((unit) => unit.id === state.tourUnitId)?.number,
                  state.tourDate + " · Central",
                  getApplications(state)[0].email,
                  "Requested",
                ],
              },
            ]}
          />
        </section>
      )}
      <div className="m-source-inquiries">
        <LeasingInbox />
      </div>
    </div>
  );
}
export function ManagementApplications({
  propertyId = "",
  embedded = false,
}: {
  propertyId?: string;
  embedded?: boolean;
}) {
  const { state, update } = useDemoState();
  const [query, setQuery] = useState("");
  const [property, setProperty] = useState(propertyId);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const all = getApplications(state).filter(
    (a) => !property || a.property_id === property,
  );
  const filtered = all.filter(
    (a) =>
      (!status || a.status === status) &&
      (a.name + " " + a.email).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="m-page">
      <ManagementHeading
        title="Applications"
        description="Contact and move-in information, with a simple demo review workflow."
        embedded={embedded}
      />
      <div className="m-filters">
        <SearchBox
          label="Search applications"
          value={query}
          onChange={setQuery}
        />
        {!propertyId && (
          <PropertyFilter value={property} onChange={setProperty} />
        )}
        <FilterSelect
          label="Application status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All statuses" },
            ...applicationStatuses.map((s) => ({
              value: s,
              label: applicationLabels[s],
            })),
          ]}
        />
      </div>
      <div className="m-application-summary">
        {applicationStatuses.map((s) => (
          <span key={s}>
            {applicationLabels[s]}{" "}
            <strong>{all.filter((a) => a.status === s).length}</strong>
          </span>
        ))}
      </div>
      {notice && (
        <p role="status" className="m-save-status">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="m-inline-error">
          {error}
        </p>
      )}
      <ManagementTable
        caption="Application workflow"
        headers={[
          "Applicant",
          "Property / unit",
          "Move-in",
          "Household",
          "Workflow status",
          "Details",
        ]}
        rows={filtered.map((a) => ({
          id: a.id,
          cells: [
            <span className="m-cell-stack" key="n">
              <strong>{a.name}</strong>
              <small>{a.email}</small>
            </span>,
            <span className="m-cell-stack" key="p">
              {properties.find((p) => p.id === a.property_id)!.name}
              <small>
                Unit {units.find((u) => u.id === a.unit_id)?.number}
              </small>
            </span>,
            formatDate(a.desired_move_in),
            a.occupants + " occupant(s)",
            <select
              key="s"
              className="m-inline-select"
              value={a.status}
              aria-label={"Application status for " + a.name}
              onChange={(e) => {
                try {
                  update({
                    applicationStatuses: {
                      ...state.applicationStatuses,
                      [a.id]: e.target
                        .value as (typeof applicationStatuses)[number],
                    },
                  });
                  setNotice(
                    a.name +
                      " · " +
                      applicationLabels[
                        e.target.value as (typeof applicationStatuses)[number]
                      ] +
                      " saved.",
                  );
                  setError("");
                } catch {
                  setError(
                    "The application stage could not be saved. Please try again.",
                  );
                }
              }}
            >
              {applicationStatuses.map((s) => (
                <option key={s} value={s}>
                  {applicationLabels[s]}
                </option>
              ))}
            </select>,
            <DetailDialog
              key="d"
              title={a.name}
              description="Fictional application · No screening performed"
              trigger={
                <Button variant="outline" size="sm">
                  View application
                </Button>
              }
            >
              <FactList
                items={[
                  ["Name", a.name],
                  [
                    "Property",
                    properties.find((property) => property.id === a.property_id)
                      ?.name ?? "Community",
                  ],
                  [
                    "Apartment",
                    units.find((unit) => unit.id === a.unit_id)?.number ??
                      "Selected apartment",
                  ],
                  ["Email", a.email],
                  ["Phone", a.phone],
                  ["Move-in date", formatDate(a.desired_move_in)],
                  ["Occupants", a.occupants],
                  ["Pets", a.pets],
                  ["Status", applicationLabels[a.status]],
                ]}
              />
              <p className="m-footnote">
                This workflow contains contact and housing preferences only. No
                screening data or real approval decision is collected or sent.
              </p>
            </DetailDialog>,
          ],
        }))}
      />
      <DemoSaveNote />
    </div>
  );
}

"use client";
import { demoStory } from "@/lib/demo/story";
import { useState } from "react";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DetailDialog, Panel, EmptyState } from "@/components/shared";
import { useDemoState } from "@/lib/demo/store";
import { getMaintenance } from "@/lib/demo/selectors";
import { properties, residents, units } from "@/lib/demo/data";
import { maintenanceStaff } from "@/lib/management/data";
import { statusLabels, maintenanceStatuses } from "@/lib/resident/schema";
import { formatDate } from "@/lib/resident/data";
import {
  MaintenanceTimeline,
  MaintenanceAccess,
  ManagementMaintenanceActions,
  ResidentStatus,
} from "@/components/resident/maintenance-shared";
import type { MaintenanceRequest, Persona } from "@/lib/types";
import {
  FilterSelect,
  ManagementHeading,
  PropertyFilter,
  SearchBox,
  FactList,
} from "./common";
function StaffNotes({
  request,
  persona,
}: {
  request: MaintenanceRequest;
  persona: Persona;
}) {
  const { state, update } = useDemoState();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const author =
    persona === "maintenance"
      ? "Marcus Reed"
      : persona === "owner"
        ? "Sam Bennett"
        : "Alex Morgan";
  return (
    <div className="m-internal-notes">
      <h3>Internal notes</h3>
      <p>
        Visible to the management and maintenance team. Never shown in the
        resident timeline.
      </p>
      <ul>
        {(state.internalNotes ?? [])
          .filter((n) => n.requestId === request.id)
          .map((n) => (
            <li key={n.id}>
              <p>{n.body}</p>
              <small>
                {n.author} · {formatDate(n.at)}
              </small>
            </li>
          ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const body = String(new FormData(form).get("note") ?? "").trim();
          if (!body) {
            setError("Write a note before saving.");
            return;
          }
          try {
            update({
              internalNotes: [
                ...(state.internalNotes ?? []),
                {
                  id: crypto.randomUUID(),
                  requestId: request.id,
                  body,
                  author,
                  at: new Date().toISOString(),
                },
              ],
            });
            form.reset();
            setSaved("Internal note saved.");
            setError("");
          } catch {
            setError("Your note could not be saved. Please try again.");
          }
        }}
      >
        <label>
          Internal note
          <Textarea
            name="note"
            required
            maxLength={2000}
            placeholder="Parts needed, troubleshooting, or a team handoff…"
          />
        </label>
        <Button variant="outline" type="submit">
          Save internal note
        </Button>
      </form>
      {saved && <p role="status">{saved}</p>}
      {error && (
        <p role="alert" className="m-inline-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function ManagementQueue({
  persona,
  propertyId = "",
  residentId = "",
  embedded = false,
}: {
  persona: Persona;
  propertyId?: string;
  residentId?: string;
  embedded?: boolean;
}) {
  const { state, update } = useDemoState();
  const [query, setQuery] = useState("");
  const [property, setProperty] = useState(propertyId);
  const [status, setStatus] = useState("active");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [assigned, setAssigned] = useState(
    persona === "maintenance" ? demoStory.maintenanceUserId : "",
  );
  const [assignmentError, setAssignmentError] = useState("");
  const all = getMaintenance(state).filter(
    (r) =>
      (!property || r.property_id === property) &&
      (!residentId || r.resident_id === residentId),
  );
  const filtered = all.filter(
    (r) =>
      (!status ||
        (status === "active"
          ? r.status !== "completed"
          : r.status === status)) &&
      (!priority || r.priority === priority) &&
      (!category || r.category === category) &&
      (!assigned ||
        (assigned === "unassigned"
          ? !r.assigned_to
          : r.assigned_to === assigned)) &&
      (
        r.title +
        " " +
        r.description +
        " " +
        units.find((u) => u.id === r.unit_id)?.number
      )
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="m-page">
      <ManagementHeading
        title={
          persona === "maintenance" && !embedded
            ? "Your maintenance queue"
            : "Maintenance"
        }
        description="Assign the right person, plan access, and keep residents informed."
        embedded={embedded}
      />
      {persona === "maintenance" && (
        <div
          className="sales-work-tabs"
          role="group"
          aria-label="Work queue scope"
        >
          <button
            aria-pressed={assigned === demoStory.maintenanceUserId}
            onClick={() => setAssigned(demoStory.maintenanceUserId)}
          >
            My assignments
          </button>
          <button
            aria-pressed={assigned === ""}
            onClick={() => setAssigned("")}
          >
            Team queue
          </button>
        </div>
      )}
      <div className="m-filters">
        <SearchBox
          label="Search maintenance"
          value={query}
          onChange={setQuery}
        />
        {!propertyId && !residentId && (
          <PropertyFilter value={property} onChange={setProperty} />
        )}
        <FilterSelect
          label="Maintenance status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "active", label: "Active requests" },
            { value: "", label: "All requests" },
            ...maintenanceStatuses.map((s) => ({
              value: s,
              label: statusLabels[s],
            })),
          ]}
        />
        <FilterSelect
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={[
            { value: "", label: "All priorities" },
            ...["urgent", "high", "normal", "low"].map((s) => ({
              value: s,
              label: s,
            })),
          ]}
        />
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={[
            { value: "", label: "All categories" },
            ...[...new Set(all.map((r) => r.category))].map((s) => ({
              value: s,
              label: s,
            })),
          ]}
        />
        <FilterSelect
          label="Assigned staff"
          value={assigned}
          onChange={setAssigned}
          options={[
            { value: "", label: "All staff" },
            { value: "unassigned", label: "Unassigned" },
            ...maintenanceStaff.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
      </div>
      <p className="m-result-count">
        {filtered.length} requests ·{" "}
        {
          all.filter((r) => r.priority === "urgent" && r.status !== "completed")
            .length
        }{" "}
        urgent and active
      </p>
      <div className="maintenance-list m-maintenance-list">
        {filtered.map((r) => {
          const unit = units.find((u) => u.id === r.unit_id)!;
          const resident = residents.find((res) => res.id === r.resident_id)!;
          return (
            <Panel key={r.id}>
              <div className="m-repair-row">
                <div className="m-repair-icon">
                  <Wrench size={20} />
                </div>
                <div className="m-repair-copy">
                  <div>
                    <ResidentStatus status={r.status} />
                    <span className={"m-priority " + r.priority}>
                      {r.priority}
                    </span>
                  </div>
                  <h2>{r.title}</h2>
                  <p>
                    {properties.find((p) => p.id === r.property_id)!.name} ·
                    Unit {unit.number} · {r.category}
                  </p>
                  <small>
                    {maintenanceStaff.find((s) => s.id === r.assigned_to)
                      ?.name ?? "Unassigned"}{" "}
                    · Requested {formatDate(r.created_at)}
                  </small>
                </div>
                <DetailDialog
                  title={r.title}
                  description={
                    "Maintenance · " +
                    unit.number +
                    " · " +
                    properties.find((p) => p.id === r.property_id)!.name
                  }
                  trigger={<Button variant="outline">View request</Button>}
                >
                  <div className="m-request-dialog">
                    <FactList
                      items={[
                        ["Resident", resident.name],
                        ["Unit", unit.number],
                        ["Category", r.category],
                        ["Priority", r.priority],
                        ["Issue", r.description],
                      ]}
                    />
                    <label className="m-assignment-label">
                      Assignment
                      <select
                        aria-label="Assign request to"
                        value={r.assigned_to ?? ""}
                        onChange={(e) => {
                          try {
                            update({
                              maintenanceAssignments: {
                                ...state.maintenanceAssignments,
                                [r.id]: e.target.value || null,
                              },
                            });
                            setAssignmentError("");
                          } catch {
                            setAssignmentError(
                              "The assignment could not be saved.",
                            );
                          }
                        }}
                      >
                        <option value="">Unassigned</option>
                        {maintenanceStaff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {assignmentError && <p role="alert">{assignmentError}</p>}
                    <MaintenanceAccess request={r} />
                    <MaintenanceTimeline request={r} />
                    <ManagementMaintenanceActions request={r} />
                    <StaffNotes request={r} persona={persona} />
                  </div>
                </DetailDialog>
              </div>
            </Panel>
          );
        })}
      </div>
      {!filtered.length && (
        <EmptyState
          title="No requests match"
          description="Try another filter to find the work you need."
        />
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { Plus, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DetailDialog, EmptyState } from "@/components/shared";
import { useDemoState } from "@/lib/demo/store";
import {
  allDocuments,
  allAnnouncements,
  documentsForResident,
  unitForResident,
} from "@/lib/management/data";
import { type ManagementDocument } from "@/lib/management/schema";
import { buildings, properties, residents } from "@/lib/demo/data";
import { formatDate } from "@/lib/resident/data";
import {
  DemoSaveNote,
  FactList,
  FilterSelect,
  ManagementHeading,
  PropertyFilter,
  SearchBox,
} from "./common";
function scopeLabel(
  propertyId: string | null | undefined,
  buildingId: string | null | undefined,
) {
  return (
    (properties.find((p) => p.id === propertyId)?.name ??
      "Entire organization") +
    (buildingId ? " · " + buildings.find((b) => b.id === buildingId)?.name : "")
  );
}
export function ManagementAnnouncements({
  propertyId = "",
  embedded = false,
  readOnly = false,
}: {
  propertyId?: string;
  embedded?: boolean;
  readOnly?: boolean;
}) {
  const { state, update } = useDemoState();
  const [adding, setAdding] = useState(false);
  const [property, setProperty] = useState(propertyId);
  const [scope, setScope] = useState(propertyId);
  const [building, setBuilding] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const rows = allAnnouncements(state).filter(
    (a) => !property || !a.property_id || a.property_id === property,
  );
  return (
    <div className="m-page">
      <ManagementHeading
        title="Announcements"
        description="Publish updates to the organization, a property, or a specific building."
        embedded={embedded}
        action={
          !readOnly && (
            <Button onClick={() => setAdding(!adding)}>
              <Plus size={16} />
              {adding ? "Close form" : "Write announcement"}
            </Button>
          )
        }
      />
      {adding && (
        <form
          className="m-editor"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            try {
              update({
                announcements: [
                  {
                    id: crypto.randomUUID(),
                    title: String(form.get("title")).trim(),
                    body: String(form.get("body")).trim(),
                    property_id: scope || null,
                    building_id: building || null,
                    category: String(form.get("category")),
                    published_at: new Date().toISOString(),
                  },
                  ...(state.announcements ?? []),
                ],
              });
              setNotice(
                "Announcement published to " +
                  scopeLabel(scope, building) +
                  ".",
              );
              setError("");
              setAdding(false);
            } catch {
              setError("Please check the title and message, then try again.");
            }
          }}
        >
          <h2>Share a community update</h2>
          <div className="m-form-grid">
            <label>
              Audience property
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  setBuilding("");
                }}
              >
                <option value="">Entire organization</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Audience building
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                disabled={!scope}
              >
                <option value="">All buildings</option>
                {buildings
                  .filter((b) => b.property_id === scope)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Category
              <select name="category">
                <option>Community</option>
                <option>Maintenance</option>
                <option>Office</option>
                <option>Event</option>
              </select>
            </label>
            <label className="m-form-wide">
              Title
              <Input name="title" required maxLength={120} />
            </label>
            <label className="m-form-wide">
              Message
              <Textarea
                name="body"
                required
                minLength={10}
                maxLength={3000}
                rows={4}
              />
            </label>
          </div>
          <Button type="submit">Publish to demo</Button>
          <DemoSaveNote />
        </form>
      )}
      {notice && (
        <p className="m-save-status" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="m-inline-error" role="alert">
          {error}
        </p>
      )}
      {!propertyId && (
        <div className="m-filters">
          <PropertyFilter value={property} onChange={setProperty} />
        </div>
      )}
      <div className="m-announcements">
        {rows.map((a) => (
          <article key={a.id}>
            <header>
              <span className="eyebrow">{a.category}</span>
              <time dateTime={a.published_at}>
                {formatDate(a.published_at)}
              </time>
            </header>
            <h2>{a.title}</h2>
            <p>{a.body}</p>
            <footer>{scopeLabel(a.property_id, a.building_id)}</footer>
          </article>
        ))}
      </div>
      {!rows.length && (
        <EmptyState
          title="No announcements here yet"
          description="Updates for this audience will appear here."
        />
      )}
    </div>
  );
}
function ResidentsPicker({
  propertyId,
  buildingId,
  selected,
  onChange,
}: {
  propertyId: string | null;
  buildingId: string | null;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <fieldset className="m-resident-assignment">
      <legend>Assign to residents</legend>
      <Input
        aria-label="Find a resident to assign"
        placeholder="Find a resident…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div>
        {residents
          .filter((r) => {
            const u = unitForResident(r.id);
            return (
              (!propertyId || u?.property_id === propertyId) &&
              (!buildingId || u?.building_id === buildingId) &&
              r.name.toLowerCase().includes(query.toLowerCase())
            );
          })
          .map((r) => (
            <label key={r.id}>
              <input
                type="checkbox"
                checked={selected.includes(r.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, r.id]
                      : selected.filter((id) => id !== r.id),
                  )
                }
              />
              <span>
                {r.name}
                <small>
                  {unitForResident(r.id)?.number} ·{" "}
                  {
                    properties.find(
                      (p) => p.id === unitForResident(r.id)?.property_id,
                    )?.name
                  }
                </small>
              </span>
            </label>
          ))}
      </div>
      <small>{selected.length} residents selected</small>
    </fieldset>
  );
}
function AssignmentEditor({ doc }: { doc: ManagementDocument }) {
  const { state, update } = useDemoState();
  const [ids, setIds] = useState(doc.residentIds);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        try {
          update({
            documentAssignments: {
              ...state.documentAssignments,
              [doc.id]: ids,
            },
          });
          setNotice("Resident access saved.");
          setError("");
        } catch {
          setError("Access could not be saved. Please try again.");
        }
      }}
    >
      <ResidentsPicker
        propertyId={doc.property_id}
        buildingId={doc.building_id}
        selected={ids}
        onChange={setIds}
      />
      <Button type="submit">Save resident access</Button>
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
      <DemoSaveNote />
    </form>
  );
}
function downloadMetadata(doc: ManagementDocument) {
  const text =
    "PROPERTY HUB · DOCUMENT METADATA ONLY\n\nTitle: " +
    doc.title +
    "\nCategory: " +
    doc.category +
    "\nAudience: " +
    scopeLabel(doc.property_id, doc.building_id) +
    "\nVisibility: " +
    doc.visibility +
    "\n\nNo actual document is attached. No legal agreement or policy text has been generated.\n";
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") + ".txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ManagementDocuments({
  propertyId = "",
  residentId = "",
  embedded = false,
}: {
  propertyId?: string;
  residentId?: string;
  embedded?: boolean;
}) {
  const { state, update } = useDemoState();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [property, setProperty] = useState(propertyId);
  const [visibility, setVisibility] = useState("");
  const [scope, setScope] = useState(propertyId);
  const [building, setBuilding] = useState("");
  const [access, setAccess] =
    useState<ManagementDocument["visibility"]>("staff");
  const [assigned, setAssigned] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const docs = (
    residentId ? documentsForResident(state, residentId) : allDocuments(state)
  ).filter(
    (d) =>
      (!property || !d.property_id || d.property_id === property) &&
      (!visibility || d.visibility === visibility) &&
      (d.title + " " + d.category).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="m-page">
      <ManagementHeading
        title="Documents"
        description="A metadata library with explicit community and resident access."
        embedded={embedded}
        action={
          !residentId && (
            <Button onClick={() => setAdding(!adding)}>
              <Plus size={16} />
              {adding ? "Close form" : "Add document metadata"}
            </Button>
          )
        }
      />
      {adding && (
        <form
          className="m-editor"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            if (access === "assigned" && !assigned.length) {
              setError(
                "Select at least one resident for an assigned document.",
              );
              return;
            }
            try {
              update({
                managementDocuments: [
                  {
                    id: crypto.randomUUID(),
                    title: String(form.get("title")).trim(),
                    category: String(form.get("category")),
                    property_id: scope || null,
                    building_id: building || null,
                    visibility: access,
                    residentIds: access === "assigned" ? assigned : [],
                    created_at: new Date().toISOString(),
                  },
                  ...(state.managementDocuments ?? []),
                ],
              });
              setNotice(
                "Document metadata saved. Resident access follows the selected audience.",
              );
              setError("");
              setAdding(false);
            } catch {
              setError(
                "The metadata could not be saved. Check the title and try again.",
              );
            }
          }}
        >
          <h2>Add document metadata</h2>
          <div className="m-form-grid">
            <label>
              Document title
              <Input name="title" required minLength={2} maxLength={120} />
            </label>
            <label>
              Document category
              <select name="category">
                <option>Community</option>
                <option>Lease</option>
                <option>Move-in</option>
                <option>Parking</option>
                <option>Pets</option>
                <option>Operations</option>
              </select>
            </label>
            <label>
              Document property
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  setBuilding("");
                  setAssigned([]);
                }}
              >
                <option value="">Entire organization</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Document building
              <select
                value={building}
                onChange={(e) => {
                  setBuilding(e.target.value);
                  setAssigned([]);
                }}
                disabled={!scope}
              >
                <option value="">All buildings</option>
                {buildings
                  .filter((b) => b.property_id === scope)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Document visibility
              <select
                value={access}
                onChange={(e) => setAccess(e.target.value as typeof access)}
              >
                <option value="staff">Management / staff only</option>
                <option value="community">Community residents</option>
                <option value="assigned">Assigned residents only</option>
              </select>
            </label>
          </div>
          {access === "assigned" && (
            <ResidentsPicker
              propertyId={scope || null}
              buildingId={building || null}
              selected={assigned}
              onChange={setAssigned}
            />
          )}
          <p className="m-footnote">
            Metadata and download placeholders only. Add actual files through a
            future private storage integration.
          </p>
          <Button type="submit">Save document metadata</Button>
        </form>
      )}
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
      <div className="m-filters">
        <SearchBox label="Search documents" value={query} onChange={setQuery} />
        {!propertyId && !residentId && (
          <PropertyFilter value={property} onChange={setProperty} />
        )}
        <FilterSelect
          label="Visibility"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "", label: "All visibility" },
            { value: "staff", label: "Management / staff" },
            { value: "community", label: "Community" },
            { value: "assigned", label: "Assigned residents" },
          ]}
        />
      </div>
      <div className="m-document-grid">
        {docs.map((doc) => (
          <article key={doc.id}>
            <FileText size={25} />
            <span className="eyebrow">{doc.category}</span>
            <h2>{doc.title}</h2>
            <p>{scopeLabel(doc.property_id, doc.building_id)}</p>
            <small>
              {doc.visibility === "staff"
                ? "Management / staff only"
                : doc.visibility === "community"
                  ? "Community residents"
                  : doc.residentIds.length + " assigned resident(s)"}{" "}
              · Metadata only
            </small>
            <DetailDialog
              title={doc.title}
              description="Document metadata · No actual file is attached"
              trigger={
                <Button variant="outline" size="sm">
                  View metadata
                </Button>
              }
            >
              <FactList
                items={[
                  ["Title", doc.title],
                  ["Category", doc.category],
                  ["Audience", scopeLabel(doc.property_id, doc.building_id)],
                  ["Visibility", doc.visibility],
                  ["Created", formatDate(doc.created_at)],
                ]}
              />
              <Button variant="outline" onClick={() => downloadMetadata(doc)}>
                <Download size={15} />
                Download metadata
              </Button>
              {doc.visibility === "assigned" && <AssignmentEditor doc={doc} />}
            </DetailDialog>
          </article>
        ))}
      </div>
      {!docs.length && (
        <EmptyState
          title="No matching documents"
          description="Clear the search or change the audience filter."
        />
      )}
    </div>
  );
}

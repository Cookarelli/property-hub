"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  Plus,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDemoState } from "@/lib/demo/store";
import { getMaintenance } from "@/lib/demo/selectors";
import { formatDate, resident, residentProperty } from "@/lib/resident/data";
import {
  maintenanceCategories,
  type ResidentAttachment,
} from "@/lib/resident/schema";
import {
  attachmentAccept,
  localAttachmentProvider,
  validateFiles,
} from "@/lib/resident/attachments";
import { ResidentHeading, ResidentSection } from "./common";
import {
  MaintenanceAccess,
  MaintenanceTimeline,
  ResidentStatus,
} from "./maintenance-shared";
const inputSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(10).max(2000),
  category: z.enum(maintenanceCategories),
  urgency: z.enum(["low", "normal", "high", "urgent"]),
  date: z.union([
    z.literal(""),
    z.iso.date().refine((date) => date >= "2026-09-17" && date <= "2027-09-17"),
  ]),
});
export function ResidentMaintenance() {
  const { state } = useDemoState();
  const [filter, setFilter] = useState("active");
  const all = getMaintenance(state).filter(
    (r) => r.resident_id === resident.id,
  );
  const requests = all.filter(
    (r) =>
      filter === "all" ||
      (filter === "completed"
        ? r.status === "completed"
        : r.status !== "completed"),
  );
  return (
    <>
      <ResidentHeading
        title="Maintenance"
        subtitle="Tell us what needs attention. We’ll take it from here."
        action={
          <Button asChild>
            <Link href="/demo/resident/maintenance/new">
              <Plus size={17} />
              New request
            </Link>
          </Button>
        }
      />
      <div
        className="r-filter-tabs"
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
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
          >
            {label}
            <span>
              {value === "all"
                ? all.length
                : all.filter((r) =>
                    value === "completed"
                      ? r.status === "completed"
                      : r.status !== "completed",
                  ).length}
            </span>
          </button>
        ))}
      </div>
      <div className="maintenance-list r-maintenance-list">
        {requests.length ? (
          requests.map((request) => (
            <Link
              className="r-request-card"
              href={`/demo/resident/maintenance/${request.id}`}
              key={request.id}
            >
              <div>
                <span className="r-request-icon">
                  <Wrench size={22} />
                </span>
                <ResidentStatus status={request.status} />
              </div>
              <p className="eyebrow">
                {request.category} ·{" "}
                {request.priority === "urgent"
                  ? "Urgent"
                  : request.priority === "high"
                    ? "High priority"
                    : "Routine"}
              </p>
              <h2>{request.title}</h2>
              <p>{request.description}</p>
              <footer>
                <span>Requested {formatDate(request.created_at)}</span>
                <ChevronRight size={20} />
              </footer>
            </Link>
          ))
        ) : (
          <div className="r-empty">
            <CheckCircle2 size={34} />
            <h2>All clear.</h2>
            <p>
              No requests in this view. We’re here whenever you need a hand.
            </p>
            <Button asChild variant="outline">
              <Link href="/demo/resident/maintenance/new">
                Request maintenance
              </Link>
            </Button>
          </div>
        )}
      </div>
      <div className="r-emergency-note">
        <AlertTriangle size={20} />
        <p>
          <strong>Something urgent?</strong> For immediate danger, call 911. For
          urgent property issues, contact the community’s after-hours
          maintenance line.{" "}
          <Link href="/demo/resident/contact">View emergency guidance</Link>.
          This demo does not dispatch help.
        </p>
      </div>
    </>
  );
}
export function NewMaintenanceRequest() {
  const { state, update } = useDemoState();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [pets, setPets] = useState(false);
  const [urgency, setUrgency] = useState("normal");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [samplePending, setSamplePending] = useState(false);
  const [category, setCategory] = useState("Plumbing");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  async function useSample() {
    setSamplePending(true);
    try {
      const response = await fetch("/images/kitchen.jpg");
      if (!response.ok)
        throw new Error(
          "The sample photo could not be loaded. You can still choose your own image.",
        );
      const blob = await response.blob();
      const sample = new File([blob], "demo-kitchen.jpg", {
        type: "image/jpeg",
      });
      const next = [
        ...files.filter((file) => file.name !== sample.name),
        sample,
      ];
      validateFiles(next);
      setFiles(next);
      setCategory("Other");
      setTitle("Kitchen cabinet hinge needs adjusting");
      setDescription(
        "The cabinet beside the refrigerator does not close properly. Please adjust the hinge. The attached demo photo shows the kitchen area.",
      );
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The sample could not be loaded. Please try again.",
      );
    } finally {
      setSamplePending(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const read = (key: string) => String(form.get(key) ?? "").trim();
    const parsed = inputSchema.safeParse({
      title: read("title"),
      description: read("description"),
      category: read("category"),
      urgency,
      date: read("accessDate"),
    });
    if (!parsed.success) {
      setError(
        "Please enter a title of at least 4 characters, a description of at least 10 characters, and a valid preferred date.",
      );
      return;
    }
    setPending(true);
    setError("");
    const id = crypto.randomUUID();
    let attachments: ResidentAttachment[] = [];
    try {
      attachments = await localAttachmentProvider.save(id, files);
      update({
        tickets: [
          {
            id,
            title: parsed.data.title,
            description: parsed.data.description,
            category: parsed.data.category,
            priority: parsed.data.urgency,
            permission: form.get("permission") === "on",
          },
          ...(state.tickets ?? []),
        ],
        requestDetails: {
          ...state.requestDetails,
          [id]: {
            pets,
            petNotes: read("petNotes"),
            accessDate: read("accessDate"),
            accessTime: read("accessTime"),
            contactPreference: read("contactPreference") as
              "Email" | "Text message" | "Phone" | "Portal",
            attachments,
            createdAt: new Date().toISOString(),
          },
        },
      });
      router.push(`/demo/resident/maintenance/${id}?saved=1`);
    } catch (e) {
      await localAttachmentProvider
        .remove(attachments.map((a) => a.key))
        .catch(() => {});
      setError(
        e instanceof Error
          ? e.message
          : "Your request couldn’t be saved. Please try again.",
      );
      setPending(false);
    }
  }
  return (
    <>
      <ResidentHeading
        title="What can we help with?"
        subtitle={`${residentProperty.name} · Apartment A-101`}
        back={{ href: "/demo/resident/maintenance", label: "Your requests" }}
      />
      <form className="r-form r-request-form" onSubmit={submit}>
        <div className="sales-sample">
          <div>
            <strong>Trying the demo?</strong>
            <p>
              Use a sample request and an illustrative kitchen photo. You can
              edit every detail.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={samplePending || pending}
            onClick={useSample}
          >
            {samplePending ? "Loading sample…" : "Use sample request & photo"}
          </Button>
        </div>
        <fieldset>
          <legend>
            <span>01</span>Tell us what’s happening
          </legend>
          <label>
            Category
            <select
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              {maintenanceCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            What needs attention?
            <Input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={4}
              maxLength={120}
              placeholder="For example, the kitchen faucet is leaking"
            />
          </label>
          <label>
            Tell us a little more
            <Textarea
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              placeholder="Where is the issue? When did it start? What have you noticed?"
            />
          </label>
          <label>
            How urgent is it?
            <select
              name="urgency"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              <option value="low">Low · A small fix, no rush</option>
              <option value="normal">Normal · Needs attention</option>
              <option value="high">High · Affecting daily use</option>
              <option value="urgent">Urgent · Needs prompt attention</option>
            </select>
          </label>
          {urgency === "urgent" && (
            <div className="r-emergency-note">
              <AlertTriangle size={20} />
              <p>
                For immediate danger, call 911. Do not wait for a portal
                response. For urgent property issues, use your community’s
                after-hours line.{" "}
                <Link href="/demo/resident/contact">Emergency guidance</Link>
              </p>
            </div>
          )}
        </fieldset>
        <fieldset>
          <legend>
            <span>02</span>A picture helps
          </legend>
          <label className="r-upload">
            <ImagePlus size={29} />
            <strong>Add photos or a short video</strong>
            <span>Up to 5 files · 25 MB combined</span>
            <input
              type="file"
              aria-label="Photos or videos"
              accept={attachmentAccept}
              multiple
              onChange={(e) => {
                try {
                  const next = [...files, ...Array.from(e.target.files ?? [])];
                  validateFiles(next);
                  setFiles(next);
                  setError("");
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "These files couldn’t be added.",
                  );
                }
                e.target.value = "";
              }}
            />
          </label>
          <p className="r-muted">
            JPG, PNG, WebP up to 10 MB each; MP4, WebM, MOV up to 20 MB each.
            Demo attachments stay in this browser and are never uploaded to a
            server.
          </p>
          {files.length > 0 && (
            <ul className="r-file-list">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <span>
                    {file.name}
                    <small>{(file.size / 1024 / 1024).toFixed(1)} MB</small>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <X size={17} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <fieldset>
          <legend>
            <span>03</span>Let’s plan a visit
          </legend>
          <label className="r-check-row">
            <input type="checkbox" name="permission" />
            <span>
              <strong>Our team may enter when I’m away.</strong>
              <small>
                Leave unchecked if you’d like us to contact you before entering.
              </small>
            </span>
          </label>
          <label className="r-check-row">
            <input
              type="checkbox"
              checked={pets}
              onChange={(e) => setPets(e.target.checked)}
            />
            <span>
              <strong>Pets are in my home</strong>
              <small>
                Help our team plan a comfortable visit for everyone.
              </small>
            </span>
          </label>
          {pets && (
            <label>
              What should we know about your pets?
              <Input
                name="petNotes"
                maxLength={300}
                placeholder="For example, one cat will be in the bedroom"
              />
            </label>
          )}
          <div className="r-form-grid">
            <label>
              Preferred access date (optional)
              <Input
                type="date"
                name="accessDate"
                min="2026-09-17"
                max="2027-09-17"
              />
            </label>
            <label>
              Preferred time
              <select name="accessTime">
                <option>Contact me to arrange</option>
                <option>9 AM–12 PM</option>
                <option>12 PM–3 PM</option>
                <option>3 PM–6 PM</option>
                <option>Any time during office hours</option>
              </select>
            </label>
          </div>
          <label>
            How should we contact you?
            <select
              name="contactPreference"
              defaultValue={state.contactPreference ?? "Email"}
            >
              <option>Email</option>
              <option>Text message</option>
              <option>Phone</option>
              <option>Portal</option>
            </select>
          </label>
          <p className="r-muted">
            Access preferences are a request, not a confirmed appointment.
          </p>
        </fieldset>
        {error && (
          <p className="r-error" role="alert">
            {error}
          </p>
        )}
        <Button className="r-primary-action" type="submit" disabled={pending}>
          {pending ? "Saving request…" : "Submit demo request"}
          <ArrowRight size={17} />
        </Button>
        <p className="r-muted text-center">
          Saves in your current demo tab. No maintenance team is dispatched.
        </p>
      </form>
    </>
  );
}
export function MaintenanceDetail({
  id,
  saved,
}: {
  id: string;
  saved?: boolean;
}) {
  const { state, hydrated } = useDemoState();
  const request = getMaintenance(state).find(
    (r) => r.id === id && r.resident_id === resident.id,
  );
  if (!hydrated)
    return (
      <p role="status" className="r-loading">
        Loading request details…
      </p>
    );
  if (!request)
    return (
      <>
        <ResidentHeading
          title="Let’s find your request."
          subtitle="This request isn’t in your current demo session."
        />
        <Button asChild>
          <Link href="/demo/resident/maintenance">Back to maintenance</Link>
        </Button>
      </>
    );
  return (
    <>
      {saved && (
        <div className="r-saved" role="status">
          <CheckCircle2 size={19} />
          Your demo request is saved. Follow its progress here.
        </div>
      )}
      <ResidentHeading
        title={request.title}
        subtitle={`${request.category} · The Mercer, A-101`}
        back={{ href: "/demo/resident/maintenance", label: "Your requests" }}
      />
      <div className="r-request-detail-grid">
        <div>
          <ResidentSection title="Your request">
            <div className="r-detail-description">
              <ResidentStatus status={request.status} />
              <p>{request.description}</p>
              <div>
                <span>Requested {formatDate(request.created_at)}</span>
                <span>
                  {request.priority === "urgent"
                    ? "Urgent"
                    : request.priority === "high"
                      ? "High priority"
                      : "Routine priority"}
                </span>
              </div>
            </div>
            <MaintenanceTimeline request={request} />
          </ResidentSection>
        </div>
        <ResidentSection title="Making a visit work for you">
          <MaintenanceAccess request={request} />
          <p className="r-muted r-padding">
            These are your access preferences. A scheduled visit appears in the
            timeline once the team confirms it.
          </p>
        </ResidentSection>
      </div>
      <div className="r-help-row">
        <MessageHelp />
        <Link href="/demo/resident/contact?subject=Maintenance%20question">
          Need to add a detail? Contact management <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}
function MessageHelp() {
  return <Wrench size={20} />;
}

"use client";
import {
  demoOrganizationBranding as tenantBranding,
  demoOrganizationContacts,
} from "@/lib/demo/organization";
import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DetailDialog } from "@/components/shared";
import { useDemoState } from "@/lib/demo/store";
import { money, residentUnit, planFor } from "@/lib/demo/data";
import {
  formatDate,
  resident,
  residentAnnouncements,
  getResidentDocuments,
  residentLease,
  residentProperty,
} from "@/lib/resident/data";
import { ResidentDemoNote, ResidentHeading, ResidentSection } from "./common";

export function ResidentDocuments() {
  const { state } = useDemoState();
  const [query, setQuery] = useState("");
  const items = getResidentDocuments(state).filter((d) =>
    `${d.title} ${d.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  function download(title: string, category: string) {
    const text = `PROPERTY HUB — DEMO DOCUMENT METADATA\n\nTitle: ${title}\nCategory: ${category}\nCommunity: ${residentProperty.name}\nResident: ${resident.name}\nApartment: ${residentUnit.number}\n\nNo actual document is attached. This is a metadata/download placeholder. It contains no legal terms, signatures, agreement, or policy.\n\nContact management through the demo portal for more information.\n`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <ResidentHeading
        title="Your documents"
        subtitle="Your lease information, community documents, and move-in essentials."
      />
      <ResidentDemoNote>
        <strong>Demo document center.</strong> These are metadata and download
        placeholders. Actual agreements and policy files have not been uploaded.
      </ResidentDemoNote>
      <label className="r-document-search">
        <Search size={20} />
        <Input
          aria-label="Search your documents"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a document…"
        />
      </label>
      <div className="r-documents-grid">
        {items.map((doc) => (
          <article className="r-document-card" key={doc.id}>
            <span className="r-icon-tile">
              <FileText size={25} />
            </span>
            <p className="eyebrow">{doc.category}</p>
            <h2>{doc.title}</h2>
            <span>Metadata only · Updated Sep 17, 2026</span>
            <DetailDialog
              title={doc.title}
              description="Demo document information · No actual document attached"
              trigger={
                <Button variant="outline" aria-label={doc.title}>
                  View document <ArrowRight size={16} />
                </Button>
              }
            >
              <div className="r-document-preview">
                <FileText size={40} />
                <h3>Document placeholder</h3>
                <p>
                  This demo includes metadata for <strong>{doc.title}</strong>.
                  No legal agreement or policy document has been generated.
                </p>
                <dl className="r-details">
                  <div>
                    <dt>Community</dt>
                    <dd>{residentProperty.name}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{doc.category}</dd>
                  </div>
                  <div>
                    <dt>Availability</dt>
                    <dd>Demo metadata only</dd>
                  </div>
                </dl>
                <Button
                  onClick={() => download(doc.title, doc.category)}
                  aria-label={
                    doc.title === "Resident welcome guide"
                      ? "Download demo document"
                      : "Download metadata placeholder"
                  }
                >
                  <Download size={17} />
                  Download metadata placeholder
                </Button>
                {doc.title === "Lease Agreement" && (
                  <Link className="r-text-link" href="/demo/resident/lease">
                    View your lease details
                  </Link>
                )}
              </div>
            </DetailDialog>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="r-empty">
          <FileText size={30} />
          <h2>No matching documents</h2>
          <p>Try searching for lease, parking, or community.</p>
          <Button variant="outline" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      )}
    </>
  );
}
export function ResidentAnnouncements() {
  const { state } = useDemoState();
  const [filter, setFilter] = useState("All updates");
  const announcements = residentAnnouncements(state);
  const categories = [
    "All updates",
    ...new Set(announcements.map((a) => a.category)),
  ];
  const shown = announcements.filter(
    (a) => filter === "All updates" || a.category === filter,
  );
  return (
    <>
      <ResidentHeading
        title="Community updates"
        subtitle="Notices, events, and updates from your team."
      />
      <div className="r-announcement-filter">
        <label htmlFor="announcement-filter">Show</label>
        <select
          id="announcement-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span>{shown.length} updates</span>
      </div>
      <div className="r-announcement-feed">
        {shown.map((a) => (
          <article key={a.id}>
            <span className="r-feed-icon">
              {a.category === "Maintenance" ? (
                <AlertTriangle size={23} />
              ) : (
                <CalendarDays size={23} />
              )}
            </span>
            <div>
              <p className="eyebrow">
                {a.category} · {formatDate(a.published_at)}
              </p>
              <h2>{a.title}</h2>
              <p>{a.body}</p>
              <footer>
                {a.property_id ? residentProperty.name : tenantBranding.name}
                <span>Community team</span>
              </footer>
            </div>
          </article>
        ))}
      </div>
      <p className="r-muted">
        Updates shown are for your community and organization. Notification
        preferences are available in{" "}
        <Link href="/demo/resident/profile">your profile</Link>.
      </p>
    </>
  );
}
export function ResidentLease() {
  const { state } = useDemoState();
  const name = state.profileName ?? resident.name;
  return (
    <>
      <ResidentHeading
        title="Your lease"
        subtitle="The everyday details of your current lease."
      />
      <div className="r-lease-page">
        <div className="r-lease-banner">
          <span className="r-icon-tile">
            <FileText size={28} />
          </span>
          <div>
            <p className="eyebrow">ACTIVE LEASE · DEMO</p>
            <h2>{residentProperty.name}</h2>
            <p>
              Apartment {residentUnit.number} · {planFor(residentUnit).name}
            </p>
          </div>
          <span className="r-status r-status-completed">Active</span>
        </div>
        <dl className="r-details r-lease-details">
          {[
            ["Property", residentProperty.name],
            [
              "Apartment",
              `${residentUnit.number} · ${planFor(residentUnit).sqft} sqft`,
            ],
            ["Lease start", formatDate(residentLease.starts_on)],
            ["Lease end", formatDate(residentLease.ends_on)],
            ["Monthly rent", money(residentLease.rent_cents)],
            ["Security deposit", money(residentLease.deposit_cents)],
            ["Occupants", `${name} · 1 resident`],
            ["Renewal status", "Eligible for renewal discussion"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="r-renewal-card">
          <CalendarDays size={26} />
          <h3>Another year of feeling at home?</h3>
          <p>
            Your lease ends October 31. Contact your community team to discuss
            availability and renewal options. No renewal offer or agreement has
            been issued in this demo.
          </p>
          <Button asChild variant="outline">
            <Link href="/demo/resident/contact?subject=Lease%20renewal">
              Ask about renewal <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
        <ResidentDemoNote>
          These are fictional lease details, not a legal agreement.{" "}
          <Link href="/demo/resident/documents">
            View the document placeholder
          </Link>
          .
        </ResidentDemoNote>
      </div>
    </>
  );
}
export function ResidentProfile() {
  const { state, update } = useDemoState();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <ResidentHeading
        title="Your details. Your preferences."
        subtitle="Make it easy for your community team to reach you."
      />
      <div className="r-profile-card">
        <span className="r-profile-avatar">
          <UserRound size={34} />
        </span>
        <div>
          <h2>{state.profileName ?? resident.name}</h2>
          <p>
            {residentProperty.name} · Apartment {residentUnit.number}
          </p>
          <span className="r-status r-status-completed">
            Resident · Demo account
          </span>
        </div>
      </div>
      <form
        className="r-form r-profile-form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const name = String(data.get("name")).trim(),
            phone = String(data.get("phone")).trim();
          if (name.length < 2 || phone.replace(/\D/g, "").length < 7) {
            setError("Please enter your name and a valid phone number.");
            return;
          }
          try {
            update({
              profileName: name,
              residentEmail: String(data.get("email")).trim(),
              profilePhone: phone,
              contactPreference: String(data.get("preference")),
              residentNotifications: {
                community: data.get("community") === "on",
                payment: data.get("payment") === "on",
                maintenance: data.get("maintenance") === "on",
              },
            });
            setError("");
            setSaved(true);
          } catch {
            setError(
              "Your preferences couldn’t be saved in this browser. Please try again.",
            );
          }
        }}
      >
        <fieldset>
          <legend>Contact information</legend>
          <label>
            Full name
            <Input
              name="name"
              defaultValue={state.profileName ?? resident.name}
              required
              maxLength={100}
              autoComplete="name"
            />
          </label>
          <div className="r-form-grid">
            <label>
              Email address
              <Input
                type="email"
                name="email"
                defaultValue={state.residentEmail ?? resident.email}
                required
                maxLength={254}
                autoComplete="email"
              />
            </label>
            <label>
              Phone number
              <Input
                type="tel"
                name="phone"
                defaultValue={state.profilePhone ?? resident.phone}
                required
                maxLength={30}
                autoComplete="tel"
              />
            </label>
          </div>
          <label>
            Preferred way to reach you
            <select
              name="preference"
              defaultValue={state.contactPreference ?? "Email"}
            >
              <option>Email</option>
              <option>Text message</option>
              <option>Phone</option>
              <option>Portal</option>
            </select>
          </label>
        </fieldset>
        <fieldset>
          <legend>What would you like to hear about?</legend>
          {[
            {
              key: "maintenance",
              title: "Maintenance updates",
              description: "Visit schedules and progress on your repairs.",
            },
            {
              key: "payment",
              title: "Payment reminders",
              description: "A friendly reminder before rent is due.",
            },
            {
              key: "community",
              title: "Community announcements",
              description:
                "Events, office updates, and around-the-community news.",
            },
          ].map((item) => (
            <label className="r-check-row" key={item.key}>
              <input
                type="checkbox"
                name={item.key}
                defaultChecked={
                  state.residentNotifications?.[
                    item.key as "maintenance" | "payment" | "community"
                  ] ?? true
                }
              />
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <ResidentDemoNote>
          Preferences are saved for this demo tab. Email and text delivery are
          not connected.
        </ResidentDemoNote>
        {error && (
          <p className="r-error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="r-saved" role="status">
            <CheckCircle2 size={18} />
            Your contact preferences are saved.
          </p>
        )}
        <Button type="submit" className="r-primary-action">
          Save preferences <ArrowRight size={17} />
        </Button>
      </form>
    </>
  );
}
export function ResidentContact({
  initialSubject = "General question",
}: {
  initialSubject?: string;
}) {
  const { state, update } = useDemoState();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const subjects = [
    "General question",
    "Lease renewal",
    "Maintenance question",
    "Payments",
    "Documents",
    "Other",
  ];
  return (
    <>
      <ResidentHeading
        title="Contact management"
        subtitle="Reach your community team or find emergency guidance."
      />
      <div className="r-contact-grid">
        <ResidentSection title="Your community team">
          <div className="r-contact-details">
            <h3>{tenantBranding.name}</h3>
            <p>{residentProperty.name} · Leasing & resident services</p>
            <div>
              <Mail size={20} />
              <span>
                <strong>{tenantBranding.email}</strong>
                <small>Fictional demo email</small>
              </span>
            </div>
            <div>
              <Phone size={20} />
              <span>
                <strong>{tenantBranding.phone}</strong>
                <small>Demo office phone · Mon–Fri, 9 AM–6 PM CT</small>
              </span>
            </div>
            <div>
              <MapPin size={20} />
              <span>
                <strong>Community office</strong>
                <small>1840 Mercer Avenue · Austin, TX</small>
              </span>
            </div>
          </div>
        </ResidentSection>
        <div className="r-emergency-card">
          <AlertTriangle size={26} />
          <h2>If it can’t wait</h2>
          <p>
            For immediate danger, a fire, or a medical emergency, call{" "}
            <strong>911</strong>. Do not wait for a portal response.
          </p>
          <p>
            For urgent property issues, such as an active water leak or a broken
            exterior lock, contact your community’s after-hours maintenance
            line.
          </p>
          <strong>
            Demo after-hours line: {demoOrganizationContacts.emergency_phone}
          </strong>
          <small>
            These phone numbers are fictional. This demo cannot dispatch help.
            Use your actual community’s emergency contacts for real issues.
          </small>
        </div>
      </div>
      <ResidentSection title="Leave a message">
        {saved ? (
          <div className="r-contact-success" role="status">
            <CheckCircle2 size={35} />
            <h3>Your demo message is saved.</h3>
            <p>
              It’s visible in this tab’s management demo. No email or message
              has been sent.
            </p>
            <Button variant="outline" onClick={() => setSaved(false)}>
              Write another message
            </Button>
          </div>
        ) : (
          <form
            className="r-form r-contact-form"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const message = String(data.get("message")).trim();
              if (message.length < 10) {
                setError(
                  "Please add a little more detail, at least 10 characters.",
                );
                return;
              }
              try {
                update({
                  residentMessages: [
                    {
                      id: crypto.randomUUID(),
                      subject: String(data.get("subject")),
                      message,
                      preference: state.contactPreference ?? "Email",
                      createdAt: new Date().toISOString(),
                    },
                    ...(state.residentMessages ?? []),
                  ],
                });
                setSaved(true);
                setError("");
              } catch {
                setError("Your message couldn’t be saved. Please try again.");
              }
            }}
          >
            <p className="r-contact-sender">
              From {state.profileName ?? resident.name} · Apartment{" "}
              {residentUnit.number}
              <br />
              <span>{state.residentEmail ?? resident.email}</span>
            </p>
            <label>
              What’s on your mind?
              <select
                name="subject"
                defaultValue={
                  subjects.includes(initialSubject)
                    ? initialSubject
                    : "General question"
                }
              >
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Your message
              <Textarea
                name="message"
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                placeholder="How can we help you feel a little more at home?"
              />
            </label>
            <p className="r-muted">
              Preferred response: {state.contactPreference ?? "Email"}.{" "}
              <Link href="/demo/resident/profile">Edit preferences</Link>
            </p>
            {error && (
              <p className="r-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="r-primary-action">
              Save demo message <ArrowRight size={17} />
            </Button>
            <p className="r-muted">
              For routine questions only. No message is sent outside this demo.
            </p>
          </form>
        )}
      </ResidentSection>
      {(state.residentMessages?.length ?? 0) > 0 && (
        <ResidentSection title="Your recent messages">
          {state.residentMessages?.map((m) => (
            <article className="r-message-record" key={m.id}>
              <MessageCircle size={21} />
              <div>
                <h3>{m.subject}</h3>
                <p>{m.message}</p>
                <small>
                  {formatDate(m.createdAt)} · Saved in demo · Not sent
                </small>
              </div>
            </article>
          ))}
        </ResidentSection>
      )}
    </>
  );
}
export function ResidentMessagesInbox() {
  const { state } = useDemoState();
  if (!state.residentMessages?.length) return null;
  return (
    <section className="leasing-inbox">
      <div className="section-title">
        <div>
          <p className="eyebrow">RESIDENT DEMO · THIS TAB</p>
          <h2>Messages from Alex’s home</h2>
          <p>Saved resident messages. No email or text has been sent.</p>
        </div>
      </div>
      {state.residentMessages.map((message) => (
        <article key={message.id} className="r-message-record">
          <MessageCircle size={22} />
          <div>
            <h3>{message.subject}</h3>
            <p>{message.message}</p>
            <small>
              The Mercer · A-101 · {formatDate(message.createdAt)} · Prefers{" "}
              {message.preference}
            </small>
          </div>
        </article>
      ))}
    </section>
  );
}

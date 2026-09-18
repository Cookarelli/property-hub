"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Heart,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EmptyState,
  PageHeading,
  Panel,
  Status,
  Success,
  TextLink,
} from "@/components/shared";
import { AvailabilityBrowser, UnitCard } from "@/components/marketplace";
import {
  applications,
  availableUnits,
  money,
  planFor,
  properties,
  propertyFor,
  units,
} from "@/lib/demo/data";
import { useDemoState } from "@/lib/demo/store";
import { demoStory, interestedUnit } from "@/lib/demo/story";
import { applicationLabels } from "@/lib/management/schema";

export function ApplicationPage() {
  const { state, update } = useDemoState();
  const unit = interestedUnit(state);
  const p = propertyFor(unit.property_id);
  const [editing, setEditing] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="YOUR NEXT CHAPTER"
        title="One step closer to home."
        description="Your application, all in one place."
      />
      <div className="application-layout">
        <div>
          <div className="application-progress">
            <span className="complete">
              <Check size={14} />
              Choose a home
            </span>
            <i />
            <span
              className={state.applicationSubmitted ? "complete" : "current"}
            >
              {state.applicationSubmitted ? <Check size={14} /> : "2"}Your
              application
            </span>
            <i />
            <span>3 Review</span>
          </div>
          {state.applicationSubmitted && !editing ? (
            <Panel>
              <div className="submitted-state">
                <span>
                  <CheckCircle2 size={40} />
                </span>
                <h2>You’re on your way.</h2>
                <p>
                  Your demo application has been submitted. Switch to Property
                  Manager to see it in the application list.
                </p>
                <Status>
                  {
                    applicationLabels[
                      state.applicationStatuses?.[applications[0].id] ??
                        "submitted"
                    ]
                  }
                </Status>
                <Button asChild>
                  <Link href="/demo/property-manager/applications">
                    See it as the manager <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Review application details
                </Button>
              </div>
            </Panel>
          ) : (
            <Panel
              title="Let’s get to know you"
              subtitle="Please use fictional information in this demo."
            >
              <form
                className="form-grid p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  update({
                    applicationSubmitted: true,
                    savedUnitId: unit.id,
                    application: {
                      name: `${form.get("firstName")} ${form.get("lastName")}`.trim(),
                      email: String(form.get("email")),
                      moveIn: String(form.get("moveIn")),
                      unitId: unit.id,
                      phone: String(form.get("phone")),
                      occupants: Number(form.get("occupants")),
                      pets: String(form.get("pets")),
                    },
                  });
                  setEditing(false);
                }}
              >
                <label>
                  First name
                  <Input
                    name="firstName"
                    defaultValue={
                      state.application?.name.split(" ")[0] ?? "Sofia"
                    }
                    required
                    maxLength={60}
                  />
                </label>
                <label>
                  Last name
                  <Input
                    name="lastName"
                    defaultValue={
                      state.application?.name.split(" ").slice(1).join(" ") ??
                      "Martinez"
                    }
                    required
                    maxLength={60}
                  />
                </label>
                <label className="form-full">
                  Email address
                  <Input
                    name="email"
                    type="email"
                    defaultValue={
                      state.application?.email ?? applications[0].email
                    }
                    required
                    maxLength={254}
                  />
                </label>
                <label>
                  Preferred move-in date
                  <Input
                    name="moveIn"
                    type="date"
                    defaultValue={state.application?.moveIn ?? "2026-10-01"}
                    min="2026-10-01"
                    max="2027-09-30"
                    required
                  />
                </label>
                <label>
                  Phone number
                  <Input
                    name="phone"
                    type="tel"
                    required
                    maxLength={30}
                    defaultValue={
                      state.application?.phone ?? demoStory.applicant.phone
                    }
                  />
                </label>
                <label>
                  Number of occupants
                  <Input
                    name="occupants"
                    type="number"
                    required
                    min={1}
                    max={12}
                    defaultValue={
                      state.application?.occupants ??
                      demoStory.applicant.occupants
                    }
                  />
                </label>
                <label>
                  Pets
                  <select
                    name="pets"
                    defaultValue={state.application?.pets ?? "One cat"}
                  >
                    <option>None</option>
                    <option>One cat</option>
                    <option>One dog</option>
                    <option>Other pets</option>
                  </select>
                </label>
                <label className="checkbox-label form-full">
                  <input required type="checkbox" />I understand this is a
                  demonstration and no real application or screening is
                  submitted.
                </label>
                <div className="form-full">
                  <Button type="submit">
                    Submit demo application <ArrowRight size={16} />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    No application fee. No credit check. Demo data only.
                  </p>
                </div>
              </form>
            </Panel>
          )}
        </div>
        <aside className="application-summary">
          <div className="application-summary-photo">
            <Image
              src={p.image}
              alt={`${p.name} model apartment`}
              fill
              sizes="350px"
            />
          </div>
          <div>
            <p className="eyebrow">YOUR INTERESTED APARTMENT</p>
            <h2>{p.name}</h2>
            <p>
              <MapPin size={14} />
              {p.neighborhood}, Austin
            </p>
            <dl>
              <div>
                <dt>Apartment</dt>
                <dd>
                  {unit.number} · {planFor(unit).name}
                </dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{planFor(unit).sqft} sqft</dd>
              </div>
              <div>
                <dt>Monthly rent</dt>
                <dd>{money(unit.rent_cents)}</dd>
              </div>
            </dl>
            <TextLink href="/demo/applicant/saved">
              Change your selection
            </TextLink>
          </div>
        </aside>
      </div>
    </>
  );
}
export function TourPage() {
  const { state, update } = useDemoState();
  const [scheduled, setScheduled] = useState(false);
  const unit = interestedUnit(state);
  return (
    <>
      <PageHeading
        title="Come get a feel for the place."
        description="Pick a time to explore your next chapter."
      />
      <div className="tour-layout">
        <Panel
          title="Request a demo tour"
          subtitle={`${propertyFor(unit.property_id).name} · Apartment ${unit.number}`}
        >
          <form
            className="form-grid p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              update({
                savedUnitId: unit.id,
                tourDate: `${data.get("date")} at ${data.get("time")}`,
                tourUnitId: unit.id,
              });
              setScheduled(true);
            }}
          >
            <label>
              Your preferred day
              <Input
                type="date"
                name="date"
                min="2026-09-18"
                max="2027-09-17"
                defaultValue="2026-09-19"
                required
              />
            </label>
            <label>
              Your preferred time
              <select name="time">
                <option>10:00 AM</option>
                <option>11:30 AM</option>
                <option>2:00 PM</option>
                <option>4:00 PM</option>
              </select>
            </label>
            <p className="form-full text-sm text-muted-foreground">
              Tours are shown in Austin local time (America/Chicago). This saves
              a demo request; no appointment is booked with a real community.
            </p>
            <Button type="submit">
              {state.tourDate ? "Update demo request" : "Request demo tour"}{" "}
              <CalendarDays size={16} />
            </Button>
            {scheduled && (
              <div className="form-full">
                <Success>Your demo tour request is saved.</Success>
                <Button asChild variant="outline">
                  <Link href="/demo/applicant/application">
                    Next: Your application <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            )}
          </form>
        </Panel>
        <Panel title="Your visit">
          <div className="visit-card">
            <CalendarDays size={32} />
            <h2>
              {state.tourDate ? "Tour requested" : "Let’s find a time to visit"}
            </h2>
            <p>
              {state.tourDate ??
                "Choose a preferred day and time. The community team will review your request."}
            </p>
            <p>
              {
                propertyFor(
                  (
                    units.find((u) => u.id === state.tourUnitId) ??
                    availableUnits[0]
                  ).property_id,
                ).name
              }{" "}
              ·{" "}
              {
                (
                  units.find((u) => u.id === state.tourUnitId) ??
                  availableUnits[0]
                ).number
              }
            </p>
            <Status>{state.tourDate ? "pending" : "not requested"}</Status>
            {state.tourDate && (
              <TextLink href="/demo/property-manager/leads">
                View the manager’s tour inbox
              </TextLink>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
export function ContactForm({ publicPage = false }: { publicPage?: boolean }) {
  const { state, update } = useDemoState();
  const [sent, setSent] = useState(false);
  return (
    <div className="contact-layout">
      <div>
        <p className="eyebrow">LET’S TALK ABOUT HOME</p>
        <h1>
          {publicPage
            ? "Good conversations start here."
            : "We’re here for you."}
        </h1>
        <p>
          Curious about a community or finding your next place? Leave a demo
          inquiry and explore what a connected experience could feel like.
        </p>
        <div className="contact-details">
          <span>
            <MapPin size={20} />
            <strong>Austin, Texas</strong>
          </span>
          <p>Three fictional communities. One helpful team.</p>
          <span>
            <CalendarDays size={20} />
            <strong>Monday–Friday, 9 AM–6 PM</strong>
          </span>
          <p>Demonstration office hours · Central time</p>
        </div>
      </div>
      <Panel
        title="Say hello"
        subtitle="This demo saves an inquiry locally. No message is sent."
      >
        {sent ? (
          <div className="submitted-state">
            <CheckCircle2 size={36} />
            <h2>Thanks for stopping by.</h2>
            <p>Your demo inquiry is saved in this tab.</p>
            <Button variant="outline" onClick={() => setSent(false)}>
              Write another inquiry
            </Button>
          </div>
        ) : (
          <form
            className="form-grid p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              update({
                inquiries: (state.inquiries ?? 0) + 1,
                inquiryMessages: [
                  ...(state.inquiryMessages ?? []),
                  {
                    name: String(data.get("name")),
                    email: String(data.get("email")),
                    community: String(data.get("community")),
                    message: String(data.get("message")),
                  },
                ],
              });
              setSent(true);
            }}
          >
            <label className="form-full">
              Your name
              <Input
                required
                name="name"
                placeholder="Alex Taylor"
                maxLength={100}
              />
            </label>
            <label className="form-full">
              Email address
              <Input
                type="email"
                required
                name="email"
                placeholder="alex@example.com"
                maxLength={254}
              />
            </label>
            <label className="form-full">
              Community
              <select name="community">
                <option>Help me find my fit</option>
                {properties.map((p) => (
                  <option key={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="form-full">
              How can we help?
              <Textarea
                name="message"
                required
                minLength={10}
                maxLength={2000}
                placeholder="Tell us a little about what you’re looking for."
              />
            </label>
            <Button type="submit">
              Save demo inquiry <ArrowRight size={16} />
            </Button>
          </form>
        )}
      </Panel>
    </div>
  );
}
export function ApplicantPage({ section }: { section: string }) {
  const { state, update } = useDemoState();
  const saved = state.savedUnitId === "" ? undefined : interestedUnit(state);
  const featured = interestedUnit(state);
  if (section === "properties")
    return (
      <>
        <PageHeading
          eyebrow="WELCOME, SOFIA"
          title="A home for your next chapter."
          description="Find a space you love. We’ll help you take it from here."
        />
        <section className="sales-interested-home">
          <div>
            <span className="eyebrow">YOUR INTERESTED HOME</span>
            <h2>
              {propertyFor(featured.property_id).name}, {featured.number}
            </h2>
            <p>
              A light-filled{" "}
              {planFor(featured).bedrooms
                ? `${planFor(featured).bedrooms}-bedroom apartment`
                : "studio"}{" "}
              with room for your next chapter. Available October 1.
            </p>
            <span>
              {planFor(featured).bedrooms} beds · {planFor(featured).bathrooms}{" "}
              baths · {planFor(featured).sqft} sqft ·{" "}
              {money(featured.rent_cents)}/mo
            </span>
          </div>
          <div>
            <Button asChild>
              <Link
                href="/demo/applicant/tour"
                onClick={() => update({ savedUnitId: featured.id })}
              >
                {planFor(featured).bedrooms === 2
                  ? "Tour this two-bedroom"
                  : "Tour this apartment"}{" "}
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Link href="/demo/applicant/saved">View interested apartment</Link>
          </div>
        </section>
        <AvailabilityBrowser demo />
      </>
    );
  if (section === "saved")
    return (
      <>
        <PageHeading
          title="A place you can picture yourself."
          description="Your saved apartment stays with you as you explore."
        />
        {saved ? (
          <div className="max-w-md">
            <UnitCard unit={saved} demo />
          </div>
        ) : (
          <EmptyState
            title="Your next home is out there"
            description="Tap the heart on an available apartment to save it here."
            action={
              <Button asChild>
                <Link href="/demo/applicant">
                  Explore apartments <Heart size={16} />
                </Link>
              </Button>
            }
          />
        )}
      </>
    );
  if (section === "application") return <ApplicationPage />;
  if (section === "tour") return <TourPage />;
  return <ContactForm />;
}

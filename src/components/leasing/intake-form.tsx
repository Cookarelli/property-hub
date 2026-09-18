"use client";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import { properties, floorPlans, units, money, planFor } from "@/lib/demo/data";
import {
  displayDate,
  externalApplicationUrl,
  leasingDate,
  leasingHref,
} from "@/lib/leasing/catalog";
import { useLeasingData } from "@/lib/leasing/use-leasing-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function Field({
  name,
  label,
  error,
  required = false,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="leasing-field">
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function IntakeForm({
  kind,
  initialProperty = "",
  initialUnit = "",
  initialPlan = "",
}: {
  kind: "application" | "tour";
  initialProperty?: string;
  initialUnit?: string;
  initialPlan?: string;
}) {
  const preselected = properties.find((p) => p.slug === initialProperty);
  const initialApartment = units.find(
    (u) =>
      u.id === initialUnit &&
      u.property_id === preselected?.id &&
      u.status === "available",
  );
  const initialFloorPlan = floorPlans.find(
    (p) => p.id === initialPlan && p.property_id === preselected?.id,
  );
  const [propertyId, setPropertyId] = useState(preselected?.id ?? "");
  const [selection, setSelection] = useState(
    initialApartment
      ? `unit:${initialApartment.id}`
      : initialFloorPlan
        ? `plan:${initialFloorPlan.id}`
        : "",
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const {
    data: leasingData,
    error: connectionError,
    pending: connecting,
    refresh,
  } = useLeasingData();
  const providers = leasingData?.providers ?? {};
  const ready = !!leasingData && !connecting && !connectionError;
  const shownError = error || connectionError;
  const [receipt, setReceipt] = useState<{
    id: string;
    name: string;
    date: string;
    time?: string;
  } | null>(null);
  const requestId = useRef("");
  const successHeading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const property = properties.find((p) => p.id === propertyId);
  const apartment = units.find((u) => `unit:${u.id}` === selection);
  const plan = apartment
    ? planFor(apartment)
    : floorPlans.find((p) => `plan:${p.id}` === selection);
  const externalUrl =
    property && providers[property.id]
      ? externalApplicationUrl(providers[property.id])
      : null;
  const isTour = kind === "tour";
  useEffect(() => {
    requestId.current = crypto.randomUUID();
  }, []);
  useEffect(() => {
    if (receipt) successHeading.current?.focus();
  }, [receipt]);
  useEffect(() => {
    if (shownError) errorSummary.current?.focus();
  }, [shownError]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !ready) return;
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();
    setPending(true);
    setError("");
    setFields({});
    const payload = {
      kind,
      requestId: requestId.current,
      propertyId,
      unitId: apartment?.id ?? "",
      floorPlanId: plan?.id ?? "",
      firstName: get("firstName"),
      lastName: get("lastName"),
      email: get("email"),
      phone: get("phone"),
      message: get("message"),
      website: get("website"),
      ...(isTour
        ? { date: get("date"), time: get("time") }
        : {
            moveIn: get("moveIn"),
            occupants: Number(get("occupants")),
            pets: get("pets"),
          }),
    };
    try {
      const response = await fetch("/api/leasing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setFields(result.fields ?? {});
        throw new Error(
          result.error ?? "We couldn’t save your request. Please try again.",
        );
      }
      setReceipt({
        id: result.id,
        name: get("firstName"),
        date: get(isTour ? "date" : "moveIn"),
        time: get("time"),
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Please check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }
  const input = (
    name: string,
    label: string,
    type: string,
    autoComplete?: string,
  ) => (
    <Field name={name} label={label} error={fields[name]} required>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        maxLength={name === "email" ? 254 : name === "phone" ? 30 : 60}
        aria-invalid={!!fields[name]}
        aria-describedby={fields[name] ? `${name}-error` : undefined}
      />
    </Field>
  );
  if (receipt)
    return (
      <section className="leasing-success">
        <span className="success-icon">
          <CheckCircle2 size={38} />
        </span>
        <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
        <h1 ref={successHeading} tabIndex={-1}>
          {isTour
            ? "Your tour request is in."
            : "You’re one step closer to home."}
        </h1>
        <p>
          Thanks, {receipt.name}. Your{" "}
          {isTour ? "tour request" : "application inquiry"} for{" "}
          <strong>{property?.name}</strong> has been saved.
        </p>
        <div className="receipt-details">
          <span>
            <CalendarDays size={20} />
            {isTour ? "Requested tour" : "Preferred move-in"}
          </span>
          <strong>
            {displayDate(receipt.date)}
            {receipt.time &&
              ` at ${Number(receipt.time.split(":")[0]) > 12 ? Number(receipt.time.split(":")[0]) - 12 : receipt.time.split(":")[0]}:00 ${Number(receipt.time.split(":")[0]) >= 12 ? "PM" : "AM"} CT`}
          </strong>
          <span>
            {apartment
              ? `Apartment ${apartment.number} · ${plan?.name}`
              : (plan?.name ?? "Community tour")}
          </span>
          <small>Reference PH-{receipt.id.slice(0, 8).toUpperCase()}</small>
        </div>
        <h2>
          {isTour
            ? "A request today. A closer look next."
            : "Here’s what comes next."}
        </h2>
        <p>
          {isTour
            ? "A leasing team would confirm the requested time and arrange your visit. This request does not reserve a tour slot."
            : "A leasing team would review your preferences, answer your questions, and guide you through the full application. This inquiry does not reserve an apartment."}
        </p>
        <p className="form-demo-note">
          Demo mode: your request is stored for this browser’s management demo.
          No email or text message has been sent.
        </p>
        <div className="success-actions">
          <Button asChild>
            <Link href={`/properties/${property?.slug}`}>
              Back to the community <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/demo/property-manager/leads">
              View in management demo
            </Link>
          </Button>
        </div>
      </section>
    );
  return (
    <section className="public-section intake-page">
      <Link
        href={property ? `/properties/${property.slug}` : "/properties"}
        className="back-link"
      >
        <ArrowLeft size={15} /> Back to {property?.name ?? "communities"}
      </Link>
      <p className="eyebrow">
        {isTour ? "A LITTLE LOOK AROUND" : "LET’S GET TO KNOW YOUR NEXT MOVE"}
      </p>
      <h1>
        {isTour ? "Come see what feels like home." : "Let’s find your place."}
      </h1>
      <p className="intake-intro">
        {isTour
          ? "Choose a community and a time that works for you. A closer look makes all the difference."
          : "Share a few details to start your application inquiry. Your next chapter can begin right here."}
      </p>
      <div className="intake-layout">
        <form onSubmit={submit} className="intake-form">
          <div className="form-step-title">
            <span>01</span>
            <h2>
              {isTour
                ? "Where would you like to visit?"
                : "Tell us about your new home."}
            </h2>
          </div>
          <Field
            name="propertyId"
            label="Community"
            required
            error={fields.propertyId}
          >
            <select
              id="propertyId"
              name="propertyId"
              required
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setSelection("");
                setFields({});
              }}
              aria-invalid={!!fields.propertyId}
            >
              <option value="">Choose a community</option>
              {properties
                .filter((p) => p.published)
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name} · {p.neighborhood}
                  </option>
                ))}
            </select>
          </Field>
          {externalUrl && !isTour ? (
            <div className="external-provider">
              <h3>Continue with this community’s application provider.</h3>
              <p>
                This community uses an external service for applications. Your
                contact details have not been shared.
              </p>
              <Button asChild>
                <a href={externalUrl} rel="noopener noreferrer">
                  Continue to application provider <ArrowRight size={16} />
                </a>
              </Button>
            </div>
          ) : (
            <>
              <Field
                name="selection"
                label={
                  isTour
                    ? "Apartment or floor plan (optional)"
                    : "Apartment or floor plan"
                }
                required={!isTour}
                error={fields.unitId ?? fields.floorPlanId}
              >
                <select
                  id="selection"
                  required={!isTour}
                  disabled={!property}
                  value={selection}
                  onChange={(e) => setSelection(e.target.value)}
                  aria-invalid={!!(fields.unitId || fields.floorPlanId)}
                >
                  <option value="">
                    {isTour
                      ? "I’d like a community tour"
                      : "Choose your preferred home"}
                  </option>
                  <optgroup label="Available apartments">
                    {units
                      .filter(
                        (u) =>
                          u.property_id === propertyId &&
                          u.status === "available",
                      )
                      .map((u) => (
                        <option value={`unit:${u.id}`} key={u.id}>
                          {u.number} · {planFor(u).name} · {money(u.rent_cents)}
                          /mo
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Floor plan preference">
                    {floorPlans
                      .filter((p) => p.property_id === propertyId)
                      .map((p) => (
                        <option value={`plan:${p.id}`} key={p.id}>
                          {p.name} · {p.bedrooms || "Studio"}
                          {p.bedrooms ? " bed" : ""} · {p.sqft} sqft
                        </option>
                      ))}
                  </optgroup>
                </select>
              </Field>
              <div className="form-grid">
                <Field
                  name={isTour ? "date" : "moveIn"}
                  label={isTour ? "Requested date" : "Preferred move-in date"}
                  required
                  error={fields[isTour ? "date" : "moveIn"]}
                >
                  <Input
                    id={isTour ? "date" : "moveIn"}
                    name={isTour ? "date" : "moveIn"}
                    type="date"
                    min={
                      !isTour && apartment?.available_on
                        ? apartment.available_on
                        : leasingDate
                    }
                    max="2027-09-17"
                    required
                    aria-invalid={!!fields[isTour ? "date" : "moveIn"]}
                  />
                </Field>
                {isTour ? (
                  <Field
                    name="time"
                    label="Preferred time (Central Time)"
                    required
                    error={fields.time}
                  >
                    <select id="time" name="time" defaultValue="" required>
                      <option value="">Choose a time</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </Field>
                ) : (
                  <Field
                    name="occupants"
                    label="Number of occupants"
                    required
                    error={fields.occupants}
                  >
                    <Input
                      id="occupants"
                      name="occupants"
                      type="number"
                      min="1"
                      max="12"
                      required
                      defaultValue="1"
                    />
                  </Field>
                )}
              </div>
              {!isTour && (
                <Field
                  name="pets"
                  label="Will pets be joining you?"
                  required
                  error={fields.pets}
                >
                  <select id="pets" name="pets" defaultValue="none" required>
                    <option value="none">No pets</option>
                    <option value="cat">A cat</option>
                    <option value="dog">A dog</option>
                    <option value="multiple">More than one pet</option>
                    <option value="other">Another pet · let’s talk</option>
                  </select>
                  <p className="field-hint">
                    Assistance animals are handled separately. You can discuss
                    accommodations with the leasing team.
                  </p>
                </Field>
              )}
              <div className="form-step-title">
                <span>02</span>
                <h2>How can we reach you?</h2>
              </div>
              <div className="form-grid">
                {input("firstName", "First name", "text", "given-name")}
                {input("lastName", "Last name", "text", "family-name")}
                {input("email", "Email", "email", "email")}
                {input("phone", "Phone", "tel", "tel")}
              </div>
              <Field
                name="message"
                label={
                  isTour
                    ? "Anything you’d like us to know? (optional)"
                    : "Message (optional)"
                }
                error={fields.message}
              >
                <Textarea
                  id="message"
                  name="message"
                  maxLength={2000}
                  rows={4}
                  placeholder={
                    isTour
                      ? "Accessibility needs, a favorite floor plan, or a question for our team…"
                      : "Tell us what would make your next home a great fit…"
                  }
                />
              </Field>
              <div className="intake-honeypot" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <p className="form-demo-note">
                <strong>Demo mode.</strong> Use fictional contact details.
                Requests are saved in a database and visible only to this
                browser’s demo session. No emails, screening, or payments are
                triggered. Demo calendar: September 2026.
              </p>
              {shownError && (
                <div
                  className="form-error"
                  role="alert"
                  tabIndex={-1}
                  ref={errorSummary}
                >
                  {shownError}
                  {!ready && (
                    <Button type="button" variant="outline" onClick={refresh}>
                      Try connection again
                    </Button>
                  )}
                </div>
              )}
              <Button
                className="intake-submit"
                type="submit"
                disabled={pending || !ready}
              >
                {pending
                  ? "Saving your request…"
                  : !ready
                    ? "Connecting…"
                    : isTour
                      ? "Request a tour"
                      : "Send application inquiry"}
                <ArrowRight size={17} />
              </Button>
              <p className="form-fineprint">
                {isTour
                  ? "Your preferred time is a request and requires confirmation."
                  : "An inquiry starts the conversation. It does not reserve a home or complete a full rental application."}{" "}
                Fields marked * are required.
              </p>
            </>
          )}
        </form>
        <aside className="intake-summary">
          <div className="intake-summary-image">
            <Image
              src={property?.image ?? "/images/hero.jpg"}
              priority
              fill
              sizes="(max-width: 800px) 100vw, 35vw"
              alt={
                property
                  ? `${property.name} illustrative community photography`
                  : "Sunlit model apartment interior"
              }
            />
          </div>
          <div>
            <p className="eyebrow">
              {property
                ? "YOUR NEXT CHAPTER"
                : "FIND YOUR EVERYDAY EXTRAORDINARY"}
            </p>
            <h2>{property?.name ?? "Good places. Better living."}</h2>
            {property && (
              <p className="summary-location">
                <MapPin size={15} />
                {property.neighborhood}, Austin
              </p>
            )}
            {plan && (
              <div className="selected-home">
                <strong>
                  {plan.name}
                  {apartment && ` · ${apartment.number}`}
                </strong>
                <span>
                  {plan.bedrooms ? `${plan.bedrooms} bed` : "Studio"} ·{" "}
                  {plan.bathrooms} bath · {plan.sqft} sqft
                </span>
                {apartment && (
                  <>
                    <strong>
                      {money(apartment.rent_cents)}{" "}
                      <small>/month base rent</small>
                    </strong>
                    <span>
                      Available {displayDate(apartment.available_on!)}
                    </span>
                  </>
                )}
              </div>
            )}
            <ul>
              <li>
                <Check size={17} /> A dedicated leasing team
              </li>
              <li>
                <Check size={17} /> A simpler path from search to home
              </li>
              <li>
                <Check size={17} /> One connected resident experience
              </li>
            </ul>
            <div className="summary-help">
              <Clock size={19} />
              <p>
                {isTour
                  ? "Plan on about 30 minutes for a relaxed look around."
                  : "Just a few minutes now. A new beginning ahead."}
              </p>
            </div>
            {!isTour && property && (
              <Link
                className="unit-tour-link"
                href={leasingHref("tour", property, apartment, plan?.id)}
              >
                Prefer to take a tour first? <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

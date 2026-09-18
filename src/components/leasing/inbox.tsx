"use client";
import { CalendarDays, FileText, RefreshCw } from "lucide-react";
import { properties, units, floorPlans } from "@/lib/demo/data";
import { displayDate } from "@/lib/leasing/catalog";
import { useLeasingData } from "@/lib/leasing/use-leasing-data";
import { Button } from "@/components/ui/button";

export function LeasingInbox() {
  const { data, pending, error, refresh } = useLeasingData(true);
  const records = data?.records ?? [];
  return (
    <section className="leasing-inbox">
      <div className="section-title">
        <div>
          <p className="eyebrow">
            PUBLIC WEBSITE · THIS BROWSER’S DEMO SESSION
          </p>
          <h2>New leasing inquiries</h2>
          <p>
            Application inquiries and tour requests saved from the public
            website.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={pending}>
          <RefreshCw size={15} />
          Refresh
        </Button>
      </div>
      {pending && <p role="status">Loading saved requests…</p>}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {!pending && !error && !records.length && (
        <div className="inbox-empty">
          <FileText size={24} />
          <h3>Your next resident starts here.</h3>
          <p>
            Submit an application inquiry or tour request on the public website
            to see it appear in this inbox.
          </p>
        </div>
      )}
      {records.map((record) => {
        const data = record.payload;
        const p = properties.find((p) => p.id === data.propertyId);
        const unit = units.find((u) => u.id === data.unitId);
        const plan = floorPlans.find((p) => p.id === data.floorPlanId);
        return (
          <details className="inbox-record" key={record.id}>
            <summary>
              {record.kind === "tour" ? (
                <CalendarDays size={20} />
              ) : (
                <FileText size={20} />
              )}
              <span>
                <strong>
                  {data.firstName} {data.lastName}
                </strong>
                <small>
                  {p?.name} ·{" "}
                  {record.kind === "tour"
                    ? "Tour requested"
                    : "Application inquiry"}
                </small>
              </span>
              <span className="inbox-status">New</span>
            </summary>
            <div className="inbox-record-details">
              <dl>
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {data.email}
                    <br />
                    {data.phone}
                  </dd>
                </div>
                <div>
                  <dt>Home preference</dt>
                  <dd>
                    {unit
                      ? `Apartment ${unit.number}`
                      : "Floor plan preference"}{" "}
                    · {plan?.name ?? "Community tour"}
                  </dd>
                </div>
                <div>
                  <dt>
                    {data.kind === "tour"
                      ? "Requested tour"
                      : "Preferred move-in"}
                  </dt>
                  <dd>
                    {displayDate(
                      data.kind === "tour" ? data.date : data.moveIn,
                    )}
                    {data.kind === "tour" && ` · ${data.time} CT`}
                  </dd>
                </div>
                {data.kind === "application" && (
                  <div>
                    <dt>Household</dt>
                    <dd>
                      {data.occupants} occupant(s) · Pets: {data.pets}
                    </dd>
                  </div>
                )}
              </dl>
              {data.message && <p>{data.message}</p>}
              <small>
                PH-{record.id.slice(0, 8).toUpperCase()} · Saved{" "}
                {new Date(record.created_at).toLocaleString()} · No messages
                sent
              </small>
            </div>
          </details>
        );
      })}
    </section>
  );
}

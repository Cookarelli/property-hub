"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  MessageCircle,
  Wrench,
} from "lucide-react";
import { useDemoState } from "@/lib/demo/store";
import { getMaintenance } from "@/lib/demo/selectors";
import { money, residentUnit } from "@/lib/demo/data";
import {
  formatDate,
  resident,
  residentAnnouncements,
  getResidentDocuments,
  residentLease,
  residentLedger,
  residentProperty,
} from "@/lib/resident/data";
import { ResidentHeading, ResidentSection } from "./common";
import { ResidentStatus } from "./maintenance-shared";
import { Button } from "@/components/ui/button";
export function ResidentHome() {
  const { state } = useDemoState();
  const ledger = residentLedger(state);
  const due = ledger.filter((p) => p.status !== "paid");
  const balance = due.reduce((sum, p) => sum + p.amount_cents, 0);
  const requests = getMaintenance(state).filter(
    (r) => r.resident_id === resident.id && r.status !== "completed",
  );
  const updates = residentAnnouncements(state);
  return (
    <>
      <ResidentHeading
        title={`Welcome home, ${(state.profileName ?? resident.name).split(" ")[0]}.`}
        subtitle="Your home, payments, and community updates."
      />
      <div className="r-home-intro">
        <div className="r-home-address">
          <div className="r-community-photo">
            <Image
              src={residentProperty.image}
              alt="Illustrative architecture at The Mercer"
              fill
              sizes="64px"
            />
          </div>
          <div>
            <strong>{residentProperty.name}</strong>
            <span>Apartment {residentUnit.number} · Austin, TX</span>
          </div>
          <Link href="/demo/resident/lease" aria-label="View your lease">
            <ChevronRight size={21} />
          </Link>
        </div>
        <span className="r-home-date">THURSDAY, SEPTEMBER 17</span>
      </div>
      <section
        className={`r-balance ${balance === 0 ? "settled" : ""}`}
        aria-label="Rent balance"
      >
        <div>
          <p>
            {balance
              ? "YOUR CURRENT RENT BALANCE"
              : "YOUR RENT IS TAKEN CARE OF"}
          </p>
          <strong>
            {money(balance)}
            <small>.00</small>
          </strong>
          <span>
            {balance
              ? `October rent · Due ${formatDate(due[0].due_on)}`
              : `Paid through your current lease · Ends ${formatDate(residentLease.ends_on)}`}
          </span>
          <span className="r-balance-status">
            {balance ? <CalendarDays size={15} /> : <CheckCircle2 size={15} />}
            {balance ? "Upcoming · No past-due rent" : "Paid in the demo"}
          </span>
        </div>
        <div>
          <Button asChild>
            <Link
              href={
                balance
                  ? "/demo/resident/payments/pay"
                  : "/demo/resident/payments"
              }
            >
              {balance ? "Pay rent" : "View payment history"}
              <ArrowRight size={18} />
            </Link>
          </Button>
          <small>Simulated payments. No money moves.</small>
        </div>
      </section>
      <nav className="r-quick-actions" aria-label="Quick actions">
        {[
          {
            Icon: CreditCard,
            title: "Pay rent",
            detail: "Quick & simple",
            path: "payments/pay",
          },
          {
            Icon: Wrench,
            title: "Request maintenance",
            detail: "We’re here to help",
            path: "maintenance/new",
          },
          {
            Icon: FileText,
            title: "View lease",
            detail: "Your home details",
            path: "lease",
          },
          {
            Icon: MessageCircle,
            title: "Contact management",
            detail: "Let’s talk",
            path: "contact",
          },
        ].map(({ Icon, title, detail, path }) => (
          <Link key={path} href={`/demo/resident/${path}`}>
            <span>
              <Icon size={23} />
            </span>
            <strong>{title}</strong>
            <span className="sr-only">{detail}</span>
          </Link>
        ))}
      </nav>
      <div className="r-home-columns">
        <div>
          <ResidentSection
            title="Active maintenance"
            href="/demo/resident/maintenance"
            linkLabel="Your requests"
          >
            {requests.length ? (
              requests.slice(0, 2).map((request) => (
                <Link
                  className="r-request-row"
                  href={`/demo/resident/maintenance/${request.id}`}
                  key={request.id}
                >
                  <span className="r-request-icon">
                    <Wrench size={21} />
                  </span>
                  <div>
                    <ResidentStatus status={request.status} />
                    <h3>{request.title}</h3>
                    <p>
                      {request.category} · {formatDate(request.created_at)}
                    </p>
                  </div>
                  <ChevronRight size={20} />
                </Link>
              ))
            ) : (
              <div className="r-calm-empty">
                <CheckCircle2 size={23} />
                <p>
                  Everything’s in good shape.
                  <br />
                  <span>No active maintenance requests.</span>
                </p>
              </div>
            )}
          </ResidentSection>
          <ResidentSection
            title="Around your community"
            href="/demo/resident/announcements"
          >
            {updates.slice(0, 2).map((a, i) => (
              <Link
                href="/demo/resident/announcements"
                className={`r-announcement-teaser ${i === 0 ? "featured" : ""}`}
                key={a.id}
              >
                <p className="eyebrow">
                  {a.category} · {formatDate(a.published_at)}
                </p>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
                <span>
                  Read community updates <ArrowRight size={15} />
                </span>
              </Link>
            ))}
          </ResidentSection>
        </div>
        <div>
          <ResidentSection
            title="Your lease"
            href="/demo/resident/lease"
            linkLabel="View details"
          >
            <div className="r-lease-teaser">
              <span className="r-icon-tile">
                <FileText size={24} />
              </span>
              <p>YOUR HOME THROUGH</p>
              <h3>{formatDate(residentLease.ends_on)}</h3>
              <p>
                Thinking about another year? It’s a good time to talk about your
                next chapter.
              </p>
              <Link href="/demo/resident/contact?subject=Lease%20renewal">
                Ask about renewal <ArrowRight size={15} />
              </Link>
            </div>
          </ResidentSection>
          <ResidentSection
            title="Important documents"
            href="/demo/resident/documents"
          >
            {getResidentDocuments(state)
              .filter((d) =>
                [
                  "Lease Agreement",
                  "Move-in checklist",
                  "Community Rules",
                ].includes(d.title),
              )
              .map((d) => (
                <Link
                  className="r-document-row"
                  href="/demo/resident/documents"
                  key={d.id}
                >
                  <FileText size={21} />
                  <div>
                    <strong>{d.title}</strong>
                    <small>Demo document information</small>
                  </div>
                  <ChevronRight size={18} />
                </Link>
              ))}
          </ResidentSection>
        </div>
      </div>
    </>
  );
}

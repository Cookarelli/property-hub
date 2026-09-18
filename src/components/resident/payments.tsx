"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Landmark,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoState } from "@/lib/demo/store";
import { money, residentUnit } from "@/lib/demo/data";
import {
  formatDate,
  residentLedger,
  residentLease,
  residentProperty,
} from "@/lib/resident/data";
import { simulatedPaymentProvider } from "@/lib/resident/payments";
import { ResidentDemoNote, ResidentHeading, ResidentSection } from "./common";
export function ResidentPayments() {
  const { state } = useDemoState();
  const ledger = residentLedger(state);
  const unpaid = ledger.filter((p) => p.status !== "paid");
  const amount = unpaid.reduce((sum, p) => sum + p.amount_cents, 0);
  return (
    <>
      <ResidentHeading
        title="Payments"
        subtitle="Your rent balance and payment history."
      />
      <ResidentDemoNote>
        <strong>Payment simulation.</strong> No real money is processed, and no
        bank or card details are collected.
      </ResidentDemoNote>
      <div className="r-payments-grid">
        <section className="r-payment-balance">
          <p className="eyebrow">AMOUNT DUE</p>
          <h2>
            {money(amount)}
            <span>.00</span>
          </h2>
          <p>
            {amount
              ? `Due ${formatDate(unpaid[0].due_on)} · October rent`
              : "All current charges are paid."}
          </p>
          <span
            className={`r-status ${amount ? "r-status-scheduled" : "r-status-completed"}`}
          >
            {amount ? "Upcoming" : "Paid · Simulated"}
          </span>
          <Button asChild>
            <Link
              href={amount ? "/demo/resident/payments/pay" : "/demo/resident"}
            >
              {amount ? "Pay rent" : "Back to home"}
              <ArrowRight size={17} />
            </Link>
          </Button>
          <p className="r-muted">
            {amount
              ? "No past-due rent. You can pay the upcoming charge in this demo."
              : `No additional charges are posted. Your current lease ends ${formatDate(residentLease.ends_on)}; contact management about renewal.`}
          </p>
        </section>
        <ResidentSection title="Payment method">
          <div className="r-method-placeholder">
            <Landmark size={28} />
            <h3>A safe place to try it out.</h3>
            <p>
              Choose a fictional checking account or debit card during the demo
              payment flow.
            </p>
            <span>
              <LockKeyhole size={15} /> No financial credentials needed
            </span>
          </div>
        </ResidentSection>
      </div>
      <ResidentSection title="Payment history">
        <div className="r-payment-list">
          {ledger.map((payment) => (
            <article key={payment.id}>
              <span className="r-payment-icon">
                <CreditCard size={21} />
              </span>
              <div>
                <h3>
                  {new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(`${payment.due_on}T12:00:00Z`))}{" "}
                  rent
                </h3>
                <p>
                  {payment.paid_at
                    ? `Paid ${formatDate(payment.paid_at)}`
                    : `Due ${formatDate(payment.due_on)}`}
                </p>
                <small>{payment.method} · Simulated</small>
              </div>
              <div>
                <strong>{money(payment.amount_cents)}</strong>
                <span
                  className={`r-status ${payment.status === "paid" ? "r-status-completed" : "r-status-scheduled"}`}
                >
                  {payment.status === "paid" ? "Paid" : "Upcoming"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </ResidentSection>
    </>
  );
}
export function PayRent() {
  const { state, update, hydrated } = useDemoState();
  const invoice = residentLedger(state).find((p) => p.status !== "paid");
  const [method, setMethod] = useState<
    "Demo checking account" | "Demo debit card"
  >("Demo checking account");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [paidId, setPaidId] = useState("");
  const busy = useRef(false);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const receipt =
    state.residentReceipts?.find((r) => r.id === paidId) ??
    (!invoice ? state.residentReceipts?.at(-1) : undefined);
  const receiptId = receipt?.id;
  useEffect(() => {
    if (receiptId) {
      successHeading.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [receiptId]);
  async function pay() {
    if (!invoice || busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await simulatedPaymentProvider.pay({
        invoiceId: invoice.id,
        idempotencyKey: crypto.randomUUID(),
        method,
      });
      if (result.kind !== "simulated")
        throw new Error("Hosted checkout is unavailable in demo mode.");
      update({
        residentReceipts: [
          ...(state.residentReceipts ?? []).filter(
            (r) => r.invoiceId !== invoice.id,
          ),
          result.receipt,
        ],
      });
      setPaidId(result.receipt.id);
    } catch {
      setError(
        "Your demo payment couldn’t be saved. Please try again. No money was moved.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  if (!hydrated)
    return (
      <p role="status" className="r-loading">
        Loading your payment details…
      </p>
    );
  if (receipt)
    return (
      <div className="r-payment-success">
        <span>
          <CheckCircle2 size={40} />
        </span>
        <p className="eyebrow">SIMULATION COMPLETE</p>
        <h1 ref={successHeading} tabIndex={-1}>
          One less thing on your mind.
        </h1>
        <p>
          Your demo rent payment is recorded.{" "}
          <strong>No real money moved.</strong>
        </p>
        <dl className="r-details">
          <div>
            <dt>Amount</dt>
            <dd>{money(receipt.amountCents)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Paid · Simulated</dd>
          </div>
          <div>
            <dt>Method</dt>
            <dd>{receipt.method}</dd>
          </div>
          <div>
            <dt>Receipt</dt>
            <dd>DEMO-{receipt.id.slice(0, 8).toUpperCase()}</dd>
          </div>
        </dl>
        <Button asChild>
          <Link href="/demo/resident/payments">
            View payment history <ArrowRight size={16} />
          </Link>
        </Button>
        <Link href="/demo/resident" className="r-text-link">
          Back to home
        </Link>
      </div>
    );
  if (!invoice)
    return (
      <>
        <ResidentHeading
          title="You’re all caught up."
          subtitle="There are no open charges to pay."
        />
        <Button asChild>
          <Link href="/demo/resident/payments">View payments</Link>
        </Button>
      </>
    );
  return (
    <>
      <ResidentHeading
        title="Let’s take care of rent."
        subtitle="Review your upcoming payment. This is a simulation."
        back={{ href: "/demo/resident/payments", label: "Payments" }}
      />
      <div className="r-pay-review">
        <ResidentDemoNote>
          <strong>Demo payment only.</strong> This flow cannot charge a bank
          account or card.
        </ResidentDemoNote>
        <div className="r-pay-total">
          <span>OCTOBER RENT</span>
          <strong>{money(invoice.amount_cents)}</strong>
          <p>
            {residentProperty.name} · Apartment {residentUnit.number}
          </p>
          <small>Due {formatDate(invoice.due_on)}</small>
        </div>
        <fieldset className="r-method-options">
          <legend>Choose a demo payment method</legend>
          {[
            {
              name: "Demo checking account",
              icon: Landmark,
              description: "Simulated bank transfer",
            },
            {
              name: "Demo debit card",
              icon: CreditCard,
              description: "Simulated card payment",
            },
          ].map(({ name, icon: Icon, description }) => (
            <label key={name}>
              <Icon size={23} />
              <span>
                <strong>{name}</strong>
                <small>{description} · No credentials</small>
              </span>
              <input
                type="radio"
                name="method"
                value={name}
                checked={method === name}
                onChange={() => setMethod(name as typeof method)}
              />
            </label>
          ))}
        </fieldset>
        <dl className="r-total-lines">
          <div>
            <dt>Rent</dt>
            <dd>{money(invoice.amount_cents)}</dd>
          </div>
          <div>
            <dt>Demo processing fee</dt>
            <dd>$0</dd>
          </div>
          <div>
            <dt>Total simulated payment</dt>
            <dd>{money(invoice.amount_cents)}</dd>
          </div>
        </dl>
        {error && (
          <p role="alert" className="r-error">
            {error}
          </p>
        )}
        <Button
          className="r-primary-action"
          onClick={() => void pay()}
          disabled={pending}
        >
          {pending
            ? "Recording simulated payment…"
            : "Confirm simulated payment"}
          <ArrowRight size={17} />
        </Button>
        <p className="r-muted text-center">
          This records a fictional receipt in your current demo tab.
        </p>
      </div>
    </>
  );
}

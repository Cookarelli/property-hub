import { payments, residents } from "@/lib/demo/data";
import type { PaymentReceipt } from "./schema";
export type PaymentResult =
  | { kind: "simulated"; receipt: PaymentReceipt }
  | { kind: "checkout"; url: string };
export interface PaymentProvider {
  readonly mode: "simulation" | "hosted";
  readonly name: string;
  pay(input: {
    invoiceId: string;
    idempotencyKey: string;
    method: "Demo checking account" | "Demo debit card";
  }): Promise<PaymentResult>;
}
// Real providers must create a server-authorized checkout using the invoice ID.
// The demo adapter never requests credentials, opens a checkout, or moves money.
export const simulatedPaymentProvider: PaymentProvider = {
  mode: "simulation",
  name: "Property Hub payment simulator",
  async pay({ invoiceId, idempotencyKey, method }) {
    const invoice = payments.find(
      (p) =>
        p.id === invoiceId &&
        p.resident_id === residents[0].id &&
        p.status === "pending" &&
        p.simulated,
    );
    if (!invoice)
      throw new Error("This demo charge is no longer available to pay.");
    return {
      kind: "simulated",
      receipt: {
        id: idempotencyKey,
        invoiceId,
        amountCents: invoice.amount_cents,
        paidAt: new Date().toISOString(),
        method,
        status: "paid",
        simulated: true,
      },
    };
  },
};

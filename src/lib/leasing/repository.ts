import "server-only";
import { createClient } from "@supabase/supabase-js";
import { organizationId } from "@/lib/demo/data";
import type { ApplicationProvider } from "./catalog";
import type { IntakeRecord, LeasingIntake } from "./validation";

export interface LeasingRepository {
  submit(sessionId: string, payload: LeasingIntake): Promise<string>;
  list(sessionId: string): Promise<IntakeRecord[]>;
  providers(): Promise<Record<string, ApplicationProvider>>;
}
// The demo endpoint is permanently scoped to its fictional organization. Production
// tenant resolution must use a verified domain and authenticated membership separately.
export async function leasingRepository(): Promise<LeasingRepository> {
  if (process.env.PROPERTY_HUB_LEASING_BACKEND === "supabase-demo") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (
      !url ||
      !secret ||
      process.env.PROPERTY_HUB_DEMO_ORGANIZATION_ID !== organizationId
    )
      throw new Error("Leasing storage is not configured.");
    const client = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return {
      async providers() {
        const { data, error } = await client
          .from("properties")
          .select("id,application_mode,application_url")
          .eq("organization_id", organizationId)
          .eq("published", true);
        if (error) throw new Error("Unable to load application options.");
        return Object.fromEntries(
          data.map((p) => [
            p.id,
            p.application_mode === "external"
              ? {
                  mode: "external",
                  url: p.application_url,
                  name: "Community application provider",
                }
              : { mode: "internal" },
          ]),
        );
      },
      async submit(sessionId, payload) {
        const { data, error } = await client.rpc("submit_leasing_intake", {
          p_org: organizationId,
          p_session: sessionId,
          p_request: payload.requestId,
          p_payload: payload,
        });
        if (error || typeof data !== "string")
          throw new Error("Unable to save your request.");
        return data;
      },
      async list(sessionId) {
        const { data, error } = await client
          .from("leasing_intakes")
          .select("id,kind,created_at,payload,lead_id,tour_request_id")
          .eq("organization_id", organizationId)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw new Error("Unable to load your requests.");
        return data as IntakeRecord[];
      },
    };
  }
  if (
    process.env.VERCEL ||
    process.env.PROPERTY_HUB_LEASING_BACKEND === "disabled"
  )
    throw new Error(
      "Connect durable leasing storage before accepting requests.",
    );
  const { localLeasingRepository } = await import("./local-repository");
  return localLeasingRepository();
}

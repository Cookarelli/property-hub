import "server-only";
import { PGlite } from "@electric-sql/pglite";
import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { organizationId } from "@/lib/demo/data";
import type { LeasingRepository } from "./repository";
import type { IntakeRecord } from "./validation";

const globalDb = globalThis as typeof globalThis & {
  propertyHubLeasingDb?: Promise<PGlite>;
};
async function openDatabase() {
  const dir =
    process.env.PROPERTY_HUB_DEMO_DB_PATH ||
    path.join(process.cwd(), ".local", "leasing-db");
  await mkdir(dir, { recursive: true });
  const db = new PGlite(dir);
  const exists = await db.query<{ present: string | null }>(
    "select to_regclass('private.local_migrations')::text as present",
  );
  if (!exists.rows[0].present) {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,email text,created_at timestamptz,updated_at timestamptz); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create schema private; create table private.local_migrations(name text primary key);",
    );
  }
  const migrationsDir = path.join(process.cwd(), "supabase/migrations");
  for (const name of (await readdir(migrationsDir))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    if (
      !(
        await db.query(
          "select name from private.local_migrations where name=$1",
          [name],
        )
      ).rows.length
    ) {
      // Execute migration and bookkeeping in one transaction; nested migration markers removed.
      await db.transaction(async (tx) => {
        await tx.exec(
          (await readFile(path.join(migrationsDir, name), "utf8"))
            .replace(/^begin;\s*$/gim, "")
            .replace(/^commit;\s*$/gim, ""),
        );
        await tx.query(
          "insert into private.local_migrations(name) values($1)",
          [name],
        );
      });
    }
  }
  // Idempotent inserts add newly introduced demo fixtures while retaining
  // previously submitted leasing inquiries and existing property settings.
  await db.exec(
    await readFile(path.join(process.cwd(), "supabase/seed.sql"), "utf8"),
  );
  return db;
}
export async function localLeasingRepository(): Promise<LeasingRepository> {
  const db = await (globalDb.propertyHubLeasingDb ??= openDatabase().catch(
    (error) => {
      delete globalDb.propertyHubLeasingDb;
      throw error;
    },
  ));
  return {
    async providers() {
      const { rows } = await db.query<{
        id: string;
        application_mode: string;
        application_url: string | null;
      }>(
        "select id,application_mode,application_url from public.properties where organization_id=$1 and published",
        [organizationId],
      );
      return Object.fromEntries(
        rows.map((p) => [
          p.id,
          p.application_mode === "external" && p.application_url
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
      const result = await db.query<{ id: string }>(
        "select public.submit_leasing_intake($1,$2,$3,$4::jsonb) as id",
        [organizationId, sessionId, payload.requestId, JSON.stringify(payload)],
      );
      return result.rows[0].id;
    },
    async list(sessionId) {
      return (
        await db.query<IntakeRecord>(
          "select id,kind,created_at,payload,lead_id,tour_request_id from public.leasing_intakes where organization_id=$1 and session_id=$2 order by created_at desc limit 100",
          [organizationId, sessionId],
        )
      ).rows;
    },
  };
}

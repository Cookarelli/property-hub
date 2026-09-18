import { PGlite } from "@electric-sql/pglite";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  writeFile,
  open,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
// Offline, additive migration of the existing local demo only. Stop the app first.
// There is deliberately no reset, truncate, tenant reassignment, or remote target.
const reportName =
  process.argv.find((arg) => arg.startsWith("--report="))?.slice(9) ??
  "local-tenant-migration.json";
if (!/^[a-z0-9-]+\.json$/.test(reportName))
  throw new Error("Use a simple JSON report filename.");
const dataDir = path.resolve(
  process.env.PROPERTY_HUB_DEMO_DB_PATH || ".local/leasing-db",
);
const lock = path.join(path.dirname(dataDir), "migration.lock");
const handle = await open(lock, "wx");
let db: PGlite | undefined;
try {
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  const backup = path.join(
    path.dirname(dataDir),
    "backups",
    `before-tenant-migration-${stamp}`,
  );
  await mkdir(path.dirname(backup), { recursive: true });
  await cp(dataDir, backup, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
  db = new PGlite(dataDir);
  const columns = (
    await db.query<{ table_name: string; column_name: string }>(
      "select c.table_name,c.column_name from information_schema.columns c join information_schema.tables t using(table_schema,table_name) where c.table_schema='public' and t.table_type='BASE TABLE' order by c.table_name,c.ordinal_position",
    )
  ).rows;
  const originalTables = [...new Set(columns.map((c) => c.table_name))];
  async function snapshot() {
    const result: Record<string, { rows: number; hash: string }> = {};
    for (const table of originalTables) {
      // Branding migration updates organization metadata; verify its original identity.
      const fields =
        table === "organizations"
          ? ["id", "name", "slug", "created_at"]
          : columns
              .filter((c) => c.table_name === table)
              .map((c) => c.column_name);
      const rows = (
        await db!.query(
          `select ${fields.map((f) => `"${f}"`).join(",")} from public."${table}" order by id`,
        )
      ).rows;
      result[table] = {
        rows: rows.length,
        hash: createHash("sha256").update(JSON.stringify(rows)).digest("hex"),
      };
    }
    return result;
  }
  const before = await snapshot();
  const applied: string[] = [];
  for (const filename of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (
      (
        await db.query(
          "select name from private.local_migrations where name=$1",
          [filename],
        )
      ).rows.length
    )
      continue;
    await db.transaction(async (tx) => {
      const sql = (
        await readFile(path.join("supabase/migrations", filename), "utf8")
      )
        .replace(/^begin;\s*$/gim, "")
        .replace(/^commit;\s*$/gim, "");
      await tx.exec(sql);
      await tx.query("insert into private.local_migrations(name)values($1)", [
        filename,
      ]);
    });
    applied.push(filename);
  }
  const after = await snapshot();
  assert.deepEqual(
    after,
    before,
    "Existing tenant identity and every business record must survive unchanged",
  );
  const report = {
    applied,
    backup,
    verifiedTables: originalTables.length,
    preservedRows: Object.fromEntries(
      Object.entries(after).map(([table, value]) => [table, value.rows]),
    ),
  };
  await writeFile(
    path.join("docs", reportName),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await db?.close();
  await handle.close();
  await unlink(lock);
}

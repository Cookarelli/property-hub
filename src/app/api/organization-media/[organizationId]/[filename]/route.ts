import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string; filename: string }> },
) {
  const { organizationId, filename } = await params;
  if (
    !supabaseConfig() ||
    !z.uuid().safeParse(organizationId).success ||
    !z.uuid().safeParse(filename.replace(/\.webp$/, "")).success ||
    !filename.endsWith(".webp")
  )
    return new Response(null, { status: 404 });
  const client = await createClient();
  const { data, error } = await client.storage
    .from("organization-marketing")
    .download(`${organizationId}/${filename}`);
  if (error || !data)
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  return new Response(data, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { leasingRepository } from "@/lib/leasing/repository";
import { intakeSchema } from "@/lib/leasing/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookieName = "property-hub-leasing-session";
function reportStorageFailure(operation: "read" | "submit", error: unknown) {
  const knownMessages = [
    "Leasing storage is not configured.",
    "Unable to load application options.",
    "Unable to load your requests.",
    "Unable to save your request.",
    "Connect durable leasing storage before accepting requests.",
  ];
  const cause = error instanceof Error ? error.cause : null;
  // Log only fixed diagnostic labels, never credentials, cookies or form data.
  console.error("Leasing storage unavailable", {
    operation,
    reason:
      error instanceof Error && knownMessages.includes(error.message)
        ? error.message
        : "Unexpected storage error",
    hostedDemo: process.env.PROPERTY_HUB_LEASING_BACKEND === "supabase-demo",
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSecret: Boolean(process.env.SUPABASE_SECRET_KEY),
    status:
      cause &&
      typeof cause === "object" &&
      "status" in cause &&
      typeof cause.status === "number"
        ? cause.status
        : undefined,
    code:
      cause &&
      typeof cause === "object" &&
      "code" in cause &&
      typeof cause.code === "string" &&
      /^[A-Za-z0-9_]{1,30}$/.test(cause.code)
        ? cause.code
        : undefined,
  });
}
function session(request: NextRequest) {
  const existing = request.cookies.get(cookieName)?.value;
  return existing && /^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(existing)
    ? existing
    : randomUUID();
}
function reply(
  request: NextRequest,
  sessionId: string,
  body: unknown,
  status = 200,
) {
  const response = NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
  response.cookies.set(cookieName, sessionId, {
    httpOnly: true,
    sameSite: "strict",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
export async function GET(request: NextRequest) {
  const sessionId = session(request);
  try {
    const repository = await leasingRepository();
    const [records, providers] = await Promise.all([
      repository.list(sessionId),
      repository.providers(),
    ]);
    return reply(request, sessionId, { records, providers });
  } catch (error) {
    reportStorageFailure("read", error);
    return reply(
      request,
      sessionId,
      {
        error:
          "Leasing requests are temporarily unavailable. Please try again shortly.",
      },
      503,
    );
  }
}
export async function POST(request: NextRequest) {
  const sessionId = session(request);
  // Next may normalize nextUrl to localhost behind its development proxy.
  // Compare the browser's Origin with the actual request Host instead.
  let sameOrigin = false;
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    sameOrigin =
      ["http:", "https:"].includes(origin.protocol) &&
      origin.host === request.headers.get("host");
  } catch {
    /* Missing or malformed origins are rejected. */
  }
  if (
    !sameOrigin ||
    !request.headers.get("content-type")?.startsWith("application/json")
  )
    return reply(
      request,
      sessionId,
      { error: "Please submit this form from Property Hub." },
      403,
    );
  if (Number(request.headers.get("content-length") ?? 0) > 12000)
    return reply(
      request,
      sessionId,
      { error: "Your message is too long." },
      413,
    );
  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 12000)
      return reply(
        request,
        sessionId,
        { error: "Your message is too long." },
        413,
      );
    input = JSON.parse(raw);
  } catch {
    return reply(
      request,
      sessionId,
      { error: "We couldn’t read this request. Please try again." },
      400,
    );
  }
  const result = intakeSchema.safeParse(input);
  if (!result.success)
    return reply(
      request,
      sessionId,
      {
        error: "Please check the highlighted fields.",
        fields: Object.fromEntries(
          result.error.issues.map((issue) => [issue.path[0], issue.message]),
        ),
      },
      422,
    );
  try {
    const id = await (await leasingRepository()).submit(sessionId, result.data);
    return reply(request, sessionId, { id, kind: result.data.kind }, 201);
  } catch (error) {
    reportStorageFailure("submit", error);
    return reply(
      request,
      sessionId,
      {
        error:
          "We couldn’t save your request. Please try again shortly. Your details are still here.",
      },
      503,
    );
  }
}

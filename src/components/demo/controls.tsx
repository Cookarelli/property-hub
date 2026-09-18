"use client";
import { demoOrganizationBranding as tenantBranding } from "@/lib/demo/organization";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDemoState } from "@/lib/demo/store";
import { demoHref, personas, isPersona } from "@/lib/navigation";
import { storyRequest, storySteps } from "@/lib/demo/story";
import type { Persona } from "@/lib/types";
import { DemoResetDialog } from "./reset-dialog";

export function ResetDemoButton() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <div className="sales-reset">
      <Button ref={triggerRef} variant="outline" onClick={() => setOpen(true)}>
        <RotateCcw size={16} />
        Reset demo data
      </Button>
      {notice && <p role="status">{notice}</p>}
      <DemoResetDialog
        returnFocusRef={triggerRef}
        open={open}
        onOpenChange={setOpen}
        onReset={() =>
          setNotice(
            "Demo restored. All five personas are ready for a fresh story.",
          )
        }
      />
    </div>
  );
}

export function DemoControls({ persona }: { persona: Persona }) {
  const router = useRouter();
  const { state, update } = useDemoState();
  const steps = storySteps(state);
  const next = steps.find((step) => !step.done);
  return (
    <div className="sales-controls">
      <Select
        value={persona}
        onValueChange={(value) => {
          if (isPersona(value)) router.push(demoHref(value));
        }}
      >
        <SelectTrigger
          aria-label="Switch demo persona"
          className="sales-persona-trigger"
        >
          <Sparkles size={15} aria-hidden="true" />
          <span className="sales-persona-prefix">Demo: Viewing as</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {personas.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="sales-guide-trigger"
            aria-label="Open demo guide"
          >
            <BookOpen size={17} />
            <span>Demo guide</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="sales-guide-sheet">
          <div className="sales-guide-heading">
            <span className="eyebrow">ONE COMMUNITY. EVERY PERSPECTIVE.</span>
            <SheetTitle>Your Property Hub demo</SheetTitle>
            <SheetDescription>
              Follow one connected story or jump to any experience. Every
              persona belongs to {tenantBranding.name}.
            </SheetDescription>
          </div>
          <div className="sales-guide-progress">
            <span>
              {steps.filter((step) => step.done).length} of {steps.length}{" "}
              moments explored
            </span>
            <progress
              max={steps.length}
              value={steps.filter((step) => step.done).length}
              aria-label="Demo story progress"
            />
          </div>
          <ol className="sales-story-list">
            {steps.map((step, i) => (
              <li key={step.id} data-complete={step.done}>
                <span className="sales-step-number" aria-hidden="true">
                  {step.done ? <Check size={15} /> : i + 1}
                </span>
                <SheetClose asChild>
                  <Link
                    href={step.href}
                    onClick={() => update({ demoGuide: true })}
                  >
                    <strong>
                      {step.title}
                      {step.done && (
                        <span className="sr-only"> · Completed</span>
                      )}
                    </strong>
                    <p>{step.description}</p>
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ol>
          {next ? (
            <SheetClose asChild>
              <Button asChild>
                <Link
                  href={next.href}
                  onClick={() => update({ demoGuide: true })}
                >
                  Continue the story <ArrowRight size={16} />
                </Link>
              </Button>
            </SheetClose>
          ) : (
            <p className="sales-complete" role="status">
              You’ve connected the whole experience. Explore freely or reset for
              your next presentation.
            </p>
          )}
          <label className="sales-hint-toggle">
            <input
              type="checkbox"
              checked={!!state.demoGuide}
              onChange={(event) => update({ demoGuide: event.target.checked })}
            />
            Show contextual demo hints
          </label>
          <div className="sales-guide-footer">
            <SheetClose asChild>
              <Link href="/demo">
                <Compass size={17} />
                All demo experiences
              </Link>
            </SheetClose>
            <ResetDemoButton />
            <p>
              Resets this tab’s story, edits, payments and repairs. Earlier
              website inquiries are hidden here; saved database records and
              production accounts are untouched.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function DemoHint({ persona }: { persona: Persona }) {
  const { state, update, hydrated } = useDemoState();
  const pathname = usePathname();
  const request = storyRequest(state);
  const visits = state.demoVisited;
  let visit:
    "manager-review" | "resident-update" | "owner-overview" | undefined;
  if (
    state.applicationSubmitted &&
    pathname.includes("/property-manager/applications")
  )
    visit = "manager-review";
  if (
    request &&
    ["in_progress", "completed"].includes(request.status) &&
    pathname === "/demo/resident/maintenance/" + request.id
  )
    visit = "resident-update";
  if (visits?.includes("resident-update") && pathname === "/demo/owner")
    visit = "owner-overview";
  const shouldRecord = hydrated && !!visit && !visits?.includes(visit);
  useEffect(() => {
    if (shouldRecord && visit)
      update({ demoVisited: [...(visits ?? []), visit] });
  }, [shouldRecord, visit, visits, update]);
  if (!hydrated || !state.demoGuide) return null;
  const steps = storySteps(state);
  const next = steps.find((step) => !step.done);
  const hints = {
    owner:
      "Your portfolio reflects the story: new leads, applications, repairs and recent activity.",
    "property-manager":
      request && !request.assigned_to
        ? "Alex’s new repair is in Maintenance. Open it and assign Marcus Reed."
        : state.applicationSubmitted
          ? "Sofia’s submitted application and linked lead are ready to review."
          : "Explore daily operations, or use the guide to bring a new applicant into this workspace.",
    maintenance:
      "You’re Marcus Reed. My assignments shows your work; Team queue shows the rest of the maintenance team’s requests.",
    resident:
      request && ["in_progress", "completed"].includes(request.status)
        ? "Your maintenance team has posted an update. Open the request to see what changed."
        : "You’re Alex in The Mercer A-101. Try a repair request with the ready-to-use demo photo.",
    applicant:
      "You’re Sofia, looking for a two-bedroom home. Request a tour, then send a basic application.",
  };
  return (
    <aside className="sales-context-hint" aria-label="Demo hint">
      <BookOpen size={17} />
      <p>{hints[persona]}</p>
      {next && (
        <Link href={next.href}>
          Next: {next.title}
          <ArrowRight size={14} />
        </Link>
      )}
      <button
        aria-label="Hide demo hints"
        onClick={() => update({ demoGuide: false })}
      >
        Hide
      </button>
    </aside>
  );
}

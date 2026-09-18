"use client";
import { demoOrganizationBranding as tenantBranding } from "@/lib/demo/organization";
import { DemoControls, DemoHint } from "@/components/demo/controls";
import { DemoResetDialog } from "@/components/demo/reset-dialog";
import { LoadingState } from "@/components/loading-state";
import { demoStory } from "@/lib/demo/story";
import { ResidentShell } from "@/components/resident/shell";
import { getApplications } from "@/lib/management/data";
import { getMaintenance } from "@/lib/demo/selectors";
import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  DoorOpen,
  FileCheck2,
  Files,
  Heart,
  House,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Search,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  Wrench,
  CalendarDays,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { demoHref, navFor, personas } from "@/lib/navigation";
import type { Persona } from "@/lib/types";
import { useDemoState } from "@/lib/demo/store";
import { DetailDialog } from "@/components/shared";
const icons: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Home: House,
  Properties: Building2,
  Units: DoorOpen,
  Residents: Users,
  Leads: MessageSquare,
  Applications: FileCheck2,
  Maintenance: Wrench,
  Documents: Files,
  Announcements: Megaphone,
  Analytics: ChartNoAxesCombined,
  Activity: CalendarDays,
  Settings: Settings2,
  Payments: CreditCard,
  Profile: UserRound,
  Saved: Heart,
  Application: FileCheck2,
  Tour: CalendarDays,
  Contact: MessageSquare,
};
export function PersonaSwitcher({ persona }: { persona: Persona }) {
  return <DemoControls persona={persona} />;
}
export function DemoShell({
  persona,
  children,
}: {
  persona: Persona;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, hydrated } = useDemoState();
  const [resetOpen, setResetOpen] = useState(false);
  const accountRef = useRef<HTMLButtonElement>(null);
  const user = personas.find((p) => p.id === persona)!;
  const nav = navFor(persona);
  const current =
    nav.find(
      (n) =>
        demoHref(persona, n) === pathname ||
        (demoHref(persona, n) !== demoHref(persona) &&
          pathname.startsWith(demoHref(persona, n) + "/")),
    ) ?? nav[0];
  const resident = persona === "resident";
  const personal = resident || persona === "applicant";
  if (resident)
    return (
      <ResidentShell personaControl={<PersonaSwitcher persona="resident" />}>
        {children}
      </ResidentShell>
    );
  function navigation(mobile = false) {
    return (
      <nav
        aria-label={mobile ? "Mobile navigation" : "Workspace navigation"}
        className="workspace-nav"
      >
        {nav.map((n, i) => {
          const Icon = icons[n];
          const link = (
            <Link
              href={demoHref(persona, n)}
              aria-current={current === n ? "page" : undefined}
              className={i === 4 && !personal ? "nav-divider" : ""}
            >
              <Icon size={18} />
              <span>{n === "Saved" ? "Saved apartment" : n}</span>
              {n === "Maintenance" && !personal && (
                <span className="nav-count">
                  {
                    getMaintenance(state).filter(
                      (request) =>
                        request.status !== "completed" &&
                        (persona !== "maintenance" ||
                          request.assigned_to === demoStory.maintenanceUserId),
                    ).length
                  }
                </span>
              )}
              {n === "Applications" && (
                <span className="nav-count subtle">
                  {
                    getApplications(state).filter((a) =>
                      ["draft", "submitted", "in_review"].includes(a.status),
                    ).length
                  }
                </span>
              )}
            </Link>
          );
          return mobile ? (
            <SheetClose asChild key={n}>
              {link}
            </SheetClose>
          ) : (
            <div key={n}>{link}</div>
          );
        })}
      </nav>
    );
  }
  return (
    <div className={`demo-app ${personal ? "personal-app" : ""}`}>
      <DemoResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        returnFocusRef={accountRef}
      />
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand light />
        </div>
        <div className="organization-selector">
          <span className="org-icon">
            <Building2 size={18} />
          </span>
          <div>
            <strong>{state.organizationName || tenantBranding.name}</strong>
            <span>Demo organization</span>
          </div>
          <ChevronDown size={14} />
        </div>
        <p className="sidebar-label">{personal ? "YOUR SPACE" : "WORKSPACE"}</p>
        {navigation()}
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <ShieldCheck size={21} />
            <strong>
              {personal
                ? "A little closer to home."
                : "Your portfolio, connected."}
            </strong>
            <p>
              {personal
                ? "Everything you need for everyday living."
                : "One place for your properties, your people, and what’s next."}
            </p>
            <Link href="/">
              Visit public website <ArrowUpRight size={14} />
            </Link>
          </div>
          <DetailDialog
            title="Welcome to your Property Hub demo"
            description="Explore the platform without an account."
            trigger={
              <button className="sidebar-support">
                <CircleHelp size={17} /> Help & getting started
              </button>
            }
          >
            <p className="text-sm leading-6">
              Use Demo Mode to switch between all five personas. Browse
              communities, review applications, submit a maintenance request, or
              schedule a fictional tour. Your changes stay in this browser tab.
              Open the demo guide for the connected story, or use “Reset demo”
              to start fresh.
            </p>
          </DetailDialog>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open workspace navigation"
                  >
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="mobile-workspace">
                  <SheetTitle className="p-5">Property Hub</SheetTitle>
                  {navigation(true)}
                </SheetContent>
              </Sheet>
            </div>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href={demoHref(persona)}>
                {personal ? "Your portal" : "Workspace"}
              </Link>
              <ChevronRight size={13} />
              <span>{current}</span>
            </nav>
          </div>
          <div className="topbar-actions">
            <DetailDialog
              title="Search your workspace"
              description="Jump to a section of your demo workspace."
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Search workspace"
                >
                  <Search size={19} />
                </Button>
              }
            >
              <div className="grid grid-cols-2 gap-2">
                {nav.map((n) => (
                  <Button key={n} variant="outline" asChild>
                    <Link href={demoHref(persona, n)}>{n}</Link>
                  </Button>
                ))}
              </div>
            </DetailDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <span className="notification-bell">
                    <Bell size={19} />
                    <i />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Demo notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-3 text-sm leading-6">
                  You’re all caught up. Live notifications will appear here when
                  your organization is connected.
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="topbar-separator" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  ref={accountRef}
                  className="profile-trigger"
                  aria-label="Account menu"
                >
                  <span className="avatar">{user.initials}</span>
                  <span className="profile-copy">
                    <strong>{user.name}</strong>
                    <small>{user.label}</small>
                  </span>
                  <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.name} · Demo account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    router.push(
                      demoHref(
                        persona,
                        nav.includes("Settings")
                          ? "Settings"
                          : nav.includes("Profile")
                            ? "Profile"
                            : "Application",
                      ),
                    )
                  }
                >
                  <UserRound />
                  Account details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setResetOpen(true)}>
                  <RotateCcw />
                  Reset demo
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <LogOut />
                    Exit demo
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="workspace-demo-banner">
          <span className="demo-banner-text">
            <span className="live-dot" />
            <strong>{tenantBranding.name}</strong> · One fictional portfolio,
            five perspectives.
          </span>
          <PersonaSwitcher persona={persona} />
        </div>
        <main
          id="main-content"
          className={`workspace-content ${personal ? "personal-content" : ""}`}
        >
          <DemoHint persona={persona} />
          {hydrated ? (
            children
          ) : (
            <LoadingState label="Loading your demo workspace…" />
          )}
        </main>
        <footer className="workspace-footer">
          <span>
            Property Hub <span aria-hidden="true">·</span> A place for
            everything.
          </span>
          <span>Fictional demo · September 2026</span>
        </footer>
      </div>
      {resident && (
        <nav
          className="resident-bottom-nav"
          aria-label="Resident quick navigation"
        >
          {["Home", "Payments", "Maintenance", "Documents", "Profile"].map(
            (n) => {
              const Icon = icons[n];
              return (
                <Link
                  key={n}
                  href={demoHref(persona, n)}
                  aria-current={current === n ? "page" : undefined}
                >
                  <Icon size={21} />
                  <span>{n === "Maintenance" ? "Repairs" : n}</span>
                </Link>
              );
            },
          )}
        </nav>
      )}
    </div>
  );
}

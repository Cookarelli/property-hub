"use client";
import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CreditCard,
  FileText,
  House,
  Menu,
  MessageCircle,
  Megaphone,
  RotateCcw,
  UserRound,
  Wrench,
  LogOut,
} from "lucide-react";
import { DemoHint } from "@/components/demo/controls";
import { DemoResetDialog } from "@/components/demo/reset-dialog";
import { LoadingState } from "@/components/loading-state";
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
import { useDemoState } from "@/lib/demo/store";
import { residentAnnouncements } from "@/lib/resident/data";
const links = [
  { name: "Home", path: "", icon: House },
  { name: "Payments", path: "/payments", icon: CreditCard },
  { name: "Maintenance", path: "/maintenance", icon: Wrench },
  { name: "Documents", path: "/documents", icon: FileText },
  { name: "Profile", path: "/profile", icon: UserRound },
];
const allLinks = [
  ...links,
  { name: "Announcements", path: "/announcements", icon: Megaphone },
  { name: "Lease", path: "/lease", icon: FileText },
  { name: "Contact", path: "/contact", icon: MessageCircle },
];
export function ResidentShell({
  children,
  personaControl,
}: {
  children: ReactNode;
  personaControl: ReactNode;
}) {
  const pathname = usePathname();
  const { state, hydrated } = useDemoState();
  const [resetOpen, setResetOpen] = useState(false);
  const accountRef = useRef<HTMLButtonElement>(null);
  const name = state.profileName ?? "Alex Rivera";
  const active = (path: string) =>
    path
      ? pathname.startsWith(`/demo/resident${path}`)
      : pathname === "/demo/resident";
  return (
    <div className="resident-app">
      <DemoResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        returnFocusRef={accountRef}
      />
      <div className="r-app-top">
        <header className="r-app-header">
          <Link
            href="/demo/resident"
            aria-label="Resident home"
            className="r-wordmark"
          >
            <House size={26} />
            <span>
              propertyhub<span>.</span>
              <small>YOUR HOME, CONNECTED</small>
            </span>
          </Link>
          <div className="r-header-actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Resident notifications"
                >
                  <Bell size={21} />
                  <span className="r-notification-dot" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="r-notifications">
                <DropdownMenuLabel>Around your community</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {residentAnnouncements(state)
                  .slice(0, 2)
                  .map((a) => (
                    <DropdownMenuItem asChild key={a.id}>
                      <Link href="/demo/resident/announcements">{a.title}</Link>
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuItem asChild>
                  <Link href="/demo/resident/maintenance">
                    View maintenance updates
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  ref={accountRef}
                  className="r-avatar"
                  aria-label="Account menu"
                >
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{name} · Demo resident</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/demo/resident/profile">
                    <UserRound />
                    Your profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setResetOpen(true)}>
                  <RotateCcw />
                  Reset demo
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <LogOut />
                    Public website
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="r-menu">
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
                <SheetContent side="right">
                  <SheetTitle className="p-6">Your home</SheetTitle>
                  <nav aria-label="Mobile navigation" className="r-sheet-nav">
                    {allLinks.map(({ name, path, icon: Icon }) => (
                      <SheetClose asChild key={name}>
                        <Link href={`/demo/resident${path}`}>
                          <Icon size={20} />
                          {name}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
        <div className="r-demo-strip">
          <span>Fictional resident · No real payments or messages</span>
          {personaControl}
        </div>
        <nav className="r-desktop-nav" aria-label="Workspace navigation">
          {allLinks.map(({ name, path }) => (
            <Link
              key={name}
              href={`/demo/resident${path}`}
              aria-current={active(path) ? "page" : undefined}
            >
              {name}
            </Link>
          ))}
        </nav>
      </div>
      <main id="main-content" className="r-main">
        <DemoHint persona="resident" />
        {hydrated ? children : <LoadingState label="Loading your home…" />}
      </main>
      <footer className="r-footer">
        <Brand />
        <span>Demo mode · September 2026</span>
        <Link href="/demo/resident/contact">Here when you need us</Link>
      </footer>
      <nav className="r-bottom-nav" aria-label="Resident quick navigation">
        {links.map(({ name, path, icon: Icon }) => (
          <Link
            key={name}
            href={`/demo/resident${path}`}
            aria-current={active(path) ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={active(path) ? 2 : 1.65} />
            <span>{name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

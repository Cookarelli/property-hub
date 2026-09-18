"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
const links = [
  ["Home", "/"],
  ["Properties", "/properties"],
  ["Availability", "/availability"],
  ["How it works", "/how-it-works"],
  ["Contact", "/contact"],
];
export function PublicHeader() {
  const pathname = usePathname();
  return (
    <>
      <div className="public-demo-bar">
        <span>
          <span className="live-dot" /> A better way to feel at home.
        </span>
        <Link href="/demo">
          Start Demo <ArrowUpRight size={14} />
        </Link>
      </div>
      <header className="public-header">
        <Brand />
        <nav aria-label="Main navigation" className="public-nav">
          {links.map(([label, href]) => (
            <Link
              key={href}
              aria-current={pathname === href ? "page" : undefined}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/sign-in">
              Sign in <ArrowUpRight size={15} />
            </Link>
          </Button>
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle className="p-5">Property Hub</SheetTitle>
                <nav className="mobile-public-nav">
                  {[
                    ...links,
                    ["Sign in", "/sign-in"],
                    ["Start Demo", "/demo"],
                  ].map(([label, href]) => (
                    <SheetClose key={href} asChild>
                      <Link href={href}>{label}</Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="footer-top">
        <div>
          <Brand light />
          <p>Good places. Better living.</p>
        </div>
        <div>
          <h2>Find your place</h2>
          <Link href="/properties">Our communities</Link>
          <Link href="/availability">Available apartments</Link>
          <Link href="/how-it-works">How it works</Link>
        </div>
        <div>
          <h2>Already at home?</h2>
          <Link href="/demo/resident">Resident demo</Link>
          <Link href="/sign-in">Resident sign in</Link>
          <Link href="/contact">Get in touch</Link>
        </div>
        <div>
          <h2>Meet Property Hub</h2>
          <Link href="/demo">Start Demo</Link>
          <Link href="/demo/property-manager">Management demo</Link>
          <p>
            A connected experience for
            <br />
            every part of property life.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Property Hub. All communities shown are fictional.</span>
        <span>Made for a place called home.</span>
      </div>
    </footer>
  );
}

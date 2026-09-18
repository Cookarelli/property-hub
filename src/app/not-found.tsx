import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main id="main-content" className="state-page">
      <p className="eyebrow">404 · A SMALL DETOUR</p>
      <h1>Let’s get you back home.</h1>
      <p>
        This page isn’t part of your current workspace, or the address has
        changed.
      </p>
      <Button asChild>
        <Link href="/">Back to Property Hub</Link>
      </Button>
    </main>
  );
}

"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function DemoError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="state-page" role="alert">
      <h1>Let’s try that again.</h1>
      <p>This view couldn’t load. Your saved demo changes are still here.</p>
      <Button onClick={reset}>Reload this view</Button>
      <Button variant="outline" asChild>
        <Link href="/demo">Back to demo launcher</Link>
      </Button>
    </section>
  );
}

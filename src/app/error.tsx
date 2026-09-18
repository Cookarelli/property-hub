"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="state-page" role="alert">
      <p className="eyebrow">LET’S TRY THAT AGAIN</p>
      <h1>We couldn’t load this space.</h1>
      <p>
        Something interrupted the page. Your saved demo changes are still in
        this tab.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}

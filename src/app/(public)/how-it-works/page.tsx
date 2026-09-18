import Link from "next/link";
import { ArrowRight, Search, CalendarDays, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
export const metadata = { title: "How it works" };
export default function HowItWorks() {
  return (
    <section className="public-section listing-page">
      <p className="eyebrow">LESS FRICTION. MORE LIVING.</p>
      <h1>Your next chapter, made simple.</h1>
      <p className="listing-intro">
        A clear path from “this could be home” to “welcome home.”
      </p>
      <div className="steps-grid">
        {[
          {
            Icon: Search,
            title: "Find your fit",
            text: "Explore our communities and compare available floor plans, rents, and the details that make a space yours.",
          },
          {
            Icon: CalendarDays,
            title: "Get a feel for the place",
            text: "Save an apartment and request a tour. Then keep your application organized in your own applicant portal.",
          },
          {
            Icon: KeyRound,
            title: "Make yourself at home",
            text: "Once you move in, your resident portal brings payments, maintenance, documents, and community news together.",
          },
        ].map(({ Icon, title, text }, i) => (
          <article key={title}>
            <span className="step-number">0{i + 1}</span>
            <Icon size={30} />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="simple-cta">
        <h2>Take the first look.</h2>
        <p>
          Try the complete experience with fictional data, no account required.
        </p>
        <Button asChild>
          <Link href="/demo/applicant">
            Explore the applicant demo <ArrowRight size={17} />
          </Link>
        </Button>
      </div>
    </section>
  );
}

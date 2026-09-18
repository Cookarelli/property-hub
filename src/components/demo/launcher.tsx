"use client";
import { demoOrganizationBranding as tenantBranding } from "@/lib/demo/organization";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  House,
  KeyRound,
  ChartNoAxesCombined,
  Check,
  Play,
  Wrench,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useDemoState } from "@/lib/demo/store";
import { demoStory, storySteps } from "@/lib/demo/story";
import { planFor, money } from "@/lib/demo/data";
import { ResetDemoButton } from "./controls";

const experiences = [
  {
    title: "Explore Apartments",
    copy: "See what prospective residents experience.",
    detail: "Meet Sofia. Find a home, request a tour and take the next step.",
    href: "/demo/applicant",
    icon: KeyRound,
    image: "/images/mercer.jpg",
    label: "APPLICANT",
  },
  {
    title: "Resident Experience",
    copy: "See payments, maintenance and documents.",
    detail: "Meet Alex. Everyday living, with everything in one place.",
    href: "/demo/resident",
    icon: House,
    image: "/images/kitchen.jpg",
    label: "RESIDENT",
  },
  {
    title: "Property Management",
    copy: "Manage properties, residents and operations.",
    detail: "Meet Alex Morgan. Keep the community’s day moving.",
    href: "/demo/property-manager",
    icon: Building2,
    image: "/images/juniper.jpg",
    label: "PROPERTY MANAGER",
  },
  {
    title: "Owner Overview",
    copy: "See portfolio performance at a glance.",
    detail: "Meet Sam. Three communities, one clear portfolio view.",
    href: "/demo/owner",
    icon: ChartNoAxesCombined,
    image: "/images/westhaven.jpg",
    label: "OWNER",
  },
];
export function DemoLauncher() {
  const { state, update, hydrated } = useDemoState();
  const steps = storySteps(state);
  const next = steps.find((step) => !step.done);
  const progress = steps.filter((step) => step.done).length;
  return (
    <div className="sales-launcher">
      <header className="sales-launcher-header">
        <Brand />
        <span>INTERACTIVE DEMO</span>
        <Link href="/">
          Public website <ArrowUpRight size={16} />
        </Link>
      </header>
      <main id="main-content">
        <section className="sales-launcher-hero">
          <div>
            <p className="eyebrow">WELCOME TO PROPERTY HUB</p>
            <h1>
              One community.
              <br />
              <em>Every perspective.</em>
            </h1>
            <p>
              From the first apartment tour to the everyday moments of home.
              Experience how Property Hub brings it all together.
            </p>
            <div className="sales-hero-actions">
              <Button asChild>
                <Link
                  href={next?.href ?? "/demo/owner"}
                  onClick={() => update({ demoGuide: true })}
                >
                  <Play size={16} />
                  {hydrated && progress
                    ? "Continue the guided story"
                    : "Start the guided story"}
                </Link>
              </Button>
              <a href="#experiences">
                Choose an experience <ArrowRight size={16} />
              </a>
            </div>
            <div className="sales-hero-assurances">
              <span>
                <Check size={14} />
                No sign-in needed
              </span>
              <span>
                <Check size={14} />
                Switch roles instantly
              </span>
              <span>
                <Check size={14} />
                Fictional data only
              </span>
            </div>
          </div>
          <div className="sales-hero-photo">
            <Image
              src="/images/mercer.jpg"
              alt="Illustrative apartment architecture for the fictional Mercer community"
              fill
              sizes="(max-width: 850px) 100vw, 45vw"
              loading="eager"
            />
            <div>
              <small>THE COMMUNITY IN YOUR STORY</small>
              <h2>The Mercer</h2>
              <p>Sofia’s next home. Alex’s everyday life.</p>
              <span>
                {planFor(demoStory.unit).bedrooms} beds ·{" "}
                {demoStory.unit.number} · {money(demoStory.unit.rent_cents)}/mo
              </span>
            </div>
          </div>
        </section>
        <section className="sales-experiences" id="experiences">
          <div className="sales-section-heading">
            <div>
              <p className="eyebrow">CHOOSE YOUR PERSPECTIVE</p>
              <h2>Make yourself at home.</h2>
            </div>
            <p>
              Each experience is ready to explore.
              <br />
              The same organization connects them all.
            </p>
          </div>
          <div className="sales-experience-grid">
            {experiences.map(({ icon: Icon, ...experience }, i) => (
              <Link
                className="sales-experience-card"
                href={experience.href}
                key={experience.title}
                onClick={() => update({ demoGuide: true })}
              >
                <div className="sales-card-photo">
                  <Image
                    src={experience.image}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 25vw"
                  />
                  <span>0{i + 1}</span>
                </div>
                <div className="sales-card-copy">
                  <span className="eyebrow">
                    <Icon size={15} />
                    {experience.label}
                  </span>
                  <h3>{experience.title}</h3>
                  <p>{experience.copy}</p>
                  <small>{experience.detail}</small>
                  <span className="sales-card-link">
                    Step inside <ArrowRight size={17} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="sales-connected-story">
          <div>
            <span className="eyebrow">TRY THE WHOLE STORY</span>
            <h2>
              A new neighbor.
              <br />A repair made simple.
            </h2>
            <p>
              Sofia discovers an apartment and meets the leasing team. Alex
              requests a repair. Marcus takes care of it. Sam sees the whole
              picture.
            </p>
            <Button variant="outline" asChild>
              <Link
                href="/demo/maintenance"
                onClick={() => update({ demoGuide: true })}
              >
                <Wrench size={17} />
                Meet the maintenance team
              </Link>
            </Button>
          </div>
          <ol>
            {[
              "Sofia finds a home, requests a tour and applies.",
              "Alex Morgan reviews the application and assigns a repair.",
              "Marcus updates the work. Alex sees the progress.",
              "Sam checks portfolio performance and activity.",
            ].map((text, i) => (
              <li key={text}>
                <span>{i + 1}</span>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="sales-session">
          <div>
            <h2>Ready for your next presentation?</h2>
            <p>
              Restore the seeded demo in this tab. Production accounts and saved
              database records are never changed.
            </p>
          </div>
          <ResetDemoButton />
        </section>
      </main>
      <footer className="sales-launcher-footer">
        <Brand />
        <span>{tenantBranding.name} · 3 communities · 90 apartments</span>
        <span>A fictional portfolio, ready to explore.</span>
      </footer>
    </div>
  );
}

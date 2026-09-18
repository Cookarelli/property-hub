import { demoOrganizationBranding as tenantBranding } from "@/lib/demo/organization";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  MapPin,
  PawPrint,
  Car,
  Plug,
  WashingMachine,
  Mail,
  Clock,
  ArrowRight,
} from "lucide-react";
import { properties, floorPlans, units, money } from "@/lib/demo/data";
import { AvailabilityBrowser } from "@/components/marketplace";
import { PropertyGallery } from "@/components/leasing/property-gallery";
import { FloorPlanCard } from "@/components/leasing/floor-plan";
import { communityDetails, leasingHref } from "@/lib/leasing/catalog";
import { Button } from "@/components/ui/button";
export function generateStaticParams() {
  return properties.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = properties.find((p) => p.slug === slug);
  return {
    title: property
      ? `${property.name} apartments in ${property.neighborhood}`
      : "Community not found",
    description: property?.description,
  };
}
export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = properties.find((p) => p.slug === slug && p.published);
  if (!p) notFound();
  const details = communityDetails[p.slug];
  const available = units.filter(
    (u) => u.property_id === p.id && u.status === "available",
  );
  return (
    <>
      <div className="gallery-breadcrumb">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/properties">Communities</Link>
          <span>/</span>
          <span>{p.name}</span>
        </nav>
        <span>{tenantBranding.name}</span>
      </div>
      <PropertyGallery name={p.name} images={details.gallery} />
      <section className="public-section leasing-detail">
        <div className="detail-introduction">
          <div>
            <p className="eyebrow">{p.neighborhood} · AUSTIN, TEXAS</p>
            <h1>{p.name}</h1>
            <p className="detail-address">
              <MapPin size={17} />
              {p.address}, {p.city}, {p.state} {p.zip}
            </p>
          </div>
          <div className="detail-price">
            <span>Available homes from</span>
            <p>
              {money(Math.min(...available.map((u) => u.rent_cents)))}
              <small> /month</small>
            </p>
            <span>Studio, 1 & 2 bedrooms · {available.length} available</span>
          </div>
        </div>
        <nav className="property-section-nav" aria-label="Community sections">
          <a href="#overview">Overview</a>
          <a href="#apartments">Available homes</a>
          <a href="#floor-plans">Floor plans</a>
          <a href="#neighborhood">Neighborhood</a>
          <a href="#details">Good to know</a>
        </nav>
        <div className="detail-overview-grid" id="overview">
          <div>
            <p className="eyebrow">WELCOME TO YOUR NEXT CHAPTER</p>
            <h2>{details.tagline}</h2>
            <p className="property-description">{p.description}</p>
            <p className="detail-copy">
              Thoughtfully planned spaces make room for the way you live, from a
              quiet morning at home to an evening with friends. Choose a studio,
              one-bedroom, or two-bedroom apartment and make it your own.
            </p>
            <h3 className="amenities-heading">
              A little more to come home to.
            </h3>
            <div className="amenities">
              {p.amenities.map((a) => (
                <span key={a}>
                  <Check size={16} />
                  {a}
                </span>
              ))}
            </div>
          </div>
          <aside className="leasing-contact-card">
            <p className="eyebrow">COME SEE FOR YOURSELF</p>
            <h3>Your next home starts with a hello.</h3>
            <p>
              Walk the community, explore a floor plan, and get a feel for
              everyday life here.
            </p>
            <Button asChild>
              <Link href={leasingHref("tour", p)}>
                Schedule a tour <ArrowUpRight size={17} />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={leasingHref("apply", p)}>
                Apply now <ArrowRight size={16} />
              </Link>
            </Button>
            <span>
              <Clock size={14} /> Tour requests · Mon–Sat, 10am–4pm CT
            </span>
            <span>
              <Mail size={14} /> Leasing team: {tenantBranding.phone}
            </span>
            <small>
              Demo contact information. Use the form to save a request; no calls
              or emails are sent.
            </small>
          </aside>
        </div>
        <section id="apartments" className="detail-section">
          <div className="section-title">
            <div>
              <p className="eyebrow">ROOM FOR WHAT’S NEXT</p>
              <h2>Find your perfect fit.</h2>
              <p>
                Real options for your next move. Explore the available
                apartments below.
              </p>
            </div>
          </div>
          <AvailabilityBrowser propertyId={p.id} />
        </section>
        <section id="floor-plans" className="detail-section">
          <p className="eyebrow">DESIGNED AROUND YOU</p>
          <h2>A layout for your life.</h2>
          <div className="floor-plan-grid">
            {floorPlans
              .filter((f) => f.property_id === p.id)
              .map((f) => (
                <FloorPlanCard key={f.id} plan={f} property={p} />
              ))}
          </div>
        </section>
        <section
          id="neighborhood"
          className="detail-section neighborhood-section"
        >
          <div>
            <p className="eyebrow">THE NEIGHBORHOOD</p>
            <h2>At home in {p.neighborhood}.</h2>
            <p>{details.neighborhood}</p>
            <div className="neighborhood-landmarks">
              {details.landmarks.map((l) => (
                <span key={l}>
                  <MapPin size={16} />
                  {l}
                </span>
              ))}
            </div>
            <p className="listing-note">
              This is a fictional demo address. The illustration shows
              neighborhood character, not an exact location.
            </p>
          </div>
          <div
            className="neighborhood-map"
            role="img"
            aria-label={`Illustrative neighborhood map for ${p.name}, not a geographic map`}
          >
            <div className="map-park">Neighborhood green</div>
            <div className="map-road road-one" />
            <div className="map-road road-two" />
            <div className="map-road road-three" />
            <div className="map-label">
              <MapPin size={26} />
              <strong>{p.name}</strong>
              <span>{p.neighborhood}, Austin</span>
            </div>
            <span className="map-caption">NEIGHBORHOOD ILLUSTRATION</span>
          </div>
        </section>
        <section id="details" className="detail-section">
          <p className="eyebrow">THE EVERYDAY DETAILS</p>
          <h2>Good to know before you move.</h2>
          <div className="property-policy-grid">
            {[
              {
                title: "Pets are part of the family",
                text: details.pets,
                Icon: PawPrint,
              },
              {
                title: "Parking made simple",
                text: details.parking,
                Icon: Car,
              },
              {
                title: "Utilities & internet",
                text: details.utilities,
                Icon: Plug,
              },
              {
                title: "Laundry, at home",
                text: details.laundry,
                Icon: WashingMachine,
              },
            ].map(({ title, text, Icon }) => (
              <article key={title}>
                <Icon size={23} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="listing-note">
            Base rent excludes optional services and utilities. All pricing,
            policies, floor plans, and photographs are illustrative demo
            content. Ask the leasing team to confirm details before committing
            to a home.
          </p>
        </section>
        <div className="detail-bottom-cta">
          <div>
            <h2>Picture yourself here?</h2>
            <p>Let’s help you take the next step.</p>
          </div>
          <Button asChild>
            <Link href={leasingHref("tour", p)}>
              Schedule a tour <ArrowUpRight size={17} />
            </Link>
          </Button>
        </div>
      </section>
      <nav
        className="leasing-mobile-actions"
        aria-label="Apartment leasing actions"
      >
        <a href="#apartments">
          <small>From / month</small>
          <strong>
            {money(Math.min(...available.map((u) => u.rent_cents)))}
          </strong>
        </a>
        <Button asChild variant="outline">
          <Link href={leasingHref("apply", p)}>Apply</Link>
        </Button>
        <Button asChild>
          <Link href={leasingHref("tour", p)}>Request tour</Link>
        </Button>
      </nav>
    </>
  );
}

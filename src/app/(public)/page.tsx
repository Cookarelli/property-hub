import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  HeartHandshake,
  KeyRound,
  MapPin,
  Smartphone,
  PawPrint,
  Trees,
  Dumbbell,
  Wrench,
  FileText,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearch, PropertyCard, UnitCard } from "@/components/marketplace";
import { properties, units, planFor } from "@/lib/demo/data";
export default function HomePage() {
  return (
    <>
      <section className="hero">
        <Image
          src="/images/hero.jpg"
          alt="Sunlit living room with natural finishes opening onto a garden"
          fill
          priority
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">
            <span />
            THOUGHTFULLY CHOSEN. BEAUTIFULLY LIVED.
          </p>
          <h1>
            Find a Place That
            <br />
            Feels Like <em>Home</em>
          </h1>
          <p className="hero-description">
            Discover available apartments in neighborhoods you’ll love.
            <br className="hidden sm:block" /> From your first tour to everyday
            living, manage your rental experience digitally.
          </p>
          <div className="hero-leasing-actions">
            <Button asChild>
              <Link href="/properties">
                Browse Properties <ArrowUpRight size={17} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tour">
                Schedule a Tour <ArrowRight size={17} />
              </Link>
            </Button>
          </div>
          <HeroSearch />
          <div className="hero-assurance">
            <span>
              <Check size={15} />
              Thoughtful communities
            </span>
            <span>
              <Check size={15} />A simpler move
            </span>
            <span>
              <Check size={15} />
              Support that stays
            </span>
          </div>
        </div>
        <div className="hero-caption">
          <MapPin size={14} />
          <span>A little inspiration for your next chapter.</span>
        </div>
      </section>
      <section className="trust-strip">
        <p>
          Life happens at home.
          <br />
          <strong>Let’s make it a good one.</strong>
        </p>
        <div>
          <Building2 />
          <span>
            <strong>3 distinct communities</strong>
            <small>One city. Your kind of neighborhood.</small>
          </span>
        </div>
        <div>
          <KeyRound />
          <span>
            <strong>A seamless move-in</strong>
            <small>From first look to your front door.</small>
          </span>
        </div>
        <div>
          <HeartHandshake />
          <span>
            <strong>People-first living</strong>
            <small>A team that feels like a neighbor.</small>
          </span>
        </div>
      </section>
      <section className="public-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">FIND YOUR EVERYDAY EXTRAORDINARY</p>
            <h2>A place for your kind of living.</h2>
            <p>
              Explore three unique communities, each with a character all its
              own.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/properties">
              Explore all communities <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>
        <div className="property-grid">
          {properties.map((p) => (
            <PropertyCard property={p} key={p.id} />
          ))}
        </div>
      </section>
      <section className="public-section available-home-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">YOUR NEXT CHAPTER IS OPEN</p>
            <h2>Available homes. New possibilities.</h2>
            <p>A few of our favorite spaces, ready for your next move.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/availability">
              View all available homes <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>
        <div className="property-grid">
          {properties.map((p) => (
            <UnitCard
              key={p.id}
              unit={
                units.find(
                  (u) =>
                    u.property_id === p.id &&
                    u.status === "available" &&
                    planFor(u).bedrooms === 1,
                ) ??
                units.find(
                  (u) => u.property_id === p.id && u.status === "available",
                )!
              }
            />
          ))}
        </div>
      </section>
      <section className="public-section amenities-home">
        <p className="eyebrow">MORE THAN FOUR WALLS</p>
        <h2>Make room for the good things.</h2>
        <div className="amenity-benefits">
          {[
            {
              Icon: PawPrint,
              title: "Room for your whole family",
              text: "Pet-friendly homes and outdoor spaces for your four-legged companions.",
            },
            {
              Icon: Trees,
              title: "A breath of fresh air",
              text: "Courtyards, terraces, and neighborhood connections that bring you outside.",
            },
            {
              Icon: Dumbbell,
              title: "Your everyday, elevated",
              text: "Thoughtful amenities, from fitness studios to spaces to work and unwind.",
            },
          ].map(({ Icon, title, text }) => (
            <article key={title}>
              <Icon size={28} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <p className="listing-note">
          Amenities vary by community. Find your favorites on each property
          page.
        </p>
      </section>
      <section className="public-section leasing-steps">
        <div>
          <p className="eyebrow">A SIMPLER WAY HOME</p>
          <h2>
            From first look
            <br />
            to fresh start.
          </h2>
          <Link href="/how-it-works">
            See how it works <ArrowRight size={16} />
          </Link>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>Find your fit</h3>
              <p>
                Explore communities, compare floor plans, and choose a space
                that feels like you.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Take a closer look</h3>
              <p>
                Request a tour at a time that works for you. Our team will help
                with the details.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Start your next chapter</h3>
              <p>
                Tell us about your move. Your leasing team will guide you
                through the next steps.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <section className="living-section">
        <div className="living-image">
          <Image
            src="/images/westhaven.jpg"
            alt="Warm, spacious apartment living room with an open kitchen"
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
          />
          <div className="resident-phone-preview">
            <p className="eyebrow">RESIDENT EXPERIENCE · DEMO</p>
            <h3>Welcome home, Alex.</h3>
            <p>The Mercer · Apartment A-101</p>
            <div className="phone-balance">
              <span>September rent</span>
              <strong>
                All taken care of <Check size={16} />
              </strong>
            </div>
            <div className="phone-actions">
              <span>
                <CreditCard size={21} />
                Payments
              </span>
              <span>
                <Wrench size={21} />
                Repairs
              </span>
              <span>
                <FileText size={21} />
                Documents
              </span>
            </div>
            <div className="phone-update">
              <span>COMMUNITY UPDATE</span>
              <strong>Meet your neighbors.</strong>
              <p>Saturday coffee in the courtyard.</p>
            </div>
            <Link href="/demo/resident">
              Explore the resident demo <ArrowRight size={15} />
            </Link>
          </div>
          <div className="living-note">
            <span className="mini-icon">
              <HeartHandshake size={22} />
            </span>
            <p>
              Home is a feeling.
              <br />
              <strong>We take care of the details.</strong>
            </p>
          </div>
        </div>
        <div className="living-copy">
          <p className="eyebrow">SETTLE IN. STAY CONNECTED.</p>
          <h2>
            Good living goes
            <br />
            beyond your front door.
          </h2>
          <p>
            From finding your first apartment to taking care of the everyday,
            Property Hub brings it all together.
          </p>
          <div className="feature-line">
            <Smartphone />
            <div>
              <h3>Your home, in your pocket</h3>
              <p>
                Payments, documents, and community updates in one simple portal.
              </p>
            </div>
          </div>
          <div className="feature-line">
            <HeartHandshake />
            <div>
              <h3>Help is always close by</h3>
              <p>Request a repair and follow along, every step of the way.</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/demo/resident">
              Explore the resident experience <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </section>
      <section className="platform-cta">
        <div>
          <p className="eyebrow">FOR PROPERTY OWNERS & MANAGERS</p>
          <h2>
            Your communities.
            <br />
            Beautifully connected.
          </h2>
          <p>
            Bring leasing, operations, and resident life together.
            <br className="hidden sm:block" /> Explore a platform designed to
            grow with your portfolio.
          </p>
          <Button asChild>
            <Link href="/demo/owner">
              Step inside the demo <ArrowUpRight size={17} />
            </Link>
          </Button>
        </div>
        <div className="platform-preview">
          <div className="preview-top">
            <span className="preview-logo">
              <Building2 size={17} /> propertyhub.
            </span>
            <span>DEMO</span>
          </div>
          <div className="preview-body">
            <p>YOUR PORTFOLIO AT A GLANCE</p>
            <h3>Everything’s in a good place.</h3>
            <div className="preview-stats">
              <div>
                <strong>90</strong>
                <span>Apartments</span>
              </div>
              <div>
                <strong>3</strong>
                <span>Communities</span>
              </div>
              <div>
                <strong>78</strong>
                <span>Homes occupied</span>
              </div>
            </div>
            <div className="preview-community">
              <Image
                src="/images/mercer.jpg"
                alt="The Mercer demo community"
                width={58}
                height={48}
              />
              <div>
                <strong>The Mercer</strong>
                <span>South Lamar, Austin</span>
              </div>
              <span className="status status-green">Active</span>
            </div>
            <Link href="/demo/owner">
              Your next chapter starts here <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

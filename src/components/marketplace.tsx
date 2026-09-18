"use client";
import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  Check,
  Heart,
  MapPin,
  Search,
  Square,
  SlidersHorizontal,
} from "lucide-react";
import {
  properties,
  units,
  planFor,
  money,
  propertyFor,
} from "@/lib/demo/data";
import {
  communityDetails,
  displayDate,
  leasingHref,
  emptyFilters,
  matchingProperties,
  matchingUnits,
  type SearchFilters,
} from "@/lib/leasing/catalog";
import type { Property, Unit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, Status } from "@/components/shared";
import { useDemoState } from "@/lib/demo/store";

export function PropertyCard({
  property,
  management = false,
  href,
}: {
  property: Property;
  management?: boolean;
  href?: string;
}) {
  const ownUnits = units.filter((u) => u.property_id === property.id);
  const minRent = Math.min(
    ...ownUnits
      .filter((u) => u.status === "available")
      .map((u) => u.rent_cents),
  );
  const available = ownUnits.filter((u) => u.status === "available").length;
  return (
    <article className="property-card">
      <Link
        href={href ?? `/properties/${property.slug}`}
        className="property-image"
      >
        <Image
          src={property.image}
          alt={`Illustrative architecture at the fictional ${property.name} community`}
          fill
          sizes="(max-width: 700px) 100vw, 33vw"
        />
        <span className="photo-label">
          {management ? "30 apartments" : `${available} homes available`}
        </span>
        <span className="property-photo-arrow">
          <ArrowUpRight size={19} />
        </span>
      </Link>
      <div className="property-card-body">
        <p className="property-location">
          <MapPin size={13} />
          {property.neighborhood} · {property.city}, {property.state}
        </p>
        <Link href={href ?? `/properties/${property.slug}`}>
          <h3>{property.name}</h3>
        </Link>
        <p className="property-card-description">
          {management
            ? `${ownUnits.filter((u) => u.status === "occupied").length} occupied · ${available} available · 1 in turnover`
            : "Studio, 1 & 2 bedroom apartments"}
        </p>
        {!management && (
          <p className="card-amenities">
            {property.amenities.slice(0, 3).join(" · ")}
          </p>
        )}
        <div className="property-card-bottom">
          <span>
            From <strong>{money(minRent)}</strong>
            <small> /mo</small>
          </span>
          {management ? (
            <Status>active</Status>
          ) : (
            <span className="property-amenity">
              Pet friendly <Check size={12} />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
export function HeroSearch() {
  return (
    <form action="/properties" className="hero-search">
      <label>
        <MapPin size={21} />
        <span>
          <span className="search-label">WHERE YOU WANT TO LIVE</span>
          <input
            name="q"
            placeholder="Austin, TX or a neighborhood"
            aria-label="City or neighborhood"
          />
        </span>
      </label>
      <div className="hero-bed-select">
        <label htmlFor="hero-beds">BEDROOMS</label>
        <select id="hero-beds" name="beds" defaultValue="all">
          <option value="all">Any bedrooms</option>
          <option value="0">Studio</option>
          <option value="1">1 bedroom</option>
          <option value="2">2 bedrooms</option>
        </select>
      </div>
      <Button type="submit">
        <Search size={17} />
        Find your home
      </Button>
    </form>
  );
}
export function PropertyBrowser({
  initialQuery = "",
  initialBeds = "all",
}: {
  initialQuery?: string;
  initialBeds?: string;
}) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...emptyFilters,
    query: initialQuery,
    beds: ["0", "1", "2"].includes(initialBeds) ? initialBeds : "all",
  });
  const [sort, setSort] = useState("featured");
  const [expanded, setExpanded] = useState(false);
  const filterId = useId();
  const activeCount = Object.entries(filters).filter(([key, value]) =>
    key === "amenities"
      ? (value as string[]).length > 0
      : value !== emptyFilters[key as keyof SearchFilters],
  ).length;
  const set = (key: keyof SearchFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const matches = matchingProperties(filters).sort((a, b) =>
    sort === "rent"
      ? Math.min(...matchingUnits(a, filters).map((u) => u.rent_cents)) -
        Math.min(...matchingUnits(b, filters).map((u) => u.rent_cents))
      : 0,
  );
  const amenities = [...new Set(properties.flatMap((p) => p.amenities))];
  return (
    <>
      <div className="leasing-filters">
        <div className="filter-main">
          <label className="filter-search">
            <span>Location or community</span>
            <div className="search-field">
              <Search size={18} />
              <Input
                aria-label="Search communities"
                placeholder="City, neighborhood, or community"
                value={filters.query}
                onChange={(e) => set("query", e.target.value)}
              />
            </div>
          </label>
          <label>
            <span>Bedrooms</span>
            <select
              aria-label="Bedrooms"
              value={filters.beds}
              onChange={(e) => set("beds", e.target.value)}
            >
              <option value="all">Any bedrooms</option>
              <option value="0">Studio</option>
              <option value="1">1 bedroom</option>
              <option value="2">2 bedrooms</option>
            </select>
          </label>
          <label>
            <span>Maximum rent</span>
            <Input
              aria-label="Maximum monthly rent"
              type="number"
              min="0"
              step="50"
              placeholder="No maximum"
              value={filters.maxRent}
              onChange={(e) => set("maxRent", e.target.value)}
            />
          </label>
        </div>
        <div className="filter-disclosure">
          <Button
            variant="outline"
            aria-expanded={expanded}
            aria-controls={filterId}
            onClick={() => setExpanded(!expanded)}
          >
            <SlidersHorizontal size={16} /> More filters
            {activeCount > 0 ? ` · ${activeCount} active` : ""}
          </Button>
          {activeCount > 0 && (
            <Button variant="ghost" onClick={() => setFilters(emptyFilters)}>
              Clear all
            </Button>
          )}
        </div>
        <div
          id={filterId}
          className="filter-secondary"
          data-expanded={expanded}
        >
          <label>
            <span>Bathrooms</span>
            <select
              aria-label="Bathrooms"
              value={filters.baths}
              onChange={(e) => set("baths", e.target.value)}
            >
              <option value="all">Any bathrooms</option>
              <option value="1">1+ bathrooms</option>
              <option value="2">2+ bathrooms</option>
            </select>
          </label>
          <label>
            <span>Minimum rent</span>
            <Input
              aria-label="Minimum monthly rent"
              type="number"
              min="0"
              step="50"
              placeholder="No minimum"
              value={filters.minRent}
              onChange={(e) => set("minRent", e.target.value)}
            />
          </label>
          <label>
            <span>Availability</span>
            <select
              aria-label="Availability"
              value={filters.availability}
              onChange={(e) => set("availability", e.target.value)}
            >
              <option value="available">Available to lease</option>
              <option value="now">Move-in ready now</option>
              <option value="all">All floor plans</option>
            </select>
          </label>
          <details className="amenity-filter">
            <summary>
              Amenities{" "}
              {filters.amenities.length > 0 && `(${filters.amenities.length})`}
            </summary>
            <div>
              {amenities.map((a) => (
                <label key={a}>
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(a)}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        amenities: e.target.checked
                          ? [...f.amenities, a]
                          : f.amenities.filter((v) => v !== a),
                      }))
                    }
                  />
                  {a}
                </label>
              ))}
            </div>
          </details>
          <Button
            variant="ghost"
            onClick={() => {
              setFilters(emptyFilters);
              setSort("featured");
            }}
          >
            Reset filters
          </Button>
        </div>
      </div>
      <div className="listing-count">
        <span aria-live="polite">
          <strong>{matches.length} communities</strong> to call home
        </span>
        <label className="sort-select">
          Sort by{" "}
          <select
            aria-label="Sort communities"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="rent">Lowest rent</option>
          </select>
        </label>
      </div>
      {matches.length ? (
        <div className="property-grid">
          {matches.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No communities match your search"
          description="Try a different neighborhood or adjust your rent range."
          action={
            <Button variant="outline" onClick={() => setFilters(emptyFilters)}>
              Clear search and filters
            </Button>
          }
        />
      )}
      <p className="listing-note">
        Monthly prices are base rent. Pet, parking, and utility charges vary by
        community. Availability is illustrative as of September 17, 2026.
      </p>
    </>
  );
}
export function UnitCard({
  unit,
  demo = false,
}: {
  unit: Unit;
  demo?: boolean;
}) {
  const p = propertyFor(unit.property_id);
  const plan = planFor(unit);
  const { state, update } = useDemoState();
  const saved = state.savedUnitId === unit.id;
  return (
    <article className="unit-card">
      <div className="unit-card-image">
        <Image
          src={p.image}
          alt={`${p.name} illustrative community photography`}
          fill
          sizes="(max-width: 700px) 100vw, 33vw"
        />
        <button
          className={`save-unit ${saved ? "saved" : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${p.name} ${unit.number}`}
          aria-pressed={saved}
          onClick={() => update({ savedUnitId: saved ? "" : unit.id })}
        >
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="unit-card-body">
        <div className="flex justify-between items-center">
          <p className="eyebrow">{p.name}</p>
          <Status>available</Status>
        </div>
        <h3>
          {plan.name} <span>· {unit.number}</span>
        </h3>
        <div className="unit-specs">
          <span>
            <BedDouble size={15} />
            {plan.bedrooms || "Studio"}
            {plan.bedrooms ? " bed" : ""}
          </span>
          <span>
            <Bath size={15} />
            {plan.bathrooms} bath
          </span>
          <span>
            <Square size={13} />
            {plan.sqft.toLocaleString()} sqft
          </span>
        </div>
        <p className="unit-availability">
          Available{" "}
          {unit.available_on ? displayDate(unit.available_on) : "soon"}
        </p>
        <p className="unit-features">
          {communityDetails[p.slug].features.join(" · ")}
        </p>
        <div className="unit-card-bottom">
          <span>
            <strong>{money(unit.rent_cents)}</strong> /mo
          </span>
          <Button asChild variant="outline" size="sm">
            <Link
              href={
                demo
                  ? "/demo/applicant/application"
                  : leasingHref("apply", p, unit)
              }
              onClick={() => update({ savedUnitId: unit.id })}
            >
              Apply <ArrowUpRight size={14} />
            </Link>
          </Button>
        </div>
        <Link
          className="unit-tour-link"
          href={demo ? "/demo/applicant/tour" : leasingHref("tour", p, unit)}
          onClick={() => {
            if (demo) update({ savedUnitId: unit.id });
          }}
        >
          Schedule a tour <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
export function AvailabilityBrowser({
  propertyId,
  demo = false,
}: {
  propertyId?: string;
  demo?: boolean;
}) {
  const [property, setProperty] = useState(propertyId ?? "all");
  const [beds, setBeds] = useState("all");
  const available = units.filter(
    (u) =>
      u.status === "available" &&
      (property === "all" || u.property_id === property) &&
      (beds === "all" || planFor(u).bedrooms === Number(beds)),
  );
  return (
    <>
      <div className="listing-filters">
        <label className="filter-select">
          <span>Community</span>
          <select
            aria-label="Filter by community"
            value={property}
            onChange={(e) => setProperty(e.target.value)}
          >
            <option value="all">All communities</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span>Bedrooms</span>
          <select
            aria-label="Filter by bedrooms"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
          >
            <option value="all">Any bedrooms</option>
            <option value="0">Studio</option>
            <option value="1">1 bedroom</option>
            <option value="2">2 bedrooms</option>
          </select>
        </label>
        <span className="ml-auto text-sm text-muted-foreground">
          {available.length} apartments available to lease
        </span>
      </div>
      {available.length ? (
        <div className="property-grid">
          {available.map((u) => (
            <UnitCard key={u.id} unit={u} demo={demo} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No available apartments"
          description="Try another community or bedroom count."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setProperty(propertyId ?? "all");
                setBeds("all");
              }}
            >
              Reset availability filters
            </Button>
          }
        />
      )}
      <p className="listing-note">
        Fictional communities and illustrative photography. All prices and
        availability are demonstration data.{" "}
        <Link href="/demo/applicant/saved">
          View your saved apartment <ArrowRight size={13} />
        </Link>
      </p>
    </>
  );
}

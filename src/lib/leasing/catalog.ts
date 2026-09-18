import { DEMO_DATE, floorPlans, properties, units } from "@/lib/demo/data";
import type { Property, Unit } from "@/lib/types";

export type ApplicationProvider =
  { mode: "internal" } | { mode: "external"; url: string; name: string };
export type CommunityDetails = {
  tagline: string;
  neighborhood: string;
  landmarks: string[];
  gallery: { src: string; alt: string }[];
  pets: string;
  parking: string;
  utilities: string;
  laundry: string;
  features: string[];
  application: ApplicationProvider;
};
const interior = {
  src: "/images/hero.jpg",
  alt: "Illustrative sunlit living area opening onto a private garden",
};
export const communityDetails: Record<string, CommunityDetails> = {
  "the-mercer": {
    tagline: "City energy. A softer landing.",
    neighborhood:
      "Start with coffee, take the long way home, and leave room for a little live music. South Lamar brings Austin’s creative energy to your doorstep, with an inviting retreat waiting at the end of the day.",
    landmarks: [
      "Neighborhood cafés",
      "South Lamar dining",
      "Greenbelt escapes",
    ],
    gallery: [
      {
        src: "/images/mercer.jpg",
        alt: "Illustrative contemporary architecture at The Mercer, with mature trees and generous windows",
      },
      interior,
      {
        src: "/images/kitchen.jpg",
        alt: "Illustrative modern kitchen with generous counter space",
      },
    ],
    pets: "Cats and dogs are welcome. Up to two pets per home; $300 one-time pet fee and $25 monthly pet rent per pet. Assistance animal accommodations are handled separately.",
    parking:
      "One unreserved space included. Covered parking available for $65 per month, subject to availability.",
    utilities:
      "Residents arrange electricity and internet. Water, sewer, and waste collection are billed separately based on use and occupancy.",
    laundry: "Full-size washer and dryer included in every apartment.",
    features: [
      "Quartz countertops",
      "Private balcony",
      "In-home washer & dryer",
    ],
    application: { mode: "internal" },
  },
  "juniper-park": {
    tagline: "A little greener. A little more you.",
    neighborhood:
      "An easygoing home base in East Austin. Find your favorite coffee counter, bike to a neighborhood market, or stay close and spend an afternoon in the courtyard. There’s room here for your own rhythm.",
    landmarks: [
      "Local coffee & bakeries",
      "Neighborhood bike routes",
      "Independent shops",
    ],
    gallery: [
      {
        src: "/images/juniper.jpg",
        alt: "Illustrative Juniper Park living room overlooking greenery",
      },
      {
        src: "/images/bedroom.jpg",
        alt: "Illustrative peaceful bedroom with warm neutral finishes",
      },
      interior,
    ],
    pets: "A pet-friendly community with a landscaped walking area. Up to two pets per home; $250 one-time pet fee and $20 monthly pet rent per pet. Ask about assistance animal accommodations.",
    parking:
      "One surface parking space included. Secure bicycle storage is available at no additional charge.",
    utilities:
      "Electricity and internet are arranged by residents. Water and sewer are individually metered; waste collection is $20 per month.",
    laundry: "Energy-efficient washer and dryer included in every home.",
    features: ["Garden views", "Wood-style floors", "In-home washer & dryer"],
    application: { mode: "internal" },
  },
  "westhaven-lofts": {
    tagline: "A fresh perspective on a classic neighborhood.",
    neighborhood:
      "Slow mornings and lively evenings find a natural balance in Clarksville. Tree-lined streets, independent restaurants, and neighborhood gathering places make the everyday feel a little more considered.",
    landmarks: [
      "Tree-lined walking streets",
      "Neighborhood restaurants",
      "Downtown connections",
    ],
    gallery: [
      {
        src: "/images/westhaven.jpg",
        alt: "Illustrative Westhaven loft with an open kitchen and generous windows",
      },
      {
        src: "/images/kitchen.jpg",
        alt: "Illustrative chef-inspired kitchen with natural textures",
      },
      {
        src: "/images/bedroom.jpg",
        alt: "Illustrative spacious bedroom filled with natural light",
      },
    ],
    pets: "Bring your four-legged neighbors. Up to two pets per loft; $300 one-time pet fee and $30 monthly pet rent per pet. Assistance animal accommodations are available.",
    parking:
      "Reserved garage parking is $90 per month. EV charging spaces are available with separately billed usage.",
    utilities:
      "Residents arrange electricity and internet. Water, sewer, and waste collection are billed separately. Ask the leasing team for an estimate.",
    laundry:
      "Stacked washer and dryer included, with dedicated laundry storage.",
    features: ["Oversized windows", "Open-plan kitchen", "Walk-in closets"],
    application: { mode: "internal" },
  },
};
export const leasingDate = DEMO_DATE;
export const displayDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
export function leasingHref(
  kind: "apply" | "tour",
  property?: Property,
  unit?: Unit,
  floorPlanId?: string,
) {
  const params = new URLSearchParams();
  if (property) params.set("property", property.slug);
  if (unit) params.set("unit", unit.id);
  if (floorPlanId) params.set("floorPlan", floorPlanId);
  return `/${kind}${params.size ? `?${params}` : ""}`;
}
export function externalApplicationUrl(
  provider: ApplicationProvider,
): string | null {
  if (provider.mode !== "external") return null;
  const url = new URL(provider.url);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Application providers require a secure HTTPS URL.");
  return url.href;
}
export type SearchFilters = {
  query: string;
  beds: string;
  baths: string;
  minRent: string;
  maxRent: string;
  availability: string;
  amenities: string[];
};
export const emptyFilters: SearchFilters = {
  query: "",
  beds: "all",
  baths: "all",
  minRent: "",
  maxRent: "",
  availability: "available",
  amenities: [],
};
export function matchingUnits(property: Property, filters: SearchFilters) {
  return units.filter((unit) => {
    const plan = floorPlans.find((p) => p.id === unit.floor_plan_id)!;
    return (
      unit.property_id === property.id &&
      (filters.beds === "all" || plan.bedrooms === Number(filters.beds)) &&
      (filters.baths === "all" || plan.bathrooms >= Number(filters.baths)) &&
      (!filters.minRent || unit.rent_cents >= Number(filters.minRent) * 100) &&
      (!filters.maxRent || unit.rent_cents <= Number(filters.maxRent) * 100) &&
      (filters.availability === "all" || unit.status === "available") &&
      (filters.availability !== "now" ||
        (!!unit.available_on && unit.available_on <= leasingDate))
    );
  });
}
export function matchingProperties(filters: SearchFilters) {
  return properties.filter(
    (p) =>
      p.published &&
      `${p.name} ${p.neighborhood} ${p.city}`
        .toLowerCase()
        .includes(filters.query.trim().toLowerCase()) &&
      filters.amenities.every((a) => p.amenities.includes(a)) &&
      matchingUnits(p, filters).length > 0,
  );
}

import Link from "next/link";
import { ArrowUpRight, Bath, BedDouble, Square } from "lucide-react";
import { units, money } from "@/lib/demo/data";
import type { FloorPlan, Property } from "@/lib/types";
import { leasingHref } from "@/lib/leasing/catalog";
import { Button } from "@/components/ui/button";

export function FloorPlanCard({
  plan,
  property,
}: {
  plan: FloorPlan;
  property: Property;
}) {
  const apartments = units.filter(
    (u) => u.floor_plan_id === plan.id && u.status === "available",
  );
  return (
    <article className="floor-plan-card">
      <div className="floor-plan-drawing">
        <svg
          viewBox="0 0 320 220"
          role="img"
          aria-label={`Illustrative ${plan.bedrooms || "studio"} bedroom floor plan, not to scale`}
        >
          <rect
            x="28"
            y="18"
            width="264"
            height="184"
            fill="#f9f8f3"
            stroke="#526457"
            strokeWidth="5"
          />
          <path
            d="M182 20v64m0 25v91M30 140h74m25 0h53M184 118h48m23 0h36"
            stroke="#526457"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M35 25h92v20H35zM35 52h20v55H35z"
            fill="#dedfd3"
            stroke="#899080"
          />
          <rect
            x="77"
            y="73"
            width="65"
            height="29"
            rx="3"
            fill="#d3dccf"
            stroke="#879983"
          />
          <path
            d="M82 106h55M70 76v22m78-22v22"
            stroke="#879983"
            strokeWidth="3"
          />
          <rect
            x="203"
            y="29"
            width="64"
            height="65"
            fill="#ece2d4"
            stroke="#b4a591"
          />
          <rect
            x="208"
            y="34"
            width="23"
            height="15"
            fill="white"
            stroke="#b4a591"
          />
          <rect
            x="239"
            y="34"
            width="23"
            height="15"
            fill="white"
            stroke="#b4a591"
          />
          <rect
            x="249"
            y="136"
            width="29"
            height="51"
            rx="8"
            fill="#dfe7e5"
            stroke="#83958d"
          />
          {plan.bedrooms === 2 && (
            <>
              <path d="M105 143v58" stroke="#526457" strokeWidth="4" />
              <rect
                x="43"
                y="154"
                width="49"
                height="34"
                fill="#ece2d4"
                stroke="#b4a591"
              />
            </>
          )}
          <path d="M57 18h87m148 14v61" stroke="#abc5c3" strokeWidth="6" />
          <text x="93" y="124" textAnchor="middle" fontSize="9" fill="#465448">
            LIVING / KITCHEN
          </text>
          <text x="236" y="108" textAnchor="middle" fontSize="9" fill="#465448">
            {plan.bedrooms ? "BEDROOM" : "SLEEPING AREA"}
          </text>
          <text x="209" y="167" fontSize="9" fill="#465448">
            BATH
          </text>
          <text x="123" y="176" fontSize="9" fill="#465448">
            ENTRY
          </text>
        </svg>
        <span>Illustrative layout · Not to scale</span>
      </div>
      <div className="floor-plan-info">
        <div>
          <p className="eyebrow">{apartments.length} available</p>
          <h3>{plan.name}</h3>
        </div>
        <p>
          From{" "}
          <strong>
            {money(
              Math.min(
                ...(apartments.length
                  ? apartments
                  : units.filter((u) => u.floor_plan_id === plan.id)
                ).map((u) => u.rent_cents),
              ),
            )}
          </strong>{" "}
          /mo
        </p>
        <div className="unit-specs">
          <span>
            <BedDouble size={15} />
            {plan.bedrooms ? `${plan.bedrooms} bed` : "Studio"}
          </span>
          <span>
            <Bath size={15} />
            {plan.bathrooms} bath
          </span>
          <span>
            <Square size={14} />
            {plan.sqft} sqft
          </span>
        </div>
        <p className="unit-features">
          Open living area · Natural light · In-home laundry
        </p>
        <div className="floor-plan-actions">
          <Button asChild variant="outline">
            <Link href={leasingHref("apply", property, undefined, plan.id)}>
              Apply <ArrowUpRight size={15} />
            </Link>
          </Button>
          <Link href={leasingHref("tour", property, undefined, plan.id)}>
            Schedule a tour
          </Link>
        </div>
      </div>
    </article>
  );
}

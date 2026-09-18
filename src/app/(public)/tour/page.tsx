import { IntakeForm } from "@/components/leasing/intake-form";
export const metadata = { title: "Schedule a tour" };
export default async function TourPage({
  searchParams,
}: {
  searchParams: Promise<{
    property?: string;
    unit?: string;
    floorPlan?: string;
  }>;
}) {
  const query = await searchParams;
  return (
    <IntakeForm
      key={`${query.property}:${query.unit}:${query.floorPlan}`}
      kind="tour"
      initialProperty={query.property}
      initialUnit={query.unit}
      initialPlan={query.floorPlan}
    />
  );
}

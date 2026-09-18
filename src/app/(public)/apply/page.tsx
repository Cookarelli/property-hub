import { IntakeForm } from "@/components/leasing/intake-form";
export const metadata = {
  title: "Start your application inquiry",
  robots: { index: false, follow: true },
};
export default async function ApplyPage({
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
      kind="application"
      initialProperty={query.property}
      initialUnit={query.unit}
      initialPlan={query.floorPlan}
    />
  );
}

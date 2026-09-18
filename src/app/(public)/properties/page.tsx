import { PropertyBrowser } from "@/components/marketplace";
export const metadata = { title: "Our communities" };
export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; beds?: string }>;
}) {
  const params = await searchParams;
  return (
    <section className="public-section listing-page">
      <p className="eyebrow">AUSTIN, TEXAS</p>
      <h1>Apartments in Austin</h1>
      <p className="listing-intro">
        Compare three distinctive communities and find your next home.
      </p>
      <PropertyBrowser initialQuery={params.q} initialBeds={params.beds} />
    </section>
  );
}

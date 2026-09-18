import { AvailabilityBrowser } from "@/components/marketplace";
export const metadata = { title: "Available apartments" };
export default function AvailabilityPage() {
  return (
    <section className="public-section listing-page">
      <p className="eyebrow">ROOM FOR YOUR NEXT CHAPTER</p>
      <h1>Available apartments</h1>
      <p className="listing-intro">
        Explore available studios, one-bedroom, and two-bedroom homes.
      </p>
      <AvailabilityBrowser />
    </section>
  );
}

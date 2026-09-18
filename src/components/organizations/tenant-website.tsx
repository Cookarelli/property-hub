import Image from "next/image";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { organizationTheme } from "@/lib/organizations/branding";
import type { OrganizationCatalog } from "@/lib/organizations/catalog";
import { OrganizationActionForm } from "./action-form";
import { submitOrganizationInquiry } from "@/lib/organizations/onboarding-actions";
import { Button } from "@/components/ui/button";
export function TenantWebsite({
  catalog,
  preview = false,
}: {
  catalog: OrganizationCatalog;
  preview?: boolean;
}) {
  const { organization: o, properties, units } = catalog;
  return (
    <div style={organizationTheme(o)}>
      {preview && (
        <div className="bg-secondary text-secondary-foreground px-6 py-3 text-center text-sm">
          Private preview · Only platform administrators can see this preview.
        </div>
      )}
      <header
        className="public-header flex-wrap gap-4"
        style={{
          height: "auto",
          minHeight: 84,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <Link
          href={`/sites/${o.slug}`}
          className="flex min-w-0 items-center gap-3 font-semibold"
        >
          {o.logo_url && (
            <Image
              unoptimized
              src={o.logo_url}
              alt=""
              width={46}
              height={46}
              className="object-contain"
            />
          )}
          <span>{o.name}</span>
        </Link>
        <nav
          className="flex flex-wrap items-center gap-4 text-sm"
          aria-label="Company website"
        >
          {o.features.property_listings && (
            <a href="#communities">Properties</a>
          )}
          <a href="#contact">Contact</a>
          {o.features.resident_portal && (
            <Link href={`/workspace/${o.id}`}>Resident sign in</Link>
          )}
        </nav>
      </header>
      <main id="main-content">
        <section className="public-section">
          <p className="eyebrow">{o.name}</p>
          <h1 className="mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">
            Find a place that feels like home.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Explore our communities and find the space that fits your next
            chapter.
          </p>
          {o.features.property_listings && (
            <Button asChild className="mt-6">
              <a href="#communities">Browse properties</a>
            </Button>
          )}
        </section>
        {o.features.property_listings && (
          <section id="communities" className="public-section pt-0">
            <h2 className="mb-6 text-2xl">Our communities</h2>
            {properties.length ? (
              <div className="space-y-10">
                {properties.map((p) => (
                  <article key={p.id} className="border-b pb-10">
                    <div className="grid gap-6 lg:grid-cols-2">
                      {p.image && (
                        <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                          <Image
                            unoptimized
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="(max-width:1024px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="text-3xl">{p.name}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {p.address}, {p.city}, {p.state} {p.zip}
                        </p>
                        <p className="mt-5 whitespace-pre-line leading-relaxed">
                          {p.description}
                        </p>
                        <ul className="mt-5 grid grid-cols-2 gap-2 text-sm">
                          {p.amenities.map((a) => (
                            <li key={a}>✓ {a}</li>
                          ))}
                        </ul>
                        <div className="mt-5 space-y-1 text-sm">
                          <p>Leasing office: {p.office_phone}</p>
                          <p>
                            Resident emergency maintenance: {p.emergency_phone}
                          </p>
                          {p.office_hours && <p>{p.office_hours}</p>}
                          {p.office_email && (
                            <a
                              className="block underline"
                              href={`mailto:${p.office_email}`}
                            >
                              {p.office_email}
                            </a>
                          )}
                        </div>
                        {p.photos.length > 0 && (
                          <div className="mt-5 grid grid-cols-3 gap-2">
                            {p.photos.map((url, i) => (
                              <Image
                                key={`${url}-${i}`}
                                unoptimized
                                src={url}
                                alt={`${p.name} photo ${i + 1}`}
                                width={260}
                                height={190}
                                className="aspect-[4/3] w-full object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {o.features.availability && (
                      <div className="mt-6">
                        <h4 className="mb-3 text-lg font-semibold">
                          Available apartments
                        </h4>
                        {units.filter((u) => u.property_id === p.id).length ? (
                          <div className="grid gap-4 md:grid-cols-2">
                            {units
                              .filter((u) => u.property_id === p.id)
                              .map((u) => (
                                <div key={u.id} className="border p-4">
                                  <div className="flex flex-wrap justify-between gap-2">
                                    <strong>
                                      {u.floor_plan} · Unit {u.number}
                                    </strong>
                                    <strong>
                                      ${(u.rent_cents / 100).toLocaleString()}
                                      /month
                                    </strong>
                                  </div>
                                  <p className="mt-2 text-sm">
                                    {u.bedrooms === 0
                                      ? "Studio"
                                      : `${u.bedrooms} bed`}{" "}
                                    · {u.bathrooms} bath ·{" "}
                                    {u.sqft.toLocaleString()} sq ft
                                  </p>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    Available {u.available_on ?? "now"} ·
                                    Deposit $
                                    {(u.deposit_cents / 100).toLocaleString()}
                                  </p>
                                  {u.photos.map((url, i) => (
                                    <Image
                                      key={`${url}-${i}`}
                                      unoptimized
                                      src={url}
                                      width={400}
                                      height={280}
                                      alt={`Unit ${u.number} photo ${i + 1}`}
                                      className="mt-3 aspect-[4/3] w-full object-cover"
                                    />
                                  ))}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            There are no available apartments right now. Contact
                            the leasing office for upcoming availability.
                          </p>
                        )}
                      </div>
                    )}
                    {o.features.lead_capture && (
                      <details className="mt-5 border p-4">
                        <summary className="cursor-pointer py-2 font-medium">
                          Ask about {p.name}
                        </summary>
                        <div className="mt-4 max-w-xl">
                          {preview ? (
                            <p className="text-sm">
                              On the live website, visitors can send their
                              contact details and housing preferences to this
                              property’s leasing team. Submissions are disabled
                              in this preview.
                            </p>
                          ) : (
                            <OrganizationActionForm
                              action={submitOrganizationInquiry.bind(
                                null,
                                o.slug,
                                p.id,
                                randomUUID(),
                              )}
                              submitLabel="Send inquiry"
                              fields={[
                                {
                                  name: "name",
                                  label: "Full name",
                                  required: true,
                                },
                                {
                                  name: "email",
                                  label: "Email",
                                  type: "email",
                                  required: true,
                                },
                                {
                                  name: "phone",
                                  label: "Phone",
                                  required: true,
                                },
                                {
                                  name: "desired_move_in",
                                  label: "Preferred move-in date",
                                  type: "date",
                                },
                                {
                                  name: "message",
                                  label: "Message or interested apartment",
                                  type: "textarea",
                                },
                              ]}
                            />
                          )}
                        </div>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p>Community listings will appear here when available.</p>
            )}
          </section>
        )}
      </main>
      <footer id="contact" className="public-section border-t">
        <h2 className="text-xl">Contact {o.name}</h2>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {o.phone && <a href={`tel:${o.phone}`}>{o.phone}</a>}
          {o.email && <a href={`mailto:${o.email}`}>{o.email}</a>}
          {o.address && <span>{o.address}</span>}
          {o.website && (
            <a href={o.website} rel="noopener noreferrer" target="_blank">
              Company website
            </a>
          )}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Powered by Property Hub
        </p>
      </footer>
    </div>
  );
}

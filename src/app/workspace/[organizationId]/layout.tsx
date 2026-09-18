import { sectionFeatures, featureEnabled } from "@/lib/organizations/features";
import { organizationTheme } from "@/lib/organizations/branding";
import Image from "next/image";
import Link from "next/link";
import { requireMembership } from "@/lib/auth";
import { sections, mayAccessSection } from "@/lib/organizations/policy";
export default async function OrganizationLayout({
  params,
  children,
}: {
  params: Promise<{ organizationId: string }>;
  children: React.ReactNode;
}) {
  const { organization, membership } = await requireMembership(
    (await params).organizationId,
  );
  const root = `/workspace/${organization.id}`;
  const style = organizationTheme(organization);
  return (
    <div style={style}>
      <div
        className="mb-6 flex flex-wrap items-center gap-4 border-b pb-5"
        style={{ borderBottomColor: organization.primary_color }}
      >
        {organization.logo_url && (
          <Image
            src={organization.logo_url}
            alt={`${organization.name} logo`}
            width={48}
            height={48}
            unoptimized
            className="object-contain"
          />
        )}
        <div>
          <p className="font-semibold">{organization.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {membership.role.replaceAll("_", " ")}
          </p>
        </div>
        <Link
          className="ml-auto text-sm underline underline-offset-4"
          href="/workspace"
        >
          Switch organization
        </Link>
      </div>
      <nav
        aria-label="Organization navigation"
        className="mb-6 flex flex-wrap gap-2"
      >
        {[
          "overview",
          ...sections.filter(
            (section) =>
              mayAccessSection(membership.role, section) &&
              (!sectionFeatures[section] ||
                featureEnabled(organization, sectionFeatures[section]!)),
          ),
        ].map((section) => (
          <Link
            key={section}
            className="rounded border bg-secondary text-secondary-foreground px-3 py-2 text-sm capitalize hover:opacity-80 focus-visible:outline-2"
            href={section === "overview" ? root : `${root}/${section}`}
          >
            {section}
          </Link>
        ))}
      </nav>
      {children}
      <footer className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t pt-5 text-sm text-muted-foreground">
        <span>{organization.legal_name || organization.name}</span>
        {organization.phone && <span>{organization.phone}</span>}
        {organization.email && (
          <a href={`mailto:${organization.email}`}>{organization.email}</a>
        )}
        {organization.website && (
          <a
            href={organization.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Company website
          </a>
        )}
        {organization.address && <span>{organization.address}</span>}
      </footer>
    </div>
  );
}

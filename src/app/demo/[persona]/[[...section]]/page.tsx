import { ManagementWorkspace } from "@/components/management/workspace";
import { properties, residents } from "@/lib/demo/data";
import { notFound } from "next/navigation";
import { isPersona, navFor, personas } from "@/lib/navigation";
import { ApplicantPage } from "@/components/personal";
import { ResidentHome } from "@/components/resident/home";
import { ResidentPayments, PayRent } from "@/components/resident/payments";
import {
  ResidentMaintenance,
  NewMaintenanceRequest,
  MaintenanceDetail,
} from "@/components/resident/maintenance";
import {
  ResidentDocuments,
  ResidentAnnouncements,
  ResidentLease,
  ResidentProfile,
  ResidentContact,
} from "@/components/resident/living";
export function generateStaticParams() {
  return personas.flatMap((p) =>
    navFor(p.id).map((section, i) => ({
      persona: p.id,
      section: i === 0 ? [] : [section.toLowerCase()],
    })),
  );
}
export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ persona: string; section?: string[] }>;
  searchParams: Promise<{ saved?: string; subject?: string }>;
}) {
  const { persona, section: segments } = await params;
  if (!isPersona(persona)) notFound();
  if (persona === "resident") {
    const route = (segments ?? []).join("/");
    if (!route || route === "home") return <ResidentHome />;
    if (route === "payments") return <ResidentPayments />;
    if (route === "payments/pay") return <PayRent />;
    if (route === "maintenance") return <ResidentMaintenance />;
    if (route === "maintenance/new") return <NewMaintenanceRequest />;
    if (
      segments?.length === 2 &&
      segments[0] === "maintenance" &&
      /^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(segments[1])
    )
      return (
        <MaintenanceDetail
          id={segments[1]}
          saved={(await searchParams).saved === "1"}
        />
      );
    if (route === "documents") return <ResidentDocuments />;
    if (route === "announcements") return <ResidentAnnouncements />;
    if (route === "lease") return <ResidentLease />;
    if (route === "profile") return <ResidentProfile />;
    if (route === "contact") {
      const query = await searchParams;
      return (
        <ResidentContact key={query.subject} initialSubject={query.subject} />
      );
    }
    notFound();
  }
  const section = segments?.[0] ?? navFor(persona)[0].toLowerCase();
  if (!navFor(persona).some((n) => n.toLowerCase() === section)) notFound();
  if (persona === "applicant") {
    if ((segments?.length ?? 0) > 1) notFound();
    return <ApplicantPage section={section} />;
  }
  if ((segments?.length ?? 0) > 1) {
    if ((segments?.length ?? 0) > 3) notFound();
    if (section === "properties") {
      if (!properties.some((p) => p.slug === segments![1])) notFound();
      const allowed =
        persona === "maintenance"
          ? ["overview", "units", "maintenance", "announcements"]
          : [
              "overview",
              "units",
              "residents",
              "maintenance",
              "applications",
              "documents",
              "announcements",
            ];
      if (segments?.[2] && !allowed.includes(segments[2])) notFound();
    } else if (section === "residents" && persona !== "maintenance") {
      if (!residents.some((r) => r.id === segments![1])) notFound();
      if (
        segments?.[2] &&
        !["profile", "lease", "payments", "maintenance", "documents"].includes(
          segments[2],
        )
      )
        notFound();
    } else notFound();
  }
  return <ManagementWorkspace persona={persona} segments={segments ?? []} />;
}

"use client";
import { PortfolioDashboard, ActivityFeed } from "./dashboard";
import {
  PortfolioProperties,
  ManagementUnits,
  ManagementResidents,
  PropertyDetail,
  ResidentDetail,
} from "./records";
import { ManagementQueue } from "./repairs";
import { ManagementLeads, ManagementApplications } from "./leasing";
import { ManagementDocuments, ManagementAnnouncements } from "./communications";
import { ManagementHeading } from "./common";
import { SettingsPage } from "@/components/management";
import { useDemoState } from "@/lib/demo/store";
import { getMaintenance } from "@/lib/demo/selectors";
import type { Persona } from "@/lib/types";
import { demoStory } from "@/lib/demo/story";
import { roleCapabilities } from "@/lib/management/access";
export function ManagementWorkspace({
  persona,
  segments,
}: {
  persona: Persona;
  segments: string[];
}) {
  const { hydrated, state } = useDemoState();
  const capabilities =
    roleCapabilities[
      persona === "property-manager" ? "property_manager" : persona
    ];
  if (!hydrated)
    return (
      <p role="status" className="m-loading">
        Loading your workspace…
      </p>
    );
  const [section = "dashboard", id, tab] = segments;
  if (section === "properties" && id)
    return <PropertyDetail persona={persona} slug={id} tab={tab} />;
  if (section === "residents" && id)
    return <ResidentDetail persona={persona} id={id} tab={tab} />;
  if (section === "dashboard" && persona === "maintenance") {
    const rows = getMaintenance(state).filter(
      (request) => request.assigned_to === demoStory.maintenanceUserId,
    );
    return (
      <>
        <ManagementHeading
          title="Ready for the day, Marcus."
          description="Review assignments, plan visits, and keep residents informed."
        />
        <div className="m-maintenance-summary">
          <span>
            <strong>
              {rows.filter((r) => r.status !== "completed").length}
            </strong>
            Your active assignments
          </span>
          <span>
            <strong>
              {rows.filter((r) => r.status === "scheduled").length}
            </strong>
            Scheduled visits
          </span>
          <span>
            <strong>
              {
                rows.filter(
                  (r) => r.priority === "urgent" && r.status !== "completed",
                ).length
              }
            </strong>
            Urgent repairs
          </span>
        </div>
        <ManagementQueue persona={persona} embedded />
      </>
    );
  }
  if (
    (section === "dashboard" || section === "analytics") &&
    capabilities.finance
  )
    return (
      <PortfolioDashboard
        persona={persona}
        analytics={section === "analytics"}
      />
    );
  if (section === "properties")
    return <PortfolioProperties persona={persona} />;
  if (section === "units") return <ManagementUnits persona={persona} />;
  if (section === "residents") return <ManagementResidents persona={persona} />;
  if (section === "leads" && capabilities.manageLeasing)
    return <ManagementLeads />;
  if (section === "applications" && capabilities.manageLeasing)
    return <ManagementApplications />;
  if (section === "maintenance" && capabilities.workMaintenance)
    return <ManagementQueue persona={persona} />;
  if (section === "announcements")
    return (
      <ManagementAnnouncements readOnly={!capabilities.manageAnnouncements} />
    );
  if (section === "documents" && capabilities.manageDocuments)
    return <ManagementDocuments />;
  if (section === "activity")
    return (
      <>
        <ManagementHeading
          title="Activity"
          description="Important actions across your demo portfolio."
        />
        <ActivityFeed persona={persona} full />
      </>
    );
  return (
    <SettingsPage
      profile={section === "profile"}
      maintenance={persona === "maintenance"}
    />
  );
}

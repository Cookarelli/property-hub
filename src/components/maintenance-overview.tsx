"use client";
import { CheckCircle2, Clock3, Wrench } from "lucide-react";
import { PageHeading } from "@/components/shared";
import { MaintenanceBoard, StatCard } from "@/components/management";
import { getMaintenance } from "@/lib/demo/selectors";
import { useDemoState } from "@/lib/demo/store";
export function MaintenanceOverview() {
  const { state } = useDemoState();
  const requests = getMaintenance(state);
  return (
    <>
      <PageHeading
        eyebrow="THURSDAY, SEPTEMBER 17, 2026"
        title="Let’s keep things running, Marcus."
        description="Your maintenance queue across three communities."
      />
      <div className="stats-grid">
        <StatCard
          label="Open requests"
          value={String(requests.filter((r) => r.status === "open").length)}
          detail="Ready for your team to review"
          icon={Wrench}
        />
        <StatCard
          label="In progress"
          value={String(
            requests.filter((r) => r.status === "in_progress").length,
          )}
          detail="Work already underway"
          icon={Clock3}
        />
        <StatCard
          label="Completed"
          value={String(
            requests.filter((r) => r.status === "completed").length,
          )}
          detail="Repairs marked complete"
          icon={CheckCircle2}
        />
        <StatCard
          label="Urgent"
          value={String(
            requests.filter(
              (r) => r.priority === "urgent" && r.status !== "completed",
            ).length,
          )}
          detail="Prioritize these requests"
          icon={Wrench}
        />
      </div>
      <MaintenanceBoard />
    </>
  );
}

import { maintenanceRequests } from "./data";
import type { DemoState } from "./store";
import type { MaintenanceRequest } from "@/lib/types";
export function getMaintenance(state: DemoState): MaintenanceRequest[] {
  const added: MaintenanceRequest[] = (state.tickets ?? []).map((ticket) => ({
    ...maintenanceRequests[0],
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    permission_to_enter: ticket.permission,
    assigned_to: null,
    status: "open",
    created_at:
      state.requestDetails?.[ticket.id]?.createdAt ??
      maintenanceRequests[0].created_at,
  }));
  return [...added, ...maintenanceRequests].map((request) => ({
    ...request,
    status: state.maintenanceStatuses?.[request.id] ?? request.status,
    assigned_to:
      state.maintenanceAssignments && request.id in state.maintenanceAssignments
        ? state.maintenanceAssignments[request.id]
        : request.assigned_to,
  }));
}

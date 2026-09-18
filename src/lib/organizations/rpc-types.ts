import type { Json } from "@/lib/database.types";
export type OnboardingRpc = {
  organization_onboarding_gaps: { Args: { p_org: string }; Returns: string[] };
  configure_organization_unit: {
    Args: {
      p_org: string;
      p_property: string;
      p_unit: string | null;
      p_data: Json;
    };
    Returns: string;
  };
  organization_catalog: {
    Args: { p_slug: string; p_preview?: boolean };
    Returns: Json;
  };
  accept_organization_invitation: { Args: { p_hash: string }; Returns: string };
  capture_organization_lead: {
    Args: {
      p_slug: string;
      p_property: string;
      p_request: string;
      p_payload: Json;
    };
    Returns: string;
  };
};

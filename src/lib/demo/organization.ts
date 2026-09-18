import { planFeatures } from "../organizations/features";
// Fictional tenant configuration belongs to the demo fixture, never to a
// production component or authorization fallback.
export const demoOrganizationBranding = {
  name: "Alder & Stone Living",
  slug: "alder-stone",
  legal_name: "Alder & Stone Living",
  phone: "(512) 555-0142",
  email: "residents@alderandstone.example",
  website: "https://alder-stone.propertyhub.example",
  logo_url: null,
  primary_color: "#284f40",
  secondary_color: "#edf2ed",
  address: "1840 Mercer Avenue, Austin, TX 78704",
  status: "active",
  plan: "portfolio",
  features: planFeatures("portfolio"),
  subscription_status: "trial",
};
export const demoOrganizationContacts = {
  emergency_phone: "(512) 555-0199",
  maintenance_phone: "512-555-0188",
  manager_phone: "512-555-0100",
};

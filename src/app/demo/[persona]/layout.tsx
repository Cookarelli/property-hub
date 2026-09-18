import { notFound } from "next/navigation";
import { isPersona } from "@/lib/navigation";
import { DemoShell } from "@/components/demo-shell";
export default async function PersonaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ persona: string }>;
}) {
  const { persona } = await params;
  if (!isPersona(persona)) notFound();
  return <DemoShell persona={persona}>{children}</DemoShell>;
}

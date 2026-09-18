import type { Metadata } from "next";
import { DemoLauncher } from "@/components/demo/launcher";
export const metadata: Metadata = { title: "Explore the Property Hub demo" };
export default function DemoPage() {
  return <DemoLauncher />;
}

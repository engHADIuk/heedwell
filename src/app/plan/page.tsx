import type { Metadata } from "next";
import { PlanView } from "@/components/PlanView";

export const metadata: Metadata = { title: "This week's plan" };

export default function PlanPage() {
  return <PlanView />;
}

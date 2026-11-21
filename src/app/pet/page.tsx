import type { Metadata } from "next";
import { PetWizard } from "@/components/PetWizard";

export const metadata: Metadata = { title: "Your pet" };

export default function PetPage() {
  return <PetWizard />;
}

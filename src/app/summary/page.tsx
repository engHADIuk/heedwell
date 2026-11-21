import type { Metadata } from "next";
import { Suspense } from "react";
import { SummaryView } from "@/components/SummaryView";

export const metadata: Metadata = { title: "Vet summary" };

export default function SummaryPage() {
  return (
    <Suspense
      fallback={
        <main id="main" className="wrap narrow" aria-busy="true">
          <div className="skeleton skeleton--wizard" />
        </main>
      }
    >
      <SummaryView />
    </Suspense>
  );
}

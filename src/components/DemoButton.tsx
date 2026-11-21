"use client";

import { useRouter } from "next/navigation";
import { save } from "@/lib/client/store";
import { DEMO_POSTCODE, DEMO_PROFILE } from "@/lib/profile";

/** Loads a ready-made pet (Biscuit, a cocker spaniel in Hook, Hampshire) so the plan can be seen straight away. */
export function DemoButton({ className = "btn btn-ghost", children = "See an example week" }: { className?: string; children?: React.ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        save({ postcode: DEMO_POSTCODE, profile: DEMO_PROFILE, skipped: false });
        router.push("/plan");
      }}
    >
      {children}
    </button>
  );
}

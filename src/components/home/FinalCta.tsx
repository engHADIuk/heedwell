"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { save, useSaved } from "@/lib/client/store";
import { DemoButton } from "../DemoButton";
import { PostcodeForm } from "../PostcodeForm";

export function FinalCta() {
  const router = useRouter();
  const saved = useSaved();
  return (
    <section className="band band--tight" aria-labelledby="cta-title">
      <div className="wrap">
        <div className="cta glass glass--onphoto">
          <div className="cta__copy">
            <h2 id="cta-title" className="cta__title">
              Ready to see this week?
            </h2>
            <p>It takes about a minute, there&apos;s nothing to sign up for, and you can skip any question.</p>
          </div>
          <div className="cta__form">
            <PostcodeForm
              tone="dark"
              submitLabel="Plan the week"
              initial={saved.postcode ?? ""}
              key={saved.ready ? "ready" : "loading"}
              onSubmit={(pc) => {
                save({ postcode: pc });
                router.push(saved.profile || saved.skipped ? "/plan" : "/pet");
              }}
            />
            <p className="cta__alt">
              <DemoButton className="link-light">See an example week</DemoButton>
              <span aria-hidden="true"> · </span>
              <Link href="/how-it-works" className="link-light">
                How the scores work
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="wrap narrow plan-empty">
      <div className="glass panel panel--center">
        <span className="step__icon step__icon--lg">
          <Compass size={28} strokeWidth={1.4} aria-hidden="true" />
        </span>
        <h1 className="page-title">That page doesn&apos;t exist</h1>
        <p className="lead">The link may be old or mistyped. Your plan is one click away.</p>
        <div className="panel__actions">
          <Link href="/plan" className="btn btn-primary">
            Go to this week&apos;s plan
          </Link>
          <Link href="/" className="btn btn-ghost">
            Back to the start
          </Link>
        </div>
      </div>
    </main>
  );
}

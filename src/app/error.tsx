"use client";

import { RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="wrap narrow plan-empty">
      <div className="glass panel panel--center" role="alert">
        <span className="step__icon step__icon--lg">
          <RefreshCw size={28} strokeWidth={1.4} aria-hidden="true" />
        </span>
        <h1 className="page-title">Something went wrong</h1>
        <p className="lead">Nothing you entered has been lost. Try loading the page again.</p>
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}

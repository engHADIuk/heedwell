"use client";

import { MapPin } from "lucide-react";
import { useId, useState } from "react";
import { parsePostcode } from "@/lib/weather/postcode";

export function PostcodeForm({
  initial = "",
  submitLabel,
  onSubmit,
  tone = "light",
  autoFocus = false,
  hint = "We use it to look up your local weather. We don't keep it.",
}: {
  initial?: string;
  submitLabel: string;
  onSubmit: (postcode: string) => void;
  tone?: "light" | "dark";
  autoFocus?: boolean;
  hint?: string;
}) {
  const id = useId();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parsePostcode(value);
    if (!parsed) {
      setError("That doesn't look like a UK postcode. Try something like RG27 9XA.");
      return;
    }
    setError(null);
    onSubmit(parsed.value);
  }

  return (
    <form onSubmit={submit} noValidate className={`postcode postcode--${tone}`}>
      <label htmlFor={id} className="postcode__label">
        Your postcode
      </label>
      <div className="postcode__row">
        <div className="postcode__field">
          <MapPin size={20} strokeWidth={1.5} aria-hidden="true" />
          <input
            id={id}
            name="postcode"
            type="text"
            inputMode="text"
            autoComplete="postal-code"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="RG27 9XA"
            value={value}
            autoFocus={autoFocus}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-help`}
          />
        </div>
        <button type="submit" className={tone === "dark" ? "btn btn-mint" : "btn btn-primary"}>
          {submitLabel}
        </button>
      </div>
      <p id={`${id}-help`} className={error ? "postcode__help postcode__help--error" : "postcode__help"} role={error ? "alert" : undefined}>
        {error ?? hint}
      </p>
    </form>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { PHOTOS, type PhotoKey } from "@/lib/photos";

/**
 * A real photograph with a gradient behind it. If the file is missing (for example before
 * `npm run photos` has run) the gradient shows instead, so the layout never breaks.
 */
export function Photo({
  name,
  className = "",
  decorative = false,
  priority = false,
  sizes = "(min-width: 900px) 50vw, 100vw",
}: {
  name: PhotoKey;
  className?: string;
  decorative?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const info = PHOTOS[name];
  return (
    <div className={`photo ${className}`} data-photo={name}>
      {!failed && (
        <Image
          src={`/images/${name}.jpg`}
          alt={decorative ? "" : info.alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          style={{ objectFit: "cover", objectPosition: info.position ?? "50% 50%" }}
          onError={() => setFailed(true)}
          ref={(el) => {
            if (el && el.complete && el.naturalWidth === 0) setFailed(true);
          }}
        />
      )}
    </div>
  );
}

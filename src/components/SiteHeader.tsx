"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LINKS } from "@/lib/copy";
import { useSaved } from "@/lib/client/store";
import { BrandMark } from "./ui";

export function SiteHeader() {
  const path = usePathname();
  const { profile } = useSaved();
  return (
    <header className="site-header">
      <div className="site-header__bar glass">
        <Link href="/" className="brand" aria-label="Heedwell, home">
          <BrandMark size={38} />
          <span className="brand__name">Heedwell</span>
        </Link>
        <nav aria-label="Main" className="site-nav">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={path === l.href ? "page" : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {profile && (
          <Link href="/pet" className="pet-chip" aria-label={`${profile.name}'s details`}>
            <span className="pet-chip__avatar" aria-hidden="true">
              {profile.name.charAt(0).toUpperCase()}
            </span>
            <span className="pet-chip__name">{profile.name}</span>
          </Link>
        )}
      </div>
    </header>
  );
}

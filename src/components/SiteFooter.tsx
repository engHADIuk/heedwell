import Link from "next/link";
import { BRAND, LINKS } from "@/lib/copy";
import { BrandMark } from "./ui";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__grid">
        <div className="site-footer__about">
          <p className="site-footer__brand">
            <BrandMark size={36} />
            {BRAND.name}
          </p>
          <p className="site-footer__tagline">{BRAND.tagline}</p>
          <p className="site-footer__line">{BRAND.disclaimer}</p>
        </div>
        <nav aria-label="Footer" className="site-footer__nav">
          <p className="site-footer__head">Explore</p>
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/summary">Vet summary</Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="site-footer__head">Your privacy</p>
          <p className="site-footer__line">Pet details stay on your device. Only your postcode is used to look up weather.</p>
          <p className="site-footer__head site-footer__head--gap">Data</p>
          <p className="site-footer__line">
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
              Weather data by Open-Meteo.com
            </a>{" "}
            (CC BY 4.0). Medicines data from the Veterinary Medicines Directorate (Open Government Licence v3.0).{" "}
            <Link href="/how-it-works#sources">All sources</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

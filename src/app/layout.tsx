import type { Metadata, Viewport } from "next";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/source-sans-3";
import "@/styles/tokens.css";
import "@/styles/glass.css";
import "@/styles/app.css";
import "@/styles/site.css";
import "@/styles/print.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: { default: "Heedwell: your pet's week, planned", template: "%s | Heedwell" },
  description:
    "A weekly parasite protection plan for UK dogs and cats, built from your local weather. Independent concept. Not veterinary advice.",
  applicationName: "Heedwell",
};

export const viewport: Viewport = {
  themeColor: "#0B3C3F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

import type { PhotoKey } from "@/lib/photos";
import { Photo } from "./Photo";

/** The dark gradient band at the top of every reading page. */
export function PageHero({
  title,
  lead,
  photo,
  children,
}: {
  title: string;
  lead: React.ReactNode;
  photo: PhotoKey;
  children?: React.ReactNode;
}) {
  return (
    <section className="pagehero" aria-labelledby="page-title">
      <div className="wrap pagehero__grid">
        <div className="pagehero__copy">
          <h1 id="page-title" className="pagehero__title">
            {title}
          </h1>
          <p className="pagehero__lead">{lead}</p>
          {children && <div className="pagehero__actions">{children}</div>}
        </div>
        <div className="pagehero__visual" aria-hidden="true">
          <Photo name={photo} decorative className="pagehero__photo" sizes="(min-width: 900px) 36vw, 100vw" />
        </div>
      </div>
    </section>
  );
}

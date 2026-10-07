import { TopBar } from "./TopBar";
import { LEGAL } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main>
      <TopBar title={title} />
      <article className="legal">
        <p className="note">Effective {LEGAL.effectiveDate}</p>
        {children}
        <h2>Contact</h2>
        <p>
          Questions or requests: <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
        </p>
      </article>
    </main>
  );
}

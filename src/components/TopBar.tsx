import Link from "next/link";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="topbar">
      <Link href="/" className="back" aria-label="Back">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
          <path d="M15 5 l-7 7 l7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <h1>{title}</h1>
      <span className="back" />
    </header>
  );
}

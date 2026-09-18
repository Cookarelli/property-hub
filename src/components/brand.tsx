import Link from "next/link";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Property Hub home"
      className={`brand ${light ? "brand-light" : ""}`}
    >
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 28 30" fill="none">
          <path
            d="M3 27V10L14 3l11 7v17M9 27V15l5-3 5 3v12M3 27h22"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>
        property<span className="font-normal">hub</span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

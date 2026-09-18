import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
export function ResidentHeading({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <div className="r-heading">
      {back && (
        <Link className="r-back" href={back.href}>
          <ArrowLeft size={16} />
          {back.label}
        </Link>
      )}
      <div>
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
export function ResidentSection({
  title,
  href,
  linkLabel = "View all",
  children,
  className = "",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`r-section ${className}`}>
      <header>
        <h2>{title}</h2>
        {href && (
          <Link href={href}>
            {linkLabel}
            <ArrowUpRight size={15} />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
export function ResidentDemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="r-demo-note">
      <ShieldCheck size={17} />
      <span>{children}</span>
    </p>
  );
}

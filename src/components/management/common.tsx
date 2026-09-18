"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeading, Panel } from "@/components/shared";
import { properties } from "@/lib/demo/data";
export function ManagementHeading({
  title,
  description,
  action,
  embedded = false,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  embedded?: boolean;
}) {
  return embedded ? (
    <div className="m-section-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  ) : (
    <PageHeading title={title} description={description} action={action} />
  );
}
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <label className="m-select" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function PropertyFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FilterSelect
      label="Property"
      value={value}
      onChange={onChange}
      options={[
        { value: "", label: "All properties" },
        ...properties.map((p) => ({ value: p.id, label: p.name })),
      ]}
    />
  );
}
export function SearchBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="m-search">
      <Search size={17} />
      <Input
        aria-label={label}
        placeholder={label + "…"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function ManagementTable({
  headers,
  rows,
  caption,
  empty = "No matching records",
}: {
  headers: string[];
  rows: { id: string; cells: ReactNode[] }[];
  caption: string;
  empty?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setOverflow(element.scrollWidth > element.clientWidth + 1),
    );
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [rows.length, headers.length]);
  return (
    <Panel>
      {rows.length ? (
        <>
          {overflow && (
            <p className="m-table-hint" id={hintId}>
              <ArrowLeftRight size={14} aria-hidden="true" /> Scroll across to
              see all columns
            </p>
          )}
          <div
            className="table-scroll m-table"
            ref={scrollRef}
            data-overflow={overflow}
            role="region"
            aria-label={caption}
            aria-describedby={overflow ? hintId : undefined}
            tabIndex={0}
          >
            <table>
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {row.cells.map((cell, i) => (
                      <td key={i}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState
          title={empty}
          description="Adjust the filters or clear your search to see more records."
        />
      )}
    </Panel>
  );
}
export function RecordLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className="m-record-link" href={href}>
      {children}
      <ArrowUpRight size={14} />
    </Link>
  );
}
export function FactList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="m-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function WorkflowStatus({ children }: { children: ReactNode }) {
  return (
    <span
      className="m-workflow-status"
      data-status={String(children).toLowerCase().replaceAll(" ", "-")}
    >
      {children}
    </span>
  );
}
export function DemoSaveNote() {
  return (
    <p className="m-footnote">
      Changes are saved in this demo tab. No messages or live account changes
      are sent.
    </p>
  );
}

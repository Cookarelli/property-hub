"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, Check, FileText, Inbox, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Status({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: string;
}) {
  const name = String(children).toLowerCase();
  const color =
    tone ??
    ([
      "paid",
      "active",
      "available",
      "approved",
      "completed",
      "confirmed",
    ].includes(name)
      ? "green"
      : ["urgent", "overdue", "high", "denied", "lost"].includes(name)
        ? "red"
        : ["pending", "in_progress", "in_review", "turnover"].includes(name)
          ? "amber"
          : "neutral");
  return (
    <span className={`status status-${color}`}>
      <span aria-hidden="true" />
      {String(children).replaceAll("_", " ")}
    </span>
  );
}
export function EmptyState({
  title = "Nothing here yet",
  description = "New items will appear here when they are added.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={30} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Success({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="success-message">
      <Check size={17} aria-hidden="true" />
      {children}
    </p>
  );
}
export function DetailDialog({
  title,
  description,
  trigger,
  children,
}: {
  title: string;
  description: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function DocumentButton({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <DetailDialog
      title={title}
      description="Fictional demo document"
      trigger={
        <button className="document-link">
          <FileText size={19} aria-hidden="true" />
          <span>{title}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      }
    >
      <pre className="document-preview">{content}</pre>
      <Button
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob([content], { type: "text/plain;charset=utf-8" }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      >
        Download demo document
      </Button>
    </DetailDialog>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-link" href={href}>
      {children}
      <ArrowRight size={15} aria-hidden="true" />
    </Link>
  );
}
export function DemoNotice() {
  const [open, setOpen] = useState(true);
  return open ? (
    <div className="inline-notice">
      <p>
        <strong>A safe space to explore.</strong> Everything here is fictional.
        Changes last for this browser tab, and no money moves.
      </p>
      <button
        aria-label="Dismiss demo explanation"
        onClick={() => setOpen(false)}
      >
        <X size={16} />
      </button>
    </div>
  ) : null;
}

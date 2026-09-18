"use client";
import Link from "next/link";
import { PhotoField } from "./photo-field";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export type ActionResult = {
  error?: string;
  success?: string;
  href?: string;
  linkLabel?: string;
} | null;
export type FormField = {
  name: string;
  label: string;
  value?: string;
  type?:
    | "text"
    | "email"
    | "url"
    | "color"
    | "number"
    | "date"
    | "textarea"
    | "password";
  uploadOrganizationId?: string;
  step?: string;
  choices?: { value: string; label: string }[];
  required?: boolean;
  options?: string[];
  maxLength?: number;
};
export function OrganizationActionForm({
  action,
  fields,
  submitLabel,
  confirmation,
  children,
}: {
  action: (previous: ActionResult, form: FormData) => Promise<ActionResult>;
  fields: FormField[];
  submitLabel: string;
  confirmation?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [uploads, setUploads] = useState(0);
  const [copied, setCopied] = useState("");
  return (
    <form action={formAction} className="grid gap-4">
      {fields.map((field) =>
        field.uploadOrganizationId ? (
          <fieldset key={field.name} className="grid gap-2 text-sm font-medium">
            <legend className="mb-2">{field.label}</legend>
            <PhotoField
              name={field.name}
              organizationId={field.uploadOrganizationId}
              value={field.value}
              multiple={field.type === "textarea"}
              onBusy={(busy) => setUploads((count) => count + (busy ? 1 : -1))}
            />
          </fieldset>
        ) : (
          <label key={field.name} className="grid gap-2 text-sm font-medium">
            {field.label}
            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                defaultValue={field.value}
                required={field.required}
                rows={4}
                maxLength={field.maxLength ?? 4000}
                className="rounded-md border bg-background p-3 font-normal"
              />
            ) : field.options || field.choices ? (
              <select
                name={field.name}
                defaultValue={field.value}
                className="h-11 w-full rounded-md border bg-background px-3"
              >
                {(
                  field.choices ??
                  field.options?.map((value) => ({
                    value,
                    label: value.replaceAll("_", " "),
                  })) ??
                  []
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                name={field.name}
                defaultValue={field.value}
                type={field.type ?? "text"}
                required={field.required}
                maxLength={field.maxLength ?? 2048}
                step={field.step}
              />
            )}
          </label>
        ),
      )}
      {children}
      {confirmation && (
        <label className="flex items-start gap-3 text-sm">
          <input
            className="mt-1 size-5"
            type="checkbox"
            name="confirmed"
            required
          />
          {confirmation}
        </label>
      )}
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm">
          {state.success}
        </p>
      )}
      {state?.href && (
        <Link className="underline underline-offset-4" href={state.href}>
          {state.linkLabel ?? "Continue"}
        </Link>
      )}
      {state?.href?.startsWith("/invite/") && (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  new URL(state.href!, window.location.origin).href,
                );
                setCopied("Invitation link copied.");
              } catch {
                setCopied(
                  "Use the invitation link’s context menu to copy its address.",
                );
              }
            }}
          >
            Copy invitation link
          </Button>
          <span role="status" className="text-sm">
            {copied}
          </span>
        </>
      )}
      <Button
        disabled={pending || uploads > 0}
        type="submit"
        className="justify-self-start"
      >
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

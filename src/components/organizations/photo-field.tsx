"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { uploadOrganizationPhoto } from "@/lib/organizations/onboarding-actions";
export function PhotoField({
  organizationId,
  name,
  value = "",
  multiple = false,
  onBusy,
}: {
  organizationId: string;
  name: string;
  value?: string;
  multiple?: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const [url, setUrl] = useState(value);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <span className="grid gap-2">
      {multiple ? (
        <textarea
          aria-label={`${name.replaceAll("_", " ")} image addresses`}
          name={name}
          value={url}
          rows={3}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-md border bg-background p-3 font-normal"
        />
      ) : (
        <Input
          aria-label={`${name.replaceAll("_", " ")} image address`}
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      )}
      <Input
        aria-label={`Upload ${name.replaceAll("_", " ")}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={pending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onBusy(true);
          start(async () => {
            try {
              const form = new FormData();
              form.set("photo", file);
              const result = await uploadOrganizationPhoto(
                organizationId,
                form,
              );
              if (result.url) {
                setUrl((old) =>
                  multiple
                    ? [old, result.url].filter(Boolean).join("\n")
                    : result.url!,
                );
                setMessage("Uploaded. Save this form to use the image.");
              } else setMessage(result.error ?? "Upload failed.");
            } catch {
              setMessage("Upload failed. Please try again.");
            } finally {
              onBusy(false);
            }
          });
        }}
      />
      <span role="status" className="text-xs font-normal text-muted-foreground">
        {pending
          ? "Uploading…"
          : message ||
            "Upload an image up to 2 MB, or paste an HTTPS image address."}
      </span>
    </span>
  );
}

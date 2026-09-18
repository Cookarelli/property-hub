"use client";
import { useState, type RefObject } from "react";
import { AlertDialog } from "radix-ui";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoState } from "@/lib/demo/store";

export function DemoResetDialog({
  open,
  onOpenChange,
  onReset,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset?: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const { reset } = useDemoState();
  const [error, setError] = useState("");
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="confirmation-overlay" />
        <AlertDialog.Content
          className="confirmation-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
        >
          <RotateCcw size={24} aria-hidden="true" />
          <AlertDialog.Title>Start a fresh demo?</AlertDialog.Title>
          <AlertDialog.Description>
            This clears this tab’s demo edits, simulated payments, new repairs,
            and guide progress. Saved database records and production accounts
            are unchanged.
          </AlertDialog.Description>
          <p className="confirmation-detail">
            This tab’s changes cannot be recovered after resetting.
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="confirmation-actions">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Keep exploring</Button>
            </AlertDialog.Cancel>
            <Button
              onClick={() => {
                try {
                  reset();
                  setError("");
                  onOpenChange(false);
                  onReset?.();
                } catch {
                  setError(
                    "Your browser couldn’t reset the demo. Please try again.",
                  );
                }
              }}
            >
              Reset this demo
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

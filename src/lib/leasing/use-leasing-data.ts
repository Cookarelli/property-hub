"use client";
import { useCallback, useEffect, useState } from "react";
import type { ApplicationProvider } from "./catalog";
import type { IntakeRecord } from "./validation";
import { useDemoState } from "@/lib/demo/store";
type LeasingData = {
  records: IntakeRecord[];
  providers: Record<string, ApplicationProvider>;
};
export function useLeasingData(refreshOnFocus = false) {
  const { state } = useDemoState();
  const [data, setData] = useState<LeasingData | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => {
    setPending(true);
    setError("");
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/leasing", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return (await response.json()) as LeasingData;
      })
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setPending(false);
          setError("");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPending(false);
          setError(
            "Leasing requests are temporarily unavailable. Please reconnect and try again.",
          );
        }
      });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    if (!refreshOnFocus) return;
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh, refreshOnFocus]);
  const visibleData =
    data && state.demoResetAt
      ? {
          ...data,
          records: data.records.filter(
            (record) =>
              Date.parse(record.created_at) > Date.parse(state.demoResetAt!),
          ),
        }
      : data;
  return { data: visibleData, error, pending, refresh };
}

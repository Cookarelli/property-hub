"use client";
import { useState } from "react";
import {
  featureDefinitions,
  featureNotes,
  featureKeys,
  planFeatures,
  plans,
  type FeatureFlags,
} from "@/lib/organizations/features";
export function FeatureControls({
  initialPlan,
  initialFlags,
}: {
  initialPlan: string;
  initialFlags: FeatureFlags;
}) {
  const [plan, setPlan] = useState(initialPlan);
  const [flags, setFlags] = useState(initialFlags);
  return (
    <>
      <label className="grid gap-2 text-sm font-medium">
        Plan
        <select
          name="plan"
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setFlags(planFeatures(e.target.value));
          }}
          className="h-11 rounded-md border px-3"
        >
          {plans.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-muted-foreground">
        Changing plans loads its feature defaults. Adjust individual features
        before saving. No billing is processed.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {featureKeys.map((key) => (
          <label
            key={key}
            className="flex items-start gap-3 border-b py-3 text-sm"
          >
            <input
              type="checkbox"
              name={key}
              checked={flags[key] && featureDefinitions[key].available}
              disabled={!featureDefinitions[key].available}
              onChange={(e) =>
                setFlags((old) => ({ ...old, [key]: e.target.checked }))
              }
              className="mt-0.5 size-5"
            />
            <span>
              {featureDefinitions[key].label}
              {featureNotes[key] && (
                <span className="block text-xs text-muted-foreground">
                  {featureNotes[key]}
                </span>
              )}
              {!featureDefinitions[key].available && (
                <span className="block text-xs text-muted-foreground">
                  Integration not yet available
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </>
  );
}

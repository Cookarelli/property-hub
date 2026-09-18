import { Skeleton } from "@/components/ui/skeleton";
export function LoadingState({
  label = "Loading your workspace…",
}: {
  label?: string;
}) {
  return (
    <div className="loading-state" role="status" aria-label={label}>
      <p>{label}</p>
      <div aria-hidden="true">
        <Skeleton className="h-8 w-48 max-w-full mb-3" />
        <Skeleton className="h-4 w-72 max-w-full mb-8" />
        <div className="loading-state-grid">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-52 mt-5" />
      </div>
    </div>
  );
}

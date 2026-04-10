import { KpiSkeleton, CardSkeleton, TableSkeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <TableSkeleton rows={6} />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

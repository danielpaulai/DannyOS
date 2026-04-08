import { db } from "@/lib/db";
import { Card } from "@/components/card";
import { ScheduleToggle } from "@/components/schedule-toggle";
import { format, formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const jobs = await db.scheduledJob.findMany({
    orderBy: { nextRunAt: "asc" },
    include: { agent: { select: { name: true, slug: true } } },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scheduled Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cron schedules for all agent jobs
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Job</th>
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 font-medium">Schedule</th>
                <th className="pb-2 font-medium">Timezone</th>
                <th className="pb-2 font-medium">Last Run</th>
                <th className="pb-2 font-medium">Next Run</th>
                <th className="pb-2 font-medium">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 font-medium">{job.name}</td>
                  <td className="py-3 text-muted-foreground">
                    {job.agent.name}
                  </td>
                  <td className="py-3 font-mono text-xs">{job.cron}</td>
                  <td className="py-3 text-muted-foreground text-xs">
                    {job.timezone}
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">
                    {job.lastRunAt
                      ? formatDistanceToNow(job.lastRunAt, { addSuffix: true })
                      : "Never"}
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">
                    {job.nextRunAt
                      ? format(job.nextRunAt, "MMM d, HH:mm")
                      : "—"}
                  </td>
                  <td className="py-3">
                    <ScheduleToggle jobId={job.id} enabled={job.enabled} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground mt-3">
                No scheduled jobs configured
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

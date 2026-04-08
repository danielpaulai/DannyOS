import { db } from "@/lib/db";
import { Card, CardHeader } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { MarkReadButton } from "@/components/mark-read-button";
import { formatDistanceToNow } from "date-fns";
import { Bell, AlertTriangle, Info, AlertOctagon } from "lucide-react";

export const dynamic = "force-dynamic";

const SEVERITY_ICON = {
  info: Info,
  warning: AlertTriangle,
  urgent: AlertOctagon,
} as const;

export default async function AlertsPage() {
  const alerts = await db.alert.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { agent: { select: { name: true } } },
  });

  const unread = alerts.filter((a) => !a.read);
  const read = alerts.filter((a) => a.read);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Notifications from all agents
          </p>
        </div>
        {unread.length > 0 && (
          <MarkReadButton alertIds={unread.map((a) => a.id)} label="Mark all read" />
        )}
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <Card>
          <CardHeader title={`Unread (${unread.length})`} />
          <div className="space-y-2">
            {unread.map((alert) => {
              const Icon = SEVERITY_ICON[alert.severity as keyof typeof SEVERITY_ICON] ?? Info;
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Icon
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      alert.severity === "urgent"
                        ? "text-red-500"
                        : alert.severity === "warning"
                          ? "text-yellow-500"
                          : "text-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <StatusBadge status={alert.severity} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.agent?.name ?? "System"} &middot;{" "}
                      {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <MarkReadButton alertIds={[alert.id]} label="Dismiss" small />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Read/History */}
      <Card>
        <CardHeader title="Alert History" />
        <div className="space-y-2">
          {read.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg opacity-60"
            >
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {alert.agent?.name ?? "System"} &middot;{" "}
                  {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {read.length === 0 && unread.length === 0 && (
            <div className="text-center py-8">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground mt-3">No alerts</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

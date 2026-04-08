import { db } from "@/lib/db";
import { Card } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";
import { SERVICE_DETAILS } from "@/lib/integrations";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const connections = await db.integrationConnection.findMany({
    orderBy: { service: "asc" },
  });

  // Show all expected services, mark missing ones as disconnected
  const allServices = Object.keys(SERVICE_DETAILS);
  const connMap = new Map(connections.map((c) => [c.service, c]));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          External service connections and health status
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {allServices.map((service) => {
          const conn = connMap.get(service);
          const details = SERVICE_DETAILS[service];
          const status = conn?.status ?? "disconnected";

          return (
            <Card key={service}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      status === "connected"
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {details.label.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{details.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {details.description}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {details.priority} priority
                    </p>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Last checked:{" "}
                  {conn?.lastCheck
                    ? formatDistanceToNow(conn.lastCheck, { addSuffix: true })
                    : "Never"}
                </span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Required env: {details.env.join(", ")}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

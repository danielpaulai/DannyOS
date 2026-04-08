import { db } from "@/lib/db";
import { Card, CardHeader } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { ApprovalActions } from "@/components/approval-actions";
import { formatDistanceToNow } from "date-fns";
import { Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const [pending, resolved] = await Promise.all([
    db.approval.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { name: true } } },
    }),
    db.approval.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { decidedAt: "desc" },
      take: 20,
      include: { agent: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Approval Inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve agent actions before they go out
        </p>
      </div>

      {/* Pending */}
      <Card>
        <CardHeader title={`Pending (${pending.length})`} />
        {pending.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mt-3">
              No pending approvals
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((approval) => (
              <div
                key={approval.id}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{approval.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {approval.agent.name} &middot; {approval.type} &middot;{" "}
                      {formatDistanceToNow(approval.createdAt, {
                        addSuffix: true,
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {approval.description}
                    </p>
                  </div>
                  <ApprovalActions approvalId={approval.id} />
                </div>
                {approval.payload && (
                  <details className="mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      View payload
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40 font-mono">
                      {JSON.stringify(approval.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Resolved */}
      <Card>
        <CardHeader title="Recently Resolved" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Decision</th>
                <th className="pb-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2.5 font-medium">{a.title}</td>
                  <td className="py-2.5 text-muted-foreground">
                    {a.agent.name}
                  </td>
                  <td className="py-2.5 text-muted-foreground">{a.type}</td>
                  <td className="py-2.5">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {a.decidedAt
                      ? formatDistanceToNow(a.decidedAt, { addSuffix: true })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resolved.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No resolved approvals yet
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

import { db } from "@/lib/db";
import { Card, CardHeader, KpiCard } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import {
  CalendarCheck2,
  Clock,
  AlertTriangle,
  Flame,
  FileText,
  Inbox,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ApprovalActions } from "@/components/approval-actions";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowEnd = new Date(todayStart.getTime() + 2 * 86400000);

  const [
    pendingApprovals,
    todayMeetings,
    tomorrowMeetings,
    hotDeals,
    staleDeals,
    unreadAlerts,
    recentRuns,
    pendingResearch,
    approvedBriefs,
  ] = await Promise.all([
    db.approval.findMany({
      where: { status: "PENDING" },
      include: { agent: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.meeting.findMany({
      where: {
        scheduledAt: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) },
        status: "scheduled",
      },
      include: { contact: { select: { name: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    db.meeting.findMany({
      where: {
        scheduledAt: {
          gte: new Date(todayStart.getTime() + 86400000),
          lt: tomorrowEnd,
        },
        status: "scheduled",
      },
      include: { contact: { select: { name: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    db.deal.findMany({
      where: {
        stage: { notIn: ["closed-won", "closed-lost"] },
        score: { gte: 75 },
      },
      include: { company: { select: { name: true } } },
      orderBy: { score: "desc" },
      take: 5,
    }),
    db.deal.findMany({
      where: {
        stage: { notIn: ["closed-won", "closed-lost"] },
        updatedAt: { lt: new Date(now.getTime() - 72 * 60 * 60 * 1000) },
      },
      include: { company: { select: { name: true } } },
    }),
    db.alert.findMany({
      where: { read: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.agentRun.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      include: { agent: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.researchBrief.count({ where: { status: "pending" } }),
    db.contentBrief.count({ where: { status: "approved" } }),
  ]);

  const urgentCount =
    pendingApprovals.length + staleDeals.length + unreadAlerts.filter((a) => a.severity === "urgent").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ fontFamily: "'Rethink Sans', sans-serif" }}
          >
            Today
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            {format(now, "EEEE, MMMM d, yyyy")} — what needs your attention
          </p>
        </div>
        <a
          href="/api/briefing?deliver=telegram"
          className="px-4 py-2 rounded-lg bg-[#0a0a0a] text-white text-xs font-semibold hover:bg-[#333333] transition-all"
          style={{ fontFamily: "'Rethink Sans', sans-serif" }}
        >
          Send briefing to Telegram
        </a>
      </div>

      {/* Urgency bar */}
      {urgentCount > 0 && (
        <div className="rounded-xl bg-[#fdf0f3] border border-[#e90d41]/20 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#e90d41] shrink-0" />
          <div>
            <p
              className="text-sm font-semibold text-[#e90d41]"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              {urgentCount} item{urgentCount > 1 ? "s" : ""} need your attention
            </p>
            <p className="text-xs text-[#666666] mt-0.5">
              {pendingApprovals.length > 0 &&
                `${pendingApprovals.length} pending approval${pendingApprovals.length > 1 ? "s" : ""}`}
              {pendingApprovals.length > 0 && staleDeals.length > 0 && " · "}
              {staleDeals.length > 0 &&
                `${staleDeals.length} stale deal${staleDeals.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      )}

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <Card>
              <CardHeader
                title={`Approvals (${pendingApprovals.length})`}
                description="These are blocking agent workflows"
              />
              <div className="space-y-3">
                {pendingApprovals.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[#eaeced]"
                  >
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-[#999999] mt-1">
                        {a.agent.name} · {a.type} ·{" "}
                        {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <ApprovalActions approvalId={a.id} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Today's Meetings */}
          <Card>
            <CardHeader
              title={`Today's Meetings (${todayMeetings.length})`}
              description={todayMeetings.length === 0 ? "No meetings today" : undefined}
            />
            {todayMeetings.length > 0 ? (
              <div className="space-y-3">
                {todayMeetings.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#f5f6f7]">
                    <CalendarCheck2 className="h-4 w-4 text-[#e90d41] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-[#666666] mt-0.5">
                        {format(m.scheduledAt, "h:mm a")} · {m.contact?.name ?? "Unknown contact"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#999999]">Clear calendar today.</p>
            )}

            {tomorrowMeetings.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#eaeced]">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest text-[#999999] mb-3"
                  style={{ fontFamily: "'Rethink Sans', sans-serif" }}
                >
                  Tomorrow
                </p>
                <div className="space-y-2">
                  {tomorrowMeetings.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 text-sm text-[#666666]">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {format(m.scheduledAt, "h:mm a")} — {m.title} ({m.contact?.name ?? "Unknown"})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Stale Deals */}
          {staleDeals.length > 0 && (
            <Card accent>
              <CardHeader
                title={`Stale Deals (${staleDeals.length})`}
                description="No activity in 72+ hours — Closer flagged these"
              />
              <div className="space-y-2">
                {staleDeals.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{d.title}</span>
                      <span className="text-[#999999] ml-2">
                        {d.company?.name}
                      </span>
                    </div>
                    <span className="text-xs text-[#e90d41]">
                      {formatDistanceToNow(d.updatedAt, { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick stats */}
          <Card>
            <CardHeader title="At a Glance" />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#666666]">
                  <Inbox className="h-3.5 w-3.5" />
                  <span>Pending approvals</span>
                </div>
                <span className="font-semibold">{pendingApprovals.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#666666]">
                  <Flame className="h-3.5 w-3.5" />
                  <span>Hot deals (75+)</span>
                </div>
                <span className="font-semibold">{hotDeals.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#666666]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Stale deals</span>
                </div>
                <span className="font-semibold text-[#e90d41]">{staleDeals.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#666666]">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Briefs ready for Creator</span>
                </div>
                <span className="font-semibold">{approvedBriefs}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#666666]">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Agent runs (24h)</span>
                </div>
                <span className="font-semibold">{recentRuns.length}</span>
              </div>
            </div>
          </Card>

          {/* Hot Deals */}
          {hotDeals.length > 0 && (
            <Card>
              <CardHeader title="Hot Deals" />
              <div className="space-y-3">
                {hotDeals.map((d) => (
                  <div key={d.id} className="flex items-start gap-2">
                    <Flame className="h-4 w-4 text-[#e90d41] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-[#999999]">
                        Score {d.score} · {d.nextAction ?? "No action set"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Unread Alerts */}
          {unreadAlerts.length > 0 && (
            <Card>
              <CardHeader
                title="Alerts"
                action={
                  <Link href="/alerts" className="text-xs text-[#e90d41] hover:underline">
                    View all
                  </Link>
                }
              />
              <div className="space-y-2">
                {unreadAlerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <AlertTriangle
                      className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                        a.severity === "urgent" ? "text-[#e90d41]" : "text-[#999999]"
                      }`}
                    />
                    <p className="text-xs">{a.title}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Agent Activity */}
          <Card>
            <CardHeader title="Recent Agent Activity" />
            <div className="space-y-2">
              {recentRuns.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-[#666666]">{r.agent.name}</span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
              {recentRuns.length === 0 && (
                <p className="text-xs text-[#999999]">No runs in the last 24h</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

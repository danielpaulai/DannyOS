import { db } from "@/lib/db";
import { Card, CardHeader, KpiCard } from "@/components/card";
import { format } from "date-fns";
import { FileText, Mail, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const [meetings, transcriptCount, pendingFollowUps] = await Promise.all([
    db.meeting.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        contact: { select: { name: true, email: true } },
        transcript: true,
      },
      take: 20,
    }),
    db.transcript.count(),
    db.approval.count({
      where: {
        status: "PENDING",
        OR: [{ type: "follow-up-draft" }, { type: "send-email" }],
      },
    }),
  ]);

  const completedMeetings = meetings.filter((meeting) => meeting.status === "completed");
  const meetingsWithTranscripts = meetings.filter((meeting) => meeting.transcript);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meetings Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transcript intake, summaries, action items, and follow-up readiness
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Completed Meetings"
          value={completedMeetings.length}
          sub="recently tracked"
          trend="up"
        />
        <KpiCard
          label="Transcripts"
          value={transcriptCount}
          sub={`${meetingsWithTranscripts.length} attached to recent meetings`}
          trend="up"
        />
        <KpiCard
          label="Pending Follow-Ups"
          value={pendingFollowUps}
          sub="waiting approval or draft"
          trend={pendingFollowUps > 0 ? "down" : "neutral"}
        />
        <KpiCard
          label="Coverage"
          value={`${completedMeetings.length > 0 ? Math.round((meetingsWithTranscripts.length / completedMeetings.length) * 100) : 0}%`}
          sub="recent meetings with transcripts"
          trend="neutral"
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Meeting Timeline" />
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{meeting.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {meeting.contact?.name ?? "Unknown contact"} ·{" "}
                      {format(meeting.scheduledAt, "MMM d, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {meeting.status}
                  </span>
                </div>

                {meeting.transcript ? (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Scribe Summary
                    </p>
                    <p className="mt-2 text-sm">
                      {meeting.transcript.summary ?? "Transcript attached, summary pending."}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {Array.isArray(meeting.transcript.actionItems)
                        ? `${meeting.transcript.actionItems.length} action items extracted`
                        : "Action items available"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No transcript attached yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Scribe Queue" />
            <div className="space-y-3">
              {meetings
                .filter((meeting) => !meeting.transcript)
                .slice(0, 5)
                .map((meeting) => (
                  <div key={meeting.id} className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Waiting for transcript ingestion
                      </p>
                    </div>
                  </div>
                ))}
              {meetings.every((meeting) => meeting.transcript) && (
                <p className="text-sm text-muted-foreground">No meetings waiting on Scribe.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent Attendees" />
            <div className="space-y-3">
              {meetings.slice(0, 5).map((meeting) => (
                <div key={meeting.id} className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {meeting.contact?.name ?? "Unknown contact"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meeting.contact?.email ?? "No email on file"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Follow-Up Readiness" />
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{pendingFollowUps} pending drafts</p>
                  <p className="text-xs text-muted-foreground">
                    Review these before sending via Gmail or Google Workspace.
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Scribe should always create a summary first, then a follow-up draft, then hand
                client-facing copy into the approval inbox.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

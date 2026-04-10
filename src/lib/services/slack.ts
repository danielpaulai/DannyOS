// Slack service — powers the Pulse agent
// Uses Slack Web API to read channels, detect blockers, and surface important messages

interface SlackMessage {
  ts: string;
  text: string;
  user: string;
  channel: string;
  channelName?: string;
  thread_ts?: string;
  reactions?: { name: string; count: number }[];
}

interface SlackChannel {
  id: string;
  name: string;
  is_member: boolean;
  num_members: number;
}

interface SlackDigest {
  totalMessages: number;
  importantMessages: SlackMessage[];
  blockers: SlackMessage[];
  decisions: SlackMessage[];
  mentions: SlackMessage[];
  channelSummaries: { channel: string; count: number; highlights: string[] }[];
}

const BLOCKER_KEYWORDS = [
  "blocked",
  "blocker",
  "stuck",
  "can't proceed",
  "waiting on",
  "need help",
  "urgent",
  "asap",
  "critical",
  "breaking",
  "down",
  "outage",
];

const DECISION_KEYWORDS = [
  "decided",
  "decision",
  "agreed",
  "let's go with",
  "approved",
  "signed off",
  "greenlight",
  "moving forward with",
  "final call",
];

async function slackApi(
  method: string,
  params: Record<string, string> = {}
): Promise<Record<string, unknown>> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN not set");

  const url = new URL(`https://slack.com/api/${method}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Slack API ${method} failed: ${res.status}`);

  const data = (await res.json()) as Record<string, unknown>;
  if (!data.ok) throw new Error(`Slack API ${method} error: ${data.error}`);

  return data;
}

export async function getJoinedChannels(): Promise<SlackChannel[]> {
  const data = await slackApi("conversations.list", {
    types: "public_channel,private_channel",
    exclude_archived: "true",
    limit: "200",
  });

  const channels = data.channels as SlackChannel[];
  return channels.filter((c) => c.is_member);
}

export async function getChannelHistory(
  channelId: string,
  since?: Date
): Promise<SlackMessage[]> {
  const params: Record<string, string> = {
    channel: channelId,
    limit: "100",
  };

  if (since) {
    params.oldest = String(since.getTime() / 1000);
  }

  const data = await slackApi("conversations.history", params);
  return (data.messages as SlackMessage[]) ?? [];
}

export async function getUserName(userId: string): Promise<string> {
  try {
    const data = await slackApi("users.info", { user: userId });
    const user = data.user as { real_name?: string; name?: string };
    return user.real_name ?? user.name ?? userId;
  } catch {
    return userId;
  }
}

function classifyMessage(
  msg: SlackMessage
): { isBlocker: boolean; isDecision: boolean; isImportant: boolean } {
  const text = msg.text.toLowerCase();

  const isBlocker = BLOCKER_KEYWORDS.some((kw) => text.includes(kw));
  const isDecision = DECISION_KEYWORDS.some((kw) => text.includes(kw));

  // Important if: has reactions, is a blocker/decision, or mentions @channel/@here
  const hasReactions =
    msg.reactions && msg.reactions.some((r) => r.count >= 2);
  const hasBroadcastMention =
    text.includes("<!channel>") || text.includes("<!here>");
  const isImportant =
    isBlocker || isDecision || hasReactions || hasBroadcastMention;

  return { isBlocker, isDecision, isImportant };
}

export async function generateSlackDigest(
  lookbackHours: number = 4
): Promise<SlackDigest> {
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
  const channels = await getJoinedChannels();

  const digest: SlackDigest = {
    totalMessages: 0,
    importantMessages: [],
    blockers: [],
    decisions: [],
    mentions: [],
    channelSummaries: [],
  };

  const botUserId = process.env.SLACK_BOT_USER_ID;

  for (const channel of channels) {
    try {
      const messages = await getChannelHistory(channel.id, since);
      digest.totalMessages += messages.length;

      const highlights: string[] = [];

      for (const msg of messages) {
        const enrichedMsg = { ...msg, channelName: channel.name };
        const { isBlocker, isDecision, isImportant } =
          classifyMessage(enrichedMsg);

        if (isBlocker) {
          digest.blockers.push(enrichedMsg);
          highlights.push(`BLOCKER: ${msg.text.slice(0, 80)}`);
        }
        if (isDecision) {
          digest.decisions.push(enrichedMsg);
          highlights.push(`DECISION: ${msg.text.slice(0, 80)}`);
        }
        if (isImportant) {
          digest.importantMessages.push(enrichedMsg);
        }

        // Check for direct mentions
        if (botUserId && msg.text.includes(`<@${botUserId}>`)) {
          digest.mentions.push(enrichedMsg);
        }
      }

      if (messages.length > 0) {
        digest.channelSummaries.push({
          channel: channel.name,
          count: messages.length,
          highlights,
        });
      }
    } catch (err) {
      console.error(
        `[Pulse] Failed to read #${channel.name}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return digest;
}

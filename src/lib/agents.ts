// Agent definitions — the canonical registry of all agents in the system

export const AGENT_DEFINITIONS = [
  {
    slug: "chief-of-staff",
    name: "Chief of Staff",
    description:
      "Top-level router and morning/evening operator. Summarizes exceptions, routes tasks to specialists, produces daily briefings.",
    role: "router",
    config: {
      inputs: ["all-agent-outputs", "calendar", "slack-digest", "crm-summary"],
      outputs: ["morning-briefing", "evening-recap", "task-routing"],
      approvalRules: { autoApprove: ["briefing"], requireApproval: ["task-routing"] },
      retryPolicy: { maxRetries: 2, backoffMs: 5000 },
      schedule: ["0 7 * * 1-5", "0 18 * * 1-5"], // 7am and 6pm weekdays
    },
  },
  {
    slug: "pulse",
    name: "Pulse",
    description:
      "Monitors Slack channels and pushes only important items into a queue. Detects blockers, decisions, and urgent mentions.",
    role: "monitor",
    config: {
      inputs: ["slack-channels"],
      outputs: ["slack-digest", "urgent-alerts", "blocker-flags"],
      approvalRules: { autoApprove: ["digest"], requireApproval: ["urgent-alert"] },
      retryPolicy: { maxRetries: 3, backoffMs: 10000 },
      schedule: ["*/30 * * * *"], // every 30 min
    },
  },
  {
    slug: "scribe",
    name: "Scribe",
    description:
      "Turns meetings into summaries, action items, and follow-up drafts. Triggered by Sybill webhooks or manual upload.",
    role: "transcriber",
    config: {
      inputs: ["sybill-webhook", "meeting-transcript"],
      outputs: ["meeting-summary", "action-items", "follow-up-draft"],
      approvalRules: { autoApprove: ["summary"], requireApproval: ["follow-up-draft"] },
      retryPolicy: { maxRetries: 2, backoffMs: 5000 },
      schedule: [], // webhook-triggered
    },
  },
  {
    slug: "closer",
    name: "Closer",
    description:
      "Watches CRM health, scores deals, drafts follow-ups, and suggests stage changes. Never auto-sends client-facing messages.",
    role: "crm",
    config: {
      inputs: ["highlevel-deals", "meeting-summaries", "email-threads"],
      outputs: ["deal-scores", "follow-up-drafts", "stage-recommendations"],
      approvalRules: {
        autoApprove: ["deal-scores"],
        requireApproval: ["follow-up-draft", "stage-change"],
      },
      retryPolicy: { maxRetries: 2, backoffMs: 5000 },
      schedule: ["0 8 * * 1-5"], // 8am weekdays
    },
  },
  {
    slug: "scout",
    name: "Scout",
    description:
      "Gathers competitor signals from TikTok, Instagram, LinkedIn, and YouTube. Turns findings into content opportunities.",
    role: "research",
    config: {
      inputs: ["apify-social-feeds", "competitor-list"],
      outputs: ["competitor-report", "content-opportunities", "hook-library"],
      approvalRules: { autoApprove: ["report"], requireApproval: [] },
      retryPolicy: { maxRetries: 3, backoffMs: 15000 },
      schedule: ["0 6 * * *"], // 6am daily
    },
  },
  {
    slug: "creator",
    name: "Creator",
    description:
      "Turns approved content ideas into scripts and content packs. Outputs structured scripts with hooks, body, and CTA.",
    role: "content",
    config: {
      inputs: ["approved-content-briefs", "brand-voice", "content-frameworks"],
      outputs: ["scripts", "content-packs"],
      approvalRules: { autoApprove: [], requireApproval: ["script", "content-pack"] },
      retryPolicy: { maxRetries: 2, backoffMs: 5000 },
      schedule: [], // triggered by approved briefs
    },
  },
  {
    slug: "ghost",
    name: "Ghost",
    description:
      "Prepares research briefs before calls or strategy sessions. Pulls company, person, and market intelligence.",
    role: "prep",
    config: {
      inputs: ["calendar-events", "brave-search", "contact-data"],
      outputs: ["research-briefs"],
      approvalRules: { autoApprove: ["research-brief"], requireApproval: [] },
      retryPolicy: { maxRetries: 3, backoffMs: 10000 },
      schedule: [], // triggered by upcoming meetings
    },
  },
  {
    slug: "echo",
    name: "Echo",
    description:
      'Answers "how would Daniel handle this?" from real source material. Shows source citations and confidence scores.',
    role: "memory",
    config: {
      inputs: ["knowledge-chunks", "query"],
      outputs: ["answer", "citations", "confidence-score"],
      approvalRules: { autoApprove: ["answer"], requireApproval: [] },
      retryPolicy: { maxRetries: 1, backoffMs: 3000 },
      schedule: [], // on-demand
    },
  },
] as const;

export type AgentSlug = (typeof AGENT_DEFINITIONS)[number]["slug"];

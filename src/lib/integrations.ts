export const SERVICE_DETAILS: Record<
  string,
  {
    label: string;
    description: string;
    env: string[];
    priority: "core" | "growth" | "advanced";
  }
> = {
  slack: {
    label: "Slack",
    description: "Workspace monitoring and blocker detection for Pulse",
    env: ["SLACK_BOT_TOKEN", "SLACK_APP_TOKEN"],
    priority: "core",
  },
  highlevel: {
    label: "GoHighLevel",
    description: "CRM pipeline, deals, and lead actions for Closer",
    env: ["HIGHLEVEL_API_KEY", "GHL_LOCATION_ID", "GHL_PIPELINE_ID"],
    priority: "core",
  },
  telegram: {
    label: "Telegram",
    description: "Mobile alerts, approvals, and morning briefs",
    env: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
    priority: "core",
  },
  google: {
    label: "Google Workspace",
    description: "Calendar context, Gmail drafts, and meeting prep",
    env: ["GOOGLE_WORKSPACE_ACCOUNT"],
    priority: "core",
  },
  sybill: {
    label: "Sybill",
    description: "Meeting transcript ingestion for Scribe and Echo",
    env: ["SYBILL_WEBHOOK_SECRET"],
    priority: "growth",
  },
  apify: {
    label: "Apify",
    description: "Competitor intelligence and social scraping for Scout",
    env: ["APIFY_API_TOKEN"],
    priority: "growth",
  },
  brave: {
    label: "Brave Search",
    description: "Fresh market and company research for Ghost",
    env: ["BRAVE_API_KEY"],
    priority: "growth",
  },
  anthropic: {
    label: "Anthropic",
    description: "Claude AI for all agent reasoning and intelligence",
    env: ["ANTHROPIC_API_KEY"],
    priority: "core",
  },
  stripe: {
    label: "Stripe",
    description: "Revenue visibility, payments, and customer health",
    env: ["STRIPE_SECRET_KEY"],
    priority: "advanced",
  },
  notion: {
    label: "Notion",
    description: "Tasks, SOPs, and operating docs sync",
    env: ["NOTION_API_KEY", "NOTION_DATABASE_ID"],
    priority: "advanced",
  },
};

export const EXPECTED_ENV_KEYS = [
  "DATABASE_URL",
  "REDIS_URL",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "SLACK_BOT_TOKEN",
  "SLACK_APP_TOKEN",
  "HIGHLEVEL_API_KEY",
  "GHL_LOCATION_ID",
  "GHL_PIPELINE_ID",
  "GOOGLE_WORKSPACE_ACCOUNT",
  "ANTHROPIC_API_KEY",
  "BRAVE_API_KEY",
  "APIFY_API_TOKEN",
  "SYBILL_WEBHOOK_SECRET",
  "STRIPE_SECRET_KEY",
  "NOTION_API_KEY",
  "NOTION_DATABASE_ID",
];

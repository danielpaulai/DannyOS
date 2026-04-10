import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AGENT_DEFINITIONS } from "../src/lib/agents";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...\n");

  // ─── Agents ─────────────────────────────────────────────────────
  for (const def of AGENT_DEFINITIONS) {
    const agent = await prisma.agent.upsert({
      where: { slug: def.slug },
      update: { name: def.name, description: def.description, role: def.role, config: def.config },
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        role: def.role,
        config: def.config,
      },
    });
    console.log(`  Agent: ${agent.name} (${agent.slug})`);

    // Create scheduled jobs from agent config
    const schedules = (def.config as { schedule?: string[] }).schedule ?? [];
    for (let i = 0; i < schedules.length; i++) {
      const cron = schedules[i];
      const jobName = `${def.slug}-schedule-${i + 1}`;
      await prisma.scheduledJob.upsert({
        where: { id: `${def.slug}-job-${i + 1}` },
        update: { cron, agentId: agent.id },
        create: {
          id: `${def.slug}-job-${i + 1}`,
          agentId: agent.id,
          name: jobName,
          cron,
        },
      });
      console.log(`    Schedule: ${jobName} → ${cron}`);
    }
  }

  // ─── Integration Connections ────────────────────────────────────
  const integrations = [
    { service: "slack", name: "Slack" },
    { service: "highlevel", name: "GoHighLevel" },
    { service: "telegram", name: "Telegram" },
    { service: "google", name: "Google Workspace" },
    { service: "sybill", name: "Sybill" },
    { service: "apify", name: "Apify" },
    { service: "brave", name: "Brave Search" },
    { service: "openai", name: "OpenAI" },
    { service: "stripe", name: "Stripe" },
    { service: "notion", name: "Notion" },
  ];

  for (const int of integrations) {
    await prisma.integrationConnection.upsert({
      where: { service: int.service },
      update: {
        status: ["telegram", "slack", "highlevel", "google"].includes(int.service)
          ? "connected"
          : "disconnected",
        lastCheck: new Date(),
      },
      create: {
        service: int.service,
        name: int.name,
        status: ["telegram", "slack", "highlevel", "google"].includes(int.service)
          ? "connected"
          : "disconnected",
        lastCheck: new Date(),
      },
    });
    console.log(`  Integration: ${int.name}`);
  }

  // ─── Sample Data ────────────────────────────────────────────────
  console.log("\nCreating sample data...\n");

  // Sample company + contact + deal
  const company = await prisma.company.upsert({
    where: { domain: "acme.com" },
    update: {},
    create: {
      name: "Acme Corp",
      domain: "acme.com",
      industry: "SaaS",
      size: "50-200",
    },
  });

  const contact = await prisma.contact.upsert({
    where: { email: "jane@acme.com" },
    update: {},
    create: {
      name: "Jane Smith",
      email: "jane@acme.com",
      title: "VP of Marketing",
      companyId: company.id,
      source: "inbound",
      tags: ["decision-maker", "marketing"],
    },
  });

  await prisma.deal.create({
    data: {
      title: "Acme Corp — Content Strategy",
      contactId: contact.id,
      companyId: company.id,
      stage: "proposal",
      value: 15000,
      score: 72,
      nextAction: "Send proposal by Friday",
    },
  });

  const secondCompany = await prisma.company.create({
    data: {
      name: "Northstar Growth",
      domain: "northstargrowth.com",
      industry: "Professional Services",
      size: "10-50",
    },
  });

  const secondContact = await prisma.contact.create({
    data: {
      name: "Marcus Allen",
      email: "marcus@northstargrowth.com",
      title: "Founder",
      companyId: secondCompany.id,
      source: "referral",
      tags: ["founder", "hot-lead"],
    },
  });

  await prisma.deal.createMany({
    data: [
      {
        title: "Northstar Growth — Fractional CMO Pilot",
        contactId: secondContact.id,
        companyId: secondCompany.id,
        stage: "qualified",
        value: 22000,
        score: 88,
        nextAction: "Call today to confirm pilot scope",
      },
      {
        title: "Summit Labs — Advisor Retainer",
        stage: "lead",
        value: 8000,
        score: 41,
        nextAction: "Send intro deck",
      },
    ],
  });

  // Sample meeting
  const meeting = await prisma.meeting.create({
    data: {
      title: "Strategy Call with Jane Smith",
      contactId: contact.id,
      scheduledAt: new Date(Date.now() - 86400000), // yesterday
      duration: 45,
      platform: "zoom",
      status: "completed",
    },
  });

  await prisma.meeting.createMany({
    data: [
      {
        title: "Discovery Call with Marcus Allen",
        contactId: secondContact.id,
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 20),
        duration: 30,
        platform: "google-meet",
        status: "scheduled",
      },
      {
        title: "Internal Content Planning",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 28),
        duration: 45,
        platform: "zoom",
        status: "scheduled",
      },
    ],
  });

  await prisma.transcript.create({
    data: {
      meetingId: meeting.id,
      source: "sybill",
      rawText: "Full transcript would go here...",
      summary: "Discussed content strategy partnership. Jane is interested in a 3-month pilot.",
      actionItems: [
        "Send proposal with pricing options",
        "Schedule follow-up for next Tuesday",
        "Share case studies from similar clients",
      ],
    },
  });

  // Sample content brief
  const brief = await prisma.contentBrief.create({
    data: {
      title: "Why Most Founders Get Content Wrong",
      topic: "content strategy",
      platform: "linkedin",
      angle: "contrarian take on content marketing mistakes",
      hook: "I wasted 6 months on content before I figured this out...",
      source: "scout-finding",
      status: "approved",
    },
  });

  await prisma.script.create({
    data: {
      briefId: brief.id,
      body: "Hook: I wasted 6 months on content before I figured this out...\n\nBody: Most founders think content is about posting consistently. It's not. It's about...\n\nCTA: Follow for more content strategy breakdowns.",
      format: "short-form",
      status: "draft",
    },
  });

  await prisma.contentBrief.createMany({
    data: [
      {
        title: "What Most Fractional CMOs Miss in Week One",
        topic: "fractional cmo onboarding",
        platform: "linkedin",
        angle: "operating-system-first positioning",
        hook: "Most fractional CMOs lose trust in week one for one simple reason.",
        source: "manual",
        status: "idea",
      },
      {
        title: "Behind the Scenes of a Real Sales Follow-Up",
        topic: "sales process",
        platform: "instagram",
        angle: "show the real follow-up logic after discovery calls",
        hook: "Here’s what I actually send after a strong discovery call.",
        source: "scout-finding",
        status: "approved",
      },
    ],
  });

  // Sample research brief
  await prisma.researchBrief.create({
    data: {
      subject: "Acme Corp",
      type: "company",
      requestedBy: "ghost",
      context: "Preparing for strategy call with VP of Marketing",
      findings: {
        funding: "Series B, $40M raised",
        headcount: "~150 employees",
        recentNews: "Launched new product line in Q1 2026",
      },
      sources: ["crunchbase", "linkedin", "company-blog"],
      status: "completed",
    },
  });

  await prisma.researchBrief.createMany({
    data: [
      {
        subject: "Northstar Growth",
        type: "company",
        requestedBy: "ghost",
        context: "Tomorrow's discovery call prep",
        findings: {
          summary: "Founder-led growth shop scaling outbound and content offers.",
        },
        sources: ["linkedin", "website", "brave-search"],
        status: "pending",
      },
      {
        subject: "Fractional CMO market",
        type: "market",
        requestedBy: "manual",
        context: "Refine core positioning for Daniel OS",
        findings: {
          summary: "Demand rising for operator-style strategy partners with execution systems.",
        },
        sources: ["brave-search", "industry-reports"],
        status: "completed",
      },
    ],
  });

  await prisma.knowledgeChunk.createMany({
    data: [
      {
        source: "transcript",
        sourceId: meeting.id,
        content:
          "When a prospect says they need to think, Daniel slows down, clarifies the real decision blocker, and reframes around cost of delay.",
        tags: ["sales", "objections", "decision-making"],
        confidence: 0.91,
      },
      {
        source: "manual",
        content:
          "Daniel prefers short, direct updates with one clear next action. He does not want padded summaries or generic AI phrasing.",
        tags: ["voice", "communication", "chief-of-staff"],
        confidence: 0.96,
      },
      {
        source: "transcript",
        content:
          "In content strategy, Daniel anchors scripts in a sharp hook, one core lesson, one proof point, and one CTA.",
        tags: ["content", "creator", "frameworks"],
        confidence: 0.88,
      },
    ],
  });

  // Sample alerts
  const chiefOfStaff = await prisma.agent.findUnique({ where: { slug: "chief-of-staff" } });
  if (chiefOfStaff) {
    await prisma.alert.createMany({
      data: [
        {
          agentId: chiefOfStaff.id,
          channel: "dashboard",
          severity: "info",
          title: "Morning briefing generated",
          message:
            "Your daily briefing is ready. 3 deals need attention, 2 meetings today, and 1 research brief needs review.",
        },
        {
          agentId: chiefOfStaff.id,
          channel: "dashboard",
          severity: "warning",
          title: "Stale deal detected",
          message: "Deal 'Acme Corp — Content Strategy' has been in proposal stage for 7 days without activity.",
        },
      ],
    });
  }

  // Sample agent runs
  const agents = await prisma.agent.findMany();
  for (const agent of agents.slice(0, 4)) {
    await prisma.agentRun.create({
      data: {
        agentId: agent.id,
        status: "COMPLETED",
        trigger: "cron",
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3590000),
        durationMs: 10000,
        output: { success: true },
      },
    });
  }

  // Sample pending approval
  const closer = await prisma.agent.findUnique({ where: { slug: "closer" } });
  if (closer) {
    const closerRun = await prisma.agentRun.create({
      data: {
        agentId: closer.id,
        status: "WAITING_APPROVAL",
        trigger: "cron",
        startedAt: new Date(),
      },
    });

    await prisma.approval.create({
      data: {
        agentId: closer.id,
        runId: closerRun.id,
        type: "follow-up-draft",
        title: "Send follow-up to Jane Smith",
        description: "Closer drafted a follow-up email about the content strategy proposal.",
        payload: {
          to: "jane@acme.com",
          subject: "Re: Content Strategy Partnership",
          body: "Hi Jane, great speaking with you yesterday. As discussed, I'm attaching the proposal with three pricing options...",
        },
      },
    });
  }

  const scribe = await prisma.agent.findUnique({ where: { slug: "scribe" } });
  if (scribe) {
    await prisma.approval.create({
      data: {
        agentId: scribe.id,
        type: "send-email",
        title: "Approve Marcus Allen meeting follow-up",
        description: "Scribe drafted a follow-up after the discovery call prep sequence.",
        payload: {
          to: "marcus@northstargrowth.com",
          subject: "Tomorrow's discovery call prep",
          body: "Marcus, looking forward to our conversation tomorrow. I pulled together a few notes based on your current positioning and where I think the biggest leverage is.",
        },
      },
    });
  }

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

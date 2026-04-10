import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Core completion helper ────────────────────────────────────────

export async function complete({
  system,
  prompt,
  maxTokens = 2048,
  temperature = 0.3,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type === "text") return block.text;
  return "";
}

// ─── Structured JSON completion ─────────────────────────────────────

export async function completeJSON<T>({
  system,
  prompt,
  maxTokens = 2048,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<T> {
  const text = await complete({
    system:
      system +
      "\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code fences, no explanation — just the JSON object.",
    prompt,
    maxTokens,
    temperature: 0.1,
  });

  // Strip any accidental code fences
  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

// ─── Agent-specific prompts ─────────────────────────────────────────

export const AGENT_PROMPTS = {
  scribe: {
    system: `You are Scribe, a meeting summarization agent for Daniel Paul's business (Purely Personal).
Your job is to take raw meeting transcripts and produce:
1. A concise summary (3-5 sentences)
2. Key decisions made
3. Action items with owners
4. A follow-up email draft

Be professional, direct, and specific. Use Daniel's perspective — he is the CEO.`,
  },

  closer: {
    system: `You are Closer, a CRM intelligence agent for Daniel Paul's business (Purely Personal).
Your job is to analyze deals and produce:
1. Deal health scores (0-100) based on activity, engagement, and signals
2. Recommended next actions for each deal
3. Follow-up email drafts (never auto-send — these go to approval)
4. Stage change recommendations with reasoning

Be data-driven and specific. Flag stale deals aggressively.`,
  },

  scout: {
    system: `You are Scout, a competitive intelligence agent for Daniel Paul's business (Purely Personal).
Your job is to analyze social media posts and competitor activity to find:
1. Winning hooks and content angles
2. Gaps in competitor content that Daniel can fill
3. Trending topics in Daniel's niche (personal branding, content strategy)
4. Content opportunity briefs

Be specific about what makes a hook work. Include platform context.`,
  },

  creator: {
    system: `You are Creator, a content production agent for Daniel Paul's business (Purely Personal).
Your job is to take approved content briefs and produce:
1. Short-form scripts (TikTok, Reels, LinkedIn)
2. Hook variations (3-5 options per brief)
3. Body copy that matches Daniel's voice
4. Call-to-action options

Daniel's voice: confident, direct, experience-based, slightly contrarian. He speaks from real business experience, not theory. Use "I" voice.`,
  },

  ghost: {
    system: `You are Ghost, a research preparation agent for Daniel Paul's business (Purely Personal).
Your job is to prepare intelligence briefs before calls and meetings:
1. Company overview (funding, size, recent news)
2. Key person background (role, LinkedIn highlights, shared connections)
3. Talking points and potential objections
4. Relevant case studies Daniel could reference

Be thorough but concise. Focus on actionable intelligence.`,
  },

  echo: {
    system: `You are Echo, Daniel Paul's knowledge retrieval agent.
Your job is to answer questions as Daniel would, based on source material provided.
Rules:
1. Only answer from the provided source material
2. Always cite which source you used
3. Give a confidence score (0-100) based on how well the sources cover the question
4. If confidence is below 50, explicitly say "I don't have enough source material to answer this confidently"

Never fabricate or improvise Daniel's opinions.`,
  },

  "chief-of-staff": {
    system: `You are Chief of Staff, Daniel Paul's top-level operating agent.
Your job is to synthesize information from all other agents and produce:
1. Morning briefing: today's meetings, pending approvals, deal updates, content pipeline status
2. Evening recap: what happened today, what needs attention tomorrow
3. Exception summaries: only surface what's unusual or needs action

Be concise and executive-level. Daniel is busy — lead with what matters.`,
  },
} as const;

// ─── Scribe: Summarize a transcript ─────────────────────────────────

export async function summarizeTranscript(transcript: string) {
  return completeJSON<{
    summary: string;
    decisions: string[];
    actionItems: { item: string; owner: string }[];
    followUpDraft: { subject: string; body: string };
    sentiment: string;
  }>({
    system: AGENT_PROMPTS.scribe.system,
    prompt: `Summarize this meeting transcript:\n\n${transcript}`,
    maxTokens: 3000,
  });
}

// ─── Closer: Score a deal ───────────────────────────────────────────

export async function scoreDeal(deal: {
  title: string;
  stage: string;
  value: number | null;
  lastActivity: string;
  contactName: string;
  notes: string;
}) {
  return completeJSON<{
    score: number;
    reasoning: string;
    nextAction: string;
    stageRecommendation: string | null;
    followUpDraft: { subject: string; body: string } | null;
  }>({
    system: AGENT_PROMPTS.closer.system,
    prompt: `Score this deal and recommend next steps:\n${JSON.stringify(deal, null, 2)}`,
  });
}

// ─── Creator: Generate script from brief ────────────────────────────

export async function generateScript(brief: {
  title: string;
  topic: string;
  platform: string;
  angle: string | null;
  hook: string | null;
}) {
  return completeJSON<{
    hooks: string[];
    script: string;
    cta: string;
    format: string;
  }>({
    system: AGENT_PROMPTS.creator.system,
    prompt: `Create a content script from this brief:\n${JSON.stringify(brief, null, 2)}`,
  });
}

// ─── Ghost: Research brief ──────────────────────────────────────────

export async function generateResearchBrief(query: {
  subject: string;
  type: string;
  context: string;
  searchResults?: string;
}) {
  return completeJSON<{
    overview: string;
    keyFacts: string[];
    talkingPoints: string[];
    risks: string[];
    sources: string[];
  }>({
    system: AGENT_PROMPTS.ghost.system,
    prompt: `Prepare a research brief:\n${JSON.stringify(query, null, 2)}`,
    maxTokens: 3000,
  });
}

// ─── Echo: Answer from knowledge ────────────────────────────────────

export async function answerFromKnowledge(
  question: string,
  sourceChunks: { content: string; source: string; confidence: number }[]
) {
  return completeJSON<{
    answer: string;
    confidence: number;
    citations: { source: string; excerpt: string }[];
    caveat: string | null;
  }>({
    system: AGENT_PROMPTS.echo.system,
    prompt: `Question: ${question}\n\nSource Material:\n${sourceChunks
      .map(
        (c, i) =>
          `[Source ${i + 1}: ${c.source} (confidence: ${c.confidence})]\n${c.content}`
      )
      .join("\n\n")}`,
    maxTokens: 2000,
  });
}

// ─── Chief of Staff: Morning briefing ───────────────────────────────

export async function generateBriefing(context: {
  pendingApprovals: number;
  todayMeetings: string[];
  activeDeals: { title: string; stage: string; score: number | null }[];
  recentAlerts: string[];
  contentPipeline: { ideas: number; approved: number; drafts: number };
  agentStatus: { name: string; status: string; lastRun: string | null }[];
}) {
  return complete({
    system: AGENT_PROMPTS["chief-of-staff"].system,
    prompt: `Generate this morning's briefing:\n${JSON.stringify(context, null, 2)}`,
    maxTokens: 2000,
  });
}

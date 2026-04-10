// Brave Search service — powers Ghost agent for research briefs

const BRAVE_API = "https://api.search.brave.com/res/v1";

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

interface BraveNewsResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  source: string;
}

export interface SearchResults {
  web: BraveSearchResult[];
  news: BraveNewsResult[];
  query: string;
}

async function braveRequest(
  endpoint: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) throw new Error("BRAVE_API_KEY not set");

  const url = new URL(`${BRAVE_API}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      "X-Subscription-Token": apiKey,
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`Brave Search error: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

// ─── Web search ─────────────────────────────────────────────────────

export async function webSearch(
  query: string,
  count = 10
): Promise<BraveSearchResult[]> {
  const data = await braveRequest("/web/search", {
    q: query,
    count: String(count),
    safesearch: "moderate",
  });

  const results = (data.web as Record<string, unknown>)?.results as
    | Record<string, unknown>[]
    | undefined;

  return (results ?? []).map((r) => ({
    title: (r.title as string) ?? "",
    url: (r.url as string) ?? "",
    description: (r.description as string) ?? "",
    age: r.age as string | undefined,
  }));
}

// ─── News search ────────────────────────────────────────────────────

export async function newsSearch(
  query: string,
  count = 10
): Promise<BraveNewsResult[]> {
  const data = await braveRequest("/news/search", {
    q: query,
    count: String(count),
  });

  const results = (data.results as Record<string, unknown>[]) ?? [];

  return results.map((r) => ({
    title: (r.title as string) ?? "",
    url: (r.url as string) ?? "",
    description: (r.description as string) ?? "",
    age: r.age as string | undefined,
    source: ((r.meta_url as Record<string, string>)?.hostname as string) ?? "",
  }));
}

// ─── Combined search (used by Ghost) ────────────────────────────────

export async function research(query: string): Promise<SearchResults> {
  const [web, news] = await Promise.all([
    webSearch(query, 8),
    newsSearch(query, 5).catch(() => [] as BraveNewsResult[]),
  ]);

  return { web, news, query };
}

// ─── Company research ───────────────────────────────────────────────

export async function researchCompany(companyName: string): Promise<{
  general: SearchResults;
  news: SearchResults;
  funding: SearchResults;
}> {
  const [general, news, funding] = await Promise.all([
    research(`${companyName} company overview`),
    research(`${companyName} recent news 2026`),
    research(`${companyName} funding investors revenue`),
  ]);

  return { general, news, funding };
}

// ─── Person research ────────────────────────────────────────────────

export async function researchPerson(
  name: string,
  company?: string
): Promise<{
  profile: SearchResults;
  content: SearchResults;
}> {
  const companyCtx = company ? ` ${company}` : "";
  const [profile, content] = await Promise.all([
    research(`${name}${companyCtx} LinkedIn background`),
    research(`${name}${companyCtx} articles talks podcast`),
  ]);

  return { profile, content };
}

// ─── Market/topic research ──────────────────────────────────────────

export async function researchMarket(topic: string): Promise<{
  trends: SearchResults;
  reports: SearchResults;
}> {
  const [trends, reports] = await Promise.all([
    research(`${topic} trends 2026`),
    research(`${topic} market report statistics`),
  ]);

  return { trends, reports };
}

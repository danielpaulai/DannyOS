// Apify service — powers Scout agent for competitor monitoring
// Uses Apify actors to scrape social media posts and profiles

const APIFY_API = "https://api.apify.com/v2";

interface ApifyRunResult {
  id: string;
  status: string;
  defaultDatasetId: string;
}

interface SocialPost {
  platform: string;
  author: string;
  text: string;
  url: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  hashtags: string[];
}

async function apifyRequest(
  path: string,
  options: RequestInit = {}
): Promise<Record<string, unknown>> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN not set");

  const url = `${APIFY_API}${path}?token=${token}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!res.ok) throw new Error(`Apify API error: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

// ─── Run an actor and wait for results ──────────────────────────────

async function runActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutSecs = 120
): Promise<unknown[]> {
  // Start the actor run
  const run = (await apifyRequest(`/acts/${actorId}/runs`, {
    method: "POST",
    body: JSON.stringify(input),
  })) as unknown as { data: ApifyRunResult };

  const runId = run.data.id;

  // Poll until complete
  const deadline = Date.now() + timeoutSecs * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));

    const status = (await apifyRequest(
      `/actor-runs/${runId}`
    )) as unknown as { data: ApifyRunResult };

    if (status.data.status === "SUCCEEDED") {
      const dataset = (await apifyRequest(
        `/datasets/${status.data.defaultDatasetId}/items`
      )) as unknown as unknown[];
      return dataset;
    }

    if (status.data.status === "FAILED" || status.data.status === "ABORTED") {
      throw new Error(`Apify actor run ${status.data.status}`);
    }
  }

  throw new Error("Apify actor run timed out");
}

// ─── Instagram Profile Scraper ──────────────────────────────────────

export async function scrapeInstagramProfiles(
  handles: string[]
): Promise<SocialPost[]> {
  const items = await runActor("apify/instagram-profile-scraper", {
    usernames: handles,
    resultsLimit: 10,
  });

  return (items as Record<string, unknown>[]).map((item) => ({
    platform: "instagram",
    author: (item.ownerUsername as string) ?? "",
    text: (item.caption as string) ?? "",
    url: (item.url as string) ?? "",
    likes: (item.likesCount as number) ?? 0,
    comments: (item.commentsCount as number) ?? 0,
    shares: 0,
    timestamp: (item.timestamp as string) ?? "",
    hashtags: (item.hashtags as string[]) ?? [],
  }));
}

// ─── TikTok Profile Scraper ────────────────────────────────────────

export async function scrapeTikTokProfiles(
  handles: string[]
): Promise<SocialPost[]> {
  const items = await runActor("clockworks/free-tiktok-scraper", {
    profiles: handles,
    resultsPerPage: 10,
  });

  return (items as Record<string, unknown>[]).map((item) => ({
    platform: "tiktok",
    author: (item.authorMeta as Record<string, string>)?.name ?? "",
    text: (item.text as string) ?? "",
    url: (item.webVideoUrl as string) ?? "",
    likes: (item.diggCount as number) ?? 0,
    comments: (item.commentCount as number) ?? 0,
    shares: (item.shareCount as number) ?? 0,
    timestamp: (item.createTimeISO as string) ?? "",
    hashtags: ((item.hashtags as Record<string, string>[]) ?? []).map(
      (h) => h.name
    ),
  }));
}

// ─── LinkedIn Post Scraper ──────────────────────────────────────────

export async function scrapeLinkedInPosts(
  urls: string[]
): Promise<SocialPost[]> {
  const items = await runActor("curious_coder/linkedin-post-search-scraper", {
    searchUrls: urls,
    maxResults: 10,
  });

  return (items as Record<string, unknown>[]).map((item) => ({
    platform: "linkedin",
    author: (item.authorName as string) ?? "",
    text: (item.text as string) ?? "",
    url: (item.postUrl as string) ?? "",
    likes: (item.numLikes as number) ?? 0,
    comments: (item.numComments as number) ?? 0,
    shares: (item.numShares as number) ?? 0,
    timestamp: (item.postedAt as string) ?? "",
    hashtags: [],
  }));
}

// ─── Full competitor scan (used by Scout) ───────────────────────────

export interface CompetitorScanResult {
  competitor: string;
  posts: SocialPost[];
  topPost: SocialPost | null;
  avgEngagement: number;
  totalPosts: number;
}

export async function scanCompetitors(
  competitors: {
    name: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
  }[]
): Promise<CompetitorScanResult[]> {
  const results: CompetitorScanResult[] = [];

  for (const comp of competitors) {
    const allPosts: SocialPost[] = [];

    try {
      if (comp.instagram) {
        const posts = await scrapeInstagramProfiles([comp.instagram]);
        allPosts.push(...posts);
      }
    } catch (e) {
      console.error(`[Scout] Instagram scrape failed for ${comp.name}:`, e);
    }

    try {
      if (comp.tiktok) {
        const posts = await scrapeTikTokProfiles([comp.tiktok]);
        allPosts.push(...posts);
      }
    } catch (e) {
      console.error(`[Scout] TikTok scrape failed for ${comp.name}:`, e);
    }

    const totalEngagement = allPosts.reduce(
      (sum, p) => sum + p.likes + p.comments + p.shares,
      0
    );

    const topPost = allPosts.length > 0
      ? allPosts.reduce((best, p) =>
          p.likes + p.comments + p.shares >
          best.likes + best.comments + best.shares
            ? p
            : best
        )
      : null;

    results.push({
      competitor: comp.name,
      posts: allPosts,
      topPost,
      avgEngagement: allPosts.length > 0 ? totalEngagement / allPosts.length : 0,
      totalPosts: allPosts.length,
    });
  }

  return results;
}

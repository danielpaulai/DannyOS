"use client";

import { useEffect } from "react";
import { Card } from "@/components/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  const msg = error.message ?? "";
  const likelyDb =
    /ECONNREFUSED|connect ECONNREFUSED|P1001|database server|PrismaClientInitializationError/i.test(
      msg,
    );

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Card>
        <h1 className="text-lg font-semibold text-foreground">
          Dashboard couldn&apos;t load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {likelyDb
            ? "The app could not reach your database. This usually means Postgres isn’t running, or DATABASE_URL doesn’t match your setup."
            : "Something went wrong while rendering this page."}
        </p>
        {likelyDb && (
          <ul className="mt-4 text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>
              Start local Postgres (see README: <code className="text-xs bg-muted px-1 rounded">docker compose up -d</code>) or fix <code className="text-xs bg-muted px-1 rounded">DATABASE_URL</code> in <code className="text-xs bg-muted px-1 rounded">.env</code>.
            </li>
            <li>
              Then run <code className="text-xs bg-muted px-1 rounded">npm run db:push</code> and{" "}
              <code className="text-xs bg-muted px-1 rounded">npm run db:seed</code>.
            </li>
          </ul>
        )}
        {process.env.NODE_ENV === "development" && msg && (
          <pre className="mt-4 text-xs bg-muted p-3 rounded-lg overflow-auto text-left text-foreground/80 whitespace-pre-wrap">
            {msg}
          </pre>
        )}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 text-sm font-medium text-accent hover:underline"
        >
          Try again
        </button>
      </Card>
    </div>
  );
}

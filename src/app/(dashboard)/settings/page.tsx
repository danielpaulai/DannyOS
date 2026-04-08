import { Card, CardHeader } from "@/components/card";
import { EXPECTED_ENV_KEYS } from "@/lib/integrations";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          System configuration and preferences
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="General" />
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">System Name</label>
              <input
                type="text"
                defaultValue="Daniel OS"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                readOnly
              />
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <input
                type="text"
                defaultValue="America/Chicago"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                readOnly
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Notifications" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Telegram Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Send urgent alerts via Telegram bot
                </p>
              </div>
              <div className="h-5 w-9 rounded-full bg-accent relative">
                <span className="inline-block h-3.5 w-3.5 rounded-full bg-white absolute top-0.5 right-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Approval Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Notify when new approvals are pending
                </p>
              </div>
              <div className="h-5 w-9 rounded-full bg-accent relative">
                <span className="inline-block h-3.5 w-3.5 rounded-full bg-white absolute top-0.5 right-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Failure Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Alert when agent runs fail
                </p>
              </div>
              <div className="h-5 w-9 rounded-full bg-accent relative">
                <span className="inline-block h-3.5 w-3.5 rounded-full bg-white absolute top-0.5 right-1" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Environment" />
          <div className="space-y-3">
            {EXPECTED_ENV_KEYS.map((key) => (
              <div key={key} className="flex items-center justify-between">
                <code className="text-xs font-mono">{key}</code>
                <span className="text-xs text-muted-foreground">
                  {process.env[key] ? "✓ Set" : "✗ Missing"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Database" />
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Provider: <span className="text-foreground">PostgreSQL</span>
            </p>
            <p>
              ORM: <span className="text-foreground">Prisma</span>
            </p>
            <p>
              Queue: <span className="text-foreground">BullMQ + Redis</span>
            </p>
            <p className="text-xs">
              Recommended deploy target: Vercel app + managed Postgres + managed Redis.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

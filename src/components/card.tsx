import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function Card({
  children,
  className = "",
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-5 transition-all duration-200 ${
        accent ? "border-l-4 border-l-accent border-[#eaeced]" : "border-[#eaeced]"
      } hover:shadow-lg hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  description,
}: {
  title: string;
  action?: ReactNode;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "'Rethink Sans', sans-serif" }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
}) {
  const trendConfig = {
    up: { color: "text-emerald-600", Icon: TrendingUp },
    down: { color: "text-[#e90d41]", Icon: TrendingDown },
    neutral: { color: "text-[#999999]", Icon: Minus },
  };

  const t = trend ? trendConfig[trend] : null;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p
            className="text-[10px] font-bold text-[#999999] uppercase tracking-widest"
            style={{ fontFamily: "'Rethink Sans', sans-serif" }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-extrabold tracking-tight text-[#0a0a0a]"
            style={{ fontFamily: "'Rethink Sans', sans-serif" }}
          >
            {value}
          </p>
          {sub && t && (
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center ${t.color}`}>
                <t.Icon className="h-3 w-3" />
              </span>
              <span className="text-xs text-[#666666]">{sub}</span>
            </div>
          )}
          {sub && !t && (
            <p className="text-xs text-[#666666]">{sub}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fdf0f3] text-accent">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

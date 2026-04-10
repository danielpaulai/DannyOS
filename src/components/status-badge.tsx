/* Status badges using Purely Personal palette */

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  // Agent statuses
  IDLE: { bg: "bg-[#f5f6f7]", text: "text-[#666666]", dot: "bg-[#b8bec1]" },
  RUNNING: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  ERROR: { bg: "bg-[#fdf0f3]", text: "text-[#e90d41]", dot: "bg-[#e90d41]" },
  DISABLED: { bg: "bg-[#eaeced]", text: "text-[#999999]", dot: "bg-[#d1d5d8]" },
  // Run statuses
  QUEUED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  WAITING_APPROVAL: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  FAILED: { bg: "bg-[#fdf0f3]", text: "text-[#e90d41]", dot: "bg-[#e90d41]" },
  // Approval statuses
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  REJECTED: { bg: "bg-[#fdf0f3]", text: "text-[#e90d41]", dot: "bg-[#e90d41]" },
  EXPIRED: { bg: "bg-[#eaeced]", text: "text-[#999999]", dot: "bg-[#d1d5d8]" },
  // Integration statuses
  connected: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  disconnected: { bg: "bg-[#eaeced]", text: "text-[#999999]", dot: "bg-[#d1d5d8]" },
  error: { bg: "bg-[#fdf0f3]", text: "text-[#e90d41]", dot: "bg-[#e90d41]" },
  // Severity
  info: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  urgent: { bg: "bg-[#fdf0f3]", text: "text-[#e90d41]", dot: "bg-[#e90d41]" },
  // Deal scores
  HOT: { bg: "bg-[#fdf0f3]", text: "text-[#e90d41]", dot: "bg-[#e90d41]" },
  WARM: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
  COLD: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
};

const DEFAULT_STYLE = {
  bg: "bg-[#f5f6f7]",
  text: "text-[#666666]",
  dot: "bg-[#b8bec1]",
};

export function StatusBadge({
  status,
  pulse,
}: {
  status: string;
  pulse?: boolean;
}) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}
      style={{ fontFamily: "'Rethink Sans', sans-serif" }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot} ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      {label}
    </span>
  );
}

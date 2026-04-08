const STATUS_STYLES: Record<string, string> = {
  // Agent statuses
  IDLE: "bg-muted text-muted-foreground",
  RUNNING: "bg-blue-100 text-blue-700",
  ERROR: "bg-red-100 text-red-700",
  DISABLED: "bg-gray-100 text-gray-500",
  // Run statuses
  QUEUED: "bg-yellow-50 text-yellow-700",
  WAITING_APPROVAL: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  // Approval statuses
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  // Integration statuses
  connected: "bg-green-100 text-green-700",
  disconnected: "bg-gray-100 text-gray-500",
  error: "bg-red-100 text-red-700",
  // Severity
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
  urgent: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

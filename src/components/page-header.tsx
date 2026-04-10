import { type ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-[#0a0a0a]"
          style={{ fontFamily: "'Rethink Sans', sans-serif" }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#666666] mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

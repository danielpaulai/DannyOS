"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  History,
  Inbox,
  Clock,
  Plug,
  Bell,
  Settings,
  BriefcaseBusiness,
  CalendarRange,
  PenTool,
  Search,
  Brain,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";

const BUSINESS_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: BriefcaseBusiness },
  { href: "/meetings", label: "Meetings", icon: CalendarRange },
  { href: "/content", label: "Content", icon: PenTool },
  { href: "/research", label: "Research", icon: Search },
  { href: "/memory", label: "Memory", icon: Brain },
];

const SYSTEM_NAV = [
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/runs", label: "Run History", icon: History },
  { href: "/approvals", label: "Approvals", icon: Inbox },
  { href: "/schedules", label: "Schedules", icon: Clock },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavItem({
  item,
  pathname,
  collapsed,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
        isActive
          ? "bg-accent/10 text-accent font-semibold"
          : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
      style={{ fontFamily: "'Rethink Sans', sans-serif" }}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

function NavSection({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (collapsed) {
    return <div className="mx-3 my-3 border-t border-white/5" />;
  }
  return (
    <p
      className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-accent"
      style={{ fontFamily: "'Rethink Sans', sans-serif" }}
    >
      {label}
    </p>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-extrabold text-xs shrink-0"
          style={{ fontFamily: "'Rethink Sans', sans-serif" }}
        >
          PP
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span
              className="font-bold text-sm leading-tight"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              Daniel OS
            </span>
            <span className="text-[10px] text-sidebar-foreground/30 leading-tight">
              Purely Personal
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <NavSection label="Business" collapsed={collapsed} />
        <div className="space-y-0.5">
          {BUSINESS_NAV.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </div>

        <NavSection label="System" collapsed={collapsed} />
        <div className="space-y-0.5">
          {SYSTEM_NAV.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5">
        {!collapsed && <SignOutButton />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center h-9 text-sidebar-foreground/20 hover:text-sidebar-foreground/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
}

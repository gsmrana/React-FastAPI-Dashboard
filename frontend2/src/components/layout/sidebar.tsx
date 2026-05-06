import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  StickyNote,
  ListChecks,
  DollarSign,
  Wrench,
  User,
  Users,
  Cpu,
  Settings,
  ServerCog,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const main = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/todos", label: "Todos", icon: ListChecks },
  { to: "/expenses", label: "Expenses", icon: DollarSign },
  { to: "/notes", label: "Notepad", icon: StickyNote },
  { to: "/chat", label: "Chatbot", icon: Bot },
  { to: "/files", label: "File Manager", icon: FolderKanban },
  { to: "/services", label: "Services", icon: Wrench },
  // { to: "/profile", label: "Profile", icon: User },
];

const admin = [
  { to: "/admin/users", label: "User Manager", icon: Users },
  { to: "/admin/llm", label: "LLM Manager", icon: Cpu },
  { to: "/admin/config", label: "App Config", icon: Settings },
  { to: "/admin/logs", label: "App Logs", icon: ScrollText },
  { to: "/admin/system", label: "System Info", icon: ServerCog },
];

interface SidebarProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

export function Sidebar({ isMobile, onItemClick }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const collapsed = !isMobile && sidebarCollapsed;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-full flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200",
          collapsed ? "w-16" : "w-64",
          isMobile && "w-full",
        )}
      >
        <div
          className={cn(
            "flex items-center h-14 px-4 border-b border-sidebar-border",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            <div className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm font-bold">
              N
            </div>
            {!collapsed && <span>Nexus Hub</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {main.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} onClick={onItemClick} />
          ))}

          {user?.is_superuser && (
            <>
              <Separator className="my-3" />
              {!collapsed && (
                <p className="px-3 pb-1 pt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
              )}
              {admin.map((item) => (
                <NavItem key={item.to} item={item} collapsed={collapsed} onClick={onItemClick} />
              ))}
            </>
          )}
        </nav>

        {!isMobile && (
          <div className="p-2 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="icon"
              className="w-full"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

function NavItem({
  item,
  collapsed,
  onClick,
}: {
  item: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; end?: boolean };
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const node = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "hover:bg-sidebar-accent/50",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (!collapsed) return node;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

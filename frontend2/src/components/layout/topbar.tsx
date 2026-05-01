import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useLogout } from "@/api/auth";
import { initials } from "@/lib/utils";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/files": "File Manager",
  "/chat": "Chatbot",
  "/notes": "Notepad",
  "/todos": "To-Do",
  "/expenses": "Expenses",
  "/services": "Services",
  "/profile": "User Profile",
  "/admin/users": "User Management",
  "/admin/llm": "LLM Manager",
  "/admin/config": "App Config",
  "/admin/system": "System Info",
  "/admin/logs": "Application Logs",
};

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  const title =
    titles[location.pathname] ||
    Object.entries(titles).find(([k]) => k !== "/" && location.pathname.startsWith(k))?.[1] ||
    "Nexus Hub";

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login");
  };

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur sticky top-0 z-30 flex items-center px-4 gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold truncate">{title}</h1>
      <div className="flex-1" />
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="rounded-full h-9 w-9 p-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials(user?.full_name || user?.email)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium truncate">{user?.full_name || "User"}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <User className="h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

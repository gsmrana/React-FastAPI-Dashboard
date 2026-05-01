import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="size-10 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
            N
          </div>
          <span className="text-xl font-semibold">Nexus Hub</span>
        </div>
        <Outlet />
        <p className="mt-8 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Nexus Hub
        </p>
      </div>
    </div>
  );
}

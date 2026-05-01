import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { setUnauthorizedHandler } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const persistedUser = useAuthStore((s) => s.user);
  const { isLoading, isError, data } = useMe();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().clear();
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    });
  }, []);

  if (isLoading && !persistedUser) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <div className="space-y-3 w-full max-w-md">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const user = data ?? persistedUser;
  if (isError && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user?.is_superuser) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

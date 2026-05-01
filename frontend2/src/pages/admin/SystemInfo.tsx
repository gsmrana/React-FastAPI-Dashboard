import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSysInfo } from "@/api/admin";
import { useHealthLive, useHealthReady } from "@/api/health";

export default function SystemInfo() {
  const sys = useSysInfo();
  const live = useHealthLive();
  const ready = useHealthReady();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Liveness</CardTitle>
          </CardHeader>
          <CardContent>
            {live.isLoading ? (
              <Skeleton className="h-12" />
            ) : live.data ? (
              <div className="space-y-1">
                <Badge variant="secondary">{live.data.status}</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Uptime: {formatUptime(live.data.uptime_seconds)}
                </p>
                <p className="text-xs text-muted-foreground">{live.data.server_time}</p>
              </div>
            ) : (
              <Badge variant="destructive">Unreachable</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            {ready.isLoading ? (
              <Skeleton className="h-12" />
            ) : ready.data ? (
              <div className="space-y-1">
                <Badge variant={ready.data.status === "ready" ? "secondary" : "destructive"}>
                  {ready.data.status}
                </Badge>
                {ready.data.detail && (
                  <p className="text-xs text-muted-foreground mt-2">{ready.data.detail}</p>
                )}
              </div>
            ) : (
              <Badge variant="destructive">Unreachable</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">System info</CardTitle>
        </CardHeader>
        <CardContent>
          {sys.isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(sys.data ?? {}).map(([k, v]) => (
                <div key={k} className="rounded-md border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
                  <p className="font-mono text-sm break-all mt-1">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

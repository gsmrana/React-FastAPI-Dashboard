import { useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppConfig } from "@/api/admin";

export default function AppConfig() {
  const { data, isLoading } = useAppConfig();
  const [filter, setFilter] = useState("");

  const entries = useMemo(() => {
    if (!data) return [] as [string, unknown][];
    return Object.entries(data).filter(([k]) =>
      filter ? k.toLowerCase().includes(filter.toLowerCase()) : true,
    );
  }, [data, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter keys..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => toast.success("Copied"))
          }
          disabled={!data}
        >
          <Copy className="h-4 w-4" /> Copy JSON
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <Skeleton className="h-64" />
            </div>
          ) : (
            <div className="divide-y">
              {entries.map(([k, v]) => (
                <div key={k} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 text-sm">
                  <div className="font-mono text-xs text-muted-foreground md:pr-4 break-all">{k}</div>
                  <div className="md:col-span-2 font-mono text-xs break-all whitespace-pre-wrap">
                    {formatValue(v)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return v;
  return JSON.stringify(v, null, 2);
}

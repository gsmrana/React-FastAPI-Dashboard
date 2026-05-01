import { useMemo, useState } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppLog, appLogDownloadUrl } from "@/api/admin";

export default function Logs() {
  const [auto, setAuto] = useState(false);
  const [filter, setFilter] = useState("");
  const log = useAppLog(auto);

  const lines = useMemo(() => {
    const text = log.data ?? "";
    const all = text.split("\n");
    if (!filter) return all;
    return all.filter((l) => l.toLowerCase().includes(filter.toLowerCase()));
  }, [log.data, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter lines..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={auto} onCheckedChange={setAuto} id="auto" />
          <Label htmlFor="auto" className="text-sm">
            Auto-refresh (5s)
          </Label>
        </div>
        <Button variant="outline" onClick={() => log.refetch()} disabled={log.isFetching}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
        <Button asChild variant="outline">
          <a href={appLogDownloadUrl()} target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" /> Download
          </a>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {log.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-64" />
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <pre className="text-xs font-mono p-4 whitespace-pre-wrap break-all leading-relaxed">
                {lines.join("\n") || "(empty)"}
              </pre>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

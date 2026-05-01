import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Plus,
  Send,
  Square,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/markdown";
import { EmptyState } from "@/components/empty-state";
import {
  useChatHistory,
  useDeleteSession,
  useMySessions,
  useNewSession,
  streamChat,
} from "@/api/chatbot";
import { useCachedLlmConfigs } from "@/api/llm-configs";
import { cn } from "@/lib/utils";
import { toastError } from "@/lib/api";
import type { ChatMessage } from "@/types/api";

export default function Chat() {
  const sessions = useMySessions();
  const newSess = useNewSession();
  const delSess = useDeleteSession();
  const llms = useCachedLlmConfigs();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [llmId, setLlmId] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [input, setInput] = useState("");
  const [pendingUser, setPendingUser] = useState<string>("");
  const [streamingMsg, setStreamingMsg] = useState("");
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-pick first session and first LLM
  useEffect(() => {
    if (!activeId && sessions.data?.sessions.length) {
      setActiveId(sessions.data.sessions[0].session_id);
    }
  }, [activeId, sessions.data]);

  useEffect(() => {
    if (!llmId && llms.data?.length) {
      setLlmId(String(llms.data[0].id));
    }
  }, [llmId, llms.data]);

  const history = useChatHistory(activeId ?? undefined);

  const messages: ChatMessage[] = useMemo(() => {
    const base = history.data?.messages ?? [];
    const extras: ChatMessage[] = [];
    if (pendingUser) extras.push({ type: "human", content: pendingUser });
    if (streamingMsg) extras.push({ type: "ai", content: streamingMsg });
    return [...base, ...extras];
  }, [history.data, streamingMsg, pendingUser]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streamingMsg]);

  const handleSend = async () => {
    if (!input.trim() || !activeId || !llmId || sending) return;
    const message = input;
    setInput("");
    setPendingUser(message);
    setSending(true);
    setStreamingMsg("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await streamChat(
        {
          llm_id: Number(llmId),
          message,
          session_id: activeId,
          system_prompt: systemPrompt || undefined,
        },
        (chunk) => setStreamingMsg((s) => s + chunk),
        ctrl.signal,
      );
      await history.refetch();
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") {
        toastError(e, "Chat failed");
      }
    } finally {
      setSending(false);
      setStreamingMsg("");
      setPendingUser("");
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();

  const handleNewSession = async () => {
    try {
      const res = await newSess.mutateAsync();
      const last = res.sessions[res.sessions.length - 1];
      if (last) setActiveId(last.session_id);
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-8rem)]">
      {/* Sessions panel */}
      <Card className="flex flex-col overflow-hidden">
        <div className="p-3 flex items-center justify-between border-b">
          <span className="font-medium text-sm">Sessions</span>
          <Button size="sm" variant="ghost" onClick={handleNewSession} disabled={newSess.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (sessions.data?.sessions ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No sessions yet.</p>
            ) : (
              sessions.data!.sessions.map((s) => (
                <div
                  key={s.session_id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer",
                    s.session_id === activeId ? "bg-accent" : "hover:bg-accent/50",
                  )}
                  onClick={() => setActiveId(s.session_id)}
                >
                  <Bot className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{s.session_id}</span>
                  {s.message_count > 0 && (
                    <span className="text-[10px] text-muted-foreground">{s.message_count}</span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await delSess.mutateAsync(s.session_id);
                        if (s.session_id === activeId) setActiveId(null);
                        toast.success("Session deleted");
                      } catch (err) {
                        toastError(err);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat area */}
      <Card className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b flex flex-col sm:flex-row gap-2">
          <Select value={llmId} onValueChange={setLlmId}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Select LLM" />
            </SelectTrigger>
            <SelectContent>
              {(llms.data ?? []).map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.title} — {l.model_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            placeholder="Optional system prompt..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="flex-1 h-9 px-3 text-sm rounded-md border border-input bg-transparent"
          />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeId ? (
            <EmptyState
              icon={Bot}
              title="No active session"
              description="Create a new session to start chatting."
              action={<Button onClick={handleNewSession}><Plus className="h-4 w-4"/>New session</Button>}
            />
          ) : history.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Send a message to start the conversation.
            </p>
          ) : (
            messages.map((m, i) => <Bubble key={i} type={m.type} content={m.content} />)
          )}
        </div>

        {/* Composer */}
        <div className="p-3 border-t flex gap-2 items-end">
          <Textarea
            placeholder="Message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            disabled={!activeId || !llmId || sending}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          {sending ? (
            <Button variant="destructive" onClick={handleStop} size="icon">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!input.trim() || !activeId || !llmId} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Bubble({ type, content }: { type: string; content: string }) {
  const isUser = type === "human" || type === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="size-7 shrink-0 rounded-full bg-primary/10 grid place-items-center">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {isUser ? <span className="whitespace-pre-wrap">{content}</span> : <Markdown>{content}</Markdown>}
      </div>
      {isUser && (
        <div className="size-7 shrink-0 rounded-full bg-primary/10 grid place-items-center">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

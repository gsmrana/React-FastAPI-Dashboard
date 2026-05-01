import {
  Box,
  Button,
  Card,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  FormControlLabel,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Send,
  Add,
  Stop,
  ContentCopy,
  Person,
  SmartToy,
  Menu as MenuIcon,
  ExpandMore,
  ExpandLess,
  Refresh,
} from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { llmApi } from '@/api/modules';
import { chatbotApi } from '@/api/chatbot';
import type { ChatMessage } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import Markdown from '@/components/common/Markdown';
import { extractError } from '@/api/client';

interface UIMessage extends ChatMessage {
  id: string;
  pending?: boolean;
}

export default function ChatbotPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [llmId, setLlmId] = useState<number | ''>('');
  const [persistent, setPersistent] = useState(true);
  const [stream, setStream] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [showSysPrompt, setShowSysPrompt] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const llms = useQuery({
    queryKey: ['llm-cached'],
    queryFn: () => llmApi.cached(false),
  });
  const sessions = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatbotApi.sessions(),
    enabled: persistent,
  });

  // Default LLM (active LLM with category=0)
  useEffect(() => {
    if (!llmId && llms.data && llms.data.length > 0) {
      const llmCat = llms.data.find((l) => l.category === 0) || llms.data[0];
      setLlmId(llmCat.id);
    }
  }, [llms.data, llmId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const loadSession = async (sid: string) => {
    setSessionId(sid);
    try {
      const h = await chatbotApi.history(sid);
      setMessages(
        h.messages.map((m, i) => ({
          ...m,
          id: `h-${i}-${Date.now()}`,
        }))
      );
    } catch (e) {
      enqueueSnackbar(extractError(e, 'Failed to load history'), { variant: 'error' });
    }
    if (isMobile) setDrawerOpen(false);
  };

  const newSession = () => {
    setSessionId('');
    setMessages([]);
    if (isMobile) setDrawerOpen(false);
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
  };

  const send = async () => {
    if (!input.trim() || !llmId) return;
    const text = input.trim();
    const userMsg: UIMessage = {
      id: `u-${Date.now()}`,
      type: 'human',
      content: text,
    };
    const aiMsg: UIMessage = {
      id: `a-${Date.now()}`,
      type: 'ai',
      content: '',
      pending: true,
    };
    setMessages((m) => [...m, userMsg, aiMsg]);
    setInput('');
    setSending(true);

    const payload = {
      llm_id: Number(llmId),
      message: text,
      session_id: persistent ? sessionId || undefined : undefined,
      system_prompt: systemPrompt || undefined,
    };

    try {
      if (stream) {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        await chatbotApi.stream(payload, {
          persistent,
          signal: ctrl.signal,
          onChunk: (chunk) => {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === aiMsg.id
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          },
        });
      } else {
        const fn = persistent ? chatbotApi.chat : chatbotApi.ask;
        const resp = await fn(payload);
        setMessages((m) =>
          m.map((msg) =>
            msg.id === aiMsg.id ? { ...msg, content: resp.response } : msg
          )
        );
        if (persistent && resp.session_id) setSessionId(resp.session_id);
      }
      setMessages((m) =>
        m.map((msg) => (msg.id === aiMsg.id ? { ...msg, pending: false } : msg))
      );
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === aiMsg.id
              ? { ...msg, content: msg.content + '\n\n*[stopped]*', pending: false }
              : msg
          )
        );
      } else {
        const err = extractError(e, 'Chat failed');
        enqueueSnackbar(err, { variant: 'error' });
        setMessages((m) => m.filter((msg) => msg.id !== aiMsg.id));
      }
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  };

  const sidebar = (
    <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="contained" startIcon={<Add />} onClick={newSession}>
          New chat
        </Button>
      </Box>
      <Divider />
      <Box sx={{ p: 2, pb: 0 }}>
        <Typography variant="overline" color="text.secondary">
          Settings
        </Typography>
      </Box>
      <Stack spacing={1.5} sx={{ p: 2 }}>
        <TextField
          select
          size="small"
          label="Model"
          value={llmId}
          onChange={(e) => setLlmId(Number(e.target.value))}
          fullWidth
        >
          {(llms.data || []).filter((l) => l.is_active).map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.title}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Switch
              checked={persistent}
              onChange={(e) => setPersistent(e.target.checked)}
              size="small"
            />
          }
          label="Persistent (keep history)"
        />
        <FormControlLabel
          control={
            <Switch
              checked={stream}
              onChange={(e) => setStream(e.target.checked)}
              size="small"
            />
          }
          label="Stream responses"
        />
      </Stack>
      <Divider />
      {persistent && (
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, pt: 2 }}
          >
            <Typography variant="overline" color="text.secondary">
              Sessions
            </Typography>
            <IconButton size="small" onClick={() => sessions.refetch()}>
              <Refresh fontSize="inherit" />
            </IconButton>
          </Stack>
          <List dense disablePadding>
            {(sessions.data || []).length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                No sessions yet
              </Typography>
            )}
            {(sessions.data || []).map((s) => (
              <ListItemButton
                key={s}
                selected={sessionId === s}
                onClick={() => loadSession(s)}
              >
                <Typography variant="body2" noWrap>
                  {s}
                </Typography>
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)' }}>
      <PageHeader
        title="Chatbot"
        subtitle="Ask questions, get answers — with streaming"
        actions={
          isMobile ? (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          ) : undefined
        }
      />

      <Paper variant="outlined" sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {isMobile ? (
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
          >
            {sidebar}
          </Drawer>
        ) : (
          <Box sx={{ borderRight: 1, borderColor: 'divider' }}>{sidebar}</Box>
        )}

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header chips */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}
          >
            {llmId && llms.data && (
              <Chip
                size="small"
                color="primary"
                label={llms.data.find((l) => l.id === llmId)?.title || `LLM #${llmId}`}
              />
            )}
            {persistent && sessionId && <Chip size="small" label={`Session: ${sessionId}`} />}
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              endIcon={showSysPrompt ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowSysPrompt((s) => !s)}
            >
              System prompt
            </Button>
          </Stack>
          <Collapse in={showSysPrompt}>
            <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                maxRows={5}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant."
              />
            </Box>
          </Collapse>

          {/* Messages */}
          <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {messages.length === 0 ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 1,
                  color: 'text.secondary',
                }}
              >
                <SmartToy sx={{ fontSize: 56, opacity: 0.4 }} />
                <Typography variant="h6">Start a conversation</Typography>
                <Typography variant="body2">
                  {llmId
                    ? 'Ask anything below to begin.'
                    : 'Configure an active LLM in the LLM Manager to begin.'}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
              </Stack>
            )}
          </Box>

          {/* Input */}
          <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" gap={1} alignItems="flex-end">
              <TextField
                fullWidth
                multiline
                maxRows={6}
                placeholder="Type a message... (Shift+Enter for newline)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!sending) send();
                  }
                }}
                disabled={!llmId}
              />
              {sending ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={stop}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  variant="contained"
                  endIcon={<Send />}
                  onClick={send}
                  disabled={!input.trim() || !llmId}
                >
                  Send
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

function MessageBubble({ msg }: { msg: UIMessage }) {
  const { enqueueSnackbar } = useSnackbar();
  const isUser = msg.type === 'human';
  return (
    <Stack
      direction={isUser ? 'row-reverse' : 'row'}
      gap={1.25}
      alignItems="flex-start"
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isUser ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
      </Box>
      <Card
        variant="outlined"
        sx={{
          maxWidth: '85%',
          bgcolor: isUser ? 'action.selected' : 'background.paper',
          p: 1.5,
        }}
      >
        {msg.content ? (
          <Markdown>{msg.content}</Markdown>
        ) : msg.pending ? (
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularProgress size={14} />
            <Typography variant="body2" color="text.secondary">
              Thinking...
            </Typography>
          </Stack>
        ) : null}
        {!isUser && msg.content && !msg.pending && (
          <Stack direction="row" justifyContent="flex-end">
            <Tooltip title="Copy">
              <IconButton
                size="small"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(msg.content);
                    enqueueSnackbar('Copied', { variant: 'success' });
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <ContentCopy fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Card>
    </Stack>
  );
}

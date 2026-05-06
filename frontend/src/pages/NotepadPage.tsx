import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  MenuItem,
  Divider,
  List,
  ListItemButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Add,
  Star,
  StarBorder,
  Search,
  Delete,
  Save,
  Visibility,
  Edit as EditIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { notepadsApi } from '@/api/modules';
import { NOTE_CATEGORIES, labelOf } from '@/constants/enums';
import type { CreateNote, Note } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Markdown from '@/components/common/Markdown';
import { extractError } from '@/api/client';

export default function NotepadPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CreateNote & { id?: number }>({
    title: '',
    content: '',
    category: 0,
    is_starred: 0,
    tags: '',
  });
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(true);

  const notes = useQuery({ queryKey: ['notes'], queryFn: () => notepadsApi.list() });

  const createM = useMutation({
    mutationFn: (p: CreateNote) => notepadsApi.create(p),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      setSelectedId(n.id);
      enqueueSnackbar('Note created', { variant: 'success' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const updateM = useMutation({
    mutationFn: (p: { id: number; data: Partial<CreateNote> }) =>
      notepadsApi.update(p.id, p.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      enqueueSnackbar('Saved', { variant: 'success' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const deleteM = useMutation({
    mutationFn: (id: number) => notepadsApi.remove(id, false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      setSelectedId(null);
      enqueueSnackbar('Note deleted', { variant: 'info' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const filtered = useMemo(() => {
    const list = notes.data || [];
    const q = search.trim().toLowerCase();
    const sorted = [...list].sort((a, b) => {
      if (a.is_starred !== b.is_starred) return b.is_starred - a.is_starred;
      return (b.updated_at || '').localeCompare(a.updated_at || '');
    });
    if (!q) return sorted;
    return sorted.filter((n) =>
      [n.title, n.content, n.tags].some((v) => v?.toLowerCase().includes(q))
    );
  }, [notes.data, search]);

  // Sync draft with selected note
  useEffect(() => {
    if (selectedId == null) {
      setDraft({ title: '', content: '', category: 0, is_starred: 0, tags: '' });
      return;
    }
    const n = (notes.data || []).find((x) => x.id === selectedId);
    if (n) {
      setDraft({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        is_starred: n.is_starred,
        tags: n.tags,
      });
    }
  }, [selectedId, notes.data]);

  const newNote = () => {
    createM.mutate({
      title: 'Untitled',
      content: '',
      category: 0,
      is_starred: 0,
      tags: '',
    });
    if (isMobile) setMobileListOpen(false);
  };

  const save = () => {
    if (!draft.id) return;
    const { id, ...data } = draft;
    updateM.mutate({ id, data });
  };

  const list = (
    <Box
      sx={{
        width: { xs: '100%', md: 320 },
        borderRight: { md: 1 },
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: { xs: '100%', md: 'auto' },
      }}
    >
      <Box sx={{ p: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              {search ? 'No matches' : 'No notes yet'}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {filtered.map((n) => (
              <ListItemButton
                key={n.id}
                selected={selectedId === n.id}
                onClick={() => {
                  setSelectedId(n.id);
                  if (isMobile) setMobileListOpen(false);
                }}
                sx={{ alignItems: 'flex-start', py: 1.25 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    {n.is_starred ? (
                      <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                    ) : null}
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {n.title || 'Untitled'}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ display: 'block' }}
                  >
                    {n.content?.slice(0, 64) || '—'}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', fontSize: 10 }}
                  >
                    {dayjs(n.updated_at || n.created_at).format('MMM D, HH:mm')}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
      <Divider />
      <Box sx={{ p: 1 }}>
        <Button fullWidth startIcon={<Add />} variant="contained" onClick={newNote}>
          New Note
        </Button>
      </Box>
    </Box>
  );

  const editor = (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {!draft.id ? (
        <EmptyState
          title="Select a note"
          message="Or create a new one to get started"
          action={
            <Button variant="contained" startIcon={<Add />} onClick={newNote}>
              New Note
            </Button>
          }
        />
      ) : (
        <>
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}
          >
            {isMobile && (
              <IconButton onClick={() => setMobileListOpen(true)} size="small">
                <ArrowBack />
              </IconButton>
            )}
            <TextField
              variant="standard"
              placeholder="Title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              sx={{ flex: 1, minWidth: 160, '& input': { fontSize: 18, fontWeight: 600 } }}
              InputProps={{ disableUnderline: true }}
            />
            <Tooltip title={draft.is_starred ? 'Unstar' : 'Star'}>
              <IconButton
                size="small"
                onClick={() => setDraft({ ...draft, is_starred: draft.is_starred ? 0 : 1 })}
                sx={{ color: 'warning.main' }}
              >
                {draft.is_starred ? <Star /> : <StarBorder />}
              </IconButton>
            </Tooltip>
            <ToggleButtonGroup
              value={mode}
              exclusive
              size="small"
              onChange={(_, v) => v && setMode(v)}
            >
              <ToggleButton value="edit">
                <EditIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="split">Split</ToggleButton>
              <ToggleButton value="preview">
                <Visibility fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              size="small"
              startIcon={<Save />}
              variant="contained"
              onClick={save}
              disabled={updateM.isPending}
            >
              Save
            </Button>
            <IconButton size="small" color="error" onClick={() => setDeleteId(draft.id!)}>
              <Delete fontSize="small" />
            </IconButton>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}
          >
            <TextField
              select
              size="small"
              label="Category"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: Number(e.target.value) })}
              sx={{ minWidth: 140 }}
            >
              {NOTE_CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Tags"
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              placeholder="comma,separated"
              sx={{ flex: 1, minWidth: 160 }}
            />
            <Chip
              size="small"
              label={labelOf(NOTE_CATEGORIES, draft.category)}
              variant="outlined"
            />
          </Stack>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: { xs: 'column', md: mode === 'split' ? 'row' : 'column' },
              minHeight: 0,
            }}
          >
            {(mode === 'edit' || mode === 'split') && (
              <Box
                sx={{
                  flex: 1,
                  borderRight: { md: mode === 'split' ? 1 : 0 },
                  borderColor: 'divider',
                  minHeight: 0,
                }}
              >
                <textarea
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  placeholder="Write markdown here..."
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 320,
                    border: 0,
                    outline: 'none',
                    padding: 16,
                    background: 'transparent',
                    color: 'inherit',
                    fontFamily: 'Fira Code, JetBrains Mono, Consolas, monospace',
                    fontSize: 14,
                    resize: 'none',
                  }}
                />
              </Box>
            )}
            {(mode === 'preview' || mode === 'split') && (
              <Box sx={{ flex: 1, p: 2, overflowY: 'auto', minHeight: 0 }}>
                <Markdown>{draft.content || '*Nothing to preview*'}</Markdown>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Box>
      {/* <PageHeader
        title="Notepad"
        subtitle="Markdown notes with live preview"
      /> */}

      {notes.isLoading ? (
        <LoadingScreen />
      ) : (
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
            height: { xs: 'calc(100vh - 240px)', md: 'calc(100vh - 200px)' },
            minHeight: 480,
          }}
        >
          {/* Mobile: drawer toggles between list and editor */}
          {isMobile ? (
            <>
              <Drawer
                anchor="left"
                open={mobileListOpen}
                onClose={() => setMobileListOpen(false)}
                ModalProps={{ keepMounted: true }}
                PaperProps={{ sx: { width: '85%', maxWidth: 360 } }}
              >
                {list}
              </Drawer>
              {editor}
            </>
          ) : (
            <>
              {list}
              {editor}
            </>
          )}
        </Paper>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete note?"
        message="This note will be soft-deleted."
        destructive
        confirmText="Delete"
        onConfirm={() => deleteId && deleteM.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </Box>
  );
}

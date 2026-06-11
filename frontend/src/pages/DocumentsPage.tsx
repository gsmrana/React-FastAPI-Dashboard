import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Download,
  DriveFileRenameOutline,
  InsertDriveFile,
  Visibility,
} from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { documentsApi } from '@/api/documents';
import type { Document } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import GroupField from '@/components/common/GroupField';
import GroupChip from '@/components/common/GroupChip';
import { extractError } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatBytes } from '@/api/utils';

function isImage(filename: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filename);
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [uploadGroup, setUploadGroup] = useState<number | null>(user?.group_id ?? null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameGroup, setRenameGroup] = useState<number | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const docs = useQuery({ queryKey: ['documents'], queryFn: () => documentsApi.list() });

  const uploadM = useMutation({
    mutationFn: (files: File[]) =>
      documentsApi.upload(files, uploadGroup, (pct) => setUploadProgress(pct)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      enqueueSnackbar('Upload complete', { variant: 'success' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
    onSettled: () => setUploadProgress(null),
  });

  const renameM = useMutation({
    mutationFn: (p: { id: number; new_filename: string; group_id: number | null }) =>
      documentsApi.update(p.id, { filename: p.new_filename, group_id: p.group_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      enqueueSnackbar('Renamed', { variant: 'success' });
      setRenameDoc(null);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const deleteM = useMutation({
    mutationFn: (id: number) => documentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      enqueueSnackbar('File deleted', { variant: 'info' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });

  const triggerUpload = () => fileInput.current?.click();
  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadM.mutate(Array.from(files));
  };

  const filtered = (docs.data || [])
    .filter((d) => d.filename.toLowerCase().includes(search.trim().toLowerCase()))
    .slice()
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-desc': return b.filename.localeCompare(a.filename);
        case 'size-asc':  return a.filesize - b.filesize;
        case 'size-desc': return b.filesize - a.filesize;
        case 'date-desc': {
          const da = new Date(a.modified_at ?? a.created_at ?? 0).getTime();
          const db = new Date(b.modified_at ?? b.created_at ?? 0).getTime();
          return db - da;
        }
        case 'date-asc': {
          const da = new Date(a.modified_at ?? a.created_at ?? 0).getTime();
          const db = new Date(b.modified_at ?? b.created_at ?? 0).getTime();
          return da - db;
        }
        default: return a.filename.localeCompare(b.filename);
      }
    });

  return (
    <Box>
      <PageHeader
        title="File Manager"
        subtitle="Upload, preview, and organize your documents"
        actions={
          <>
            <TextField
              size="small"
              placeholder="Search files"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            />
            <TextField
              select
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ minWidth: 160 }}
              label="Sort by"
            >
              <MenuItem value="date-desc">Date (Newest)</MenuItem>
              <MenuItem value="date-asc">Date (Oldest)</MenuItem>
              <MenuItem value="name-asc">Name (A → Z)</MenuItem>
              <MenuItem value="name-desc">Name (Z → A)</MenuItem>
              <MenuItem value="size-asc">Size (Smallest)</MenuItem>
              <MenuItem value="size-desc">Size (Largest)</MenuItem>
            </TextField>
            <Box sx={{ minWidth: 180 }}>
              <GroupField value={uploadGroup} onChange={setUploadGroup} />
            </Box>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={triggerUpload}
              disabled={uploadM.isPending}
            >
              Upload
            </Button>
            <input
              ref={fileInput}
              type="file"
              hidden
              multiple
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </>
        }
      />

      {/* drag and drop upload area */}
      {/* <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFiles(e.dataTransfer.files);
        }}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: dragOver ? 'action.hover' : 'transparent',
          borderRadius: 2,
          p: 3,
          mb: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onClick={triggerUpload}
      >
        <CloudUpload sx={{ fontSize: 36, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          Drag &amp; drop files here, or click to browse
        </Typography>
        {uploadProgress !== null && (
          <Box sx={{ mt: 1.5, maxWidth: 320, mx: 'auto' }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" color="text.secondary">
              {uploadProgress}%
            </Typography>
          </Box>
        )}
      </Box> */}

      {/* File list area */}
      {docs.isLoading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No files yet"
          message="Upload your first document to get started"
          icon={<InsertDriveFile fontSize="inherit" />}
        />
      ) : (
        <Grid container spacing={1}>
          {filtered.map((d) => (
            <Grid key={d.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box
                  onClick={() => setPreviewDoc(d)}
                  sx={{
                    height: 240,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={documentsApi.thumbnailUrl(d.id, 240, 240)}
                    alt={d.filename}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </Box>
                <CardContent sx={{ pt: 1, flex: 1, pb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={d.filename}>
                    {d.filename}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(d.filesize)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: 1 }}>
                    <GroupChip groupId={d.group_id} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="Preview">
                      <IconButton size="small" onClick={() => setPreviewDoc(d)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        component="a"
                        href={documentsApi.downloadUrl(d.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rename">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setRenameDoc(d);
                          setRenameValue(d.filename);
                          setRenameGroup(d.group_id ?? null);
                        }}
                      >
                        <DriveFileRenameOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteDoc(d)}>
                        <Delete fontSize="small" />
                      </IconButton>
                  </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Rename dialog */}
      <Dialog
        open={renameDoc !== null}
        onClose={() => setRenameDoc(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Rename file</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            sx={{ mt: 1 }}
            label="New filename"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            <GroupField value={renameGroup} onChange={setRenameGroup} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDoc(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!renameValue.trim() || renameM.isPending}
            onClick={async () => {
              if (!renameDoc || !renameValue.trim()) return;
              await renameM.mutateAsync({
                id: renameDoc.id,
                new_filename: renameValue.trim(),
                group_id: renameGroup,
              });
            }}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview dialog */}
      <Dialog
        open={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 6 }}>{previewDoc?.filename}</DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '70vh' }}>
          {previewDoc && (
            <Box sx={{ height: '100%', display: 'flex' }}>
              {isImage(previewDoc.filename) ? (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                  }}
                >
                  <img
                    src={documentsApi.viewUrl(previewDoc.id)}
                    alt={previewDoc.filename}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                </Box>
              ) : (
                <iframe
                  title="preview"
                  src={documentsApi.viewUrl(previewDoc.id)}
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            component="a"
            href={previewDoc ? documentsApi.downloadUrl(previewDoc.id) : '#'}
            target="_blank"
          >
            Download
          </Button>
          <Button onClick={() => setPreviewDoc(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDoc !== null}
        title="Delete file?"
        message={`"${deleteDoc?.filename}" will be permanently deleted.`}
        destructive
        confirmText="Delete"
        onConfirm={() => deleteDoc && deleteM.mutate(deleteDoc.id)}
        onClose={() => setDeleteDoc(null)}
      />
    </Box>
  );
}

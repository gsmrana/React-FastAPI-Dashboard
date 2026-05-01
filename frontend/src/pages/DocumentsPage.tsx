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
import { extractError } from '@/api/client';

function isImage(filename: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filename);
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const docs = useQuery({ queryKey: ['documents'], queryFn: () => documentsApi.list() });

  const uploadM = useMutation({
    mutationFn: (files: File[]) =>
      documentsApi.upload(files, (pct) => setUploadProgress(pct)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      enqueueSnackbar('Upload complete', { variant: 'success' });
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
    onSettled: () => setUploadProgress(null),
  });

  const renameM = useMutation({
    mutationFn: (p: { filename: string; new_filename: string }) =>
      documentsApi.rename(p.filename, p.new_filename),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      enqueueSnackbar('Renamed', { variant: 'success' });
      setRenameDoc(null);
    },
    onError: (e) => enqueueSnackbar(extractError(e), { variant: 'error' }),
  });
  const deleteM = useMutation({
    mutationFn: (filename: string) => documentsApi.remove(filename),
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

  const filtered = (docs.data || []).filter((d) =>
    d.filename.toLowerCase().includes(search.trim().toLowerCase())
  );

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

      <Box
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
      </Box>

      {docs.isLoading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No files yet"
          message="Upload your first document to get started"
          icon={<InsertDriveFile fontSize="inherit" />}
        />
      ) : (
        <Grid container spacing={2}>
          {filtered.map((d) => (
            <Grid key={d.filename} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box
                  onClick={() => setPreviewDoc(d)}
                  sx={{
                    height: 160,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={documentsApi.thumbnailUrl(d.filename, 320, 320)}
                    alt={d.filename}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </Box>
                <CardContent sx={{ flex: 1, pb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={d.filename}>
                    {d.filename}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {d.filesize}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                  <Tooltip title="Preview">
                    <IconButton size="small" onClick={() => setPreviewDoc(d)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton
                      size="small"
                      component="a"
                      href={documentsApi.downloadUrl(d.filename)}
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
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDoc(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!renameValue.trim() || renameValue === renameDoc?.filename}
            onClick={() =>
              renameDoc &&
              renameM.mutate({
                filename: renameDoc.filename,
                new_filename: renameValue.trim(),
              })
            }
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
                    src={documentsApi.viewUrl(previewDoc.filename)}
                    alt={previewDoc.filename}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                </Box>
              ) : (
                <iframe
                  title="preview"
                  src={documentsApi.viewUrl(previewDoc.filename)}
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            component="a"
            href={previewDoc ? documentsApi.downloadUrl(previewDoc.filename) : '#'}
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
        onConfirm={() => deleteDoc && deleteM.mutate(deleteDoc.filename)}
        onClose={() => setDeleteDoc(null)}
      />
    </Box>
  );
}

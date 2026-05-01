import { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { format, parseISO } from "date-fns";
import {
  Upload,
  Search,
  Download,
  Pencil,
  Trash2,
  FileIcon,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  useDocuments,
  useUploadDocument,
  useRenameDocument,
  useDeleteDocument,
  thumbnailUrl,
  viewUrl,
  downloadUrl,
} from "@/api/documents";
import { toastError } from "@/lib/api";
import { formatBytes, cn } from "@/lib/utils";
import type { Document } from "@/types/api";

export default function Files() {
  const docs = useDocuments();
  const upload = useUploadDocument();
  const rename = useRenameDocument();
  const del = useDeleteDocument();
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState<Document | null>(null);
  const [renaming, setRenaming] = useState<Document | null>(null);
  const [renameTo, setRenameTo] = useState("");
  const [deleting, setDeleting] = useState<Document | null>(null);

  const filtered = useMemo(() => {
    const list = docs.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((d) => d.filename.toLowerCase().includes(q));
  }, [docs.data, search]);

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setProgress(0);
    try {
      await upload.mutateAsync({ files, onProgress: setProgress });
      toast.success(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"}`);
    } catch (e) {
      toastError(e);
    } finally {
      setProgress(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleUpload,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div className="space-y-4" {...getRootProps()}>
      <input {...getInputProps()} />

      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={open} disabled={upload.isPending}>
          {upload.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload
        </Button>
      </div>

      {progress !== null && (
        <div className="space-y-1">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
        </div>
      )}

      {/* Drag overlay */}
      {isDragActive && (
        <div className="fixed inset-0 z-40 bg-primary/10 backdrop-blur-sm border-4 border-dashed border-primary pointer-events-none flex items-center justify-center">
          <div className="bg-background border rounded-lg p-6 shadow-lg">
            <p className="text-lg font-medium">Drop files to upload</p>
          </div>
        </div>
      )}

      {docs.isLoading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileIcon}
          title={search ? "No matching files" : "No files yet"}
          description="Drag and drop files here or click Upload to get started."
          action={
            <Button onClick={open}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((d) => (
            <FileCard
              key={d.filename}
              doc={d}
              onPreview={() => setPreviewing(d)}
              onRename={() => {
                setRenaming(d);
                setRenameTo(d.filename);
              }}
              onDelete={() => setDeleting(d)}
            />
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewing?.filename}</DialogTitle>
          </DialogHeader>
          {previewing && (
            <div className="space-y-3">
              {isImage(previewing.filename) ? (
                <img
                  src={viewUrl(previewing.filename)}
                  alt={previewing.filename}
                  className="max-h-[70vh] mx-auto rounded"
                />
              ) : isPdf(previewing.filename) ? (
                <iframe
                  src={viewUrl(previewing.filename)}
                  className="w-full h-[70vh] rounded border"
                  title={previewing.filename}
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Preview not available for this file type.
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" asChild>
                  <a
                    href={downloadUrl(previewing.filename)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="h-4 w-4" /> Download
                  </a>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename file</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New filename</Label>
            <Input value={renameTo} onChange={(e) => setRenameTo(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!renaming || !renameTo.trim()) return;
                try {
                  await rename.mutateAsync({ filename: renaming.filename, new_filename: renameTo });
                  toast.success("Renamed");
                  setRenaming(null);
                } catch (e) {
                  toastError(e);
                }
              }}
              disabled={rename.isPending}
            >
              {rename.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{deleting?.filename}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                try {
                  await del.mutateAsync(deleting.filename);
                  toast.success("Deleted");
                  setDeleting(null);
                } catch (e) {
                  toastError(e);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function isImage(name: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
}
function isPdf(name: string) {
  return /\.pdf$/i.test(name);
}

function FileCard({
  doc,
  onPreview,
  onRename,
  onDelete,
}: {
  doc: Document;
  onPreview: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="overflow-hidden group">
      <button
        onClick={onPreview}
        className="block w-full aspect-square bg-muted flex items-center justify-center overflow-hidden"
      >
        {isImage(doc.filename) ? (
          <img
            src={thumbnailUrl(doc.filename, 240, 240)}
            alt={doc.filename}
            loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <FileIcon className="h-12 w-12 text-muted-foreground" />
        )}
      </button>
      <CardContent className="p-3 space-y-2">
        <div className="text-sm font-medium truncate" title={doc.filename}>
          {doc.filename}
        </div>
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>{formatBytes(doc.filesize)}</span>
          <span>
            {doc.modified_at
              ? format(parseISO(doc.modified_at), "MMM d")
              : ""}
          </span>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onPreview} title="Preview">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button asChild size="icon" variant="ghost" className="h-7 w-7" title="Download">
            <a href={downloadUrl(doc.filename)} target="_blank" rel="noreferrer">
              <Download className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRename} title="Rename">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn("h-7 w-7 text-destructive hover:text-destructive")}
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Avoid unused imports
void X;

import { Box, Button, Card, CardContent, IconButton, TextField, Tooltip } from '@mui/material';
import { Refresh, Download } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import PageHeader from '@/components/common/PageHeader';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function LogsPage() {
  const log = useQuery({ queryKey: ['app-log'], queryFn: () => adminApi.applogView() });
  const [filter, setFilter] = useState('');

  const text = useMemo(() => {
    const raw =
      typeof log.data === 'string'
        ? log.data
        : log.data
          ? JSON.stringify(log.data, null, 2)
          : '';
    if (!filter.trim()) return raw;
    return raw
      .split('\n')
      .filter((l) => l.toLowerCase().includes(filter.toLowerCase()))
      .join('\n');
  }, [log.data, filter]);

  return (
    <Box>
      <PageHeader
        title="App Logs"
        subtitle="View and download application logs"
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton onClick={() => log.refetch()}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              startIcon={<Download />}
              variant="contained"
              component="a"
              href={adminApi.applogDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </Button>
          </>
        }
      />
      {log.isLoading ? (
        <LoadingScreen />
      ) : (
        <Card>
          <CardContent>
            <TextField
              size="small"
              fullWidth
              placeholder="Filter lines..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                borderRadius: 2,
                bgcolor: (t) => (t.palette.mode === 'dark' ? '#0a0e15' : '#f5f7fa'),
                fontSize: 12,
                fontFamily: 'Fira Code, Consolas, monospace',
                overflow: 'auto',
                maxHeight: '70vh',
                // whiteSpace: 'pre-wrap',
                // wordBreak: 'break-all',
              }}
            >
              {text || '(empty)'}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

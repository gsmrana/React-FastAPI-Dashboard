import { Box, Card, CardContent, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import PageHeader from '@/components/common/PageHeader';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function AppConfigPage() {
  const cfg = useQuery({ queryKey: ['app-config'], queryFn: () => adminApi.appconfig() });
  const [filter, setFilter] = useState('');

  const display = useMemo(() => {
    if (!cfg.data) return '';
    const text = JSON.stringify(cfg.data, null, 2);
    if (!filter.trim()) return text;
    const lines = text.split('\n');
    return lines.filter((l) => l.toLowerCase().includes(filter.toLowerCase())).join('\n');
  }, [cfg.data, filter]);

  return (
    <Box>
      <PageHeader title="App Config" subtitle="Read-only view of the running server configuration" />
      {cfg.isLoading ? (
        <LoadingScreen />
      ) : (
        <Card>
          <CardContent>
            <TextField
              size="small"
              fullWidth
              placeholder="Filter keys (case-insensitive)"
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
                fontSize: 13,
                fontFamily: 'Fira Code, Consolas, monospace',
                overflowX: 'auto',
                maxHeight: '70vh',
              }}
            >
              {display}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

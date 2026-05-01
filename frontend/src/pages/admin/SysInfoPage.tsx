import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import PageHeader from '@/components/common/PageHeader';
import LoadingScreen from '@/components/common/LoadingScreen';

function flatten(obj: unknown, prefix = ''): { key: string; value: string }[] {
  if (obj === null || obj === undefined) return [{ key: prefix, value: String(obj) }];
  if (typeof obj !== 'object') return [{ key: prefix, value: String(obj) }];
  if (Array.isArray(obj)) {
    return [{ key: prefix, value: obj.length === 0 ? '[]' : JSON.stringify(obj) }];
  }
  const out: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const nk = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flatten(v, nk));
    } else {
      out.push({
        key: nk,
        value: Array.isArray(v) ? JSON.stringify(v) : String(v),
      });
    }
  }
  return out;
}

export default function SysInfoPage() {
  const info = useQuery({
    queryKey: ['sysinfo'],
    queryFn: () => adminApi.sysinfo(),
    refetchInterval: 10_000,
  });

  return (
    <Box>
      <PageHeader
        title="System Info"
        subtitle="Live runtime, OS, CPU, memory and disk metrics"
        actions={
          <Tooltip title="Refresh">
            <IconButton onClick={() => info.refetch()}>
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />
      {info.isLoading ? (
        <LoadingScreen />
      ) : !info.data ? (
        <Typography color="error">Could not load system info.</Typography>
      ) : (
        <Grid container spacing={2}>
          {Object.entries(info.data).map(([section, value]) => (
            <Grid key={section} size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      {section.replace(/_/g, ' ')}
                    </Typography>
                    {/* <Chip size="small" label={typeof value === 'object' ? 'object' : 'value'} /> */}
                  </Stack>
                  <Stack spacing={0.75}>
                    {flatten(value).map((row) => (
                      <Stack
                        key={row.key}
                        direction="row"
                        justifyContent="space-between"
                        gap={2}
                        sx={{
                          fontSize: 13,
                          py: 0.5,
                          // borderBottom: 1,
                          // borderColor: 'divider',
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: 'monospace' }}
                          noWrap
                        >
                          {row.key}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            textAlign: 'right',
                            wordBreak: 'break-all',
                          }}
                        >
                          {row.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

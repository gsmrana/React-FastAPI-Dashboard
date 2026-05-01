import { Box, CircularProgress } from '@mui/material';

export default function LoadingScreen({ label }: { label?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
        color: 'text.secondary',
      }}
    >
      <CircularProgress />
      {label && <Box sx={{ fontSize: 14 }}>{label}</Box>}
    </Box>
  );
}

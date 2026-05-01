import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const nav = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <Typography variant="h1" sx={{ fontSize: 96, fontWeight: 800, opacity: 0.2 }}>
          404
        </Typography>
        <Typography variant="h5">Page not found</Typography>
        <Typography color="text.secondary">
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button variant="contained" onClick={() => nav('/')}>
          Back to dashboard
        </Button>
      </Stack>
    </Box>
  );
}

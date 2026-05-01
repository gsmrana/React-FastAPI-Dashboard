import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Inbox } from '@mui/icons-material';

export default function EmptyState({
  title = 'Nothing here yet',
  message,
  icon,
  action,
}: {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center',
        gap: 1.5,
        color: 'text.secondary',
      }}
    >
      <Box sx={{ fontSize: 56, opacity: 0.5 }}>{icon ?? <Inbox fontSize="inherit" />}</Box>
      <Typography variant="h6" color="text.primary">
        {title}
      </Typography>
      {message && <Typography variant="body2">{message}</Typography>}
      {action}
    </Box>
  );
}

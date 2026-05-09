import { APP_NAME } from '@/api/client';
import { Box, Container, IconButton, Paper, Tooltip, Typography, useTheme } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '@/contexts/ThemeContext';
import type { ReactNode } from 'react';

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
        background:
          theme.palette.mode === 'dark'
            ? `radial-gradient(1200px 600px at 10% 0%, ${theme.palette.primary.dark}33, transparent), radial-gradient(900px 500px at 90% 100%, ${theme.palette.secondary.dark}33, transparent), ${theme.palette.background.default}`
            : `radial-gradient(1200px 600px at 10% 0%, ${theme.palette.primary.light}55, transparent), radial-gradient(900px 500px at 90% 100%, ${theme.palette.secondary.light}55, transparent), ${theme.palette.background.default}`,
      }}
    >
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton onClick={toggleMode} color="inherit">
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Tooltip>
      </Box>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              width: 56,
              height: 56,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 24,
              mb: 2,
              boxShadow: 4,
            }}
          >
            {APP_NAME.charAt(0)}
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {APP_NAME}
          </Typography>
        </Box>
        <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }} elevation={6}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          )}
          {children}
        </Paper>
      </Container>
    </Box>
  );
}

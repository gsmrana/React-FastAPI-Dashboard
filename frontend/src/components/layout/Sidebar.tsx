import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NAV_ITEMS } from './navItems';
import { APP_NAME } from '@/api/client';

export const SIDEBAR_WIDTH = 248;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
}

export default function Sidebar({
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
  isMobile,
}: SidebarProps) {
  const { user } = useAuth();
  const theme = useTheme();

  const items = NAV_ITEMS.filter((it) => !it.adminOnly || user?.is_superuser);
  const grouped = items.reduce<Record<string, typeof items>>((acc, it) => {
    const g = it.group || 'Other';
    (acc[g] ||= []).push(it);
    return acc;
  }, {});

  const expanded = isMobile ? true : !collapsed;
  const width = expanded ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          px: 2,
          gap: 1.25,
          minHeight: 64,
          justifyContent: expanded ? 'flex-start' : 'center',
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          {APP_NAME.charAt(0)}
        </Box>
        {expanded && (
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
            {APP_NAME}
          </Typography>
        )}
      </Toolbar>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {Object.entries(grouped).map(([group, groupItems]) => (
          <Box key={group} sx={{ mb: 1 }}>
            {expanded && (
              <Typography
                variant="overline"
                sx={{
                  px: 2.5,
                  color: 'text.secondary',
                  fontSize: 11,
                  letterSpacing: 1,
                }}
              >
                {group}
              </Typography>
            )}
            <List dense disablePadding>
              {groupItems.map((it) => {
                const Icon = it.icon;
                const button = (
                  <ListItemButton
                    component={NavLink}
                    to={it.to}
                    end={it.to === '/'}
                    onClick={isMobile ? onMobileClose : undefined}
                    sx={{
                      mx: 1,
                      my: 0.25,
                      borderRadius: 2,
                      minHeight: 40,
                      justifyContent: expanded ? 'flex-start' : 'center',
                      px: expanded ? 1.5 : 0,
                      '&.active': {
                        bgcolor: 'action.selected',
                        color: 'primary.main',
                        '& .MuiListItemIcon-root': { color: 'primary.main' },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: expanded ? 2 : 0,
                        justifyContent: 'center',
                      }}
                    >
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    {expanded && <ListItemText primary={it.label} />}
                  </ListItemButton>
                );
                return (
                  <Box key={it.to}>
                    {expanded ? (
                      button
                    ) : (
                      <Tooltip title={it.label} placement="right">
                        <Box>{button}</Box>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
      {!isMobile && (
        <>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <Tooltip title={collapsed ? 'Expand' : 'Collapse'}>
              <IconButton size="small" onClick={onToggleCollapse}>
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </IconButton>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            duration: theme.transitions.duration.short,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

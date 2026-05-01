import {
  Dashboard as DashboardIcon,
  CheckCircleOutline as TodoIcon,
  Receipt as ExpenseIcon,
  StickyNote2 as NoteIcon,
  VpnKey as ServiceIcon,
  Folder as FilesIcon,
  Chat as ChatIcon,
  Person as ProfileIcon,
  AdminPanelSettings as AdminIcon,
  Group as UsersIcon,
  Memory as LlmIcon,
  Settings as ConfigIcon,
  MonitorHeart as SysInfoIcon,
  Article as LogIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavItem {
  to: string;
  label: string;
  icon: SvgIconComponent;
  adminOnly?: boolean;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, group: 'Main' },
  { to: '/todos', label: 'Todos', icon: TodoIcon, group: 'Main' },
  { to: '/expenses', label: 'Expenses', icon: ExpenseIcon, group: 'Main' },
  { to: '/notepad', label: 'Notepad', icon: NoteIcon, group: 'Main' },
  { to: '/services', label: 'Services', icon: ServiceIcon, group: 'Main' },
  { to: '/files', label: 'File Manager', icon: FilesIcon, group: 'Main' },
  { to: '/chatbot', label: 'Chatbot', icon: ChatIcon, group: 'Main' },
  // { to: '/profile', label: 'Profile', icon: ProfileIcon, group: 'Account' },
  { to: '/admin/users', label: 'Users', icon: UsersIcon, adminOnly: true, group: 'Admin' },
  { to: '/admin/llm-manager', label: 'LLM Manager', icon: LlmIcon, adminOnly: true, group: 'Admin' },
  { to: '/admin/app-config', label: 'App Config', icon: ConfigIcon, adminOnly: true, group: 'Admin' },
  { to: '/admin/logs', label: 'App Logs', icon: LogIcon, adminOnly: true, group: 'Admin' },
  { to: '/admin/sysinfo', label: 'System Info', icon: SysInfoIcon, adminOnly: true, group: 'Admin' },
];

export { AdminIcon };

import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { ProtectedRoute, AdminRoute } from '@/components/layout/ProtectedRoute';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyPage from '@/pages/auth/VerifyPage';

import DashboardPage from '@/pages/DashboardPage';
import TodosPage from '@/pages/TodosPage';
import ExpensesPage from '@/pages/ExpensesPage';
import NotepadPage from '@/pages/NotepadPage';
import ServicesPage from '@/pages/ServicesPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ChatbotPage from '@/pages/ChatbotPage';
import ProfilePage from '@/pages/ProfilePage';

import UsersAdminPage from '@/pages/admin/UsersAdminPage';
import LlmManagerPage from '@/pages/admin/LlmManagerPage';
import AppConfigPage from '@/pages/admin/AppConfigPage';
import SysInfoPage from '@/pages/admin/SysInfoPage';
import LogsPage from '@/pages/admin/LogsPage';

import NotFoundPage from '@/pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public auth pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify" element={<VerifyPage />} />

      {/* Protected app */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/notepad" element={<NotepadPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/files" element={<DocumentsPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin */}
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UsersAdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/llm-manager"
          element={
            <AdminRoute>
              <LlmManagerPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/app-config"
          element={
            <AdminRoute>
              <AppConfigPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sysinfo"
          element={
            <AdminRoute>
              <SysInfoPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <AdminRoute>
              <LogsPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AdminRoute, ProtectedRoute } from "@/components/layout/protected-route";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Verify from "@/pages/auth/Verify";

import Dashboard from "@/pages/Dashboard";
import Files from "@/pages/Files";
import Chat from "@/pages/Chat";
import Notes from "@/pages/Notes";
import Todos from "@/pages/Todos";
import Expenses from "@/pages/Expenses";
import Services from "@/pages/Services";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

import AdminUsers from "@/pages/admin/Users";
import AdminLlm from "@/pages/admin/LlmManager";
import AdminConfig from "@/pages/admin/AppConfig";
import AdminSystem from "@/pages/admin/SystemInfo";
import AdminLogs from "@/pages/admin/Logs";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/verify", element: <Verify /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/files", element: <Files /> },
      { path: "/chat", element: <Chat /> },
      { path: "/notes", element: <Notes /> },
      { path: "/todos", element: <Todos /> },
      { path: "/expenses", element: <Expenses /> },
      { path: "/services", element: <Services /> },
      { path: "/profile", element: <Profile /> },
      {
        path: "/admin",
        element: (
          <AdminRoute>
            <Navigate to="/admin/users" replace />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/llm",
        element: (
          <AdminRoute>
            <AdminLlm />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/config",
        element: (
          <AdminRoute>
            <AdminConfig />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/system",
        element: (
          <AdminRoute>
            <AdminSystem />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/logs",
        element: (
          <AdminRoute>
            <AdminLogs />
          </AdminRoute>
        ),
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

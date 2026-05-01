import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRead } from "@/types/api";

interface AuthState {
  user: UserRead | null;
  isLoading: boolean;
  setUser: (u: UserRead | null) => void;
  setLoading: (b: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      clear: () => set({ user: null, isLoading: false }),
    }),
    {
      name: "nexus-auth",
      partialize: (s) => ({ user: s.user }),
    },
  ),
);

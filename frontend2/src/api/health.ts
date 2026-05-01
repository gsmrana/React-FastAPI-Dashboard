import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { HealthLive, HealthReady } from "@/types/api";

const healthApi = axios.create({ baseURL: "/health", withCredentials: true });

export function useHealthLive() {
  return useQuery({
    queryKey: ["health", "live"],
    queryFn: async () => (await healthApi.get<HealthLive>("/live")).data,
    refetchInterval: 10_000,
  });
}

export function useHealthReady() {
  return useQuery({
    queryKey: ["health", "ready"],
    queryFn: async () => (await healthApi.get<HealthReady>("/ready")).data,
    refetchInterval: 10_000,
  });
}

// Lightweight API client for taggyManagement.API
export const API_BASE_URL =
   "http://localhost:5158";

const TOKEN_KEY = "taggy_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Options = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
};

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal } = opts;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "title" in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).title)
        : undefined) ||
      (data && typeof data === "object" && "detail" in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).detail)
        : undefined) ||
      (typeof data === "string" ? data : undefined) ||
      `Erro ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

// ---------- DTO Types ----------
export type PropulsionType = "Electric" | "Hybrid" | "Combustion";

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  propulsion: PropulsionType;
  fuelConsumptionKmPerLiter?: number | null;
  cO2GramsPerKm?: number | null;
  batteryKwhPerKm?: number | null;
}

export interface AutoRefillSettings {
  id: string;
  userId: string;
  enabled: boolean;
  minimumBalance: number;
  rechargeAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagBalance {
  balance: number;
}

export type TransactionType = "Recharge" | "TollDebit";

export interface Transaction {
  id: string;
  tagAccountId: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  vehicleId: string;
  distanceKm: number;
  tollCost: number;
  fuelCost: number;
  energyCost: number;
  totalCost: number;
  cO2EmissionKg: number;
  createdAt: string;
}

export interface SimulateTollResponse {
  previousBalance: number;
  tollAmount: number;
  currentBalance: number;
  autoRefillTriggered: boolean;
}

// ---------- Endpoints ----------
export const Auth = {
  register: (body: { fullName: string; email: string; password: string; confirmPassword: string }) =>
    api<unknown>("/api/v1/auth/register", { method: "POST", body, auth: false }),
  login: (body: { email: string; password: string }) =>
    api<Record<string, unknown>>("/api/v1/auth/login", { method: "POST", body, auth: false }),
};

export const Users = {
  me: () => api<Record<string, unknown>>("/api/v1/users/me"),
  update: (body: { fullName: string; email: string }) =>
    api<unknown>("/api/v1/users/me", { method: "PUT", body }),
  changePassword: (body: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
    api<unknown>("/api/v1/users/me/password", { method: "PATCH", body }),
  remove: () => api<unknown>("/api/v1/users/me", { method: "DELETE" }),
};

export const Vehicles = {
  list: () => api<Vehicle[]>("/api/v1/vehicles"),
  get: (id: string) => api<Vehicle>(`/api/v1/vehicles/${id}`),
  create: (body: Omit<Vehicle, "id">) => api<Vehicle>("/api/v1/vehicles", { method: "POST", body }),
  update: (id: string, body: Omit<Vehicle, "id">) =>
    api<Vehicle>(`/api/v1/vehicles/${id}`, { method: "PUT", body }),
  remove: (id: string) => api<unknown>(`/api/v1/vehicles/${id}`, { method: "DELETE" }),
};

export const TagAccount = {
  balance: () => api<TagBalance>("/api/v1/tag-account/balance"),
  recharge: (amount: number) =>
    api<TagBalance>("/api/v1/tag-account/recharge", { method: "POST", body: { amount } }),
  statement: () => api<Transaction[]>("/api/v1/tag-account/statement"),
};

export const AutoRefill = {
  get: () => api<AutoRefillSettings>("/api/v1/auto-refill"),
  configure: (body: { enabled: boolean; minimumBalance: number; rechargeAmount: number }) =>
    api<AutoRefillSettings>("/api/v1/auto-refill", { method: "POST", body }),
};

export const Toll = {
  simulate: (body: { amount: number; description: string }) =>
    api<SimulateTollResponse>("/api/v1/toll/simulate", { method: "POST", body }),
};

export interface TripInput {
  vehicleId: string;
  distanceKm: number;
  fuelPrice: number;
  energyPrice: number;
  tollPrices: number[];
}

export const Trips = {
  list: () => api<Trip[]>("/api/v1/trips"),
  get: (id: string) => api<Trip>(`/api/v1/trips/${id}`),
  create: (body: TripInput) => api<Trip>("/api/v1/trips", { method: "POST", body }),
  calculate: (body: TripInput) => api<Trip>("/api/v1/trips/calculate", { method: "POST", body }),
};

// Extract token from various login response shapes
export function extractToken(payload: Record<string, unknown>): string | null {
  const candidates = ["token", "accessToken", "access_token", "jwt", "id_token"];
  for (const key of candidates) {
    const v = payload[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  // nested under data
  if (payload.data && typeof payload.data === "object") {
    return extractToken(payload.data as Record<string, unknown>);
  }
  return null;
}

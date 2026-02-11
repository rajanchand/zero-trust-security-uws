// MongoDB proxy client — calls the Express proxy server directly.
// In Docker, requests go through nginx reverse proxy: /api -> proxy-server:3000
// Locally, set VITE_MONGO_PROXY_URL=http://localhost:3000
const MONGO_PROXY_URL = import.meta.env.VITE_MONGO_PROXY_URL || "/api";
const MONGO_PROXY_SECRET = import.meta.env.VITE_MONGO_PROXY_SECRET || "secret";

interface MongoRequest {
  action: "find" | "findOne" | "insertOne" | "insertMany" | "updateOne" | "updateMany" | "deleteOne" | "deleteMany" | "count" | "aggregate";
  collection: string;
  database?: string;
  query?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  filter?: Record<string, unknown>;
  update?: Record<string, unknown>;
  options?: { limit?: number; sort?: Record<string, number> };
}

export async function mongoQuery<T = unknown>(request: MongoRequest): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${MONGO_PROXY_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(MONGO_PROXY_SECRET ? { "x-proxy-secret": MONGO_PROXY_SECRET } : {}),
      },
      body: JSON.stringify(request),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "MongoDB request failed" };
  }
}

// Convenience helpers
export const mongo = {
  find: <T = unknown>(collection: string, query?: Record<string, unknown>, options?: { limit?: number }) =>
    mongoQuery<T[]>({ action: "find", collection, query, options }),

  findOne: <T = unknown>(collection: string, query: Record<string, unknown>) =>
    mongoQuery<T>({ action: "findOne", collection, query }),

  insertOne: (collection: string, data: Record<string, unknown>) =>
    mongoQuery({ action: "insertOne", collection, data }),

  insertMany: (collection: string, data: Record<string, unknown>[]) =>
    mongoQuery({ action: "insertMany", collection, data }),

  updateOne: (collection: string, filter: Record<string, unknown>, update: Record<string, unknown>) =>
    mongoQuery({ action: "updateOne", collection, filter, update }),

  deleteOne: (collection: string, query: Record<string, unknown>) =>
    mongoQuery({ action: "deleteOne", collection, query }),

  count: (collection: string, query?: Record<string, unknown>) =>
    mongoQuery<number>({ action: "count", collection, query }),
};

/**
 * Log an OTP code to the backend server console.
 * This makes OTPs visible in `docker logs` / VS Code terminal.
 */
export async function logOTP(data: { email?: string; mobile?: string; otp: string; type: string; channel?: string }) {
  try {
    await fetch(`${MONGO_PROXY_URL}/otp-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(MONGO_PROXY_SECRET ? { "x-proxy-secret": MONGO_PROXY_SECRET } : {}),
      },
      body: JSON.stringify(data),
    });
  } catch {
    // Silently ignore — server logging is best-effort
  }
}

/**
 * Log a full auth event to the backend server console.
 * Shows user info, OTP, IP, location, device, and policy decision in `docker logs`.
 */
export async function logEvent(data: {
  event: string;
  user?: { fullName?: string; email?: string; mobile?: string; role?: string; status?: string };
  otp?: { code: string; channel?: string; type?: string };
  ip?: string;
  location?: string;
  device?: { browser?: string; os?: string; approved?: boolean; fingerprint?: string; posture?: Record<string, boolean> };
  policy?: { decision?: string; riskScore?: number; reasons?: string[] };
  details?: string;
}) {
  try {
    await fetch(`${MONGO_PROXY_URL}/event-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(MONGO_PROXY_SECRET ? { "x-proxy-secret": MONGO_PROXY_SECRET } : {}),
      },
      body: JSON.stringify(data),
    });
  } catch {
    // Silently ignore — server logging is best-effort
  }
}

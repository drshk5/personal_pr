type TimeoutConfig = {
  short: number;
  medium: number;
  long: number;
  signalR: number;
};

const getProcessEnv = (key: string): string | undefined => {
  const value = process.env[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return undefined;
};

const parsePositiveInt = (key: string, fallback: number): number => {
  const value = getProcessEnv(key);
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeUrl = (url: string | undefined, fallback: string): string => {
  const candidate = url ?? fallback;
  try {
    return new URL(candidate).toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
};

const baseUrl = normalizeUrl(
  getProcessEnv("PLAYWRIGHT_BASE_URL") ?? getProcessEnv("VITE_TEST_BASE_URL"),
  "http://localhost:5173"
);

const timeout: TimeoutConfig = {
  short: parsePositiveInt("PLAYWRIGHT_TIMEOUT_SHORT_MS", 5000),
  medium: parsePositiveInt("PLAYWRIGHT_TIMEOUT_MEDIUM_MS", 10000),
  long: parsePositiveInt("PLAYWRIGHT_TIMEOUT_LONG_MS", 30000),
  signalR: parsePositiveInt("PLAYWRIGHT_TIMEOUT_SIGNALR_MS", 15000),
};

export const testRuntime = {
  baseUrl,
  timeout,
};

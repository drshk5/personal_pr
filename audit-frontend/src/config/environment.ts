type RuntimeEnv = Record<string, string | undefined>;

const getRuntimeEnv = (): RuntimeEnv => {
  try {
    const viteEnv = (import.meta as ImportMeta & { env?: RuntimeEnv }).env;
    if (viteEnv && typeof viteEnv === "object") {
      return viteEnv;
    }
  } catch {
    // import.meta is unavailable in some Node-side loaders.
  }

  const nodeEnv = (globalThis as { process?: { env?: RuntimeEnv } }).process
    ?.env;
  if (nodeEnv && typeof nodeEnv === "object") {
    return nodeEnv;
  }

  return {};
};

const runtimeEnv = getRuntimeEnv();

const getEnv = (key: string, fallback?: string): string | undefined => {
  const value = runtimeEnv?.[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
};

const normalizeLocalDevUrl = (url?: string) => {
  if (!url) {
    return url;
  }

  try {
    return new URL(url).toString().replace(/\/$/, "");
  } catch {
    return url;
  }
};

const parsePositiveInt = (key: string, fallback: number): number => {
  const value = getEnv(key);
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const baseUrl =
  normalizeLocalDevUrl(getEnv("VITE_BASE_URL", "http://localhost:5001")) ??
  "http://localhost:5001";
const hubUrl =
  normalizeLocalDevUrl(getEnv("VITE_HUB_URL", baseUrl)) ?? baseUrl;

const testBaseUrl =
  normalizeLocalDevUrl(
    getEnv("PLAYWRIGHT_BASE_URL", getEnv("VITE_TEST_BASE_URL"))
  ) ?? "http://localhost:5173";

export const environment = {
  baseUrl,
  hubUrl,

  // CDN Configuration for Module Images
  // Set this to your CDN URL (e.g., Cloudflare, AWS CloudFront, etc.)
  // Leave empty to use local backend serving
  cdnUrl: "", // Example: "https://cdn.yourdomain.com"

  // Module images path on CDN or backend
  moduleImagesPath: "/Uploads/ModuleImages",

  // Playwright and Node-side test config
  test: {
    baseUrl: testBaseUrl,
    timeout: {
      short: parsePositiveInt("PLAYWRIGHT_TIMEOUT_SHORT_MS", 5000),
      medium: parsePositiveInt("PLAYWRIGHT_TIMEOUT_MEDIUM_MS", 10000),
      long: parsePositiveInt("PLAYWRIGHT_TIMEOUT_LONG_MS", 30000),
      signalR: parsePositiveInt("PLAYWRIGHT_TIMEOUT_SIGNALR_MS", 15000),
    },
  },
};

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

const baseUrl = normalizeLocalDevUrl(import.meta.env.VITE_BASE_URL);
const hubUrl = normalizeLocalDevUrl(import.meta.env.VITE_HUB_URL) ?? baseUrl;

export const environment = {
  baseUrl,
  hubUrl,

  // CDN Configuration for Module Images
  // Set this to your CDN URL (e.g., Cloudflare, AWS CloudFront, etc.)
  // Leave empty to use local backend serving
  cdnUrl: "", // Example: "https://cdn.yourdomain.com"

  // Module images path on CDN or backend
  moduleImagesPath: "/Uploads/ModuleImages",

  // Test environment
  // test: {
  //   baseUrl: "http://localhost:5173",
  //   timeout: {
  //     short: 5000,
  //     medium: 10000,
  //     long: 30000,
  //     signalR: 15000,
  //   },
  // },
};

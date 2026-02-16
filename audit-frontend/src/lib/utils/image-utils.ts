import { environment } from "@/config/environment";

export function getImagePath(
  imagePath: string | null | undefined
): string | undefined {
  if (!imagePath) return undefined;

  if (imagePath.startsWith("data:")) return imagePath;

  if (imagePath === "") return undefined;

  const baseUrl = environment.baseUrl;
  return `${baseUrl}${imagePath}`;
}

/**
 * Get the CDN URL for module images if CDN is configured,
 * otherwise falls back to backend serving
 */
export function getModuleImagePath(
  imagePath: string | null | undefined
): string | undefined {
  if (!imagePath) return undefined;

  if (imagePath.startsWith("data:")) return imagePath;

  if (imagePath === "") return undefined;

  // Check if CDN is configured
  const cdnUrl = environment.cdnUrl;

  if (cdnUrl) {
    // Use CDN for module images
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith("/")
      ? imagePath.slice(1)
      : imagePath;
    return `${cdnUrl}/${cleanPath}`;
  }

  // Fallback to local backend serving
  const baseUrl = environment.baseUrl;
  return `${baseUrl}${imagePath}`;
}

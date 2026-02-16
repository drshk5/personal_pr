import React, { useState, useCallback } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { cn } from "@/lib/utils";
import "react-lazy-load-image-component/src/effects/blur.css";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  placeholderClassName?: string;
  onError?: () => void;
  onLoad?: () => void;
  loading?: "lazy" | "eager";
  threshold?: number;
  rootMargin?: string;
}

// Generate a simple blur placeholder (low-quality base64 encoded 1x1 pixel)
const generateBlurPlaceholder = (): string => {
  // A tiny 1x1 pixel transparent PNG as base64
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=";
};

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  placeholderClassName,
  onError,
  onLoad,
  loading = "lazy",
  threshold: _threshold = 0.1,
  rootMargin = "50px",
}) => {
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Convert rootMargin string (e.g., "50px") to pixels for threshold
  // The library's threshold is in pixels (distance from viewport edge)
  const getThresholdInPixels = (): number => {
    const match = rootMargin.match(/(\d+)/);
    const marginPixels = match ? parseInt(match[1], 10) : 50;
    // Also consider the threshold ratio if provided
    // Default threshold of 0.1 means load when 10% of image is visible
    // We'll use the rootMargin value directly as pixels
    return marginPixels;
  };

  const blurPlaceholder = generateBlurPlaceholder();

  // If loading is eager, use regular img tag
  if (loading === "eager") {
    return (
      <div
        className={cn("relative overflow-hidden", containerClassName)}
      >
        {!hasError ? (
          <img
            src={src}
            alt={alt}
            className={cn("transition-opacity duration-300", className)}
            onLoad={handleLoad}
            onError={handleError}
            loading="eager"
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-muted flex items-center justify-center",
              placeholderClassName
            )}
            aria-hidden="true"
          >
            <div className="text-muted-foreground text-xs">Failed to load</div>
          </div>
        )}
      </div>
    );
  }

  // Use LazyLoadImage for lazy loading
  return (
    <div
      className={cn("relative overflow-hidden", containerClassName)}
    >
      {!hasError ? (
        <LazyLoadImage
          src={src}
          alt={alt}
          className={cn("transition-opacity duration-300", className)}
          placeholderSrc={blurPlaceholder}
          effect="blur"
          threshold={getThresholdInPixels()}
          visibleByDefault={false}
          wrapperClassName="w-full h-full"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 bg-muted flex items-center justify-center",
            placeholderClassName
          )}
          aria-hidden="true"
        >
          <div className="text-muted-foreground text-xs">Failed to load</div>
        </div>
      )}
    </div>
  );
};


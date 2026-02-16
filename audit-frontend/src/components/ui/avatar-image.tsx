import React from "react";
import { User, Building2 } from "lucide-react";
import { getImagePath } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";

interface AvatarImageProps {
  imagePath?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg";
  type?: "user" | "organization";
  className?: string;
}

/**
 * A reusable avatar component that handles image display with fallbacks
 */
export function AvatarImage({
  imagePath,
  alt = "Avatar",
  size = "md",
  type = "user",
  className = "",
}: AvatarImageProps) {
  // Determine the image URL using the utility function
  const imageUrl = getImagePath(imagePath);

  // Handle image loading error by setting a placeholder
  const [hasError, setHasError] = React.useState(false);

  // Define size classes
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  // Define icon size based on avatar size
  const iconSize = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
  };

  // If no image or error loading, show placeholder
  if (!imageUrl || hasError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center ${className}`}
      >
        {type === "user" ? (
          <User size={iconSize[size]} className="text-muted-foreground" />
        ) : (
          <Building2 size={iconSize[size]} className="text-muted-foreground" />
        )}
      </div>
    );
  }

  // Show the actual image with lazy loading
  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}
    >
      <LazyImage
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        containerClassName="w-full h-full rounded-full"
        placeholderClassName="rounded-full"
        loading="lazy"
        threshold={100}
        rootMargin="50px"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

/// <reference types="vite/client" />

declare module "react-lazy-load-image-component" {
  import { Component, ImgHTMLAttributes } from "react";

  export interface LazyLoadImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    placeholderSrc?: string;
    effect?: "blur" | "opacity" | "black-and-white";
    threshold?: number;
    visibleByDefault?: boolean;
    wrapperClassName?: string;
    wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
    scrollPosition?: { x: number; y: number };
    delayMethod?: "throttle" | "debounce";
    delayTime?: number;
    useIntersectionObserver?: boolean;
  }

  export const LazyLoadImage: React.FC<LazyLoadImageProps>;
}
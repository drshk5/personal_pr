import { useEffect, useState } from "react";

type ColorScheme =
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose";

const colorSchemes: Record<ColorScheme, Record<string, string>> = {
  slate: {
    primary: "oklch(0.55 0.08 255)",
    accent: "oklch(0.7 0.06 250)",
    ring: "oklch(0.55 0.08 255 / 35%)",
    border: "oklch(0.55 0.04 255 / 20%)",
  },
  gray: {
    primary: "oklch(0.5 0.05 0)",
    accent: "oklch(0.65 0.05 0)",
    ring: "oklch(0.5 0.05 0 / 35%)",
    border: "oklch(0.5 0.05 0 / 20%)",
  },
  zinc: {
    primary: "oklch(0.5 0.04 0)",
    accent: "oklch(0.65 0.03 0)",
    ring: "oklch(0.5 0.04 0 / 35%)",
    border: "oklch(0.5 0.03 0 / 20%)",
  },
  neutral: {
    primary: "oklch(0.5 0.02 0)",
    accent: "oklch(0.65 0.01 0)",
    ring: "oklch(0.5 0.02 0 / 35%)",
    border: "oklch(0.5 0.01 0 / 20%)",
  },
  stone: {
    primary: "oklch(0.5 0.05 85)",
    accent: "oklch(0.65 0.04 80)",
    ring: "oklch(0.5 0.05 85 / 35%)",
    border: "oklch(0.5 0.03 85 / 20%)",
  },
  red: {
    primary: "oklch(0.65 0.28 25)",
    accent: "oklch(0.75 0.22 20)",
    ring: "oklch(0.65 0.28 25 / 35%)",
    border: "oklch(0.65 0.18 25 / 20%)",
  },
  orange: {
    primary: "oklch(0.65 0.25 45)",
    accent: "oklch(0.75 0.2 40)",
    ring: "oklch(0.65 0.25 45 / 35%)",
    border: "oklch(0.65 0.15 45 / 20%)",
  },
  amber: {
    primary: "oklch(0.7 0.26 75)",
    accent: "oklch(0.8 0.19 70)",
    ring: "oklch(0.7 0.26 75 / 35%)",
    border: "oklch(0.7 0.16 75 / 20%)",
  },
  yellow: {
    primary: "oklch(0.85 0.2 85)",
    accent: "oklch(0.9 0.15 80)",
    ring: "oklch(0.85 0.2 85 / 35%)",
    border: "oklch(0.85 0.12 85 / 20%)",
  },
  lime: {
    primary: "oklch(0.8 0.22 125)",
    accent: "oklch(0.85 0.16 120)",
    ring: "oklch(0.8 0.22 125 / 35%)",
    border: "oklch(0.8 0.12 125 / 20%)",
  },
  green: {
    primary: "oklch(0.59 0.22 145)",
    accent: "oklch(0.73 0.18 150)",
    ring: "oklch(0.59 0.22 145 / 35%)",
    border: "oklch(0.59 0.12 145 / 20%)",
  },
  emerald: {
    primary: "oklch(0.62 0.25 155)",
    accent: "oklch(0.72 0.18 150)",
    ring: "oklch(0.62 0.25 155 / 35%)",
    border: "oklch(0.62 0.15 155 / 20%)",
  },
  teal: {
    primary: "oklch(0.6 0.22 195)",
    accent: "oklch(0.75 0.18 200)",
    ring: "oklch(0.6 0.22 195 / 35%)",
    border: "oklch(0.6 0.12 195 / 20%)",
  },
  cyan: {
    primary: "oklch(0.7 0.2 205)",
    accent: "oklch(0.8 0.15 210)",
    ring: "oklch(0.7 0.2 205 / 35%)",
    border: "oklch(0.7 0.1 205 / 20%)",
  },
  sky: {
    primary: "oklch(0.65 0.21 225)",
    accent: "oklch(0.75 0.18 230)",
    ring: "oklch(0.65 0.21 225 / 35%)",
    border: "oklch(0.65 0.11 225 / 20%)",
  },
  blue: {
    primary: "oklch(0.6 0.22 241)",
    accent: "oklch(0.75 0.18 235)",
    ring: "oklch(0.6 0.22 241 / 35%)",
    border: "oklch(0.6 0.12 241 / 20%)",
  },
  indigo: {
    primary: "oklch(0.55 0.24 265)",
    accent: "oklch(0.7 0.18 260)",
    ring: "oklch(0.55 0.24 265 / 35%)",
    border: "oklch(0.55 0.14 265 / 20%)",
  },
  violet: {
    primary: "oklch(0.58 0.24 280)",
    accent: "oklch(0.73 0.18 275)",
    ring: "oklch(0.58 0.24 280 / 35%)",
    border: "oklch(0.58 0.14 280 / 20%)",
  },
  purple: {
    primary: "oklch(0.6 0.24 290)",
    accent: "oklch(0.75 0.18 285)",
    ring: "oklch(0.6 0.24 290 / 35%)",
    border: "oklch(0.6 0.14 290 / 20%)",
  },
  fuchsia: {
    primary: "oklch(0.63 0.25 310)",
    accent: "oklch(0.78 0.19 305)",
    ring: "oklch(0.63 0.25 310 / 35%)",
    border: "oklch(0.63 0.15 310 / 20%)",
  },
  pink: {
    primary: "oklch(0.65 0.26 330)",
    accent: "oklch(0.75 0.2 335)",
    ring: "oklch(0.65 0.26 330 / 35%)",
    border: "oklch(0.65 0.16 330 / 20%)",
  },
  rose: {
    primary: "oklch(0.63 0.27 5)",
    accent: "oklch(0.78 0.21 10)",
    ring: "oklch(0.63 0.27 5 / 35%)",
    border: "oklch(0.63 0.17 5 / 20%)",
  },
};

const COLOR_SCHEME_KEY = "color-scheme";

export function useThemeColor() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const savedScheme = localStorage?.getItem(COLOR_SCHEME_KEY) as ColorScheme;
    return savedScheme && colorSchemes[savedScheme] ? savedScheme : "blue";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const colors = colorSchemes[colorScheme];
    Object.entries(colors).forEach(([key, value]) => {
      // Skip setting border to keep it neutral
      if (key !== "border") {
        root.style.setProperty(`--${key}`, value);
      }
    });

    localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
  }, [colorScheme]);

  return {
    colorScheme,
    setColorScheme,
    availableColorSchemes: Object.keys(colorSchemes) as ColorScheme[],
    getColorForScheme: (scheme: ColorScheme) => colorSchemes[scheme].primary,
  };
}

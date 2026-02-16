import { Component } from "react";

class PageLoaderInner extends Component {
  constructor(props: object) {
    super(props);
    this.applyThemeFromLocalStorage();
  }

  private applyThemeFromLocalStorage(): void {
    try {
      const root = window.document.documentElement;
      const storedTheme = localStorage.getItem("theme");

      root.classList.remove("light", "dark");

      if (storedTheme === "system" || !storedTheme) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(storedTheme);
      }
    } catch (error) {
      console.error("Error applying theme:", error);
    }
  }

  componentDidMount(): void {
    this.applyThemeFromLocalStorage();
  }

  render() {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-background">
        <style>
          {`
            @keyframes scaleAnimation {
              from {
                transform: scale(2);
              }
              to {
                transform: scale(1);
              }
            }
            .scale-dot {
              animation: scaleAnimation 1s alternate infinite;
            }
            .scale-dot:nth-child(2) {
              animation-delay: 0.2s;
            }
            .scale-dot:nth-child(3) {
              animation-delay: 0.4s;
            }
            .scale-dot:nth-child(4) {
              animation-delay: 0.6s;
            }
            .scale-dot:nth-child(5) {
              animation-delay: 0.8s;
            }
          `}
        </style>
        <div className="flex flex-col items-center gap-4">
          {/* Loading text */}
          <p className="text-lg font-semibold text-foreground animate-pulse">
            Loading...
          </p>
          <div className="flex gap-2 items-center justify-center">
            <span className="w-3 h-3 bg-primary rounded-full inline-block scale-dot"></span>
            <span className="w-3 h-3 bg-primary rounded-full inline-block scale-dot"></span>
            <span className="w-3 h-3 bg-primary rounded-full inline-block scale-dot"></span>
            <span className="w-3 h-3 bg-primary rounded-full inline-block scale-dot"></span>
            <span className="w-3 h-3 bg-primary rounded-full inline-block scale-dot"></span>
          </div>
        </div>
      </div>
    );
  }
}

export const PageLoader = () => <PageLoaderInner />;

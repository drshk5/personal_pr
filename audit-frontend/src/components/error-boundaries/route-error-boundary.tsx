import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryInner extends Component<
  Props & { onNavigateHome: () => void },
  State
> {
  constructor(props: Props & { onNavigateHome: () => void }) {
    super(props);
    this.state = { hasError: false };
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

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Route error:", error, errorInfo);
    this.applyThemeFromLocalStorage();
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full flex flex-col items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-6xl font-bold text-primary">404</h1>
              <p className="text-sm text-muted-foreground">Navigation Error</p>
              <p className="text-lg text-foreground max-w-md">
                There was a problem loading this page. This could be due to a
                permission issue or a problem with the application.
              </p>
              {this.state.error && (
                <p className="text-sm text-muted-foreground max-w-md">
                  Error: {this.state.error.message}
                </p>
              )}
              <Button
                variant="default"
                onClick={this.props.onNavigateHome}
                className="mt-4"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export with navigation hook
export function RouteErrorBoundary({ children }: Props): React.ReactElement {
  const navigate = useNavigate();

  const handleNavigateHome = React.useCallback(() => {
    navigate("/welcome");
  }, [navigate]);

  return (
    <ErrorBoundaryInner onNavigateHome={handleNavigateHome}>
      {children}
    </ErrorBoundaryInner>
  );
}

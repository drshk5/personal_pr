import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/contexts/theme/theme-provider";
import "@/styles/sonner.css";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      closeButton={true}
      position="top-right"
      toastOptions={{
        classNames: {
          // ✅ Light mode = File 1 (unchanged)
          // ✅ Dark mode = File 2 (added)
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border-color group-[.toaster]:shadow-lg dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800",
          description:
            "group-[.toast]:text-muted-foreground dark:text-zinc-400",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground dark:bg-gray-100 dark:text-gray-700 dark:hover:bg-gray-200/90",

          // ✅ Extra dark mode variants from File 2 (light untouched)
          success:
            "!bg-green-100 !text-green-800 border-green-200 dark:!bg-green-950 dark:!text-green-200",
          error:
            "!bg-red-100 !text-red-700 border-red-200 dark:!bg-rose-950 dark:!text-rose-200 dark:border-rose-900",
          warning:
            "!bg-amber-100 !text-amber-700 border-amber-200 dark:!bg-yellow-950 dark:!text-yellow-200 dark:border-yellow-900",
          info: "!bg-sky-100 !text-sky-700 border-sky-200 dark:!bg-blue-950 dark:!text-blue-200 dark:border-blue-900",
        },
      }}
      {...props}
    />
  );
}

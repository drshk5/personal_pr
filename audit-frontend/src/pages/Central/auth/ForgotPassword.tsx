import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useForgotPassword } from "@/hooks/api/central/use-auth";

import { ThemeToggle } from "@/components/shared/theme-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { ThemeProvider } from "@/contexts/theme/theme-provider";

import "@/styles/animations.css";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const { mutate: forgotPassword, isPending: isLoading } = useForgotPassword();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotPassword(
      { email: values.email },
      {
        onSuccess: () => {
          setTimeout(() => {
            navigate("/auth/change-password", {
              state: { email: values.email, fromForgotPassword: true },
            });
          }, 1000);
        },
      }
    );
  };

  return (
    <ThemeProvider defaultTheme="system">
      <div className="flex min-h-screen items-center justify-center bg-background bg-linear-to-br from-background to-background/90 p-4 relative">
        <Toaster />

        <div className="absolute bottom-4 left-4 z-10">
          <ThemeToggle />
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg border-border-color shadow-lg backdrop-blur-sm animate-fade-in-up"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-extrabold bg-linear-to-r from-primary to-primary/70 text-transparent bg-clip-text">
                  Forgot Password
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your email to receive an OTP
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="m@example.com"
                      disabled={isLoading}
                      className="focus-visible:ring-primary/30 transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-medium transition-all hover:shadow-md bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>

            <div className="text-center text-sm pt-2">
              <Link
                to="/auth/login"
                className="text-primary underline-offset-4 transition-colors hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </ThemeProvider>
  );
}

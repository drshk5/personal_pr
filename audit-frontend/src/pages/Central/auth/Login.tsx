import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AxiosError } from "axios";

import { useAuth } from "@/hooks/api/central/use-auth";
import { useToken } from "@/hooks/common/use-token";
import type {
  SessionExistsError,
  ActiveSessionInfo,
} from "@/types/central/user";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/theme/theme-provider";
import { ThemeToggle } from "@/components/shared/theme-switcher";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ModalDialog } from "@/components/ui/modal-dialog";
import {
  Status,
  StatusIndicator,
  StatusLabel,
} from "@/components/ui/shadcn-io/status";

import "@/styles/animations.css";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { isLoadingUser, login, isLoggingIn, loginError } = useAuth();
  const { hasToken } = useToken();
  const navigate = useNavigate();
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionInfo[]>([]);
  const [pendingCredentials, setPendingCredentials] = useState<{
    strEmailId: string;
    strPassword: string;
  } | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Redirect when there's a valid auth token
    if (hasToken) {
      navigate("/welcome", { replace: true });
    }
  }, [hasToken, navigate]);

  // Handle session conflict error
  useEffect(() => {
    if (loginError && loginError instanceof AxiosError) {
      const errorResponse = loginError.response?.data as SessionExistsError;
      if (errorResponse?.statusCode === 409 && errorResponse?.data?.sessions) {
        setActiveSessions(errorResponse.data.sessions);
        setShowSessionDialog(true);
      }
    }
  }, [loginError]);

  const onSubmit = (values: LoginFormValues) => {
    if (isLoggingIn || isLoadingUser) {
      return;
    }

    setPendingCredentials({
      strEmailId: values.email,
      strPassword: values.password,
    });
    login({ strEmailId: values.email, strPassword: values.password });
  };

  const handleForceLogin = () => {
    if (pendingCredentials) {
      setShowSessionDialog(false);
      login({
        ...pendingCredentials,
        bolIsForce: true,
      });
    }
  };

  const handleCancelForceLogin = () => {
    setShowSessionDialog(false);
    setActiveSessions([]);
    setPendingCredentials(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <ThemeProvider defaultTheme="system">
      <div className="flex min-h-screen items-center justify-center bg-background bg-linear-to-br from-background to-background/90 p-4 relative">
        <div className="absolute bottom-4 left-4 z-10">
          <ThemeToggle />
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg border-border-color shadow-lg backdrop-blur-sm animate-fade-in-up"
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h2 className="text-3xl font-extrabold bg-linear-to-r from-primary to-primary/70 text-transparent bg-clip-text">
                  Log in
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Access your account
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email address"
                        className="focus-visible:ring-primary/30 transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Password</FormLabel>
                      <div className="text-sm">
                        <Link
                          to="/auth/forgot-password"
                          className="font-medium text-primary hover:text-primary/80"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                    <FormControl>
                      <PasswordInput
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full font-medium transition-all hover:shadow-md bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                disabled={isLoggingIn}
              >
                {isLoggingIn && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Log in
              </Button>
            </div>
          </form>
        </Form>

        {/* Session Conflict Dialog */}
        <ModalDialog
          open={showSessionDialog}
          onOpenChange={setShowSessionDialog}
          title="Active Session Detected"
          description={`You have ${activeSessions.length} active session${
            activeSessions.length > 1 ? "s" : ""
          } on other device${
            activeSessions.length > 1 ? "s" : ""
          }. Do you want to sign out from ${
            activeSessions.length > 1 ? "them" : "it"
          } and continue?`}
          maxWidth="500px"
          footerContent={
            <>
              <Button
                variant="outline"
                onClick={handleCancelForceLogin}
                disabled={isLoggingIn}
              >
                Cancel
              </Button>
              <Button onClick={handleForceLogin} disabled={isLoggingIn}>
                {isLoggingIn && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign Out Other Sessions & Continue
              </Button>
            </>
          }
        >
          <div className="space-y-3 px-6 py-4">
            {activeSessions.map((session, index) => (
              <div
                key={index}
                className="p-3 rounded-md bg-muted/50 space-y-1 relative border border-border-color"
              >
                <div className="absolute top-3 right-3">
                  <Status status="online" className="text-xs font-medium">
                    <StatusIndicator size="w-2 h-2" />
                    <StatusLabel>Active Session</StatusLabel>
                  </Status>
                </div>
                {session.strDeviceInfo && (
                  <p className="text-sm font-medium pr-20">
                    {session.strDeviceInfo}
                  </p>
                )}
                {session.strIPAddress && (
                  <p className="text-xs text-muted-foreground">
                    IP: {session.strIPAddress}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Active since: {formatDate(session.dtCreatedOn)}
                </p>
                {session.dtExpiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {formatDate(session.dtExpiresAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ModalDialog>

        <Toaster />
      </div>
    </ThemeProvider>
  );
}

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check } from "lucide-react";

import { useResetPassword } from "@/hooks/api/central/use-auth";

import { ThemeToggle } from "@/components/shared/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "@/components/ui/otp-input";
import { PasswordInput } from "@/components/ui/password-input";
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

const changePasswordSchema = z
  .object({
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(1, "New password is required"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePassword() {
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate: resetPassword, isPending: isLoading } = useResetPassword();

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";
  const fromForgotPassword = location.state?.fromForgotPassword || false;

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!email && fromForgotPassword) {
      navigate("/auth/forgot-password");
    }
  }, [email, fromForgotPassword, navigate]);

  const onSubmit = (values: ChangePasswordFormValues) => {
    resetPassword(
      {
        strEmailId: email,
        strOtp: values.otp,
        strNewPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
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
                  Change Password
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {!isSuccess ? "Enter your OTP and create a new password" : ""}
                </p>
              </div>
            </div>
            {!isSuccess ? (
              <>
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP Code</FormLabel>
                      <FormControl>
                        <div className="flex justify-center mt-2">
                          <InputOTP
                            maxLength={6}
                            pattern={REGEXP_ONLY_DIGITS}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isLoading}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="••••••••"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="••••••••"
                          disabled={isLoading}
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
                  {isLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-foreground text-xl font-semibold">
                  Success!
                </h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Your password has been changed successfully.
                </p>
                <Button
                  onClick={() => navigate("/auth/login")}
                  className="w-full font-medium transition-all hover:shadow-md bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  Return to Login
                </Button>
              </div>
            )}

            {!isSuccess && (
              <Link
                to="/auth/login"
                className="text-primary underline-offset-4 transition-colors hover:underline"
              >
                Back to Login
              </Link>
            )}
          </form>
        </Form>
      </div>
    </ThemeProvider>
  );
}

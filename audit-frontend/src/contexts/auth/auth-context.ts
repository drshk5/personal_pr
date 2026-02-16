import type { User } from "@/types";
import type { LoginRequest } from "@/types/central/user";
import { createContext } from "react";

export interface AuthContextType {
  user: User | undefined | null;
  isLoading: boolean;
  isError: boolean;
  logout: () => void;
  login: (credentials: LoginRequest) => void;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

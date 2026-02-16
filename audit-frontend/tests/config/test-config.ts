import { testRuntime } from "./runtime-env";

/**
 * Test User Credentials
 *
 * ⚠️ IMPORTANT: Replace these with actual test users from your database
 * These should be test/staging environment users only!
 */
export const TEST_USERS = {
  admin: {
    email: "soham.maury@moneycareindia.com",
    password: "itzmek1ng",
  },
  viewer: {
    email: "viewer@moneycareindia.com",
    password: "password",
  },
} as const;

/**
 * API Endpoints for the 3 backends
 */
export const API_ENDPOINTS = {
  // Central Backend
  auth: "/api/auth",
  users: "/api/users",
  organizations: "/api/organizations",

  // Task Backend
  tasks: "/api/tasks",
  boards: "/api/boards",

  // Accounting Backend
  invoices: "/api/invoices",
  accounts: "/api/accounts",
} as const;

/**
 * Test timeouts - resolved from Node process env
 */
export const TIMEOUTS = testRuntime.timeout;

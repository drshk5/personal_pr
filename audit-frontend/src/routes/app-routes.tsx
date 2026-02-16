import { createBrowserRouter, Navigate, useRoutes } from "react-router-dom";
import { lazy, Suspense } from "react";
import App from "@/App";
import { PageLoader } from "@/components/layout/page-loader";
import { AuthRedirect } from "@/components/auth/auth-redirect";
import { useUserRights } from "@/hooks";
import { createDynamicRoutes } from "./dynamic-routes";
import { AppLoader } from "@/components/layout/app-loader";

const Login = lazy(() => import("@/pages/Central/auth/Login"));
const ForgotPassword = lazy(
  () => import("@/pages/Central/auth/ForgotPassword")
);
const ChangePassword = lazy(
  () => import("@/pages/Central/auth/ChangePassword")
);
const Profile = lazy(() => import("@/pages/Central/profile/Profile"));
const UserWelcome = lazy(() => import("@/pages/UserWelcome"));

// Task reports are routed dynamically via user rights; no direct imports here

const InvoicePrint = lazy(
  () => import("@/pages/Account/invoice/SalesInvoicePrint")
);

const PurchaseInvoicePrint = lazy(
  () => import("@/pages/Account/purchase-invoice/PurchaseInvoicePrint")
);

const PaymentReceivedPrint = lazy(
  () => import("@/pages/Account/payment-received/PaymentReceivedPrint")
);

const PaymentMadePrint = lazy(
  () => import("@/pages/Account/payment-made/PaymentMadePrint")
);

const RecurringProfileList = lazy(
  () =>
    import(
      "@/pages/Account/journalvoucher-recurring/JournalVoucherRecurringList"
    )
);
const RecurringProfileForm = lazy(
  () =>
    import(
      "@/pages/Account/journalvoucher-recurring/JournalVoucherRecurringForm"
    )
);

// All Tasks Page
const AllTasks = lazy(() => import("@/pages/Task/alltasks/AllTasks"));

export function DynamicRoutes() {
  const { menuItems } = useUserRights();
  const routes = createDynamicRoutes(menuItems);
  return useRoutes(routes);
}

export const AppRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <AuthRedirect />,
      },
      {
        path: "welcome",
        element: (
          <Suspense fallback={<PageLoader />}>
            <UserWelcome />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        ),
      },
      
      {
        path: "invoice/:id/print",
        element: (
          <Suspense fallback={<PageLoader />}>
            <InvoicePrint />
          </Suspense>
        ),
      },
      {
        path: "purchase-invoice/:id/print",
        element: (
          <Suspense fallback={<PageLoader />}>
            <PurchaseInvoicePrint />
          </Suspense>
        ),
      },
      {
        path: "payment-received/:id/print",
        element: (
          <Suspense fallback={<PageLoader />}>
            <PaymentReceivedPrint />
          </Suspense>
        ),
      },
      {
        path: "payment-made/:id/print",
        element: (
          <Suspense fallback={<PageLoader />}>
            <PaymentMadePrint />
          </Suspense>
        ),
      },
      {
        path: "journal-voucher-recurring-profile",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecurringProfileList />
          </Suspense>
        ),
      },
      {
        path: "journal-voucher-recurring",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecurringProfileList />
          </Suspense>
        ),
      },
      {
        path: "journal-voucher-recurring-profile/new",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecurringProfileForm />
          </Suspense>
        ),
      },
      {
        path: "journal-voucher-recurring/new",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecurringProfileForm />
          </Suspense>
        ),
      },
      {
        path: "journal-voucher-recurring-profile/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecurringProfileForm />
          </Suspense>
        ),
      },
      {
        path: "journal-voucher-recurring/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecurringProfileForm />
          </Suspense>
        ),
      },
      {
        path: "all-tasks",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AllTasks />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: <DynamicRoutes />,
      },
    ],
  },
  {
    path: "/auth",
    children: [
      {
        path: "login",
        element: (
          <Suspense fallback={<AppLoader />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <Suspense fallback={<AppLoader />}>
            <ForgotPassword />
          </Suspense>
        ),
      },
      {
        path: "change-password",
        element: (
          <Suspense fallback={<AppLoader />}>
            <ChangePassword />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: "/forgot-password",
    element: <Navigate to="/auth/forgot-password" replace />,
  },
  {
    path: "/change-password",
    element: <Navigate to="/auth/change-password" replace />,
  },
]);

export default AppRouter;

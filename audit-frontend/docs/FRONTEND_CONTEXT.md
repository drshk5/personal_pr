# EasyAudit Frontend - Project Context

## 📊 Current State (January 2026)

**Development Environment:**

- ✅ All 3 backends running (Central, Task, Accounting)
- ✅ Frontend dev server ready: `http://localhost:5173`
- ✅ VS Code tasks configured for easy startup
- ✅ Hot module replacement (HMR) enabled

**Project Health:**

- ✅ 725+ source files
- ✅ Zero build errors
- ✅ All dependencies up to date (React 19, Vite 6, TypeScript 5.8)
- ✅ Playwright tests passing
- ✅ Production-ready codebase

**Recent Updates:**

- React 19.1.0 (latest stable)
- Vite 6.3.5 with improved performance
- TanStack Query 5.81.2 with enhanced caching
- Tailwind CSS 4.1.10 with new features
- Playwright 1.56.1 for E2E testing

---

## 🎯 Project Overview

**EasyAudit Frontend** is a modern React-based web application for comprehensive audit, accounting, and task management. Built with TypeScript, it connects to three separate backend services (Central, Task, and Accounting) to provide a unified user experience.

**Current Status (January 2026):**

- ✅ Production-ready application with 725+ source files
- ✅ All 3 backends (Central, Task, Accounting) running and integrated
- ✅ Complete authentication & authorization system
- ✅ Real-time SignalR notifications
- ✅ Comprehensive E2E test suite with Playwright
- ✅ Modern React 19 with TypeScript 5.8

## 🛠️ Tech Stack

### Core Framework

- **React 19.1.0** with **TypeScript 5.8.3** - Latest React with full type safety
- **Vite 6.3.5** - Lightning-fast build tool and dev server
- **React Router v7.6.2** - Client-side routing with lazy loading

### State Management

- **TanStack Query v5.81.2 (React Query)** - Server state management, caching, and synchronization
- **React Context API** - Global app state (Auth, Theme, User Rights, Document Mode)
- **Jotai v2.15.0** - Lightweight atomic state management
- **LocalStorage Persistence** - Query cache persistence for offline-first experience

### UI & Styling

- **Tailwind CSS v4.1.10** - Utility-first CSS framework with latest features
- **Radix UI** - Headless, accessible UI primitives (20+ component packages)
- **shadcn/ui pattern** - Customizable component system (50+ UI components)
- **Lucide React v0.523** - Icon library (500+ icons)
- **class-variance-authority (CVA) v0.7.1** - Component variant styling
- **Framer Motion v12.26.2** - Animation library for smooth transitions

### Forms & Validation

- **React Hook Form v7.59** - Performant form state management
- **Zod v3.25.67** - TypeScript-first schema validation
- **@hookform/resolvers v5.1.1** - Integration between RHF and Zod

### Data & APIs

- **Axios v1.10.0** - HTTP client with interceptors and auto-retry
- **@microsoft/signalr v9.0.6** - Real-time WebSocket communication
- **date-fns v4.1.0** - Date manipulation and formatting
- **xlsx v0.18.5** - Excel file generation and parsing

### UI Features

- **@tanstack/react-table v8.21.3** - Headless table library for complex data tables
- **@dnd-kit v6.3.1** - Drag-and-drop for task boards and sortable lists
- **Tiptap v3.6.5** - Rich text editor (WYSIWYG) with extensions
- **react-day-picker v9.7.0** - Date picker component
- **Sonner v2.0.5** - Toast notifications
- **react-medium-image-zoom v5.4.0** - Image zoom functionality
- **react-image-crop v11.0.10** - Image cropping
- **recharts v3.6.0** - Charts and data visualization
- **react-window v2.2.4** - Virtualization for large lists
- **driver.js v1.4.0** - Product tours and feature highlights
- **react-joyride v3.0.0-7** - Interactive user onboarding

### Testing

- **Playwright v1.56.1** - End-to-end testing framework
- **@playwright/test** - Test runner with fixtures and assertions
- **Cross-backend testing** - Tests cover all 3 backends (Central, Task, Accounting)
- **Smoke tests** - Critical path testing suite
- **SignalR tests** - Real-time connection testing

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI primitives (55+ components)
│   │   │   ├── button.tsx, input.tsx, form.tsx
│   │   │   ├── dialog.tsx, sheet.tsx, modal-dialog.tsx
│   │   │   ├── table.tsx, pagination.tsx
│   │   │   ├── select/, dropdown-menu.tsx
│   │   │   ├── date-picker.tsx, time-picker.tsx, calendar.tsx
│   │   │   ├── alert-dialog.tsx, confirmation-dialog.tsx
│   │   │   ├── tabs.tsx, accordion.tsx, collapsible.tsx
│   │   │   ├── card.tsx, badge.tsx, avatar.tsx
│   │   │   ├── chart.tsx, skeleton.tsx, progress.tsx
│   │   │   ├── rich-text-editor.tsx, textarea.tsx
│   │   │   ├── attachments/ (AttachmentManager, AudioRecorder)
│   │   │   ├── with-permission.tsx
│   │   │   └── shadcn-io/ (original shadcn components)
│   │   ├── auth/           # Authentication components
│   │   │   ├── auth-redirect.tsx
│   │   │   └── auth-bootstrapper.tsx
│   │   ├── FloatingTaskWidget/ # Floating task widget for quick access
│   │   ├── layout/         # Layout components (header, sidebar, loading)
│   │   │   ├── site-header.tsx
│   │   │   ├── app-loader.tsx
│   │   │   └── page-loading-layout.tsx
│   │   ├── navigation/     # Navigation components (sidebar, search, switchers)
│   │   │   ├── sidebar/
│   │   │   ├── document-sidebar/
│   │   │   ├── module-switcher-modal.tsx
│   │   │   ├── organization-year-switcher.tsx
│   │   │   ├── page-search.tsx
│   │   │   └── notification-dropdown.tsx
│   │   ├── data-display/   # Data tables, cards, skeletons
│   │   │   ├── data-table-*.tsx (various table components)
│   │   │   └── list-view-skeleton.tsx
│   │   ├── shared/         # Shared utilities
│   │   │   ├── theme-switcher.tsx
│   │   │   ├── column-visibility.tsx
│   │   │   └── table-layout-switcher.tsx
│   │   ├── modals/         # Modal dialogs
│   │   └── error-boundaries/ # Error handling components
│   │
│   ├── pages/              # Route-level page components
│   │   ├── Central/        # Central backend pages (27+ modules)
│   │   │   ├── auth/              # Login, forgot password, change password
│   │   │   ├── user/              # User management
│   │   │   ├── organization/      # Organization management
│   │   │   ├── schedule/          # Schedule management
│   │   │   ├── document/          # Document viewer & management
│   │   │   ├── group/             # Group management
│   │   │   ├── profile/           # User profile
│   │   │   └── ...                # Tax, picklist, master data, etc.
│   │   ├── Account/        # Accounting pages (19 modules)
│   │   │   ├── party/             # Party (customer/supplier) management
│   │   │   ├── invoice/           # Sales invoices
│   │   │   ├── purchase-invoice/  # Purchase invoices
│   │   │   ├── journalvoucher/    # Journal vouchers
│   │   │   ├── payment-received/  # Payment received
│   │   │   ├── payment-made/      # Payment made
│   │   │   ├── opening-balance/   # Opening balances
│   │   │   ├── trial-balance/     # Trial balance report
│   │   │   ├── balance-sheet/     # Balance sheet report
│   │   │   ├── profit-and-loss/   # P&L report
│   │   │   └── ...                # Accounts, banks, items, vendors, etc.
│   │   └── Task/           # Task management pages (11 modules)
│   │   │   ├── board/             # Kanban boards
│   │   │   ├── mytask/            # My tasks view
│   │   │   ├── alltasks/          # All tasks view
│   │   │   ├── assign-task/       # Task assignment
│   │   │   ├── review-task/       # Task reviews
│   │   │   ├── task-dashboard/    # Task analytics dashboard
│   │   │   ├── task-reports/      # Task reports
│   │   │   ├── task-timer/        # Time tracking
│   │   │   ├── task-import/       # Bulk task import
│   │   │   └── user-hourly-rate/  # User hourly rates
│   │
│   ├── services/           # API service layer (business logic)
│   │   ├── Central/        # Central backend services (36 services)
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── organization.service.ts
│   │   │   ├── schedule.service.ts
│   │   │   ├── document.service.ts
│   │   │   ├── group.service.ts
│   │   │   ├── menu.service.ts
│   │   │   └── ...                # Tax, picklist, master data, etc.
│   │   ├── Account/        # Accounting services (23 services)
│   │   │   ├── salesinvoice.service.ts
│   │   │   ├── purchase-invoice.service.ts
│   │   │   ├── journal-voucher.service.ts
│   │   │   ├── party.service.ts
│   │   │   ├── payment-received.service.ts
│   │   │   ├── payment-made.service.ts
│   │   │   ├── opening-balance.service.ts
│   │   │   ├── trial-balance.service.ts
│   │   │   └── ...                # Accounts, banks, items, etc.
│   │   ├── Task/           # Task backend services (18 services)
│   │   │   ├── task.service.ts
│   │   │   ├── board.service.ts
│   │   │   ├── assign-task.service.ts
│   │   │   ├── review-task.service.ts
│   │   │   ├── task-comment.service.ts
│   │   │   ├── task-checklist.service.ts
│   │   │   ├── signalr.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── ...                # Task reports, timer, import, etc.
│   │   └── index.ts        # Centralized service exports
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── api/           # API hooks using TanStack Query (96+ hooks)
│   │   │   ├── Central/   # Central backend hooks (50+ hooks)
│   │   │   │   ├── use-users.ts, use-organizations.ts
│   │   │   │   ├── use-schedules.ts, use-documents.ts
│   │   │   │   ├── use-groups.ts, use-user-roles.ts
│   │   │   │   ├── use-tax-categories.ts, use-tax-types.ts
│   │   │   │   └── ...
│   │   │   ├── Account/   # Accounting hooks (25+ hooks)
│   │   │   │   ├── use-parties.ts, use-sales-invoices.ts
│   │   │   │   ├── use-purchase-invoices.ts
│   │   │   │   ├── use-journal-vouchers.ts
│   │   │   │   ├── use-payments.ts
│   │   │   │   └── ...
│   │   │   ├── Task/      # Task hooks (20+ hooks)
│   │   │   │   ├── use-tasks.ts, use-boards.ts
│   │   │   │   ├── use-assign-task.ts, use-review-task.ts
│   │   │   │   ├── use-task-comments.ts
│   │   │   │   ├── use-signalr.ts
│   │   │   │   └── ...
│   │   │   ├── common.ts  # Shared hook utilities
│   │   │   └── index.ts   # Centralized hook exports
│   │   ├── common/        # General-purpose hooks (10+ hooks)
│   │   │   ├── use-auth-context.ts
│   │   │   ├── use-user-rights.ts
│   │   │   ├── use-theme-color.ts
│   │   │   ├── use-debounce.ts
│   │   │   ├── use-mobile.ts
│   │   │   ├── use-column-visibility.ts
│   │   │   ├── use-table-layout.ts
│   │   │   ├── use-list-preferences.ts
│   │   │   └── ...
│   │   └── index.ts       # Main hook exports
│   │
│   ├── contexts/           # React Context providers
│   │   ├── auth/          # Authentication context
│   │   ├── theme/         # Theme (light/dark mode)
│   │   ├── user-rights/   # User permissions & menu
│   │   ├── document-mode/ # Document viewing mode
│   │   └── app-providers.tsx # Combined provider wrapper
│   │
│   ├── lib/               # Utility libraries
│   │   ├── api/           # API infrastructure
│   │   │   ├── axios.ts              # Axios instance with interceptors
│   │   │   ├── api-service.ts        # Generic API service class
│   │   │   ├── token-refresh.ts      # JWT token refresh logic
│   │   │   └── schemas/              # API response schemas
│   │   ├── utils/         # Helper functions
│   │   │   ├── formatting.ts         # String/number formatting
│   │   │   ├── date-utils.ts         # Date helpers
│   │   │   ├── file-utils.ts         # File operations
│   │   │   ├── api-error.ts          # Error extraction
│   │   │   └── pagination-utils.ts   # Pagination helpers
│   │   ├── query-provider.tsx        # TanStack Query setup
│   │   └── icon-map.ts               # Icon mapping utilities
│   │
│   ├── routes/            # Routing configuration
│   │   ├── app-routes.tsx            # Main router setup
│   │   ├── dynamic-routes.tsx        # Permission-based route generation
│   │   └── route-utils.tsx           # Route helper utilities
│   │
│   ├── types/             # TypeScript type definitions
│   │   ├── Central/       # Central backend types
│   │   ├── Account/       # Accounting types
│   │   ├── Task/          # Task types
│   │   └── common.ts      # Shared types (ApiResponse, PagedResponse)
│   │
│   ├── validations/       # Zod validation schemas
│   │   ├── Central/       # Central entity schemas (30+ schemas)
│   │   │   ├── user.ts, organization.ts, schedule.ts
│   │   │   ├── tax-category.ts, tax-type.ts, tax-rate.ts
│   │   │   ├── picklist-type.ts, picklist-value.ts
│   │   │   └── ...
│   │   ├── Account/       # Accounting schemas (15+ schemas)
│   │   │   ├── party.ts, invoice.ts, purchase-invoice.ts
│   │   │   ├── journal-voucher.ts, payment.ts
│   │   │   └── ...
│   │   ├── Task/          # Task schemas (10+ schemas)
│   │   │   ├── task.ts, board.ts, review-task.ts
│   │   │   ├── task-comment.ts, task-import.ts
│   │   │   └── ...
│   │   └── index.ts       # Centralized validation exports
│   │
│   ├── config/            # Configuration files
│   │   ├── environment.ts # API base URLs and timeouts
│   │   └── upload-limits.ts # File upload constraints
│   │
│   ├── constants/         # Application constants
│   ├── data/              # Static data and mock data
│   ├── assets/            # Images, fonts, static files
│   └── styles/            # Global styles
│
├── tests/                 # Playwright E2E tests
│   ├── smoke/            # Critical path smoke tests
│   │   ├── login.spec.ts
│   │   ├── dashboard.spec.ts
│   │   └── task-crud.spec.ts
│   ├── signalr/          # Real-time SignalR connection tests
│   │   ├── connection.spec.ts
│   │   └── notifications.spec.ts
│   ├── fixtures/         # Test fixtures and helpers
│   │   └── auth.fixture.ts
│   ├── helpers/          # Test utility functions
│   ├── config/           # Test configuration
│   │   └── test-config.ts
│   └── README.md         # Test documentation
│
├── docs/                  # Additional documentation
├── playwright-report/     # Test reports
└── test-results/          # Test artifacts
```

---

## 🏗️ Architecture Patterns

### 1. **Multi-Backend Architecture**

The frontend communicates with **3 independent backends**:

- **Central Backend** (`/api/...`) - Authentication, users, organizations, schedules, documents
- **Task Backend** (`/api/task/...`) - Task management, boards, assignments, reviews, SignalR hub
- **Accounting Backend** (`/api/account/...`) - Parties, invoices, journal vouchers, payments

All requests are proxied through the **Central Backend** which acts as an API gateway.

### 2. **Service Layer Pattern**

Each backend feature has a corresponding **service file** in `src/services/`:

```typescript
// Example: src/services/Central/user.service.ts
export const userService = {
  getUsers: (params) => ApiService.get("/users", params),
  getUser: (id) => ApiService.get(`/users/${id}`),
  createUser: (data) => ApiService.post("/users", data),
  updateUser: (id, data) => ApiService.put(`/users/${id}`, data),
  deleteUser: (id) => ApiService.delete(`/users/${id}`),
};
```

### 3. **Custom Hooks Pattern (React Query)**

Each service has corresponding **custom hooks** in `src/hooks/api/`:

```typescript
// Example: src/hooks/api/Central/use-users.ts
export const useUsers = (params) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => userService.getUsers(params),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("User created successfully");
    },
  });
};
```

### 4. **API Service Class**

`ApiService` wraps Axios and handles response unwrapping:

```typescript
// Automatically unwraps ApiResponse<T> to just T
ApiService.get<User>("/users/123"); // Returns User, not ApiResponse<User>
ApiService.post<User>("/users", data); // Returns User
```

**Methods:**

- `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>` - Auto-unwrap `data` field
- `getWithMeta<T>`, `postWithMeta<T>` - Return full response with status/message
- `getArray<T>` - Fetch arrays
- `exportFile()`, `downloadFile()` - File downloads

### 5. **Token Management**

**JWT Access + Refresh Token Flow:**

1. Tokens stored in `localStorage`
2. Axios interceptor attaches tokens to every request
3. On **401 Unauthorized**, automatically refresh tokens
4. Queues pending requests during refresh
5. Retries failed requests with new token
6. If refresh fails → redirect to login

**Key files:**

- `src/lib/api/axios.ts` - Request/response interceptors
- `src/lib/api/token-refresh.ts` - Token refresh logic

### 6. **Permission-Based Routing**

Routes are **dynamically generated** based on user permissions:

1. User logs in → fetch menu items with permissions
2. `createDynamicRoutes()` builds routes from menu structure
3. Each route checks `bolCanView`, `bolCanCreate`, `bolCanEdit`, `bolCanDelete`
4. Components use `<WithPermission>` wrapper to conditionally render UI

**Key files:**

- `src/routes/dynamic-routes.tsx`
- `src/contexts/user-rights/user-rights-provider.tsx`
- `src/components/ui/with-permission.tsx`

### 7. **SignalR Real-Time Updates**

**Task Backend** provides a SignalR hub for real-time notifications:

- Automatic reconnection on disconnect
- Keeps connection alive with ping/pong
- Visibility API integration (reconnect on tab focus)
- Desktop notifications support
- Notification sound alerts

**Key files:**

- `src/services/Task/signalr.service.ts`
- `src/hooks/api/Task/use-signalr.ts`

---

## 🔄 Data Flow

### **Read Operations (Queries)**

```
Component → useQueryHook → Service → ApiService → Axios → Backend
                ↓
          TanStack Query Cache
                ↓
          Component renders
```

### **Write Operations (Mutations)**

```
Component → useMutationHook → Service → ApiService → Axios → Backend
                ↓
          onSuccess callback
                ↓
     queryClient.invalidateQueries()
                ↓
          Refetch affected queries
                ↓
          UI updates automatically
```

### **Authentication Flow**

```
Login Page → AuthService.login() → Store tokens → useAuth hook updates
                                                         ↓
                                              AuthContext.user populated
                                                         ↓
                                              Fetch user rights/menu
                                                         ↓
                                              Generate dynamic routes
                                                         ↓
                                              Redirect to dashboard
```

---

## 🧩 Component Architecture

### **UI Component System (shadcn/ui pattern)**

All UI components in `src/components/ui/` follow this structure:

1. Built on **Radix UI primitives** (accessible, unstyled)
2. Styled with **Tailwind CSS**
3. Variants managed with **CVA (class-variance-authority)**
4. Fully typed with TypeScript
5. Forwarded refs for composability

**Example components:**

- `button.tsx` - Variants: default, destructive, outline, ghost, link
- `input.tsx` - Text inputs with error states
- `dialog.tsx` - Modal dialogs
- `form.tsx` - Form integration with React Hook Form
- `table.tsx` - Data table with sorting/filtering
- `select.tsx` - Dropdown select
- `date-picker.tsx` - Calendar-based date selection

### **Feature Components**

Located in `src/components/features/`:

- **auth/** - Login, password reset, auth bootstrapper
- **task/** - Task modals, checklists, comments, reviews, activity tabs

### **Layout Components**

Located in `src/components/layout/`:

- `site-header.tsx` - App header with user menu
- `page-loading-layout.tsx` - Loading states
- `app-loader.tsx` - Initial app load spinner
- `page-loader.tsx` - Page transition loader

### **Navigation Components**

Located in `src/components/navigation/`:

- `sidebar/` - Collapsible sidebar with menu items
- `document-sidebar/` - Document viewer sidebar
- `module-switcher-modal.tsx` - Switch between modules
- `organization-year-switcher.tsx` - Context switcher
- `page-search.tsx` - Global search (Cmd+K)
- `notification-dropdown.tsx` - Real-time notifications

---

## 🧪 Testing Strategy

### **Playwright E2E Tests**

Located in `tests/`:

**Test Categories:**

1. **Smoke Tests** (`tests/smoke/`) - Critical user journeys
   - Login/logout flow
   - Dashboard loading
   - Task CRUD operations
   - Backend health checks

2. **SignalR Tests** (`tests/signalr/`) - Real-time features
   - Connection establishment
   - Reconnection logic
   - Notification delivery

**Running Tests:**

```bash
npm run test:e2e              # Run all tests
npm run test:e2e:ui           # Interactive UI mode
npm run test:smoke            # Only smoke tests
npm run test:e2e:debug        # Debug mode
npm run test:report           # View HTML report
```

**Test Configuration:**

- `playwright.config.ts` - Main config
- `tests/config/test-config.ts` - Test users, endpoints, timeouts
- `tests/fixtures/auth.fixture.ts` - Authentication helpers

---

## 📦 Key Dependencies Explained

| Package                 | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `@tanstack/react-query` | Server state management, automatic refetching, caching |
| `@tanstack/react-table` | Headless table library for complex data tables         |
| `@radix-ui/*`           | Accessible, unstyled UI primitives (20+ packages)      |
| `react-hook-form`       | Performant form state management                       |
| `zod`                   | Schema validation for forms and API responses          |
| `axios`                 | HTTP client with interceptors and retry logic          |
| `@microsoft/signalr`    | WebSocket real-time communication                      |
| `react-router-dom`      | Client-side routing with lazy loading                  |
| `tailwindcss`           | Utility-first CSS framework                            |
| `lucide-react`          | Icon library (500+ icons)                              |
| `date-fns`              | Date manipulation and formatting                       |
| `sonner`                | Toast notification library                             |
| `@dnd-kit`              | Drag-and-drop for task boards                          |
| `@tiptap`               | Rich text editor                                       |
| `jotai`                 | Atomic state management                                |
| `@playwright/test`      | End-to-end testing framework                           |

---

## 🔐 Authentication & Authorization

### **Authentication**

- **JWT-based** authentication
- **Access Token** + **Refresh Token** pattern
- Tokens stored in `localStorage`
- Automatic token refresh on 401
- Logout clears tokens and redirects to login

### **Authorization**

- **Role-Based Access Control (RBAC)**
- User permissions stored in `UserRights` context
- Each menu item has permissions: `bolCanView`, `bolCanCreate`, `bolCanEdit`, `bolCanDelete`
- Routes dynamically generated based on permissions
- UI elements conditionally rendered with `<WithPermission>`

---

## 🎨 Styling System

### **Tailwind CSS v4**

- Utility-first CSS framework
- Custom design system with brand colors
- Dark mode support via `ThemeProvider`
- Responsive breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`

### **CSS Architecture**

- Global styles in `src/index.css`
- Component-specific styles inline with Tailwind
- CSS variables for theming (light/dark)
- Animation utilities from `tw-animate-css`

### **Theme System**

- Light/Dark mode toggle
- Theme persisted in `localStorage`
- CSS variables: `--background`, `--foreground`, `--primary`, etc.
- Automatic system preference detection

---

## 🚀 Build & Development

### **Development**

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
```

### **Production Build**

```bash
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build
```

### **Code Quality**

```bash
npm run lint         # ESLint check
npm run format       # Prettier format
npm run format:check # Prettier check
```

### **Testing**

```bash
npm run test:e2e     # Playwright tests
```

---

## 📝 API Response Format

All backend APIs return a consistent format:

```typescript
// Success response
{
  statusCode: 200,
  message: "Success",
  data: { /* actual data */ }
}

// Paginated response
{
  statusCode: 200,
  message: "Success",
  data: {
    items: [...],
    totalCount: 100,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 10,
    hasPrevious: false,
    hasNext: true
  }
}

// Error response
{
  statusCode: 400,
  message: "Validation failed",
  errors: { /* field errors */ }
}
```

---

## 🔍 Common Patterns

### **Creating a New Feature**

1. **Define Types** (`src/types/[Module]/feature.ts`)
2. **Create Service** (`src/services/[Module]/feature.service.ts`)
3. **Create Custom Hooks** (`src/hooks/api/[Module]/use-feature.ts`)
4. **Create Validation Schema** (`src/validations/[Module]/feature.ts`)
5. **Create Page Component** (`src/pages/[Module]/feature/FeaturePage.tsx`)
6. **Add Route** (automatic if in menu, or manual in `app-routes.tsx`)

### **Making API Calls**

```typescript
// In a component
import { useUsers, useCreateUser } from '@/hooks/api/Central/use-users'

function UserList() {
  const { data, isLoading } = useUsers({ pageSize: 10 })
  const createUser = useCreateUser()

  const handleCreate = (userData) => {
    createUser.mutate(userData)
  }

  if (isLoading) return <Spinner />
  return <div>{/* render users */}</div>
}
```

### **Form Handling**

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema } from '@/validations/Central/user'

function UserForm() {
  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: { ... }
  })

  const onSubmit = (data) => {
    // API call
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="username" render={...} />
      </form>
    </Form>
  )
}
```

---

## 🐛 Error Handling

1. **API Errors** - Extracted via `extractErrorMessage()` utility
2. **Toast Notifications** - User-friendly error messages via `Sonner`
3. **Error Boundaries** - React error boundaries for component crashes
4. **Route Error Boundary** - Catches routing errors
5. **Network Errors** - Axios retry logic with exponential backoff
6. **401 Unauthorized** - Automatic token refresh or redirect to login

---

## 📊 Performance Optimizations

1. **Code Splitting** - Lazy loading with `React.lazy()`
2. **Route-Based Splitting** - Each page is a separate chunk
3. **Query Caching** - TanStack Query reduces redundant API calls
4. **LocalStorage Persistence** - Offline-first experience
5. **Debounced Search** - `useDebounce` hook for search inputs
6. **Virtualization** - (Future) For large lists with `@tanstack/react-virtual`
7. **Image Optimization** - Lazy loading, image crop, zoom

---

## 🔗 Key Files Reference

| File                                                | Purpose                          |
| --------------------------------------------------- | -------------------------------- |
| `src/main.tsx`                                      | App entry point                  |
| `src/App.tsx`                                       | Root component with providers    |
| `src/routes/app-routes.tsx`                         | Main router configuration        |
| `src/lib/api/axios.ts`                              | Axios instance with interceptors |
| `src/lib/api/api-service.ts`                        | Generic API service wrapper      |
| `src/lib/query-provider.tsx`                        | TanStack Query configuration     |
| `src/contexts/app-providers.tsx`                    | Combined context providers       |
| `src/contexts/auth/auth-context.tsx`                | Authentication state             |
| `src/contexts/user-rights/user-rights-provider.tsx` | User permissions                 |
| `src/components/ui/*`                               | 50+ reusable UI components       |
| `src/services/index.ts`                             | Centralized service exports      |
| `src/hooks/api/index.ts`                            | Centralized hook exports         |
| `src/types/common.ts`                               | Shared TypeScript types          |
| `playwright.config.ts`                              | E2E test configuration           |

---

## 🎯 Development Workflow

1. **Start all backends** via VS Code tasks (already configured)
2. **Start frontend dev server**: `npm run dev`
3. **Access app**: `http://localhost:5173`
4. **Login** with test credentials
5. **Make changes** - Hot reload automatically
6. **Run tests** before committing: `npm run test:e2e`
7. **Format code**: `npm run format`
8. **Build for production**: `npm run build`

---

## 📞 When Asking AI for Help

**Provide this file** and mention:

- Which **module** (Central/Task/Account)
- Which **feature** (users, tasks, invoices, etc.)
- **Error messages** or **expected behavior**
- **File paths** of relevant code

**Example prompt:**

> "I'm working on the Task module in the EasyAudit frontend. I need to add a new filter to the task list page. The task service is in `src/services/Task/task.service.ts` and the hook is in `src/hooks/api/Task/use-tasks.ts`. How should I modify these files?"

---

## 🏁 Summary

This is a **production-grade, multi-backend, enterprise React application** with:

**Current Statistics (January 2026):**

- **Total Source Files**: 725+ files
- **UI Components**: 55+ reusable components
- **Page Components**: 233+ page components across 3 modules
- **Service Files**: 77+ API service files
  - Central: 36 services
  - Account: 23 services
  - Task: 18 services
- **Custom Hooks**: 96+ hooks
  - Central hooks: 50+
  - Account hooks: 25+
  - Task hooks: 20+
  - Common hooks: 10+
- **Validation Schemas**: 62+ Zod schemas
- **Type Definitions**: Comprehensive TypeScript types across all modules
- **E2E Tests**: Multiple test suites (smoke, SignalR, integration)
- **Lines of Code**: ~50,000+ lines

**Module Distribution:**

- **Central Backend**: 27+ page modules, 36 services
- **Account Backend**: 19 page modules, 23 services
- **Task Backend**: 11 page modules, 18 services

**Key Features:**

- ✅ 3 integrated backends with unified API layer
- ✅ Real-time SignalR notifications
- ✅ Dynamic permission-based routing
- ✅ Rich text editing with Tiptap
- ✅ Advanced data tables with sorting/filtering
- ✅ Drag-and-drop task boards
- ✅ Image upload, crop, and zoom
- ✅ Audio recording and attachments
- ✅ Excel/CSV export functionality
- ✅ Product tours and onboarding
- ✅ Dark/Light theme support
- ✅ Responsive design for mobile/tablet
- ✅ Offline-first with query persistence
- ✅ Comprehensive error handling

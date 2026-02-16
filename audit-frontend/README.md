# EasyAudit Software - Frontend

## Overview

The EasyAudit Software Frontend is a modern React application that provides a comprehensive user interface for audit, accounting, and task management. Built with performance, scalability, and user experience in mind, it leverages the latest frontend technologies and best practices.

## Tech Stack

- **Framework**: React 19 with TypeScript 5.8
- **Build System**: Vite 6 for fast development and optimized production builds
- **Component Library**: Custom UI component system built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom design system extensions
- **State Management**:
  - TanStack Query (React Query) v5 for server state management
  - React Context API for global application state
  - Jotai for lightweight atomic state management
  - Local component state for UI interactions
- **Form Management**: React Hook Form with Zod schema validation
- **Rich Text Editor**: Tiptap editor with custom extensions
- **Drag & Drop**: @dnd-kit for interactive UI elements
- **Routing**: React Router Dom v7 with code splitting and lazy loading
- **HTTP**: Axios with request/response interceptors and retry logic
- **Real-time Communication**: SignalR (@microsoft/signalr v9) for live updates and notifications
- **UI Components**: Radix UI primitives (Dialog, Dropdown, Select, Toast, etc.)
- **Icons**: Lucide React icon library
- **Date Handling**: date-fns for date manipulation and formatting
- **Notifications**: Sonner for elegant toast notifications
- **Testing**: Playwright for end-to-end testing

## Frontend Architecture

### Component Structure

The application follows a well-organized component-based architecture:

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (40+ components)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── form.tsx
│   │   ├── select/
│   │   ├── calendar.tsx
│   │   ├── date-picker.tsx
│   │   ├── date-range-picker.tsx
│   │   ├── rich-text-editor.tsx
│   │   ├── attachments/
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── checkbox.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── popover.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   ├── modal-dialog.tsx
│   │   ├── confirmation-dialog.tsx
│   │   ├── delete-confirmation-dialog.tsx
│   │   ├── reason-dialog.tsx
│   │   ├── progress.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   ├── password-input.tsx
│   │   ├── phone-input.tsx
│   │   ├── otp-input.tsx
│   │   ├── time-picker.tsx
│   │   ├── reminder-picker.tsx
│   │   ├── export-button.tsx
│   │   ├── lazy-image.tsx
│   │   ├── pagination.tsx
│   │   ├── with-permission.tsx
│   │   └── ... (40+ components)
│   ├── auth/           # Authentication components
│   ├── data-display/   # Data display components
│   ├── error-boundaries/ # Error handling components
│   ├── layout/         # Layout components (Navbar, Sidebar, etc.)
│   ├── modals/         # Modal dialogs
│   ├── navigation/     # Navigation components
│   └── shared/         # Shared utility components
├── pages/              # Route-level page components
│   ├── DashboardPage.tsx
│   ├── OrganizationsPage.tsx
│   ├── UsersPage.tsx
│   ├── RolesPage.tsx
│   ├── ClientsPage.tsx
│   ├── AuditEngagementsPage.tsx
│   ├── AuditChecklistsPage.tsx
│   ├── TaskPage.tsx
│   ├── TaskViewPage.tsx
│   ├── CompanySettingsPage.tsx
│   ├── accounting/     # Accounting module pages
│   │   ├── AccountsPage.tsx
│   │   ├── BanksPage.tsx
│   │   ├── PartiesPage.tsx
│   │   ├── InvoicesPage.tsx
│   │   ├── PaymentReceiptPage.tsx
│   │   ├── JournalVoucherPage.tsx
│   │   └── ReportsPage.tsx
│   └── ... (30+ pages)
├── routes/             # React Router configuration
├── services/           # API services and SignalR
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   ├── OrganizationContext.tsx
│   └── CompanyContext.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useOrganization.ts
│   ├── useCompany.ts
│   ├── useDebounce.ts
│   └── usePermissions.ts
├── lib/                # Utility libraries
│   ├── utils.ts        # Helper functions
│   └── constants.ts    # Application constants
├── types/              # TypeScript type definitions
│   ├── api.ts
│   ├── auth.ts
│   ├── organization.ts
│   └── ... (domain types)
├── validations/        # Zod validation schemas
├── config/             # Configuration files
├── constants/          # Application constants
└── data/               # Static data and mocks
```

### State Management Strategy

#### Server State Management

- **TanStack Query (React Query)**: All server data fetching, caching, and synchronization
  - Automatic background refetching
  - Optimistic updates for better UX
  - Request deduplication
  - Infinite scrolling support
  - Pagination handling

#### Global State Management

- **AuthContext**: User authentication state, login/logout, JWT token management
- **OrganizationContext**: Current organization selection and switching
- **CompanyContext**: Company-specific settings and fiscal year management
- **Component State**: Local UI state for modals, forms, and interactions

#### Real-time Updates

- **SignalR Integration**: Live notifications and real-time data synchronization
  - Task updates and assignments
  - Audit engagement status changes
  - Team collaboration notifications
  - System alerts and messages

### Design System & UI Components

#### Radix UI Component Library (40+ Components)

Our comprehensive design system built on Radix UI primitives includes:

**Form Components**:

- `Input`: Text input fields with variants
- `Textarea`: Multi-line text input
- `Select`: Dropdown selection with search
- `Checkbox`: Toggle options
- `RadioGroup`: Mutually exclusive options
- `Switch`: Boolean toggles
- `DatePicker`: Date selection with calendar
- `DateRangePicker`: Date range selection
- `TimePicker`: Time selection
- `ReminderPicker`: Reminder/notification picker
- `Form`: Form field management with validation
- `PasswordInput`: Password field with show/hide
- `PhoneInput`: Phone number input with formatting
- `OTPInput`: One-time password input
- `RichTextEditor`: Tiptap-based WYSIWYG editor

**Layout Components**:

- `Accordion`: Collapsible content sections
- `Tabs`: Tabbed navigation interfaces
- `Separator`: Visual dividers
- `ScrollArea`: Custom scrollbar styling
- `Card`: Content containers
- `Sidebar`: Navigation sidebar

**Navigation Components**:

- `DropdownMenu`: Context menus
- `Popover`: Floating content
- `Tooltip`: Contextual hints
- `Pagination`: Page navigation

**Feedback Components**:

- `Sonner (Toast)`: Elegant toast notifications
- `Dialog`: Modal windows
- `Sheet`: Slide-out panels
- `ModalDialog`: Customized modal dialogs
- `ConfirmationDialog`: Unified confirmation dialogs with optional reason input (supports all variants: success, warning, info, danger, reject, hold, incomplete)
- `DeleteConfirmationDialog`: Delete confirmation dialogs
- `Progress`: Loading indicators
- `Skeleton`: Loading placeholders

**Data Display Components**:

- `Table`: Data tables with sorting/filtering
- `Badge`: Status labels
- `Avatar`: User profile pictures
- `AvatarImage`: Avatar with image loading
- `Calendar`: Date selection interface
- `LazyImage`: Lazy-loaded images
- `Attachments`: File attachment display
- `ExportButton`: Data export button

**Utility Components**:

- `Command`: Command palette (⌘K)
- `Label`: Form field labels
- `Collapsible`: Expandable sections
- `WithPermission`: Permission-based rendering

#### Styling System

- **Tailwind CSS v4**: Utility-first CSS framework with latest features
- **Custom Theme**: Extended color palette for brand identity
- **Responsive Design**: Mobile-first approach with breakpoints
- **CSS Variables**: Dynamic theming support
- **tw-animate-css**: Extended animation utilities

## Key Features & Implementation

### 1. Multi-Backend Architecture

The frontend communicates with three separate backend services:

- **Central Backend** (Port 5000 or 5001): Core authentication, authorization, organizations, users, roles, clients, audit engagements
- **Task Backend** (Port 5001): Task management, checklists, assignments, notifications, real-time collaboration via SignalR
- **Accounting Backend** (Port 5002): Financial management, accounts, parties, invoices, payments, journal vouchers, banking, reports

Each backend has dedicated API client configurations with:

- Independent axios instances
- Custom error handling
- Separate authentication token management
- Request/response interceptors
- Automatic retry logic

### 2. Authentication & Authorization

**Implementation Details**:

- JWT-based authentication with access and refresh tokens
- Secure token storage in localStorage with encryption
- Automatic token refresh on 401 responses
- Role-based access control (RBAC) with permission-level granularity
- Organization context switching for multi-tenant scenarios
- Protected routes with permission checking
- Session timeout handling with user notifications

**Key Components**:

- `AuthContext.tsx`: Global authentication state management
- `ProtectedRoute.tsx`: Route-level authorization
- `Login.tsx`: Login page with form validation
- `useAuth.ts`: Custom hook for auth operations

### 3. Organization & Company Management

**Multi-Tenancy Support**:

- Organization selection and switching
- Company-specific settings and configurations
- Fiscal year management with period locking
- Branch/location management
- User assignments to organizations

**Context Providers**:

- `OrganizationContext`: Current organization state
- `CompanyContext`: Company settings and fiscal year
- Automatic data filtering based on active context

### 4. Audit Management Module

**Features**:

- Client profile management with contacts and locations
- Audit engagement creation and tracking
- Engagement type configuration (Statutory, Tax, Internal, etc.)
- Audit checklist templates and assignments
- Work paper management and documentation
- Finding tracking and resolution workflow
- Multi-year engagement comparison
- Engagement status tracking (Planning, Fieldwork, Review, Complete)

**Pages**:

- `ClientsPage.tsx`: Client master data management
- `AuditEngagementsPage.tsx`: Engagement lifecycle management
- `AuditChecklistsPage.tsx`: Checklist templates and execution
- `AuditFindingsPage.tsx`: Finding documentation and tracking

### 5. Task Management System

**Real-time Collaboration**:

- SignalR integration (@microsoft/signalr v9) for live updates
- Task assignment and status notifications
- Priority management (Low, Medium, High, Urgent)
- Status tracking (Open, In Progress, Review, Completed, Closed)
- Due date management with overdue notifications
- Checklist items within tasks
- File attachments and comments
- Real-time connection state management
- Automatic reconnection on network issues

**Implementation**:

- `TaskPage.tsx`: Task list with filtering and sorting
- `TaskViewPage.tsx`: Detailed task view with comments and history
- `signalr.service.ts`: SignalR hub connection management
- Real-time notifications for task updates
- Task assignment notifications
- Overdue task reminders

### 6. Accounting Module (Complete Financial Management)

#### Chart of Accounts

- Hierarchical account structure (Assets, Liabilities, Income, Expenses, Equity)
- Account groups and sub-groups
- Opening balance management
- Account activation/deactivation
- Multi-level account hierarchy

#### Party Management

- Customer and vendor master data
- Multiple contact persons per party
- Multiple locations/addresses per party
- Credit limit management
- Payment terms configuration
- Party type classification (Customer, Vendor, Both)
- GSTIN and tax registration details

#### Banking

- Multiple bank account management
- Bank reconciliation workflow
- Check printing and management
- Bank statement import
- Balance tracking and reporting

#### Transaction Management

**Sales & Purchase Invoices**:

- Multi-line invoice creation
- Tax calculation (GST/VAT support)
- Multiple tax rates per invoice
- Discount management (line-level and invoice-level)
- Terms and conditions templates
- Invoice numbering with configurable series
- Invoice status tracking (Draft, Submitted, Paid, Cancelled)
- Due date calculation based on payment terms
- Invoice templates with customization

**Payment & Receipt Vouchers**:

- Multi-mode payment (Cash, Check, Bank Transfer, UPI, Card)
- Payment allocation to multiple invoices
- Advance payment handling
- Payment status tracking
- Receipt printing with customizable formats
- Bank reconciliation integration

**Journal Vouchers**:

- Manual journal entry creation
- Multi-line entries with debit/credit validation
- Narration and reference tracking
- Approval workflow for journal entries
- Reversal entry generation
- Recurring journal templates

#### Document Numbering

- Configurable document number series
- Fiscal year-based numbering
- Prefix/suffix customization
- Auto-increment with padding
- Multiple series per document type
- Series activation/deactivation

#### Financial Reports

- Trial Balance (with opening, closing, and period totals)
- Balance Sheet (comparative multi-period)
- Profit & Loss Statement (detailed and summary views)
- Cash Flow Statement (indirect method)
- Ledger Reports (account-wise transactions)
- Day Book (all transactions by date)
- Outstanding Reports (receivables and payables aging)
- Bank Book (bank-wise transactions)
- Party-wise Outstanding (customer/vendor balances)
- GST Reports (GSTR-1, GSTR-3B ready data)
- Custom report builder with filters

#### Scheduled Email Reports

- Automated report generation and delivery
- Configurable schedules (Daily, Weekly, Monthly)
- Multiple recipients per schedule
- Multiple attachments per email
- Report format selection (PDF, Excel, CSV)
- Email templates with dynamic content
- Delivery status tracking

**Pages**:

- `AccountsPage.tsx`: Chart of accounts management
- `PartiesPage.tsx`: Party master with contacts and locations
- `BanksPage.tsx`: Bank account management
- `InvoicesPage.tsx`: Sales and purchase invoices
- `PaymentReceiptPage.tsx`: Payment and receipt vouchers
- `JournalVoucherPage.tsx`: Manual journal entries
- `ReportsPage.tsx`: Financial reports with filters
- `ScheduleEmailPage.tsx`: Automated report scheduling

### 7. User & Role Management

**Features**:

- User profile management
- Role creation with permission assignment
- Permission-based access control at menu and action level
- User-organization assignments
- User activation/deactivation
- Password reset and change workflows
- User activity tracking

**Permission System**:

- Granular permissions for each module
- Action-level permissions (View, Create, Edit, Delete, Approve)
- Menu visibility based on permissions
- API endpoint authorization
- Role hierarchy and inheritance

**Pages**:

- `UsersPage.tsx`: User management interface
- `RolesPage.tsx`: Role and permission management
- `UserProfilePage.tsx`: User profile editing

### 8. Dashboard & Analytics

**Widgets & Visualizations**:

- Revenue and expense trend charts
- Outstanding invoices summary
- Task completion metrics
- Audit engagement status overview
- Recent activities feed
- Quick action buttons
- KPI cards with real-time updates
- Interactive charts using Recharts library

**Implementation**:

- `DashboardPage.tsx`: Configurable dashboard layout
- Widget-based architecture for flexibility
- Responsive grid layout for different screen sizes
- Data refresh intervals for live updates

### 9. Company Settings

**Configuration Management**:

- Company profile (Name, logo, contact details)
- Fiscal year definition and management
- Tax configuration (GST rates, tax types)
- Document number series configuration
- Email templates and SMTP settings
- Notification preferences
- Module activation/deactivation
- Custom field configuration
- Workflow customization

**Pages**:

- `CompanySettingsPage.tsx`: Company configuration
- `FiscalYearPage.tsx`: Fiscal year management
- `TaxSettingsPage.tsx`: Tax configuration

### 10. Data Management Features

**Import/Export**:

- Excel import for bulk data upload
- Template download for imports
- Data validation during import
- Error reporting with line numbers
- Excel export for all grids
- PDF export for reports and documents
- CSV export for raw data

**Search & Filter**:

- Global search across modules
- Advanced filtering on all grids
- Saved filter templates
- Column-based sorting
- Multi-column sorting support
- Quick filters for common queries

**Pagination**:

- Server-side pagination for large datasets
- Configurable page sizes
- Jump to page functionality
- Total record count display

### 11. Advanced Features

**File Management**:

- Document upload with drag-and-drop
- Multiple file attachments per record
- File preview for images and PDFs
- File size and type validation
- Secure file storage with access control
- Image cropping with react-image-crop
- Lazy loading images with react-lazy-load-image-component
- Image zoom with react-medium-image-zoom

**Notifications**:

- Real-time toast notifications with Sonner
- In-app notification center
- SignalR-based real-time notifications
- Desktop notifications (with permission)
- Notification preferences per user
- Mark as read/unread functionality

**Audit Trail**:

- Complete audit log for all transactions
- User activity tracking
- Change history with before/after values
- Timestamp and user information
- Filterable audit log viewer

**Keyboard Shortcuts**:

- Global shortcuts (Save: Ctrl+S, Search: Ctrl+K via Command palette)
- Grid navigation shortcuts
- Form navigation shortcuts
- Customizable shortcut keys

**Onboarding & Tours**:

- Interactive product tours with React Joyride
- Driver.js for step-by-step guides
- Feature discovery and user onboarding

### Performance Optimizations

- Component code-splitting and lazy loading
- Route-based code splitting with React Router v7
- TanStack Table for efficient data rendering
- Memoization for expensive calculations (useMemo, useCallback)
- Image optimization and lazy loading with react-lazy-load-image-component
- Bundle size optimization with tree-shaking
- Debounced search inputs
- Throttled scroll event handlers
- React Query caching strategy for reduced API calls
- Persistent query caching with localStorage via @tanstack/query-sync-storage-persister

## Development Workflow

### Setup Instructions

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run smoke tests
npm run test:smoke

# View test report
npm run test:report
```

### Environment Configuration

Create a `.env` file in the project root:

```env
# API Base URLs
VITE_API_URL=https://localhost:5001/api
VITE_TASK_API_URL=https://localhost:5001/api/task
VITE_ACCOUNTING_API_URL=https://localhost:5002/api

# SignalR Configuration
VITE_SIGNALR_HUB_URL=https://localhost:5001/api/task/hubs/notification
```

### Directory Structure

```
frontend/
├── public/               # Static assets
│   ├── favicon.ico
│   └── ...
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Base UI components (40+ components)
│   │   ├── auth/        # Authentication components
│   │   ├── data-display/ # Data display components
│   │   ├── error-boundaries/ # Error handling components
│   │   ├── layout/      # Layout components
│   │   ├── modals/      # Modal dialogs
│   │   ├── navigation/  # Navigation components
│   │   └── shared/      # Shared utility components
│   ├── pages/           # Route-level page components
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── organizations/
│   │   │   └── OrganizationsPage.tsx
│   │   ├── users/
│   │   │   ├── UsersPage.tsx
│   │   │   └── UserProfilePage.tsx
│   │   ├── roles/
│   │   │   └── RolesPage.tsx
│   │   ├── clients/
│   │   │   └── ClientsPage.tsx
│   │   ├── audit/
│   │   │   ├── AuditEngagementsPage.tsx
│   │   │   ├── AuditChecklistsPage.tsx
│   │   │   └── AuditFindingsPage.tsx
│   │   ├── tasks/
│   │   │   ├── TaskPage.tsx
│   │   │   └── TaskViewPage.tsx
│   │   ├── accounting/
│   │   │   ├── AccountsPage.tsx
│   │   │   ├── PartiesPage.tsx
│   │   │   ├── BanksPage.tsx
│   │   │   ├── InvoicesPage.tsx
│   │   │   ├── PaymentReceiptPage.tsx
│   │   │   ├── JournalVoucherPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── ScheduleEmailPage.tsx
│   │   ├── settings/
│   │   │   ├── CompanySettingsPage.tsx
│   │   │   ├── FiscalYearPage.tsx
│   │   │   └── TaxSettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/          # React Router configuration
│   ├── services/        # API services and SignalR
│   │   ├── api/         # API client configurations
│   │   │   ├── axios.ts
│   │   │   ├── central-backend.api.ts
│   │   │   ├── task-backend.api.ts
│   │   │   └── accounting-backend.api.ts
│   │   └── signalr.service.ts # SignalR connection management
│   ├── contexts/        # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── OrganizationContext.tsx
│   │   └── CompanyContext.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useOrganization.ts
│   │   ├── useCompany.ts
│   │   ├── useDebounce.ts
│   │   └── usePermissions.ts
│   ├── lib/             # Utility libraries
│   │   ├── utils.ts     # Helper functions
│   │   └── constants.ts # Application constants
│   ├── types/           # TypeScript type definitions
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── organization.ts
│   │   ├── user.ts
│   │   ├── client.ts
│   │   ├── task.ts
│   │   ├── accounting.ts
│   │   └── ...
│   ├── validations/     # Zod validation schemas
│   ├── config/          # Configuration files
│   ├── constants/       # Application constants
│   ├── data/            # Static data and mocks
│   ├── styles/          # Global styles
│   │   └── index.css    # Global CSS and Tailwind directives
│   ├── App.tsx          # Root application component
│   ├── main.tsx         # Application entry point
│   └── vite-env.d.ts    # Vite type declarations
├── tests/               # Playwright E2E tests
│   ├── config/          # Test configuration
│   ├── fixtures/        # Test fixtures
│   ├── helpers/         # Test helpers
│   ├── smoke/           # Smoke tests
│   └── signalr/         # SignalR tests
├── .env.example         # Example environment variables
├── .eslintrc.json       # ESLint configuration (if exists)
├── eslint.config.js     # ESLint configuration
├── .gitignore
├── .prettierrc          # Prettier configuration (if exists)
├── components.json      # shadcn/ui configuration
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── playwright.config.ts # Playwright configuration
├── README.md            # This file
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.app.json    # App-specific TS config
├── tsconfig.node.json   # Node-specific TS config
└── vite.config.ts       # Vite build configuration
```

### Development Standards

### Code Quality

- TypeScript 5.8 with strict type checking
- ESLint v9 with modern flat config
- Prettier v3 for consistent code formatting
- Component documentation with example usage
- Accessibility compliance (WCAG 2.1 AA)

### Testing Strategy

- End-to-end tests with Playwright
- Smoke tests for critical paths
- SignalR connection and real-time feature tests
- Backend health checks and integration tests
- Visual testing for UI components (planned)

### Performance Monitoring

- Vite build analytics for bundle size
- Runtime performance tracking
- Error tracking and reporting

## Integration Patterns

### Backend Communication

- RESTful API integration with standardized response handling
- Request caching and deduplication
- Error handling with retry logic
- Automatic token refresh for authenticated requests

### Inter-component Communication

- Prop drilling for direct parent-child communication
- Context API for shared state across component trees
- Custom event bus for cross-cutting concerns
- URL state for shareable application state

## Dependencies

### Core Dependencies

```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-router-dom": "^7.6.2",
  "typescript": "~5.8.3"
}
```

### State Management

```json
{
  "@tanstack/react-query": "^5.81.2",
  "@tanstack/react-query-persist-client": "^5.81.2",
  "@tanstack/query-sync-storage-persister": "^5.81.2",
  "jotai": "^2.15.0"
}
```

### Form Handling

```json
{
  "react-hook-form": "^7.59.0",
  "zod": "^3.25.67",
  "@hookform/resolvers": "^5.1.1"
}
```

### UI Components & Styling

```json
{
  "@radix-ui/react-accordion": "^1.2.12",
  "@radix-ui/react-alert-dialog": "^1.1.14",
  "@radix-ui/react-avatar": "^1.1.10",
  "@radix-ui/react-checkbox": "^1.3.2",
  "@radix-ui/react-collapsible": "^1.1.11",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-dropdown-menu": "^2.1.15",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-popover": "^1.1.15",
  "@radix-ui/react-progress": "^1.1.8",
  "@radix-ui/react-radio-group": "^1.3.7",
  "@radix-ui/react-scroll-area": "^1.2.10",
  "@radix-ui/react-select": "^2.2.5",
  "@radix-ui/react-separator": "^1.1.7",
  "@radix-ui/react-slot": "^1.2.4",
  "@radix-ui/react-switch": "^1.2.5",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-tooltip": "^1.2.7",
  "tailwindcss": "^4.1.10",
  "tailwind-merge": "^3.3.1",
  "clsx": "^2.1.1",
  "class-variance-authority": "^0.7.1",
  "lucide-react": "^0.523.0"
}
```

### Rich Text Editor

```json
{
  "@tiptap/react": "^3.6.5",
  "@tiptap/starter-kit": "^3.6.5",
  "@tiptap/extension-image": "^3.6.5",
  "@tiptap/extension-link": "^3.6.5",
  "@tiptap/extension-text-align": "^3.6.5",
  "@tiptap/extension-bullet-list": "^3.6.5",
  "@tiptap/extension-ordered-list": "^3.6.5",
  "@tiptap/extension-list-item": "^3.6.5"
}
```

### Data Display & Tables

```json
{
  "@tanstack/react-table": "^8.21.3",
  "react-day-picker": "^9.7.0"
}
```

### HTTP & Real-time

```json
{
  "axios": "^1.10.0",
  "@microsoft/signalr": "^9.0.6"
}
```

### Utilities & Features

```json
{
  "date-fns": "^4.1.0",
  "sonner": "^2.0.5",
  "cmdk": "^1.1.1",
  "react-image-crop": "^11.0.10",
  "react-lazy-load-image-component": "^1.6.3",
  "react-medium-image-zoom": "^5.4.0",
  "react-joyride": "^3.0.0-7",
  "driver.js": "^1.4.0",
  "tunnel-rat": "^0.1.2"
}
```

### Drag & Drop

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/modifiers": "^9.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

### Development Tools

```json
{
  "vite": "^6.3.5",
  "@vitejs/plugin-react": "^4.4.1",
  "@tailwindcss/vite": "^4.1.10",
  "eslint": "^9.25.0",
  "typescript-eslint": "^8.30.1",
  "prettier": "^3.6.2",
  "@playwright/test": "^1.56.1",
  "@tanstack/react-query-devtools": "^5.85.6"
}
```

## Available Scripts

- `npm run dev` - Start development server with hot reload (Vite)
- `npm run build` - Build production bundle (TypeScript + Vite)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint on codebase
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run Playwright tests with UI mode
- `npm run test:e2e:debug` - Debug Playwright tests
- `npm run test:e2e:headed` - Run tests in headed mode
- `npm run test:smoke` - Run smoke tests only
- `npm run test:report` - View Playwright test report

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Contributing

1. Follow the established code style and conventions
2. Write meaningful commit messages
3. Add appropriate tests for new features
4. Update documentation as needed
5. Ensure all tests pass before submitting PRs

## License

Proprietary - All rights reserved by EasyAudit Software

## Support

For technical support or questions, contact the development team.

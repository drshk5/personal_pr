# Lead Management Module — Product Overview

## Why Leads Matter

Every business runs on conversations. But before a conversation becomes a deal, it starts as a **lead** — someone who showed interest, filled a form, attended a demo, or was referred by an existing client.

The problem most teams face? These leads get scattered across spreadsheets, WhatsApp groups, sticky notes, and email threads. No one knows who's following up with whom, which leads are worth pursuing, and which ones quietly went cold. Worse — when a hot lead goes untouched for three days, nobody knows until it's too late.

That's exactly what this module solves. Not just tracking, but scoring, deduplication, SLA enforcement, smart assignment, CSV import, and full conversion funnel analytics — the kind of stuff you see in enterprise CRMs, not in a typical startup build.

---

## What This Module Does

The Lead Management module is the **entry point** of our CRM system. Think of it as a funnel — every potential customer enters here, gets tracked, scored, nurtured, and eventually either converts into a real business opportunity or gets marked as unqualified.

### The Lifecycle of a Lead

```
Someone shows interest (Website, Referral, LinkedIn, Cold Call, Ad, Trade Show)
       ↓
   Lead is created (status: New)
   → Automatic duplicate check runs
   → Lead score calculated (data completeness + engagement + decay)
   → Assignment rules apply (Round Robin / Territory / Capacity)
       ↓
   Sales rep reaches out (status: Contacted)
   → SLA clock starts ticking
   → Activities logged (calls, emails, meetings)
       ↓
   Lead shows buying intent (status: Qualified)
   → Score typically 60+
   → Lead marked as conversion-ready
       ↓
   ┌───────────────────────────────────────────────────┐
   │  CONVERSION (one-click, atomic transaction)       │
   │  Lead → Contact + Account + Opportunity           │
   │  All activities transferred, audit log written    │
   └───────────────────────────────────────────────────┘
       ↓
   Deal pipeline takes over
```

If at any point the lead isn't a good fit — wrong budget, wrong timing, wrong person — they're marked **Unqualified** and moved out of the active pipeline. No lead is ever deleted; we soft-delete everything so historical data stays intact.

---

## Screens & User Experience

### 1. Lead List — The Command Center

This is where sales reps and managers spend most of their time. It's a **data-rich table** with real-time health indicators, smart filtering, and one-click actions.

**What you see:**

| Column | Why it's there |
|--------|---------------|
| Name | First + Last name, clickable — takes you to the full lead profile |
| Email | Primary contact info, always visible |
| Phone | Quick-dial reference |
| Company | Helps reps identify B2B leads instantly |
| Source | Where did this lead come from? Website form? Referral? LinkedIn? Trade show? This matters for marketing ROI |
| Status | Color-coded badge — New (blue), Contacted (amber), Qualified (green), Unqualified (red), Converted (purple) |
| Lead Score | A number from 0-100 with a visual indicator — Cold, Cool, Warm, or Hot. Helps reps prioritize who to call first |
| **Indicators** | A combined column showing three badges: **Aging** (how many days since last activity), **SLA** (breached or compliant), **Duplicates** (if potential duplicates exist) |
| Assigned To | Which team member owns this lead |
| Created On | When the lead entered the system |
| Active | Whether the lead record is active or archived |

**What's new (industry-grade additions):**

- **Conversion Funnel Mini-View** — A toggleable panel at the top that shows the real-time lead funnel: how many leads at each stage, conversion rate, average time-to-conversion. Managers can see at a glance whether the pipeline is healthy.

- **Multi-Select + Bulk Assignment** — Check multiple leads and assign them to a rep in one click. Supports manual assignment (pick a team member) and auto-assignment (system applies rules — round-robin, territory-based, capacity-based).

- **Import from CSV** — Upload a CSV file, auto-map columns to lead fields, skip duplicates optionally, and see a detailed result report (created, skipped, failed rows with per-row error messages).

- **Export to CSV/Excel** — Export the current filtered view to CSV or Excel. Respects all active filters, so you can export "all SLA-breached leads from Mumbai" in two clicks.

- **Advanced Filters** — Beyond status, source, and active/inactive, you can now filter by:
  - SLA status (breached / compliant)
  - Has duplicates (yes / no)
  - Score range (min-max slider)

- **Aging Badges** — Each lead shows how long it's been since last activity:
  - Green (0-6 days) — recent activity
  - Yellow (7-13 days) — needs attention
  - Amber (14-29 days) — aging
  - Red (30+ days) — stale, likely lost

- **SLA Compliance Indicator** — A shield icon per lead:
  - Green shield = within SLA
  - Red shield = SLA breached (e.g., "New" lead untouched for 24+ hours, "Contacted" lead with no follow-up in 48 hours)

- **Duplicate Flag** — Orange "Dup" badge on leads that have potential duplicates. Hover to preview matches; click to go to the merge workflow.

**What you can do:**

- **Search** — Real-time search across name, email, company. Debounced at 400ms so it doesn't fire on every keystroke.
- **Filter** — Dedicated filter panel with 8 filter dimensions. Active filter count badge shows how many filters are applied.
- **Sort** — Click any column header to sort ascending/descending. Sorting preference is saved to localStorage.
- **Customize Columns** — Drag-and-drop column reordering, show/hide columns, pin important columns, resize widths. All persisted.
- **Pagination** — Server-side pagination with configurable page sizes (10, 20, 50, 100). Page preference is remembered.
- **Actions per lead:**
  - **Edit** — Opens the lead in a new tab for editing
  - **Convert** — Only shows for Qualified leads. Opens the conversion dialog
  - **View Duplicates** — Opens the lead detail with focus on duplicate merge
  - **Delete** — Soft delete with confirmation dialog

---

### 2. Lead Form — Create & Edit

One unified form that works for both creating new leads and editing existing ones. In edit mode, the page uses a **2/3 + 1/3 layout** — the form on the left, and a sidebar on the right with score breakdown, lead info, and activity timeline.

The URL pattern is:
- `/crm/leads/create` — New lead
- `/crm/leads/{id}` — Edit existing lead

**Form sections (left side):**

**Duplicate Warning (create mode)**
When typing an email address in create mode, the system runs a real-time duplicate check (debounced at 600ms). If potential duplicates are found, a warning banner appears above the form showing matched leads with their match percentage and match reason (exact email, fuzzy name, phone match). The user can choose to continue creating or navigate to the existing lead.

**Duplicate Warning (edit mode)**
If the backend detected duplicates for this lead, an expanded duplicate warning card is shown with a "Merge Duplicates" button that opens the merge dialog.

**Personal Information**
- First Name (required)
- Last Name (required)
- Email (required, validated as proper email format, triggers duplicate check)
- Phone (optional)

**Company Information**
- Company Name (optional, but highly recommended — feeds into Account creation during conversion)
- Job Title (optional)

**Lead Details**
- Source (required) — dropdown with: Website, Referral, LinkedIn, Cold Call, Advertisement, Trade Show, Other
- Status (only visible in edit mode) — dropdown with: New, Contacted, Qualified, Unqualified. "Converted" is not selectable manually — it's only set by the conversion process

**Address**
- Street Address, City, State, Country, Postal Code — all optional but useful for regional segmentation and territory-based assignment

**Notes**
- Free-text area for any context — "Met at the Delhi conference", "Budget approved for Q2", etc.

**Sidebar (right side, edit mode only):**

**Lead Score Breakdown**
A visual card showing:
- Overall score (0-100) with a color-coded progress bar
- Score decomposition by category:
  - **Data Completeness** (+pts for having email, phone, company, job title)
  - **Engagement** (+pts for recent activities, status progression)
  - **Time Decay** (-pts if the lead has been inactive for too long)
  - **Negative Signals** (-pts for bounced emails, unresponsive patterns)
- Each factor shows its name and point contribution (+10, -5, etc.)

**Lead Info**
Quick-reference card showing current status (badge), created date, last updated, created by, assigned to, and conversion date (if converted).

**Recent Activities Timeline**
A compact timeline of the last 5 activities (calls, emails, meetings, notes) with:
- Activity type icon (Phone, Mail, Calendar, MessageSquare)
- Subject line
- Date/time
- Outcome (if completed)

**Header Actions:**
- **Convert** button (only for Qualified leads) — opens conversion dialog
- **Back** button — returns to lead list

---

### 3. Lead Conversion — The Key Business Process

This is what makes our lead management special. When a lead reaches the "Qualified" stage and the sales rep confirms they're a real prospect, one click triggers an **atomic conversion**.

**What happens when you click "Convert":**

A dialog opens with a summary of what will be created, plus options:
- **Create Account** (checked by default) — Takes the lead's company name and creates a new Account record
  - If unchecked, shows a field to link to an existing account
- **Create Opportunity** (checked by default) — Creates a new deal in the sales pipeline
  - Option to name the opportunity
  - Option to select a specific pipeline (or use default)
  - Option to set an initial deal amount

When confirmed, the system does all of this in a **single transaction**:
1. Creates a **Contact** from the lead's personal info (name, email, phone, job title)
2. Creates an **Account** from the lead's company info (or links to an existing account)
3. Creates an **Opportunity** (deal) linked to the account, placed in the selected pipeline's first stage
4. Re-links all historical **Activities** (calls, emails, meetings, notes) from the lead to the new contact + account + opportunity
5. Marks the lead as **Converted** and records when and what was created
6. Writes an **audit log** entry for compliance

If anything fails, everything rolls back. No half-converted leads, no orphaned records.

---

### 4. Lead Scoring — Automated Prioritization

Every lead gets a score from 0 to 100, calculated from multiple signal categories:

**Data Completeness Signals**
| Signal | Points |
|--------|--------|
| Has email | +10 |
| Has phone | +10 |
| Has company name | +15 |
| Has job title | +10 |

**Engagement Signals**
| Signal | Points |
|--------|--------|
| Status is Qualified | +20 |
| Status is Contacted | +10 |
| Has recent activity (last 7 days) | +5 |
| Source is Referral | +5 |
| Source is Website | +3 |

**Time Decay**
| Signal | Points |
|--------|--------|
| No activity in 14+ days | -5 |
| No activity in 30+ days | -15 |

**Negative Signals**
| Signal | Points |
|--------|--------|
| Bounced email | -10 |
| Status is Unqualified | -20 |

**Configurable Scoring Rules:**
Administrators can create custom scoring rules through the scoring rules API. Each rule specifies:
- A condition field (e.g., strSource, strStatus, intDaysSinceLastActivity)
- An operator (equals, contains, greater_than, days_since)
- A condition value
- Points to add/subtract
- A category (data_completeness, engagement, decay, negative)
- Active/inactive toggle and display order

The score is displayed as a color-coded badge:

| Score Range | Label | Color |
|------------|-------|-------|
| 76-100 | Hot | Green |
| 51-75 | Warm | Blue |
| 26-50 | Cool | Amber |
| 0-25 | Cold | Red |

---

### 5. Duplicate Detection & Merge

**Detection:**
When a new lead is created, the system automatically checks for duplicates by:
- Exact email match
- Fuzzy name matching (similar first+last name combinations)
- Phone number matching

Each potential duplicate is assigned a confidence score (0-100%) and a match reason.

In the list view, leads with duplicates show an orange "Dup" badge. Hovering reveals the top matches.

**Merge:**
The merge dialog allows:
1. Selecting which duplicates to merge into the primary lead
2. Field-by-field comparison — for each field (name, email, company), click the value you want to keep from either the primary or any duplicate
3. On merge:
   - All activities from duplicates are transferred to the primary lead
   - Duplicates are archived (soft-deleted)
   - Score is recalculated
   - Audit log entry is created

---

### 6. Lead Assignment — Smart Distribution

**Manual Assignment:**
From the list view, select one or more leads and click "Assign" to assign them to a specific team member.

**Auto-Assignment Rules:**
The system supports three assignment strategies, evaluated in priority order:

| Strategy | How it works |
|----------|-------------|
| **Territory** | Matches lead's city/state/country to territory conditions. Leads from Mumbai go to the Mumbai rep. |
| **Capacity** | Each rep has a max capacity. New leads go to the rep with the most remaining capacity. |
| **Round Robin** | Simple rotation — each new lead goes to the next rep in the rotation. |

Active assignment rules are displayed in the auto-assign tab of the assignment dialog. When auto-assign is triggered, the system evaluates all active rules and distributes selected leads accordingly.

---

### 7. CSV Import / Export

**Import:**
A three-step wizard inside a dialog:
1. **Upload** — Select a CSV file (or download a pre-formatted template)
2. **Mapping** — Each CSV column is shown with a dropdown to map it to a lead field. The system auto-maps by matching column names (e.g., "First Name" → strFirstName). Required fields (First Name, Last Name, Email) must be mapped. Option to skip duplicates during import.
3. **Result** — Shows import summary: total rows, created, skipped (duplicates), failed. Failed rows show per-row errors (e.g., "Row 15: Invalid email format").

**Export:**
The export button in the toolbar offers CSV or Excel format. It exports the current filtered view — so if you've filtered to "SLA Breached" + "Source: LinkedIn", only those leads are exported.

---

### 8. SLA & Lead Aging

**SLA Configuration:**
The system defines SLA thresholds for each lead stage:
- **New leads**: Max hours before first contact (e.g., 24 hours)
- **Contacted leads**: Max hours between follow-ups (e.g., 48 hours)
- **Qualified leads**: Max days before conversion (e.g., 14 days)
- **Stale threshold**: Days of inactivity that marks a lead as stale (e.g., 30 days)

**Visual Indicators:**
In the list view, each active lead shows:
- An **aging badge** (green/yellow/amber/red based on days since last activity)
- An **SLA shield** (green check = compliant, red alert = breached)

**Filtering:**
Managers can filter the list to show only SLA-breached leads, enabling a focused "save the lead" workflow each morning.

---

### 9. Conversion Funnel Analytics

A toggleable panel above the lead list that shows:
- **Funnel stages** — Count and percentage at each status (New, Contacted, Qualified, Unqualified, Converted)
- **Conversion rate** — Percentage of leads that converted
- **Average time to conversion** — In days
- **Source breakdown** — Which sources produce the most leads and which convert best
- **Rep performance** — Which team members convert the most leads and at what rate

This data comes from the analytics API and is computed on the backend from actual lead data.

---

### 10. Status Badges — Visual Communication

Every lead status has a dedicated color that stays consistent throughout the application:

| Status | Color | Meaning |
|--------|-------|---------|
| New | Blue | Just entered the system, no one has reached out yet |
| Contacted | Amber | Sales rep has made first contact — waiting for response |
| Qualified | Green | Lead has confirmed interest and has budget/authority/need |
| Unqualified | Red | Not a fit — wrong budget, wrong timing, or not the decision maker |
| Converted | Purple | Successfully converted to Contact + Account + Opportunity |

These colors were chosen based on universal associations — green for positive/go, red for stop/negative, amber for in-progress/waiting, blue for neutral/new, purple for completed/special.

---

### 11. Source Tracking — Marketing Attribution

Every lead has a source field that tracks where they came from. Each source gets its own icon for quick visual identification:

| Source | Icon | Use Case |
|--------|------|----------|
| Website | Globe | Inbound form fills, chat requests |
| Referral | Users | Referred by existing client or partner |
| LinkedIn | LinkedIn logo | Social selling, InMail responses |
| Cold Call | Phone | Outbound calling campaigns |
| Advertisement | Megaphone | Paid ads (Google, Facebook, etc.) |
| Trade Show | Store | Events, conferences, exhibitions |
| Other | Dots | Anything that doesn't fit above |

This data feeds into the analytics' "Source Breakdown" chart, giving marketing teams clear visibility into which channels are producing results and which aren't worth the spend.

---

## What Makes Our Implementation Special

### Industry-Grade Features in a Startup Timeline
- **Lead scoring** with behavioral signals, time decay, negative signals, and configurable rules — the kind of feature that takes 6 months in enterprise CRMs
- **Duplicate detection** with fuzzy matching and merge workflows — not just "exact email match" but confidence-scored fuzzy matching
- **SLA enforcement** with visual indicators and filterable breach reports
- **Smart assignment** with territory, capacity, and round-robin strategies
- **CSV import** with auto-mapping, duplicate skip, and per-row error reporting

### Built for Indian Sales Teams
- Default currency is INR
- Timezone handling for IST
- Source options include Trade Show (major channel for Indian B2B)
- Territory assignment supports city/state level granularity across India

### Performance at Scale
- Server-side pagination — we never load 10,000 leads into the browser
- Debounced search — API calls only after the user stops typing
- Column visibility and preferences persisted to localStorage — zero setup cost on repeat visits
- Lazy-loaded routes — the lead module code only downloads when you navigate to it
- Duplicate detection is debounced to avoid excessive API calls during form entry

### Data Integrity
- Soft deletes everywhere — nothing is ever truly lost
- Atomic transactions for lead conversion — no half-states
- Atomic merge operations — activities transfer completely or not at all
- Immutable activity trail — once an activity is logged, it cannot be edited or deleted
- Multi-tenant isolation — every query is automatically filtered by the user's organization

### Permission-Based Access
- Every action (view, create, edit, delete) is gated by the organization's permission system
- Buttons, menu items, and actions automatically hide if the user doesn't have the required permission
- Import and export respect the same permission boundaries

### Consistent UX Patterns
- Same table component used across all modules (Leads, Contacts, Accounts, etc.)
- Same form patterns, validation approach, and navigation flow
- A user who learns the Lead list can immediately use the Contact list or Account list — zero learning curve for new modules

---

## How It Connects to the Rest of the CRM

```
┌──────────────────────────────────────────────────────────┐
│                        DASHBOARD                          │
│  KPIs • Pipeline Funnel • Revenue Charts • Activity Feed  │
│  Lead Analytics • Source Breakdown • Rep Performance      │
└──────────────┬───────────────────────────────┬────────────┘
               │                               │
    ┌──────────▼──────────┐         ┌──────────▼──────────┐
    │       LEADS         │         │     ACTIVITIES       │
    │  (this module)      │────────▶│  Calls, Emails,      │
    │  New → Qualified    │         │  Meetings, Notes     │
    │  → Converted        │         └──────────────────────┘
    │                     │
    │  Features:          │
    │  • Scoring (0-100)  │
    │  • SLA Enforcement  │
    │  • Dedup & Merge    │
    │  • Smart Assignment │
    │  • CSV Import/Export │
    │  • Funnel Analytics │
    └─────────┬───────────┘
              │ conversion (atomic)
    ┌─────────▼───────────┐
    │     CONTACTS        │
    │  + ACCOUNTS         │
    └─────────┬───────────┘
              │
    ┌─────────▼───────────┐
    │   OPPORTUNITIES     │
    │  (Deals Pipeline)   │
    │  Kanban Board        │
    │  Deal Rotting        │
    │  Win/Loss Tracking  │
    └─────────────────────┘
```

Leads are the **top of the funnel**. Everything downstream — contacts, accounts, opportunities, revenue — starts with a lead. That's why this module was built first, and that's why it ships with enterprise-grade features from day one.

---

## File Architecture

```
src/
├── types/CRM/
│   ├── lead.ts              # 40+ interfaces — DTOs, scoring, duplicates, import/export, analytics
│   └── activity.ts          # Activity interfaces used in lead detail
├── services/CRM/
│   └── lead.service.ts      # 20+ API methods — CRUD, duplicates, import, assignment, analytics, scoring rules
├── hooks/api/CRM/
│   └── use-leads.ts         # 20+ React Query hooks for every operation
├── validations/CRM/
│   └── lead.ts              # 6 Zod schemas — form, convert, merge, import, assign, scoring rule
├── pages/CRM/leads/
│   ├── LeadList.tsx          # Full list page — table, filters, funnel, bulk actions, import/export
│   ├── LeadForm.tsx          # Create/edit with sidebar — score breakdown, activities, duplicates
│   ├── LeadFormSkeleton.tsx  # Loading skeleton
│   └── components/
│       ├── LeadStatusBadge.tsx        # Color-coded status
│       ├── LeadScoreBadge.tsx         # Score with Hot/Warm/Cool/Cold
│       ├── LeadSourceBadge.tsx        # Source with icon
│       ├── LeadAgingBadge.tsx         # Days since activity (green/yellow/amber/red)
│       ├── LeadSLAIndicator.tsx       # SLA shield (green check / red alert)
│       ├── LeadDuplicateWarning.tsx   # Compact badge + expanded panel with match details
│       ├── LeadScoreBreakdown.tsx     # Score decomposition by category with +/- points
│       ├── LeadConvertDialog.tsx      # Conversion with account/opportunity/pipeline options
│       ├── LeadImportDialog.tsx       # CSV import wizard (upload → mapping → result)
│       ├── LeadMergeDialog.tsx        # Duplicate merge with field-level comparison
│       └── LeadAssignmentDialog.tsx   # Manual + auto-assignment with rule display
└── routes/
    └── crm-routes.tsx        # Lazy-loaded CRM route mapping
```

---

## Technical Summary

| Aspect | Detail |
|--------|--------|
| Frontend | React 19, TypeScript, Vite, TanStack Query, React Hook Form, Zod, Tailwind CSS, shadcn/ui |
| State | Server state via React Query, client preferences via localStorage |
| API | RESTful, 20+ endpoints via central gateway to CRM microservice |
| Authentication | JWT-based, extracted from token for multi-tenant isolation |
| Routing | Lazy-loaded, map-key based dynamic routing |
| Validation | Client-side (Zod) + Server-side (FluentValidation) |
| Data | Soft-delete, audit-logged, tenant-scoped |
| Scoring | Configurable rule engine, 4 signal categories, real-time display |
| Assignment | 3 strategies (territory, capacity, round-robin), rule-based, bulk |
| Import/Export | CSV with auto-mapping, per-row errors, filtered export |
| Duplicates | Fuzzy matching, merge with field selection, activity transfer |
| SLA | Configurable thresholds, visual indicators, breach filtering |
| Analytics | Funnel, conversion rate, source breakdown, rep performance |

---

*This document covers the Lead Management module as designed and implemented for the CRM system. It ships with industry-grade features typically found in enterprise CRMs — lead scoring, duplicate detection, SLA enforcement, smart assignment, CSV import/export, and conversion funnel analytics — while maintaining the simplicity and speed of a modern React frontend.*

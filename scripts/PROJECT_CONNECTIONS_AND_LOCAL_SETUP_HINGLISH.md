# Project Connections + Local Setup (Hinglish)

Ye doc pure project ke runtime behavior pe based hai: central-backend, crm-backend, audit-frontend, aur SQL seed scripts.

## 1) High-Level Core Samjho

Is project ka flow:

1. Browser me `audit-frontend` chalti hai.
2. Frontend API calls central backend pe bhejta hai (`/api/...`).
3. `central-backend` API Gateway ke through request ko service prefix ke basis pe forward karta hai:
   - `/api/crm` -> CRM backend
   - `/api/accounting` -> accounting backend
   - `/api/task` -> task backend
   - `/api/hrm` -> hrm backend
4. CRM backend multi-tenant query filters use karta hai (`strGroupGUID` claim based).

## 2) Current Port Mapping (As-Is in Code)

### A) Central Backend (local)

- Effective local URLs (launch profile):
  - `https://localhost:5001`
  - `http://localhost:5000`
- Source file:
  - `central-backend/Properties/launchSettings.json`

### B) CRM Backend (local)

- Appsettings me Kestrel endpoint explicitly set hai:
  - `https://localhost:5010`
- Source file:
  - `crm-backend/appsettings.json` -> `Kestrel.Endpoints.Https.Url`
- Note:
  - `crm-backend/Properties/launchSettings.json` me `5079/7083` diya hai, but appsettings Kestrel override karega.

### C) Frontend (local dev)

- Vite default port usually `5173` (vite.config me custom server port set nahi hai).
- Frontend API base:
  - `VITE_BASE_URL=http://localhost:5001`
- Source files:
  - `audit-frontend/.env.development`
  - `audit-frontend/src/config/environment.ts`
  - `audit-frontend/src/lib/api/axios.ts`

### D) Central Docker Ports

- Docker mapping:
  - host `5001 -> container 8080` (HTTP)
  - host `5002 -> container 8081`
- Source file:
  - `central-backend/docker-compose.yml`

### E) Production Frontend Base

- `VITE_BASE_URL=https://central.moneycareindia.com`
- `VITE_HUB_URL=https://hub.moneycareindia.com`
- Source file:
  - `audit-frontend/.env.production`

## 3) Port Change Karna Ho To Kahan Edit Karen

### Central backend port change

Edit:

1. `central-backend/Properties/launchSettings.json`
   - `applicationUrl`
2. Agar Docker use kar rahe ho: `central-backend/docker-compose.yml`
   - `ports` mapping
3. Frontend ko new central URL dena hoga:
   - `audit-frontend/.env.development` -> `VITE_BASE_URL=...`

### CRM backend port change

Edit:

1. `crm-backend/appsettings.json`
   - `Kestrel.Endpoints.Https.Url`
2. Central gateway me CRM target update:
   - `central-backend/appsettings.json` -> `ApiGateway.CrmServiceBaseUrl`

### Frontend dev port change

Options:

1. Run command se:
   - `npm run dev -- --port 5174`
2. Ya `vite.config.ts` me `server.port` add karo.

## 4) Environment Config (Dev vs Prod)

### Frontend

- Dev URL: `audit-frontend/.env.development`
- Prod URL: `audit-frontend/.env.production`
- Runtime use:
  - `audit-frontend/src/config/environment.ts`
  - `audit-frontend/src/lib/api/axios.ts` (baseURL = `${environment.baseUrl}/api`)

### Central backend

- Primary config:
  - `central-backend/appsettings.json`
- Docker config:
  - `central-backend/appsettings.Docker.json`
- Template:
  - `central-backend/appsettings.json.template`

### CRM backend

- Primary:
  - `crm-backend/appsettings.json`
- Dev logging override:
  - `crm-backend/appsettings.Development.json`

## 5) Database Handling (Actual Behavior)

### Central backend DB

- Uses:
  - `central-backend/appsettings.json` -> `ConnectionStrings.DefaultConnection`
- Startup pe connection check bhi karta hai.
- Is DB me auth/user/menu/group-module meta data rehta hai.

### CRM backend DB behavior

Code me 2 layers dikh rahi hain:

1. `MasterDbContext`:
   - `mstUser`, `mstOrganization`, `mstGroupModule` read karne ke liye.
2. `CrmDbContext`:
   - CRM tables (`MstLeads`, `MstAccounts`, etc.) ke liye.
   - Tenant query filters (`strGroupGUID`) applied.

Important reality:

- `ConnectionStringResolver` + `TenantDbContextManager` classes present hain (dynamic tenant connection intent).
- Lekin runtime usage direct wired nahi dikh raha repositories/unit of work path me.
- Is waqt `CrmDbContext` DI registration `DefaultConnection` se ho rahi hai (Program.cs path).
- Matlab aaj ke code ke basis pe practical DB route static connection pe rely karta hai unless extra wiring add ho.

## 6) Services Kaise Connected Hain

### Request path chain (CRM example)

1. Frontend call: `/crm/leads` (service file me prefix `/crm`)
2. Axios baseURL adds `/api` -> final request central pe `/api/crm/leads`
3. Central `ApiGatewayMiddleware` route check karta hai.
4. `/api/crm` request `CrmServiceBaseUrl` pe forward hoti hai.
5. Auth header forward hota hai.
6. CRM me:
   - JWT auth
   - `TenantContextMiddleware` claim `strGroupGUID` se `TenantId` set karta hai
   - `RequireTenantId` attribute missing tenant pe request reject karta hai.

## 7) Is PC Par Kaise Chalaya Jaaye (Practical)

## Step 1: SQL Server ready karo

- SQL Server running hona chahiye.
- Connection strings ko apne machine ke SQL instance ke hisab se set karo:
  - `central-backend/appsettings.json`
  - `crm-backend/appsettings.json`

## Step 2: Seed scripts run karo

Root se SQL scripts execute karo:

1. `CRM_Complete_Seed_Script.sql`
2. `CRM_MasterMenu_Final.sql`
3. verify: `CRM_Verify_Seed_Data.sql`

## Step 3: Central backend start

```bash
cd /Users/drshk5/Downloads/crm-dk/central-backend
dotnet restore
dotnet run --launch-profile AuditSoftware
```

Expected: central on `https://localhost:5001`.

## Step 4: CRM backend start

```bash
cd /Users/drshk5/Downloads/crm-dk/crm-backend
dotnet restore
dotnet run
```

Expected (as per appsettings): CRM on `https://localhost:5010`.

## Step 5: Frontend start

```bash
cd /Users/drshk5/Downloads/crm-dk/audit-frontend
npm install
npm run dev
```

Expected: frontend on `http://localhost:5173`.

## Step 6: Verify integration

Check:

1. Frontend login works.
2. CRM pages (`leads/contacts/accounts/opportunities`) open.
3. Central gateway logs me `/api/crm/...` forwarding visible ho.

## 8) Critical Gaps Jo Dhyan Rakhna Hai

1. Repo me `account-backend` folder nahi mila, lekin central config me accounting service URL configured hai (`7089`).
   - Accounting module calls fail ho sakte hain jab tak external accounting backend run na ho.
2. Frontend aur backend ke kuch CRM endpoints me naming mismatch already present hai.
   - Full end-to-end test karte waqt 404/contract issues aa sakte hain.

## 9) Quick File Index (Most Important)

1. `central-backend/Properties/launchSettings.json` - central local ports
2. `central-backend/appsettings.json` - DB + gateway target URLs
3. `central-backend/docker-compose.yml` - docker port mapping
4. `central-backend/Middleware/ApiGatewayMiddleware.cs` - forwarding logic
5. `crm-backend/appsettings.json` - CRM DB/JWT/Kestrel(5010)
6. `crm-backend/Properties/launchSettings.json` - profile ports
7. `crm-backend/Middleware/TenantContextMiddleware.cs` - tenant claim extraction
8. `crm-backend/Data/DbContexts.cs` - tenant query filters + CRM entities
9. `audit-frontend/.env.development` - frontend to central base URL
10. `audit-frontend/src/lib/api/axios.ts` - `/api` prefixed gateway calls


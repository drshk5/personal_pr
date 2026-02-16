# Windows Runbook (Same Database Copy)

Goal: kisi bhi dusre Windows PC par **central-backend + crm-backend + audit-frontend** ko **exact same database** ke saath chalana (same ports, same users, same data).

This runbook assumes:
- SQL Server Docker me chalega (container name: `crm-sql`)
- Ports (as-is): SQL `14333`, Central `5001`, CRM `5005`, Frontend `5173`
- SQL login (as repo config): `sa` / `Darshak@5804`

---

## To-Do Checklist

- [ ] Install prerequisites (Docker Desktop, .NET 8 SDK, Node 18+, Git)
- [ ] Repo `crm-dk` Windows PC par copy/clone
- [ ] SQL Server container start (port `14333`)
- [ ] **Same DB** import: `MasterDB` + saare `CRM_*` databases (bacpac import)
- [ ] Central backend run (`http://localhost:5001`)
- [ ] CRM backend run (`http://localhost:5005`)
- [ ] Frontend run (`http://localhost:5173`)
- [ ] Login + basic sanity checks
- [ ] (Optional) DBeaver se DB access verify

---

## 1) Prerequisites (Windows)

Install:
- Docker Desktop (WSL2 enabled)
- .NET SDK 8.x
- Node.js 18+
- Git

Verify (PowerShell):
```powershell
docker --version
dotnet --version
node --version
git --version
```

---

## 2) Repo Setup

Example path (recommended):
- `C:\work\crm-dk`

Repo copy/clone ke baad folder structure me ye 3 folders honi chahiye:
- `central-backend`
- `crm-backend`
- `audit-frontend`

---

## 3) Ports Free Hain Ya Nahi (Quick Check)

```powershell
netstat -ano | findstr ":14333"
netstat -ano | findstr ":5001"
netstat -ano | findstr ":5005"
netstat -ano | findstr ":5173"
```

Agar already in use ho, to ya to conflict band karo ya ports change karne padenge (this runbook same ports assume karta hai).

---

## 4) SQL Server (Docker) Start (Same Password + Same Port)

### 4.1 (Optional) Clean Reset (ONLY if you want fresh import)

Warning: ye aapka purana Docker SQL data delete kar dega.
```powershell
docker rm -f crm-sql
docker volume rm crm-sql-data
```

### 4.2 Start Container

```powershell
docker run -d --name crm-sql `
  -e "ACCEPT_EULA=Y" `
  -e "MSSQL_PID=Developer" `
  -e "SA_PASSWORD=Darshak@5804" `
  -p 14333:1433 `
  -v crm-sql-data:/var/opt/mssql `
  mcr.microsoft.com/mssql/server:2022-latest
```

Wait until SQL ready:
```powershell
docker logs -f crm-sql
```

---

## 5) SQLPackage Install (One-Time)

`bacpac` import/export ke liye `sqlpackage` chahiye.

```powershell
dotnet tool install -g microsoft.sqlpackage
sqlpackage /Version
```

Note:
- Agar `sqlpackage` command not found aaye, to new terminal open karo.
- Ensure PATH includes: `%USERPROFILE%\.dotnet\tools`

---

## 6) Import “Same DB” (BACPAC)

### 6.1 Files Needed

Target Windows machine par ye bacpac files chahiye:
- `MasterDB-05022026.bacpac` (repo me already: `central-backend\db-backup\MasterDB-05022026.bacpac`)
- Saare tenant databases ke bacpacs: `CRM_*.bacpac`
  - Example (aapke current env me):  
    - `CRM_444e21822d444e8899373db8009a7f88`  
    - `CRM_b09ec921a03e4a54a783bec51a033815`

Recommended: saare bacpac files ko Windows machine me is folder me rakho:
- `C:\work\crm-dk\central-backend\db-backup\`

### 6.2 Import Commands (PowerShell)

```powershell
$Repo = "C:\work\crm-dk"
$BacpacDir = Join-Path $Repo "central-backend\\db-backup"
$Server = "localhost,14333"
$User = "sa"
$Pass = "Darshak@5804"

# 1) Import MasterDB (Central DB)
sqlpackage /Action:Import `
  /SourceFile:"$BacpacDir\\MasterDB-05022026.bacpac" `
  /TargetServerName:"$Server" `
  /TargetDatabaseName:"MasterDB" `
  /TargetUser:"$User" `
  /TargetPassword:"$Pass" `
  /TargetEncryptConnection:False

# 2) Import each CRM_* database bacpac (repeat for every CRM_*.bacpac you have)
# Example:
sqlpackage /Action:Import `
  /SourceFile:"$BacpacDir\\CRM_444e21822d444e8899373db8009a7f88.bacpac" `
  /TargetServerName:"$Server" `
  /TargetDatabaseName:"CRM_444e21822d444e8899373db8009a7f88" `
  /TargetUser:"$User" `
  /TargetPassword:"$Pass" `
  /TargetEncryptConnection:False
```

Verify DB list:
```powershell
docker exec crm-sql /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "Darshak@5804" -C `
  -Q "SET NOCOUNT ON; SELECT name FROM sys.databases ORDER BY name"
```

---

## 7) Run Backends (2 terminals)

### 7.1 Central Backend

```powershell
cd C:\work\crm-dk\central-backend
dotnet restore
dotnet run --launch-profile AuditSoftware
```

Expected:
- `http://localhost:5001`
- Swagger: `http://localhost:5001/swagger`

### 7.2 CRM Backend

```powershell
cd C:\work\crm-dk\crm-backend
dotnet restore
dotnet run --launch-profile http
```

Expected:
- `http://localhost:5005`

---

## 8) Run Frontend (1 terminal)

```powershell
cd C:\work\crm-dk\audit-frontend
npm install
npm run dev
```

Expected:
- `http://localhost:5173`

Frontend dev env already points to central:
- `audit-frontend\.env.development` -> `VITE_BASE_URL=http://localhost:5001`

---

## 9) Login + Sanity Checks

Open:
- `http://localhost:5173`

Login (QA Admin):
- Email: `qaadmin50702403@example.com`
- Password: `string`

Quick checks:
- Dashboard open
- CRM pages (Leads/Contacts/Accounts/Opportunities) load

---

## 10) (Optional) DBeaver Connection (DB Access)

Create connection: **SQL Server**

Central DB:
- Host: `localhost`
- Port: `14333`
- Database: `MasterDB`
- User: `sa`
- Password: `Darshak@5804`

CRM tenant DB (example):
- Database: `CRM_444e21822d444e8899373db8009a7f88`

Tip: agar SSL/cert error aaye to driver settings me:
- `trustServerCertificate=true`
- ya `encrypt=false`

---

## Appendix A) Source Machine Se CRM_* BACPAC Export (If needed)

Agar aapke paas `CRM_*.bacpac` nahi hain, to **source machine** (jahan project already chal raha hai) par export karke Windows machine par copy karo.

1) List tenant DBs:
```sql
SELECT name FROM sys.databases WHERE name LIKE 'CRM_%' ORDER BY name;
```

2) Export (repeat per database):
```powershell
sqlpackage /Action:Export `
  /SourceServerName:"localhost,14333" `
  /SourceDatabaseName:"CRM_444e21822d444e8899373db8009a7f88" `
  /SourceUser:"sa" `
  /SourcePassword:"Darshak@5804" `
  /SourceEncryptConnection:False `
  /TargetFile:"CRM_444e21822d444e8899373db8009a7f88.bacpac"
```

Then bacpacs ko Windows machine me `central-backend\db-backup\` me place karke import steps run karo.


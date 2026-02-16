# EasyAudit Software - Backend

## Important Development Guidelines

### DateTime Usage - IST Time Standard

As of August 2025, all date/time operations in this application should use Indian Standard Time (IST).
To support this requirement, we've provided a centralized `DateTimeProvider` class:

```csharp
// Use this instead of DateTime.UtcNow for all new and modified code
var currentDateTime = DateTimeProvider.Now; // Returns current time in IST

// Use this instead of DateTime.Now.Year
var currentYear = DateTimeProvider.CurrentYear;

// Converting between UTC and IST
var istTime = utcTime.ToIst();
var utcTime = istTime.ToUtc();
```

All existing code that uses `DateTime.UtcNow` should be gradually migrated to use `DateTimeProvider.Now`.
This ensures consistent time formatting across the application and all timestamps will be in IST.

## Prerequisites

- .NET 6.0 SDK or later
- SQL Server 2019 or later
- Visual Studio 2022 (recommended) or VS Code with C# extensions

## Getting Started

Follow these steps in order to set up the application:

### 1. Clone the Repository

```bash
git clone [repository-url]
cd audit-backend
```

### 2. Application Configuration

1. **Create appsettings.json**
   - Copy `appsettings.Example.json` to `appsettings.json`
   - Update the connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_SERVER;Database=YOUR_DB;Trusted_Connection=True;MultipleActiveResultSets=true"
     }
   }
   ```

### 3. Database Setup

1. **Update Database with Migrations**

```powershell
dotnet ef database update
```

2. **Run Initial Data Seeder**

   - Open SQL Server Management Studio (SSMS)
   - Connect to your database using the same connection details as in appsettings.json
   - Open and execute: `Migrations/CommonSeeders/InitialDataSeeder.sql`

   This script will create:

   - Required Picklist Types (Currency Code, UDF Code, etc.)
   - Menu Structure
   - Super Admin User

### 4. Run the Application

**Using Visual Studio:**

- Open `AuditSoftware.sln`
- Press F5 to run in debug mode
- Or use Ctrl + F5 to run without debugging

**Using Command Line:**

```powershell
dotnet run
```

## Initial Login Credentials

After running the seeder script, you can log in with:

- Email: super@gmail.com
- Password: [Your provided password]

## Seeded Data Details

### 1. Picklist Types

- Currency Code
- UDF Code
- Legal Status Code
- Industry Code

### 2. Menu Structure

- Organization management
- User management
- Group management
- Picklist management
- Year management

## Project Structure

```
audit-backend/
├── Controllers/         # API endpoints
├── Models/             # Data models
├── Services/           # Business logic
├── Migrations/         # Database migrations
│   └── CommonSeeders/  # Data seeder scripts
├── Data/               # Database context
└── DTOs/              # Data Transfer Objects
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Verify SQL Server is running
   - Check connection string in appsettings.json
   - Ensure database user has proper permissions

2. **Seeder Script Failed**

   - Check SQL Server error logs
   - Verify you have permissions to create/modify database objects
   - Ensure no conflicting data exists

3. **Build Errors**
   ```powershell
   dotnet restore
   dotnet clean
   dotnet build
   ```

## API Documentation

Once running, access Swagger documentation at:

- Development: https://localhost:5001/swagger
- Production: [Your-Production-URL]/swagger

# Playwright E2E Tests

End-to-end testing suite for the EasyAudit Software Frontend, covering interactions with 3 backends (Central, Task, Accounting) and SignalR real-time features.

## 📁 Test Structure

```
tests/
├── config/
│   └── test-config.ts          # Test users, API endpoints, timeouts
├── fixtures/
│   └── auth.fixture.ts         # Authentication helpers, logged-in page fixtures
├── helpers/
│   └── test-helpers.ts         # Common test utilities (forms, toasts, SignalR)
├── signalr/
│   └── signalr-connection.spec.ts  # SignalR real-time connection tests
└── smoke/
    ├── critical-paths.spec.ts  # Core user journeys (login, dashboard, logout)
    ├── task-operations.spec.ts # Task CRUD operations (planned)
    └── backend-health.spec.ts  # Backend connectivity checks (planned)
```

## 🚀 Quick Start

### Prerequisites

Before running tests, ensure:

1. **Backend services are running:**
   - Central Backend (https://localhost:5001)
   - Task Backend (with SignalR hub at https://localhost:5001/api/task/hubs/notification)
   - Accounting Backend (https://localhost:5002)
2. **Frontend dev server is running:**

   ```bash
   npm run dev
   ```

   Frontend should be accessible at http://localhost:5173

3. **Test user exists in database:**
   - Check `tests/config/test-config.ts` for required credentials
   - User must have proper permissions for testing features

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests with UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

Interactive mode with visual test runner, time travel debugging, and watch mode.

### Run Only Smoke Tests

```bash
npm run test:smoke
```

### Debug a Specific Test

```bash
npm run test:e2e:debug tests/smoke/critical-paths.spec.ts
```

### Run Tests in Headed Mode

```bash
npm run test:e2e:headed
```

### View Last Test Report

```bash
npm run test:report
```

## ⚙️ Configuration

### Update Test Users

Edit `tests/config/test-config.ts`:

```typescript
export const TEST_USERS = {
  admin: {
    email: "your-admin@example.com", // ⚠️ Update this
    password: "YourPassword123!", // ⚠️ Update this
  },
};
```

**Important:** Use test environment users only, never production credentials!

### Configure Backend URLs

Tests use environment variables from your frontend. Update `.env` if needed:

```env
VITE_API_URL=https://localhost:5001/api
VITE_TASK_API_URL=https://localhost:5001/api/task
VITE_ACCOUNTING_API_URL=https://localhost:5002/api
VITE_SIGNALR_HUB_URL=https://localhost:5001/api/task/hubs/notification
```

**Note:** Tests expect HTTPS backends by default. Ensure SSL certificates are trusted.

## 📝 Writing Tests

### Basic Test with Authentication

```typescript
import { test, expect } from "../fixtures/auth.fixture";

test("My feature works", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/my-feature");

  await expect(authenticatedPage.locator("h1")).toContainText("My Feature");
});
```

### Test Without Authentication

```typescript
import { test, expect } from "@playwright/test";

test("Login page is accessible", async ({ page }) => {
  await page.goto("/login");

  await expect(page.locator('input[name="email"]')).toBeVisible();
});
```

### Using Test Helpers

```typescript
import {
  fillFormField,
  clickButton,
  waitForToast,
  waitForSignalRConnection,
  getSignalRConnectionState,
} from "../helpers/test-helpers";

test("Create task", async ({ authenticatedPage }) => {
  await fillFormField(authenticatedPage, "title", "New Task");
  await clickButton(authenticatedPage, "Save");
  await waitForToast(authenticatedPage, "Task created");
});

test("SignalR connects after login", async ({ authenticatedPage }) => {
  const isConnected = await waitForSignalRConnection(authenticatedPage);
  const state = await getSignalRConnectionState(authenticatedPage);
  console.log(`SignalR state: ${state}`);
  expect(isConnected).toBe(true);
});
```

## 🎯 Test Categories

### Smoke Tests (`tests/smoke/`)

Fast, critical path tests that run on every commit:

- ✅ **critical-paths.spec.ts**: Login/logout flow, dashboard loads, basic navigation
- 🚧 **task-operations.spec.ts**: Task CRUD operations (planned)
- 🚧 **backend-health.spec.ts**: Backend connectivity checks (planned)

### SignalR Tests (`tests/signalr/`)

Real-time connection and notification tests:

- ✅ **signalr-connection.spec.ts**:
  - Connection establishment after login
  - Authentication with JWT token
  - WebSocket upgrade requests
  - Connection state management
  - Reconnection handling
  - Multiple connection scenarios

### Integration Tests (Planned)

Test complex workflows across multiple pages:

- Multi-step audit engagement creation
- Invoice generation and payment workflow
- Task assignment and completion flow

### API Tests (Planned)

Direct API endpoint testing without UI:

- Authentication endpoints
- CRUD operations validation
- Error handling verification

## 🔧 Troubleshooting

### Tests Fail with "Timeout" Errors

**Causes:**

- Backend services not running
- Frontend dev server not started
- Network connection issues
- Slow API responses

**Solutions:**

- Ensure all backends are running and accessible
- Start frontend dev server: `npm run dev`
- Increase timeout in `playwright.config.ts`:
  ```typescript
  timeout: 60000, // Increase to 60 seconds
  ```
- Check browser console for errors using `--headed` mode

### "Element not found" Errors

**Causes:**

- UI component structure changed
- Selectors out of date
- Component not rendered yet

**Solutions:**

- Update selectors in test files to match current UI
- Use Playwright Inspector: `npm run test:e2e:debug`
- Add explicit waits: `await page.waitForSelector('[data-testid="element"]')`
- Use `data-testid` attributes for stable selectors in components
- Check element visibility: `await expect(locator).toBeVisible()`

### SignalR Connection Fails

**Causes:**

- Task backend not running
- Incorrect SignalR hub URL
- CORS not allowing credentials
- JWT token not sent or invalid
- SSL certificate issues

**Solutions:**

- Verify SignalR hub URL in `.env`: `VITE_SIGNALR_HUB_URL=https://localhost:5001/api/task/hubs/notification`
- Check CORS settings in task-backend allow credentials:
  ```csharp
  app.UseCors(options => options
      .AllowAnyOrigin()
      .AllowAnyMethod()
      .AllowAnyHeader()
      .AllowCredentials());
  ```
- Ensure JWT token is in localStorage after login
- Verify negotiate endpoint responds: `https://localhost:5001/api/task/hubs/notification/negotiate`
- Check task-backend is running on correct port (5001)
- Trust SSL certificates for localhost

### Login Tests Fail

**Causes:**

- Test user doesn't exist in database
- Incorrect credentials in test config
- Login form field names changed
- Authentication endpoint issues

**Solutions:**

- Verify test user credentials in `tests/config/test-config.ts`
- Ensure test database has the test user with correct password
- Check if login form field names changed in `LoginPage.tsx`
- Verify authentication endpoint is working: test manually in browser
- Check for API errors in Network tab

### SSL Certificate Errors

**Cause:** Playwright doesn't trust self-signed certificates

**Solution:** Add to `playwright.config.ts`:

```typescript
use: {
  ignoreHTTPSErrors: true,
}
```

## 🎭 Playwright Inspector

Debug tests visually with step-by-step execution:

```bash
npx playwright test --debug
```

Or use the npm script:

```bash
npm run test:e2e:debug
```

### Features:

- **Step through tests**: Pause and resume execution
- **Pick selector**: Click elements to generate selectors
- **Time travel**: Jump to any point in test execution
- **Console logs**: View all console output
- **Network activity**: Monitor API calls
- **Screenshots**: Capture at any step

### Usage Tips:

- Use the "Pick Locator" button to find element selectors
- Click on test steps to jump to that point
- Use the "Resume" button to run to next breakpoint
- Add `await page.pause()` in code for manual breakpoints
- Copy selectors from the page
- Record new test actions
- Inspect element properties

## 📊 Test Configuration

### Playwright Configuration (`playwright.config.ts`)

Key settings:

- **testDir**: `./tests` - Location of test files
- **timeout**: 30000ms - Default timeout per test
- **expect timeout**: 5000ms - Assertion timeout
- **fullyParallel**: true - Run tests in parallel
- **retries**: 0 on local, 2 on CI
- **workers**: 100% of CPU cores on local, 1 on CI
- **reporter**: 'html' - HTML report generation
- **use.baseURL**: 'http://localhost:5173' - Frontend URL
- **use.trace**: 'on-first-retry' - Trace on failures
- **ignoreHTTPSErrors**: true - Trust self-signed certs

### Browsers Tested

Tests run on:

- Chromium (default, desktop viewport)
- Firefox (optional, uncomment in config)
- WebKit/Safari (optional, uncomment in config)
- Mobile browsers (optional configurations available)

## 🎬 Test Reports

After running tests, view the HTML report:

```bash
npm run test:report
```

Or directly:

```bash
npx playwright show-report
```

Reports include:

- Pass/fail status for each test
- Screenshots on failure
- Videos of failed tests (when enabled)
- Execution timeline
- Console logs and network activity
- Trace viewer for debugging

## 🔐 Security Best Practices

1. **Never commit real credentials**: Use test accounts only
2. **Use environment variables**: Store sensitive data in `.env.local` (gitignored)
3. **Separate test data**: Use dedicated test database
4. **Clean up after tests**: Remove test data to avoid conflicts
5. **Rotate test passwords**: Change test user passwords periodically
6. **Limit test user permissions**: Give only necessary access

## 📈 Test Metrics

Current test suite statistics:

- **Total test files**: 2 (smoke + signalr)
- **Total test cases**: ~12
- **Average execution time**: ~30 seconds
- **Success rate**: 95%+ (when backends are healthy)
- **Coverage areas**: Authentication, Dashboard, SignalR, Navigation

## 📚 Best Practices

1. **Use `data-testid` attributes** for stable selectors:

   ```tsx
   <button data-testid="create-task-btn">Create</button>
   ```

2. **Keep tests independent** - each test should work in isolation
   - Don't rely on test execution order
   - Clean up data created during tests
   - Use fresh authentication for each test

3. **Use fixtures** for authentication instead of repeating login code

   ```typescript
   test("My test", async ({ authenticatedPage }) => {
     // Already logged in!
   });
   ```

4. **Add meaningful test names** that describe the behavior:

   ```typescript
   test('User receives error message when creating task without title', ...)
   ```

5. **Test user flows, not implementation** - focus on what users do
   - Test from user perspective
   - Avoid testing internal component state
   - Focus on visible behavior

6. **Handle async properly**:
   - Always await async operations
   - Use `waitForSelector` when needed
   - Use proper timeout values

7. **Skip flaky tests temporarily** with `.skip` while fixing:

   ```typescript
   test.skip('Flaky test to fix', async ({ page }) => { ... });
   ```

8. **Group related tests** with `test.describe()`:
   ```typescript
   test.describe('Task Management', () => {
     test('should create task', ...);
     test('should edit task', ...);
   });
   ```

## 🎯 Future Enhancements

### Planned Test Coverage

- [ ] Complete task CRUD operations
- [ ] Audit engagement workflows
- [ ] Accounting module (invoices, payments)
- [ ] User and role management
- [ ] Organization switching
- [ ] Permission-based access control
- [ ] File upload and attachments
- [ ] Real-time notifications
- [ ] Search and filtering
- [ ] Report generation
- [ ] Mobile responsive tests
- [ ] API contract testing
- [ ] Visual regression testing
- [ ] Performance testing

### Testing Infrastructure

- [ ] CI/CD integration (GitHub Actions)
- [ ] Parallel test execution optimization
- [ ] Test result reporting dashboard
- [ ] Flaky test detection and auto-retry
- [ ] Screenshot and video comparison
- [ ] Test data factories
- [ ] Mock server for isolated testing

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Effective Tests](https://playwright.dev/docs/writing-tests)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Assertions Guide](https://playwright.dev/docs/assertions)

## 🤝 Contributing to Tests

When adding new tests:

1. **Follow naming conventions**: `feature-name.spec.ts`
2. **Use descriptive test names**: "should allow user to create a new task"
3. **Group related tests**: Use `test.describe()` blocks
4. **Use fixtures**: Leverage `auth.fixture.ts` for authenticated tests
5. **Add test helpers**: Reusable functions in `test-helpers.ts`
6. **Document test intent**: Add comments for complex test logic
7. **Keep tests independent**: Each test should be able to run standalone
8. **Clean up test data**: Remove created data after test completes
9. **Use data-testid**: Add `data-testid` attributes to components for stable selectors
10. **Test error states**: Include negative test cases

When adding new features to the application, please add corresponding tests to verify critical paths work end-to-end.

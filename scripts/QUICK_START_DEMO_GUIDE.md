# ⚡ QUICK START & DEMO GUIDE

**Goal**: Get CRM running locally in 15 minutes for demo preparation

---

## 🚀 QUICKEST PATH TO DEMO (15 Minutes)

### Step 1: Check Prerequisites (2 minutes)

Open terminal and verify:
```bash
# Check .NET SDK
dotnet --version
# Should show 6.0 or higher

# Check Node.js
node --version
# Should show v18 or higher

# Check SQL Server
sqlcmd -S localhost -E
# Should connect (Ctrl+C to exit)
```

If any missing, install from:
- .NET: https://dotnet.microsoft.com/download
- Node.js: https://nodejs.org/
- SQL Server: https://www.microsoft.com/sql-server/sql-server-downloads

---

### Step 2: Setup Database (3 minutes)

```bash
cd /Users/rajatrajawat/Desktop/crm-dk

# Create databases and run seed scripts
sqlcmd -E -i CRM_Complete_Seed_Script.sql
sqlcmd -E -i CRM_MasterMenu_Final.sql

# Verify
sqlcmd -E -i CRM_Verify_Seed_Data.sql
```

**If errors**: Check SQL Server is running, try with `-S localhost\SQLEXPRESS` if using Express edition.

---

### Step 3: Start Backend Services (5 minutes)

**Open 3 separate terminal windows:**

#### Terminal 1 - Central Backend
```bash
cd /Users/rajatrajawat/Desktop/crm-dk/central-backend
dotnet restore
dotnet run
# Wait for "Now listening on: http://localhost:5001"
```

#### Terminal 2 - CRM Backend
```bash
cd /Users/rajatrajawat/Desktop/crm-dk/crm-backend
dotnet restore
dotnet run
# Wait for "Now listening on: http://localhost:5010"
```

#### Terminal 3 - Account Backend
```bash
cd /Users/rajatrajawat/Desktop/crm-dk/account-backend
dotnet restore
dotnet run
# Wait for "Now listening on: http://localhost:7089"
```

**Tip**: Keep these terminals open during demo.

---

### Step 4: Start Frontend (3 minutes)

#### Terminal 4 - Frontend
```bash
cd /Users/rajatrajawat/Desktop/crm-dk/audit-frontend

# First time only:
npm install

# Every time:
npm run dev
# Wait for "Local: http://localhost:5173"
```

---

### Step 5: Login & Verify (2 minutes)

1. **Open browser**: http://localhost:5173
2. **Login with**:
   - Email: `super@gmail.com`
   - Password: `password123` (change after first login)
3. **Quick checks**:
   - ✅ Dashboard loads
   - ✅ Navigate to Leads → should see lead list
   - ✅ Navigate to Contacts → should see contact list
   - ✅ Navigate to Accounts → should see account list

**If any page shows errors**: Check browser console (F12) and terminal logs.

---

## 🎬 DEMO DATA PREPARATION (10 Minutes)

### Create Sample Leads (3 minutes)

Go to **CRM → Leads → Create New**

Create 5 leads with varying quality:

| Name | Email | Company | Phone | Source | Status |
|------|-------|---------|-------|--------|--------|
| Rajesh Kumar | rajesh.kumar@techcorp.com | TechCorp India | +91-9876543210 | Website | New |
| Priya Sharma | priya.sharma@healthcare.com | MedLife Healthcare | +91-9876543211 | LinkedIn | Contacted |
| Amit Patel | amit.patel@finance.com | Finance Solutions | +91-9876543212 | Referral | Qualified |
| Sneha Reddy | sneha.reddy@retail.com | Retail Plus | +91-9876543213 | Cold Call | New |
| Vikram Singh | vikram.singh@manufacturing.com | ManufactureX | +91-9876543214 | Trade Show | Contacted |

**Tips**:
- Fill all fields to maximize lead score
- Leave some fields empty on one lead to show low score
- Let system calculate score automatically

---

### Create Sample Accounts (2 minutes)

Go to **CRM → Accounts → Create New**

Create 3 accounts:

| Account Name | Industry | Phone | Annual Revenue | Employee Count |
|--------------|----------|-------|----------------|----------------|
| TechCorp India | Technology | +91-22-12345678 | 500000000 (50 Cr) | 250 |
| MedLife Healthcare | Healthcare | +91-80-23456789 | 300000000 (30 Cr) | 150 |
| Finance Solutions | Finance | +91-11-34567890 | 800000000 (80 Cr) | 500 |

---

### Create Sample Contacts (2 minutes)

Go to **CRM → Contacts → Create New**

Create 3 contacts (link to accounts created above):

| Name | Email | Account | Job Title | Lifecycle Stage |
|------|-------|---------|-----------|-----------------|
| Rajesh Kumar | rajesh.kumar@techcorp.com | TechCorp India | VP Engineering | Customer |
| Priya Sharma | priya.sharma@healthcare.com | MedLife Healthcare | Director Operations | Opportunity |
| Amit Patel | amit.patel@finance.com | Finance Solutions | CFO | SQL |

---

### Create Sample Opportunity (1 minute)

Go to **CRM → Opportunities → Create New**

Create 1 opportunity:
- **Name**: "CRM Implementation for TechCorp"
- **Account**: TechCorp India
- **Amount**: ₹10,00,000 (10 Lakhs)
- **Stage**: Proposal
- **Expected Close Date**: 30 days from now
- **Probability**: 50%

---

### Log Sample Activities (2 minutes)

Go to **CRM → Activities → Create New**

Create 5 activities (mix of types, linked to different entities):

1. **Call**: "Discovery call with Rajesh about requirements" (Link to Contact: Rajesh Kumar)
2. **Email**: "Sent proposal to Priya" (Link to Contact: Priya Sharma, Link to Opportunity)
3. **Meeting**: "Product demo scheduled with TechCorp team" (Link to Account: TechCorp India)
4. **Note**: "Vikram mentioned budget constraints" (Link to Lead: Vikram Singh)
5. **Follow-Up**: "Follow up on proposal status" (Schedule for tomorrow, Link to Opportunity)

---

## 🎤 DEMO FLOW (Use This During Presentation)

### 1. Login (30 seconds)
- Open http://localhost:5173
- Login with super@gmail.com / password123
- "Here's our CRM login page - simple, clean, professional"

### 2. Dashboard (1 minute)
- "This is the dashboard with key metrics at a glance"
- Point out: Total leads, conversion rates, pipeline value

### 3. Leads Module (5 minutes)
- Navigate to **CRM → Leads**
- "Here's all our leads with intelligent scoring"
- Point to high-score lead (85+): "This is a HOT lead needing immediate attention"
- Point to low-score lead (30-40): "This is cold, needs nurturing"
- Show SLA indicator (red/green)
- Click **Create New Lead**: Show duplicate detection (type existing email)
- Click **Convert** on qualified lead: Show atomic conversion to Contact + Account + Opportunity

### 4. Accounts Module (3 minutes)
- Navigate to **CRM → Accounts**
- "These are all our customer accounts"
- Point to industry badges (color-coded)
- Point to pipeline value column: "₹15L in open deals"
- Click on **TechCorp India**: Show 360-degree view
  - Contact list
  - Opportunity list
  - Activity timeline
- "If a rep leaves, new rep sees complete history"

### 5. Opportunities Module (3 minutes)
- Navigate to **CRM → Opportunities**
- "This is our sales pipeline"
- Point to columns: Stage, Amount, Probability, Expected Close
- Point to rotting indicator (if any): "Stale deal needs intervention"
- Click on opportunity: Show linked contacts with roles (Decision Maker, Champion)

### 6. Activities Module (2 minutes)
- Navigate to **CRM → Activities**
- "Complete interaction history - every call, email, meeting"
- Point to color-coded icons
- Click **Create New**: Show linking to multiple entities
- **IMPORTANT**: Point out immutable design (no Edit/Delete button)
  - "Compliance feature - tamper-proof audit trail"

### 7. Analytics (2 minutes - if time permits)
- Show conversion funnel (if dashboard exists)
- Show source attribution (which channels work best)
- "Data-driven decisions: Invest in referrals, not cold calls"

### 8. Security Demo (1 minute)
- Mention role-based access
- Mention audit trail
- Mention multi-tenancy
- "Every action is logged for compliance"

---

## 🐛 TROUBLESHOOTING DURING DEMO

### Frontend won't load
```bash
# Check backend is running
curl http://localhost:5001/api/health
# Should return 200 OK

# Check CORS
# In browser console (F12), look for CORS errors
# Fix: Update AllowedOrigins in backend appsettings.json
```

### "Cannot connect to database" error
```bash
# Check SQL Server is running
sqlcmd -S localhost -E

# Check connection string in appsettings.json
# Should match your SQL Server instance
```

### 500 Internal Server Error
```bash
# Check backend terminal logs
# Look for red error messages
# Common issues:
# - Database not created
# - Seed data not run
# - Connection string wrong
```

### Leads/Contacts page shows empty
```bash
# Create sample data (see section above)
# OR run seed script again
sqlcmd -E -i CRM_Complete_Seed_Script.sql
```

---

## 📋 PRE-DEMO CHECKLIST (Print This)

**1 Hour Before Demo:**
- [ ] All 4 services running (central, crm, account, frontend)
- [ ] Verified login works
- [ ] Sample data created (5 leads, 3 accounts, 3 contacts, 1 opportunity, 5 activities)
- [ ] Browser cache cleared
- [ ] Closed unnecessary applications
- [ ] Demo script printed and next to you
- [ ] Backup device ready (if live demo)

**5 Minutes Before Demo:**
- [ ] Screenshare tested (if remote)
- [ ] All browser tabs open (login, leads, accounts, contacts, opportunities, activities, dashboard)
- [ ] Notifications/popups silenced
- [ ] Phone on silent
- [ ] Water nearby (stay hydrated!)

**During Demo:**
- [ ] Breathe! You've got this
- [ ] Speak slowly and clearly
- [ ] Pause after each feature for questions
- [ ] If something breaks, stay calm and switch to backup

---

## 🎯 SUCCESS METRICS FOR DEMO

By end of demo, audience should understand:
✅ What CRM is and why it matters
✅ How our CRM solves real business problems
✅ Key features (lead scoring, conversion, 360° view, audit trail)
✅ Technical foundation (microservices, modern tech stack)
✅ Release readiness (production-ready, comprehensive testing)

**Goal**: Get approval to proceed with production deployment!

---

## 📞 EMERGENCY CONTACTS

If something breaks during demo:
- **Technical backup**: [Your colleague's name/number]
- **Database backup**: Check [backup location]
- **Fallback plan**: Use pre-recorded demo video (if available)

---

## 🎬 POST-DEMO

Within 24 hours:
- [ ] Send follow-up email with executive summary
- [ ] Share documentation links
- [ ] Provide access to staging environment for testing
- [ ] Schedule user training sessions

---

**You're ready! Good luck with your demo! 🚀**

---

## 💡 PRO TIPS

1. **Start with the problem**: Don't just show features, explain why they matter
2. **Use real scenarios**: "Imagine a rep is out sick, can another rep help their customer?"
3. **Highlight differentiators**: "This feature isn't even in Salesforce"
4. **Show, don't tell**: Click through the actual UI rather than describing it
5. **Pause for questions**: Don't rush through - engagement is key
6. **End with a call to action**: "I recommend we approve for production release"

---

## 📚 ADDITIONAL RESOURCES

- [CRM Release Presentation Guide](CRM_RELEASE_PRESENTATION_GUIDE.md) - Full presentation material
- [One-Day Improvements](ONE_DAY_IMPROVEMENTS.md) - Pre-release polish checklist
- [Demo Script](DEMO_SCRIPT.md) - Detailed 30-minute presentation script
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions

---

**End of Quick Start Guide**

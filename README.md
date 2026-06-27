# 🚀 HRMS Pro - Enterprise HR Management System

**Complete SaaS HRMS Platform built with Next.js 15 & React 19**

**Last Updated:** March 30, 2026  
**Status:** ✅ Production Ready

---

## 📋 Overview

HRMS Pro is a comprehensive, multi-tenant SaaS HR management system featuring:

- 🏢 **Multi-Tenancy** - Organization-based architecture with subscription management
- 👥 **Employee Management** - Complete employee lifecycle tracking
- 🕐 **Attendance System** - Biometric integration with device tracking
- 📅 **Leave Management** - Custom policies and approval workflows
- 💰 **Payroll Processing** - Automated salary calculation with tax compliance
- 📊 **Performance Reviews** - Goal tracking and feedback system
- 🎯 **Task Management** - Assignment and tracking
- 📁 **Document Management** - Employee documents and certifications
- 🏥 **Employee Benefits** - Reimbursements, expense claims, insurance
- 📈 **Analytics Dashboard** - Real-time HR metrics and reporting

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 15.3.4 (App Router)
- **UI Library:** React 19.0.0
- **Styling:** Tailwind CSS 3.4.14
- **Animations:** Framer Motion 12.38.0
- **Icons:** Lucide React 0.453.0
- **Charts:** Recharts 2.12.7, React ChartJS 2
- **State Management:** Zustand 5.0.0
- **Forms:** React Hook Form 7.53.1 + Zod validation

### **Backend**
- **Authentication:** NextAuth.js 5.0.0 (Auth.js v5)
- **Database ORM:** Prisma 5.21.1
- **Database:** PostgreSQL (Supabase/Neon/RDS)
- **Caching:** Redis 5.11.0
- **Data Fetching:** SWR 2.2.5

### **DevOps**
- **Deployment:** Vercel (recommended), Railway, AWS, DigitalOcean
- **Containerization:** Docker support
- **Process Manager:** PM2 for self-hosted

---

## 📁 Project Structure

```
HRMS/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (33 endpoints)
│   │   ├── auth/             # Authentication APIs
│   │   ├── organizations/    # Organization management
│   │   ├── subscriptions/    # Subscription & billing
│   │   ├── employees/        # Employee CRUD
│   │   ├── attendance/       # Attendance tracking
│   │   ├── leave/            # Leave management
│   │   ├── payroll/          # Payroll processing
│   │   └── ...               # 25+ more API modules
│   ├── auth/                 # Auth pages (signin/signup)
│   ├── dashboard/            # Main dashboard
│   ├── employees/            # Employee management
│   ├── attendance/           # Attendance tracking
│   ├── leave/                # Leave requests
│   ├── payroll/              # Payroll management
│   ├── performance/          # Performance reviews
│   ├── recruitment/          # Hiring pipeline
│   ├── settings/             # Organization settings
│   ├── pricing/              # Pricing plans
│   └── help/                 # Help center
├── prisma/
│   └── schema.prisma         # Database schema (40+ models)
├── lib/                      # Utility functions
├── components/               # React components
├── hooks/                    # Custom React hooks
└── middleware.ts             # Next.js middleware
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 20+ 
- PostgreSQL database
- npm or yarn

### **Installation**

```bash
# Clone repository
git clone <your-repo-url>
cd HRMS

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npm run prisma:seed

# Start development server
npm run dev
```

### **Environment Setup**

Required variables in `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/hrms?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## 📊 Database Schema

### **Core Models (40+)**

| Category | Models |
|----------|--------|
| **Users & Auth** | User, Organization, Subscription, Invoice |
| **Employees** | Employee, Department, Shift, PersonalInfo, BankDetails, EducationCertification, EmergencyContact |
| **Attendance** | Attendance, Shift, AttendanceCorrection, AttendanceRegularization, WorkFromHome, Device, DeviceIssue |
| **Leave** | LeaveRequest, LeaveBalance, LeavePolicy |
| **Payroll** | Payroll, SalaryStructure, SalaryRevision, TaxDeclaration, PayrollConfiguration, PayrollAuditLog |
| **Performance** | PerformanceReview, Goal, SelfAppraisal, Feedback |
| **Recruitment** | JobPosting, JobApplication, Interview |
| **Assets** | AssignedAsset, AssetRequest, Device |
| **Documents** | EmployeeDocument, Announcement |
| **Other** | Reimbursement, ExpenseClaim, OnboardingRecord, Training, Task, Notification, AuditLog |

View full schema: `prisma/schema.prisma`  
Open Prisma Studio: `npx prisma studio`

---

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `POST /api/auth/signup-with-org` - Combined signup + org creation

### **Organizations**
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### **Subscriptions**
- `GET /api/subscriptions` - Get subscription
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

### **Employees**
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### **Attendance**
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/:id` - Update attendance
- `POST /api/attendance/bulk` - Bulk attendance upload

### **Leave**
- `GET /api/leave` - Get leave requests
- `POST /api/leave` - Create leave request
- `PUT /api/leave/:id` - Update leave request
- `POST /api/leave/approve` - Approve leave

### **Payroll**
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll` - Generate payroll
- `PUT /api/payroll/:id` - Update payroll
- `POST /api/payroll/process` - Process payroll

### **And 25+ more endpoints...**

Test APIs: `http://localhost:3000/test-api`

---

## 🌐 Key Features

### **1. Multi-Tenancy**
- Organization-based data isolation
- Custom organization settings
- Subscription tiers (Free, Pro, Enterprise)
- Tenant-specific configurations

### **2. Employee Lifecycle**
- Onboarding workflow
- Probation tracking
- Confirmation processing
- Promotions & transfers
- Resignation & exit management

### **3. Attendance Management**
- Biometric device integration
- Real-time check-in/out
- Shift management
- Overtime tracking
- Attendance regularization
- Geo-location tracking

### **4. Leave Management**
- Custom leave policies
- Multiple leave types (Sick, Casual, Earned, etc.)
- Approval workflows
- Leave balance tracking
- Holiday calendar

### **5. Payroll System**
- Automated salary calculation
- Tax computation (Old/New regime)
- PF, ESI, Professional Tax
- Loan & advance deductions
- Payslip generation
- Bulk payroll processing

### **6. Performance Management**
- Goal setting & tracking
- 360° feedback
- Performance reviews
- Self-appraisals
- Competency assessment

### **7. Recruitment**
- Job postings
- Application tracking
- Interview scheduling
- Offer management
- Onboarding integration

### **8. Asset Management**
- Device tracking
- Asset assignment
- Maintenance requests
- Warranty tracking
- Return management

---

## 🎯 Key URLs

### **Customer-Facing**
```
/                     - Landing/Redirect
/pricing              - Pricing plans
/auth/signup          - Sign-up flow
/auth/signin          - Sign-in page
/dashboard            - Main dashboard
/employees            - Employee directory
/attendance           - Attendance tracking
/leave                - Leave requests
/payroll              - Payroll management
/performance          - Performance reviews
/settings/organization - Organization settings
/settings/subscription - Subscription management
/help                 - Help center
```

### **Debug/Test**
```
/test-api             - API testing page
/api/health           - Health check
/api/test-db          - Database test
```

---

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run dev:turbo        # Turbo mode (faster)
npm run dev:webpack      # Webpack mode

# Production
npm run build            # Build for production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database

# Code Quality
npm run lint             # Run ESLint

# Analysis
npm run analyze          # Analyze bundle size
```

---

## 🚢 Deployment

### **Recommended: Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Post-Deployment:**
1. Set environment variables in Vercel dashboard
2. Run migrations: `npx prisma migrate deploy`
3. Configure custom domain

### **Alternative Platforms**
- **Railway** - Full-stack with database ($5/mo)
- **AWS ECS** - Enterprise scaling
- **DigitalOcean App Platform** - Simple deployment
- **Self-Hosted VPS** - Full control (see `DEPLOYMENT_GUIDE.md`)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `DEPLOYMENT_GUIDE.md` | Complete deployment guide for all platforms |
| `QUICK_START.md` | Getting started & testing guide |
| `prisma/schema.prisma` | Database schema reference |

---

## 🔐 Security Features

- ✅ NextAuth.js authentication
- ✅ Role-based access control (Admin, Manager, Employee)
- ✅ Organization-level data isolation
- ✅ API route protection
- ✅ Environment variable validation
- ✅ HTTPS enforcement (production)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection

---

## 📊 Project Status

### **Completed Features**
- ✅ Multi-tenancy architecture
- ✅ Subscription management
- ✅ Complete authentication flow
- ✅ Employee lifecycle management
- ✅ Attendance with biometric integration
- ✅ Leave management system
- ✅ Payroll processing
- ✅ Performance reviews
- ✅ Recruitment module
- ✅ Asset & device management
- ✅ Document management
- ✅ Analytics dashboard
- ✅ Professional UI/UX

### **Production Ready**
- ✅ TypeScript compilation
- ✅ Build verification
- ✅ Database migrations
- ✅ Environment validation
- ✅ Error handling
- ✅ Responsive design

---

## 💰 Pricing Tiers

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | Up to 10 employees, basic features |
| **Pro** | $29/mo | Up to 100 employees, all features |
| **Enterprise** | Custom | Unlimited employees, priority support |

Configure in: `/pricing` page

---

## 🧩 Integrations

### **Supported**
- **Email:** SendGrid, Resend
- **Database:** PostgreSQL (Supabase, Neon, Railway, AWS RDS)
- **Caching:** Redis (Upstash)
- **Storage:** AWS S3
- **Biometric Devices:** Generic HTTP API

### **Coming Soon**
- Slack notifications
- Microsoft Teams integration
- Zoom integration for interviews
- Payment gateways (Stripe, Razorpay)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### **Common Issues**

**"Failed to create organization"**
- Check `DATABASE_URL` in `.env`
- Run migrations: `npx prisma migrate dev`

**Authentication errors**
- Verify `NEXTAUTH_SECRET` (32+ characters)
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cache & cookies

**TypeScript/Prisma errors**
- Run: `npx prisma generate`
- Restart dev server

**404 errors**
- Restart dev server
- Clear `.next` folder: `del /q /s .next`

### **Debug Mode**

```bash
# Enable debug logging
DEBUG=true npm run dev

# Test database connection
npx prisma studio

# Test API endpoints
http://localhost:3000/test-api
```

---

## 🎉 Ready to Start?

```bash
# Quick start
npm install
cp .env.example .env
# Edit .env with your config
npx prisma migrate dev
npm run dev
```

**Visit:** `http://localhost:3000`

---

**Built with ❤️ using Next.js 15, React 19, and Prisma**

**Status:** ✅ **PRODUCTION READY**

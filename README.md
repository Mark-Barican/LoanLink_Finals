# LoanLink - Professional Loan Management System

A modern, full-stack loan management application built with Next.js 15, React 19, and PostgreSQL. Designed for lending companies to efficiently manage loans, payments, and client relationships.

## 🚀 Features

- **Multi-role Authentication**: Admin, Manager, and Staff roles with different permissions
- **Loan Management**: Create, track, and manage loans with detailed repayment schedules
- **Automatic Loan Completion**: Loans automatically update to "completed" status when all repayments are fully paid
- **Payment Processing**: Handle payments with multiple methods (cash, bank transfer, check, online)
- **Company Management**: Manage client companies and their loan portfolios
- **Real-time Dashboard**: Live statistics and analytics for business insights
- **Responsive Design**: Modern UI that works on all devices
- **Role-based Access Control**: Secure access based on user roles

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, PostgreSQL
- **Authentication**: Custom JWT-based authentication
- **Database**: PostgreSQL with connection pooling
- **Deployment**: Vercel (optimized configuration)
- **Styling**: Tailwind CSS with custom design system

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd LoanLink_Finals
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Next.js Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Security
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-app.vercel.app"
```

### 4. Set up the database

Create the necessary tables in your PostgreSQL database. Primary keys are UUIDs,
which is what the deployed database uses.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  department TEXT DEFAULT 'operations',
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  address TEXT,
  tin TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  code TEXT UNIQUE NOT NULL,
  principal NUMERIC(15,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  term_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  total_interest NUMERIC(15,2),
  total_amount NUMERIC(15,2),
  status TEXT DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repayments table
CREATE TABLE repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id),
  due_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  status TEXT DEFAULT 'unpaid',
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repayment_id UUID NOT NULL REFERENCES repayments(id),
  amount NUMERIC(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  method TEXT DEFAULT 'cash',
  created_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes the list and report queries rely on
CREATE INDEX ON loans (company_id);
CREATE INDEX ON repayments (loan_id, due_date);
CREATE INDEX ON payments (repayment_id);
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and create an account
2. Import your GitHub repository
3. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: A secure random string
   - `NEXTAUTH_URL`: Your Vercel app URL

### 3. Database Setup

For production, we recommend using:
- **Neon** (PostgreSQL): [neon.tech](https://neon.tech)
- **Supabase** (PostgreSQL): [supabase.com](https://supabase.com)
- **Railway** (PostgreSQL): [railway.app](https://railway.app)

## 👥 User Management

The system supports multi-role authentication with admin, manager, and staff roles. Users can be created through the application interface or directly in the database.

### Demo accounts

Three seeded accounts sign in on a fresh database. They are created on first
successful sign-in by `src/app/api/auth/signin/route.js`, which recognises these
three addresses and their fixed passwords.

| Role | Email | Password |
|---|---|---|
| Admin | `mark_barican@example.com` | `admin123` |
| Manager | `manager@example.com` | `manager123` |
| Staff | `staff@example.com` | `staff123` |

These are demonstration credentials. Remove the `demoUsers` block in the sign-in
route before putting this in front of real data, so every account is checked
against its bcrypt hash.

### What each role can do

| Area | Admin | Manager | Staff |
|---|---|---|---|
| Companies | Full | Full | Read only |
| Loans | Full | Full | Read only |
| Repayments | Full | Full | Full |
| Payments | Full | Full | Full |
| Reports | Full | Full | Overview and collections |
| Accounts | All roles | Staff only | None |

Self-registration creates a staff account. An administrator can change the role
afterwards.

## 📁 Project Structure

Each role's routes are thin wrappers. They mount `AppShell` with the roles that
are allowed there, then render a shared screen with the permissions that role
has. The screen itself is written once.

```
src/
├── app/
│   ├── components/
│   │   ├── AppShell.js      # Route guard, sidebar, page column
│   │   ├── Sidebar.js       # Role-driven navigation
│   │   ├── ui.js            # Buttons, fields, tables, modals, status pills
│   │   └── pages/           # The screens, shared across roles
│   │       ├── CompaniesPage.js
│   │       ├── DashboardPage.js
│   │       ├── LoanDetailPage.js
│   │       ├── LoansPage.js
│   │       ├── PaymentsPage.js
│   │       ├── RepaymentsPage.js
│   │       ├── ReportsPage.js
│   │       └── UsersPage.js
│   ├── admin/               # /admin routes
│   ├── manager/             # /manager routes
│   ├── staff/               # /staff routes
│   ├── api/                 # REST endpoints
│   ├── auth/                # Sign in and registration
│   ├── globals.css          # Design tokens
│   ├── layout.js            # Root layout and fonts
│   ├── error.js
│   ├── loading.js
│   └── not-found.js
└── lib/
    ├── format.js            # Currency, dates, labels, interest maths
    └── session.js           # Session helpers and the API client
```

## 🎨 Design

A light operations console rather than a marketing page. The rules the interface
holds to:

- **Surfaces**: white page, `#fafaf9` fills, 1px `#e7e5e4` hairlines. No glass,
  no blur, no gradients, no drop shadows outside modals.
- **Colour**: forest green `#1b6b45` for actions, active navigation and focus.
  Green, amber, red and grey appear elsewhere only as loan and repayment status,
  where the colour carries the meaning.
- **Type**: IBM Plex Sans, with IBM Plex Mono for loan codes and TINs. Every
  figure uses tabular numerals so columns of money line up.
- **Tables**: money and counts are right-aligned, labels are uppercase 11px, and
  wide tables scroll inside their own container so the page never scrolls
  sideways.
- **Layout**: a fixed 240px sidebar from 1024px up, a slide-over below that.

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🛡️ Security Features

- Role-based access control
- Secure password hashing with bcrypt
- SQL injection prevention
- XSS protection headers
- CSRF protection
- Secure session management

## 📊 Performance Optimizations

- Server-side rendering (SSR)
- Static site generation (SSG)
- Image optimization
- Font optimization with display swap
- Database connection pooling
- API route caching
- Bundle optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@loanlink.com or create an issue in the repository.

---

Built with ❤️ using Next.js and modern web technologies.

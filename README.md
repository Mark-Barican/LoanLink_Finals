# LoanLink - Professional Loan Management System

A modern, full-stack loan management application built with Next.js 15, React 19, and PostgreSQL. Designed for lending companies to efficiently manage loans, payments, and client relationships.

## 🚀 Features

- **Multi-role Authentication**: Admin, Manager, and Staff roles with different permissions
- **Loan Management**: Create, track, and manage loans with detailed repayment schedules
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

Create the necessary tables in your PostgreSQL database:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff',
  department VARCHAR(100) DEFAULT 'operations',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  address TEXT,
  tin VARCHAR(50),
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans table
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  principal DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  term_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repayments table
CREATE TABLE repayments (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER REFERENCES loans(id),
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'unpaid',
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  repayment_id INTEGER REFERENCES repayments(id),
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(50) DEFAULT 'cash',
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
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

## 👥 Default Users

The system comes with demo users for testing:

- **Admin**: `mark_barican@example.com` / `admin123`
- **Manager**: `manager@example.com` / `manager123`
- **Staff**: `staff@example.com` / `staff123`

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── manager/        # Manager dashboard
│   ├── staff/          # Staff dashboard
│   ├── error.js        # Global error boundary
│   ├── loading.js      # Global loading component
│   ├── not-found.js    # 404 page
│   ├── layout.js       # Root layout
│   └── page.js         # Home page
├── components/         # Reusable components
└── lib/               # Utility functions
```

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

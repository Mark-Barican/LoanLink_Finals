# LoanLink - Loan Management System

A comprehensive loan management system built with Next.js, React, and PostgreSQL. Manage companies, loans, payments, and users with role-based access control.

## Features

- 🔐 **Authentication & Authorization**: Secure login with role-based access (Admin, Manager, Staff)
- 📊 **Real-time Dashboards**: Live statistics and analytics with auto-refresh
- 🏢 **Company Management**: Full CRUD operations for company data
- 💰 **Loan Management**: Create loans with automatic repayment schedules
- 💳 **Payment Tracking**: Record and monitor payments and repayments
- 👥 **User Management**: Admin-only user administration
- 📈 **Reports & Analytics**: Comprehensive financial reports with charts
- 🎨 **Modern UI**: Dark theme with glassmorphism effects
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: Next.js 15.4.3, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **Authentication**: bcrypt.js, localStorage
- **Charts**: Chart.js, React-Chartjs-2
- **Deployment**: Vercel

## Quick Start

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables**:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   ```
4. **Run the development server**: `npm run dev`
5. **Open** [http://localhost:3000](http://localhost:3000)

## Demo Credentials

- **Admin**: `mark_barican@example.com` / `admin123`
- **Manager**: `manager@example.com` / `manager123`
- **Staff**: `staff@example.com` / `staff123`

## Deployment

This project is optimized for deployment on Vercel. The `vercel.json` configuration file is included for seamless deployment.

## License

This project is proprietary software.

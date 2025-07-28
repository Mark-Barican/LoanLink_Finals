# Database Setup Guide

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   Create a `.env.local` file in the root directory with your database URL:
   ```
   DATABASE_URL=your_database_connection_string_here
   ```

3. **Set up your database:**
   - **For Neon (recommended):** Use the connection string from your Neon dashboard
   - **For local PostgreSQL:** Use `postgresql://localhost:5432/loanlink`

4. **Initialize database schema:**
   ```bash
   # Connect to your database and run:
   psql -d your_database -f schema.sql
   psql -d your_database -f setup-users.sql
   ```

5. **Test database connection:**
   ```bash
   npm run setup-db
   ```

## Database Connection Examples

### Neon Database
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### Local PostgreSQL
```
DATABASE_URL=postgresql://localhost:5432/loanlink
```

### Docker PostgreSQL
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/loanlink
```

## Demo Accounts

After running `setup-users.sql`, you can log in with:

- **Admin:** mark_barican@example.com / markpogi123
- **Manager:** manager_demo@example.com / manager123  
- **Staff:** staff_demo@example.com / staff123

## Troubleshooting

### Connection Issues
1. Check your `DATABASE_URL` format
2. Ensure your database server is running
3. Verify network connectivity
4. Check firewall settings

### Schema Issues
1. Run `schema.sql` to create tables
2. Run `setup-users.sql` to add demo users
3. Run `update-schema.sql` if updating existing database

### SSL Issues (Neon)
- Make sure `?sslmode=require` is in your connection string
- Check that your Neon project allows SSL connections

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000` 
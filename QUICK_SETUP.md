# Quick Setup Guide - Fix Payments Page

## 🚀 One-Command Setup

Run this command to set up everything:

```bash
npm install && npm run migrate-db
```

## 📋 Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database Connection
Create `.env.local` file in the root directory:
```
DATABASE_URL=your_neon_database_connection_string_here
```

### 3. Run Database Migration
This will fix the payments table schema:
```bash
npm run migrate-db
```

### 4. Start Development Server
```bash
npm run dev
```

## 🔧 What the Migration Does

The migration script will:

1. **Add new columns** to the payments table:
   - `payment_date` (DATE) - replaces `paid_at`
   - `method` (TEXT) - payment method (cash, bank_transfer, etc.)

2. **Add status column** to repayments table:
   - `status` (TEXT) - 'paid' or 'unpaid'

3. **Migrate existing data**:
   - Convert `paid_at` timestamps to `payment_date`
   - Set default payment method to 'cash'
   - Update repayment statuses

4. **Create indexes** for better performance

## 🎯 Expected Results

After migration, your database will have:

### Payments Table
- `id` (UUID)
- `repayment_id` (UUID)
- `amount` (NUMERIC)
- `payment_date` (DATE) ✅ **NEW**
- `method` (TEXT) ✅ **NEW**
- `created_by` (UUID)
- `created_at` (TIMESTAMP)

### Repayments Table
- `id` (UUID)
- `loan_id` (UUID)
- `due_date` (DATE)
- `amount` (NUMERIC)
- `status` (TEXT) ✅ **NEW**
- `paid` (BOOLEAN) - legacy field
- `paid_at` (TIMESTAMP) - legacy field
- `created_at` (TIMESTAMP)

## 🧪 Test the Setup

1. **Check database connection:**
   ```bash
   npm run setup-db
   ```

2. **Start the app:**
   ```bash
   npm run dev
   ```

3. **Login with demo accounts:**
   - Admin: mark_barican@example.com / markpogi123
   - Manager: manager_demo@example.com / manager123
   - Staff: staff_demo@example.com / staff123

4. **Test payments page:**
   - Navigate to Payments Management
   - Try adding a new payment
   - Verify the form works with payment method selection

## 🐛 Troubleshooting

### Migration Fails
- Check your `DATABASE_URL` in `.env.local`
- Ensure you have write permissions to the database
- Verify the database server is running

### Payments Page Still Shows Errors
- Clear browser cache
- Restart the development server
- Check browser console for errors

### Database Connection Issues
- Verify your Neon connection string includes `?sslmode=require`
- Check that your database is accessible from your network
- Ensure the database exists and is not paused

## ✅ Success Indicators

When everything is working correctly:

1. ✅ Migration script runs without errors
2. ✅ Database shows new columns in payments table
3. ✅ Payments page loads without errors
4. ✅ You can add/edit/delete payments
5. ✅ Payment method dropdown works
6. ✅ Reports page shows correct statistics

## 🎉 You're Done!

The payments page should now work perfectly with the new schema. All CRUD operations will function correctly, and the reports will display accurate data. 
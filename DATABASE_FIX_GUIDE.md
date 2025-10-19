# Database Fix Guide - Role Column Issue

## Problem
The `supabase-schema-complete.sql` file is trying to create an index on a `role` column that doesn't exist in your existing users table.

## Solution

You have **TWO OPTIONS** depending on whether you want to keep existing data:

---

## Option 1: Add Missing Columns (Keep Existing Data) ✅ RECOMMENDED

Use this if you have users or data you want to keep.

### Steps:

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration script: `supabase-migration-add-role.sql`
3. This will safely add the `role` column to your existing users table

**What this does:**
- Adds `role` column to users table
- Sets default value to 'buyer' for all existing users
- Adds the missing index
- Adds `rejection_reason` column to projects table

### After Running Migration:

You may need to manually set some users as admins:

```sql
-- Make yourself an admin
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, email, name, role FROM users;
```

---

## Option 2: Fresh Start (Delete All Data) ⚠️ DESTRUCTIVE

Use this if you're okay losing all existing data.

### Steps:

1. Go to Supabase Dashboard → SQL Editor

2. **First, drop all existing tables:**
   ```sql
   DROP TABLE IF EXISTS reviews CASCADE;
   DROP TABLE IF EXISTS purchases CASCADE;
   DROP TABLE IF EXISTS payment_transactions CASCADE;
   DROP TABLE IF EXISTS custom_requests CASCADE;
   DROP TABLE IF EXISTS projects CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```

3. **Then run:** `supabase-schema-fresh.sql`

**What this does:**
- Deletes ALL existing data
- Creates fresh tables with all correct columns
- Adds a sample admin user

---

## Files Reference

### 1. `supabase-migration-add-role.sql`
- **Use for:** Existing database with data
- **Safe:** Yes, won't delete data
- **Purpose:** Adds missing columns to existing tables

### 2. `supabase-schema-fresh.sql`
- **Use for:** Fresh/empty database
- **Safe:** No, for new databases only
- **Purpose:** Complete fresh setup

### 3. `supabase-schema-complete.sql`
- **Status:** Has the bug, don't use directly
- **Use:** Reference only
- **Purpose:** Contains all table definitions but needs existing tables dropped first

---

## After Fixing Database

### 1. Verify Tables Exist

Run this query to check:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- custom_requests
- payment_transactions
- projects
- purchases
- reviews
- users

### 2. Verify Role Column

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users';
```

You should see `role` column with default value 'buyer'

### 3. Test Your Application

1. Try logging in
2. Visit `/seller` to test seller dashboard
3. Visit `/admin` to test admin panel
4. Create a test project

---

## Common Issues

### Issue: "relation 'users' already exists"
**Solution:** Tables already exist. Use Option 1 (migration script)

### Issue: "column 'role' does not exist"
**Solution:** Run the migration script to add the missing column

### Issue: Admin panel shows empty
**Solution:** Make sure you have a user with role='admin':
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Issue: Can't create admin account
**Solution:** The fresh schema includes a sample admin:
- Email: admin@projecthub.com
- Password: admin123 (change this immediately!)

---

## Recommended Steps (Quick Start)

1. **Backup your current data** (if any is important)
   ```sql
   -- Export users
   SELECT * FROM users;
   ```

2. **Run the migration script:**
   - Copy contents of `supabase-migration-add-role.sql`
   - Paste in Supabase SQL Editor
   - Click Run

3. **Make yourself admin:**
   ```sql
   UPDATE users
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

4. **Test the application:**
   - Log in with your account
   - Visit `/admin` to see the admin panel
   - Visit `/seller` to see seller dashboard

---

## Need Help?

If you encounter any other errors:

1. Check the error message in Supabase logs
2. Verify all environment variables in `.env`
3. Make sure Supabase URL and keys are correct
4. Check that tables were created successfully

## Next Steps

After fixing the database:
1. ✅ Test authentication
2. ✅ Test creating a project as seller
3. ✅ Test approving/rejecting projects as admin
4. ✅ Set up Supabase Storage (see `SUPABASE_STORAGE_SETUP.md`)
5. ✅ Test file uploads

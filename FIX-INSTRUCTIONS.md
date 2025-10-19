# 🔧 Database Fix Instructions

## ⚠️ IMPORTANT: Which File to Run?

**DO NOT RUN:** `supabase-schema-complete.sql` ❌
**RUN THIS:** `SAFE-MIGRATION.sql` ✅

---

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Create New Query
1. Click **"New query"** button (top right)
2. You'll see an empty SQL editor

### Step 3: Copy the Migration Script
1. Open the file: **`SAFE-MIGRATION.sql`**
2. Copy **ALL** the contents (Ctrl+A, Ctrl+C)

### Step 4: Paste and Run
1. Paste into the Supabase SQL Editor (Ctrl+V)
2. Click the **"Run"** button (or press Ctrl+Enter)

### Step 5: Check Results
You should see output like:
```
✅ Migration Complete!
Total users: X
Buyers: X
Sellers: 0
Admins: 0
```

---

## After Running Migration

### Make Yourself an Admin

1. Still in the SQL Editor, run this query:
   ```sql
   UPDATE users
   SET role = 'admin'
   WHERE email = 'YOUR_EMAIL_HERE@example.com';
   ```

2. Replace `YOUR_EMAIL_HERE@example.com` with your actual email

3. Verify it worked:
   ```sql
   SELECT id, email, name, role FROM users;
   ```

---

## If You Still Get an Error

### Error: "relation 'users' does not exist"
**Solution:** Your database is empty. Run `supabase-schema-fresh.sql` instead.

### Error: "column 'role' does not exist"
**Solution:** You're running the wrong file. Make sure you're running `SAFE-MIGRATION.sql`, NOT `supabase-schema-complete.sql`

### Error: "permission denied"
**Solution:** Make sure you're using the correct Supabase project and have admin access.

---

## Verification Steps

After the migration, run these queries to verify everything is correct:

### 1. Check if role column exists:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';
```
Should return: `role`

### 2. Check your user's role:
```sql
SELECT email, role FROM users WHERE email = 'your-email@example.com';
```
Should show your role

### 3. List all tables:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
Should show: custom_requests, payment_transactions, projects, purchases, reviews, users

---

## Test Your Application

1. **Log in** to your application
2. Visit **`/seller`** - Should show seller dashboard
3. Visit **`/admin`** - Should show admin panel (if you set your role to 'admin')
4. Try **creating a project** at `/seller/projects/new`

---

## Quick Reference

| File Name | Purpose | When to Use |
|-----------|---------|-------------|
| `SAFE-MIGRATION.sql` | Add missing columns | **Existing database** ✅ |
| `supabase-schema-fresh.sql` | Fresh setup | **Empty database** |
| `supabase-schema-complete.sql` | Reference only | **Don't run directly** ❌ |

---

## Still Having Issues?

If you continue to see errors:

1. **Screenshot the error** from Supabase SQL Editor
2. Check which file name appears in the SQL editor tab
3. Make sure you copied the **entire** SAFE-MIGRATION.sql file
4. Try refreshing the Supabase dashboard and running again

---

## Success Checklist

- [ ] Ran `SAFE-MIGRATION.sql` in Supabase SQL Editor
- [ ] Saw "✅ Migration Complete!" message
- [ ] Updated at least one user to have 'admin' role
- [ ] Verified role column exists in users table
- [ ] Can log in to the application
- [ ] Can access /admin page (as admin)
- [ ] Can access /seller page

---

## Next Steps After Fix

1. ✅ Set up Supabase Storage (see `SUPABASE_STORAGE_SETUP.md`)
2. ✅ Test creating a project as seller
3. ✅ Test approving a project as admin
4. ✅ Configure environment variables
5. ✅ Test file uploads

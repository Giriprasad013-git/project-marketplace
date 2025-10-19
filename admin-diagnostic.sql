-- Diagnostic queries to check admin page data

-- Check if projects table exists and has data
SELECT 'Projects Table' as check_type, COUNT(*) as count FROM projects;

-- Check projects by status
SELECT 'Projects by Status' as check_type, status, COUNT(*) as count
FROM projects
GROUP BY status;

-- Check if users table exists and has data
SELECT 'Users Table' as check_type, COUNT(*) as count FROM users;

-- Check if purchases table exists and has data
SELECT 'Purchases Table' as check_type, COUNT(*) as count FROM purchases;

-- Check total revenue from purchases
SELECT 'Total Revenue' as check_type, SUM(amount) as total_revenue FROM purchases;

-- Check if custom_requests table exists and has data
SELECT 'Custom Requests Table' as check_type, COUNT(*) as count FROM custom_requests;

-- Check if the seller_id foreign key in projects is valid
SELECT 'Projects with Invalid Seller' as check_type, COUNT(*) as count
FROM projects p
LEFT JOIN users u ON p.seller_id = u.id
WHERE p.seller_id IS NOT NULL AND u.id IS NULL;

-- Check user roles
SELECT 'Users by Role' as check_type, role, COUNT(*) as count
FROM users
GROUP BY role;

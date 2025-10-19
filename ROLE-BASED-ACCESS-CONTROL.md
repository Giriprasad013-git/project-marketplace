# Role-Based Access Control (RBAC) Documentation

## Overview

Your Academic Projects Marketplace now has proper role-based access control implemented to secure admin and seller routes.

## User Roles

There are three user roles in the system:

| Role | Description | Access Level |
|------|-------------|--------------|
| **buyer** | Default role for all new users | Can browse, purchase projects, submit reviews |
| **seller** | Users who can list projects for sale | Can create and manage their own projects |
| **admin** | Platform administrators | Full access to moderate all projects and users |

## Role Assignment

### Default Role
- All new users are automatically assigned the **buyer** role when they sign up

### Changing Roles
You can change a user's role via SQL query in Supabase:

```sql
-- Make a user a seller
UPDATE users
SET role = 'seller'
WHERE email = 'user@example.com';

-- Make a user an admin
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';

-- Change back to buyer
UPDATE users
SET role = 'buyer'
WHERE email = 'user@example.com';
```

## Protected Routes

### API Endpoints

#### Admin-Only Routes (403 if not admin)
- `GET /api/admin/projects` - View all projects for moderation
- `GET /api/admin/stats` - View platform statistics
- `PUT /api/admin/projects/:id` - Approve/reject projects

#### Seller or Admin Routes (403 if buyer)
- `POST /api/projects` - Create a new project

#### Authenticated User Routes (any role)
- `GET /api/seller/projects` - View your own projects
- `GET /api/seller/stats` - View your seller stats
- `POST /api/projects/custom-request` - Submit custom requests
- `POST /api/projects/:id/reviews` - Submit reviews
- `GET /api/user/purchases` - View your purchases
- `GET /api/user/requests` - View your custom requests

### Frontend Pages

#### `/admin` - Admin Panel
- **Required Role**: admin
- **Behavior**: Redirects to home page with error if user is not admin
- **Features**:
  - View all projects
  - Approve/reject projects
  - View platform statistics

#### `/seller` - Seller Dashboard
- **Required Role**: Any authenticated user (shows their own data)
- **Behavior**: Redirects to login if not authenticated
- **Features**:
  - View your projects
  - View your sales stats
  - Create new projects

#### `/seller/projects/new` - Create Project
- **Required Role**: seller or admin (enforced at API level)
- **Behavior**: Returns 403 error if user tries to submit without seller role
- **Features**: Upload new project for review

## Middleware Functions

### 1. `requireAuth(request)`
- Verifies JWT token
- Returns decoded user data
- Throws error if no valid token

### 2. `requireAdmin(request)`
- Checks if user has admin role
- Returns decoded user data
- Throws "Admin access required" error if not admin

### 3. `requireSellerOrAdmin(request)`
- Checks if user has seller OR admin role
- Returns decoded user data with role
- Throws error if user is only a buyer

## Error Responses

### 403 Forbidden
Returned when a user tries to access a resource they don't have permission for:

```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 401 Unauthorized
Returned when authentication token is missing or invalid:

```json
{
  "success": false,
  "message": "Authentication required"
}
```

## Testing Role-Based Access

### Test Admin Access

1. Sign up with a new account
2. Run SQL to make yourself admin:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Log in and visit `/admin`
4. You should see the admin panel

### Test Non-Admin Access

1. Log in with a buyer account
2. Try to visit `/admin`
3. You should be redirected with "Access denied" message
4. Try to call `/api/admin/projects` - should get 403 error

### Test Seller Access

1. Update a user to seller:
   ```sql
   UPDATE users SET role = 'seller' WHERE email = 'seller@example.com';
   ```
2. Log in as that user
3. Go to `/seller/projects/new`
4. Create a project - should work
5. Log in as a buyer
6. Try to create a project - should get 403 error at API level

## Security Best Practices

### ✅ Implemented
- Role verification on all admin endpoints
- Proper HTTP status codes (403 for forbidden)
- Frontend redirects for unauthorized access
- Server-side role checks (not just frontend)

### 🔒 Additional Recommendations

1. **Add role to JWT token** - Include role in JWT payload to reduce database queries:
   ```javascript
   function generateToken(user) {
     return jwt.sign(
       { id: user.id, email: user.email, role: user.role },
       process.env.JWT_SECRET,
       { expiresIn: '7d' }
     )
   }
   ```

2. **Implement rate limiting** - Prevent abuse of admin endpoints

3. **Add audit logging** - Log all admin actions for security

4. **Two-factor authentication** - Require 2FA for admin accounts

5. **Session management** - Implement proper session expiration

## Common Issues & Solutions

### Issue: "Access denied" even though I'm an admin
**Solution**:
1. Verify your role in database:
   ```sql
   SELECT email, role FROM users WHERE email = 'your-email@example.com';
   ```
2. Log out and log back in to get fresh token
3. Clear browser localStorage and login again

### Issue: Getting 403 on admin routes
**Solution**: Check that:
1. Your token is valid (not expired)
2. Your user role is actually 'admin' in database
3. You're sending the Authorization header correctly

### Issue: Can't create projects as seller
**Solution**:
1. Verify role is 'seller' or 'admin'
2. Check browser console for API errors
3. Verify token is being sent with request

## Future Enhancements

Consider adding these features:

1. **Permission System** - Fine-grained permissions beyond roles
2. **Role Hierarchy** - Define which roles inherit permissions from others
3. **Multiple Roles** - Allow users to have multiple roles
4. **Custom Permissions** - Let admins define custom permissions
5. **Role Assignment UI** - Admin interface to change user roles
6. **Activity Logs** - Track who did what and when

## Code References

- **Middleware**: `/app/api/[[...path]]/route.js` (lines 28-73)
- **Admin Endpoints**: `/app/api/[[...path]]/route.js` (lines 437-529)
- **Frontend Protection**: `/app/admin/page.jsx` (lines 22-75)
- **Database Schema**: `COMPLETE-SETUP.sql` (users table)

## Summary

Your application now has secure role-based access control:
- ✅ Admin routes are protected
- ✅ Only sellers/admins can create projects
- ✅ Proper error messages and redirects
- ✅ Server-side validation (not just frontend)

Regular users (buyers) cannot access admin features, and the system properly checks permissions at both the API and frontend levels.

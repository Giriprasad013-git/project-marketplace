# Custom Project Request Flow - Complete Guide

## Overview

The custom project request feature allows users to submit requests for custom-built academic projects with specific requirements, budget, and deadline.

## ✅ Implemented Features

### 1. **Frontend - Request Submission**
- **Location**: Main page (`/app/page.js`)
- **Access**: Click "Request Custom Project" button on homepage
- **Form Fields**:
  - Project Title
  - Category selection
  - Detailed description
  - Technologies (multi-select)
  - Budget range
  - Deadline date

### 2. **API Endpoint - Submit Request**
- **Endpoint**: `POST /api/projects/custom-request`
- **Auth**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "title": "AI Recommendation System",
    "category": "AI & Machine Learning",
    "description": "Detailed project requirements...",
    "technologies": ["Python", "TensorFlow", "Flask"],
    "budget": "$500-$1000",
    "deadline": "2025-01-15"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Custom request submitted successfully",
    "request": {
      "id": "uuid",
      "title": "AI Recommendation System",
      "status": "pending",
      "created_at": "2025-01-11T..."
    }
  }
  ```

### 3. **User Dashboard - View Requests**
- **Location**: User Dashboard → "My Requests" tab
- **Features**:
  - List all custom requests with status
  - Color-coded status badges
  - Progress tracking for in-progress requests
  - Request details (budget, deadline, technologies)
  - Empty state with "Request Custom Project" button

### 4. **Status Tracking**
Requests can have the following statuses:
- **pending** (yellow) - Awaiting admin review
- **in_review** (blue) - Under review by admin
- **assigned** (purple) - Assigned to a seller
- **in_progress** (blue) - Work in progress
- **completed** (green) - Project delivered
- **cancelled** (red) - Request cancelled

### 5. **API Endpoint - Get User Requests**
- **Endpoint**: `GET /api/user/requests`
- **Auth**: Required (Bearer token)
- **Response**:
  ```json
  {
    "success": true,
    "requests": [
      {
        "id": "uuid",
        "title": "AI Recommendation System",
        "category": "ai",
        "description": "...",
        "technologies": ["Python", "TensorFlow"],
        "budget": "$500-$1000",
        "deadline": "2025-01-15",
        "status": "in_progress",
        "progress": 60,
        "created_at": "2025-01-01T...",
        "updated_at": "2025-01-10T..."
      }
    ]
  }
  ```

## 🔄 User Flow

### Step 1: Submit Request
1. User clicks "Request Custom Project" on homepage
2. Fills out the custom request form
3. Clicks "Submit Request"
4. System validates authentication
5. Request saved to database with status="pending"
6. User redirected to dashboard
7. Success notification shown

### Step 2: Track Request
1. User goes to Dashboard
2. Clicks "My Requests" tab
3. Sees all submitted requests with current status
4. Can view progress for in-progress requests
5. Gets notified when status changes (TODO: email notifications)

### Step 3: Receive Completed Project
1. Admin/Seller updates status to "completed"
2. User sees completed status in dashboard
3. Downloads final project files (TODO: download feature)

## 📋 Database Schema

```sql
CREATE TABLE custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[] DEFAULT '{}',
  budget VARCHAR(50) NOT NULL,
  deadline DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ⚠️ Incomplete Features

### 1. **Admin Management Interface**
**Status**: Not implemented
**Needed**:
- View all custom requests
- Assign requests to sellers
- Update request status
- Add admin notes
- Track progress

**Suggested Implementation**:
- Add `/admin/requests` page
- Create `GET /api/admin/custom-requests` endpoint
- Create `PUT /api/admin/custom-requests/:id` endpoint
- Add table with filters (status, date, budget)
- Add "Assign to Seller" dropdown

### 2. **Seller Interface**
**Status**: Not implemented
**Needed**:
- View available custom requests
- Accept/decline requests
- Update progress
- Upload deliverables
- Communicate with client

**Suggested Implementation**:
- Add `/seller/custom-requests` page
- Create `GET /api/seller/available-requests` endpoint
- Create `POST /api/seller/accept-request/:id` endpoint
- Create `PUT /api/seller/update-progress/:id` endpoint
- Add file upload for deliverables

### 3. **Status Update Endpoints**
**Status**: Partially implemented
**Needed**:
- API endpoint to update request status
- API endpoint to assign seller
- API endpoint to update progress
- API endpoint to add notes/comments

**Suggested Implementation**:
```javascript
// PUT /api/admin/custom-requests/:id/status
{
  "status": "assigned",
  "assigned_seller_id": "uuid",
  "admin_notes": "Assigned to John Doe"
}

// PUT /api/seller/custom-requests/:id/progress
{
  "progress": 75,
  "update_note": "Phase 3 completed"
}
```

### 4. **Email Notifications**
**Status**: Not implemented
**Needed**:
- Email on request submission (confirmation)
- Email on status change
- Email when assigned to seller
- Email when project completed
- Reminder emails for approaching deadlines

### 5. **File Upload/Download**
**Status**: Not implemented
**Needed**:
- Sellers upload project deliverables
- Users download completed projects
- Support for multiple files
- Version tracking

### 6. **Communication System**
**Status**: Not implemented
**Needed**:
- Message thread between user and seller
- Notifications for new messages
- Ability to request revisions
- Clarification questions

### 7. **Payment Integration**
**Status**: Not implemented
**Needed**:
- Payment for custom requests
- Escrow system (hold payment until completion)
- Release payment to seller
- Refund handling

## 🔧 How to Complete the Flow

### Priority 1: Admin Management (High Priority)

1. **Create Admin Custom Requests Page**:
```bash
touch app/admin/custom-requests/page.jsx
```

2. **Add API Endpoints**:
```javascript
// In app/api/[[...path]]/route.js

// GET /api/admin/custom-requests
if (pathParts[0] === 'admin' && pathParts[1] === 'custom-requests') {
  await requireAdmin(request)
  const { data } = await supabase
    .from('custom_requests')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false })
  return NextResponse.json({ success: true, requests: data })
}

// PUT /api/admin/custom-requests/:id
if (pathParts[0] === 'admin' && pathParts[1] === 'custom-requests' && pathParts[3]) {
  await requireAdmin(request)
  const { status, assigned_seller_id, admin_notes } = body
  const { data } = await supabase
    .from('custom_requests')
    .update({ status, assigned_seller_id, admin_notes })
    .eq('id', pathParts[3])
  return NextResponse.json({ success: true, request: data })
}
```

### Priority 2: Seller Interface (High Priority)

1. **Create Seller Custom Requests Page**:
```bash
touch app/seller/custom-requests/page.jsx
```

2. **Add API Endpoints**:
```javascript
// GET /api/seller/custom-requests
// POST /api/seller/accept-request/:id
// PUT /api/seller/update-progress/:id
```

### Priority 3: Notifications (Medium Priority)

1. **Set up Resend** (or similar email service)
2. **Add email templates**
3. **Send emails on status changes**

### Priority 4: File Management (Medium Priority)

1. **Use existing file upload component**
2. **Add deliverables table** to database
3. **Create upload endpoint** for sellers
4. **Create download endpoint** for users

## 🧪 Testing the Current Flow

### Test 1: Submit Custom Request

1. **Log in** to your app
2. Click **"Request Custom Project"**
3. Fill out the form:
   - Title: "Test Custom Project"
   - Category: "Web Development"
   - Description: "Need a simple website"
   - Technologies: Add "React", "Node.js"
   - Budget: "$100-$500"
   - Deadline: Pick a future date
4. Click **"Submit Request"**
5. **Expected**: Success message, redirected to dashboard

### Test 2: View Custom Requests

1. **Go to Dashboard**
2. Click **"My Requests"** tab
3. **Expected**: See your submitted request with status "pending"

### Test 3: Check Database

```sql
SELECT * FROM custom_requests ORDER BY created_at DESC LIMIT 10;
```

You should see your test request with all the details.

## 📊 Statistics

**Completion Status**: ~40%

- ✅ Frontend submission form
- ✅ API endpoint for submission
- ✅ Database schema
- ✅ User dashboard display
- ❌ Admin management interface
- ❌ Seller interface
- ❌ Status update workflows
- ❌ Email notifications
- ❌ File upload/download
- ❌ Payment integration
- ❌ Messaging system

## 🎯 Next Steps

1. **Immediate**: Create admin custom requests management page
2. **Soon**: Create seller interface to accept and work on requests
3. **Later**: Add email notifications and file management
4. **Future**: Add messaging and payment integration

## 💡 Recommendations

1. **Start with admin interface** - This is the bottleneck. Without it, requests get stuck in "pending" forever.

2. **Then seller interface** - Sellers need a way to see, accept, and work on requests.

3. **Add status automation** - Auto-email when status changes.

4. **Consider workflow** - Define clear steps: Pending → In Review → Assigned → In Progress → Delivered → Completed

5. **Add deadlines tracking** - Show urgency, send reminders.

---

## Support

If you need help implementing these features, refer to:
- Main app file: `/app/page.js` (lines 1313-1491 for fetch and submit logic)
- API routes: `/app/api/[[...path]]/route.js` (lines 553-615 for custom request endpoint)
- Database schema: `COMPLETE-SETUP.sql`

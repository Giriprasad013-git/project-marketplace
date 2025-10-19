# Complete Implementation Guide - Academic Project Marketplace

## 🎯 Overview

This guide covers all the incomplete flows that were identified and fixed in your academic project marketplace. Follow the steps below to complete the implementation.

---

## ✅ COMPLETED FIXES

### 1. Environment Configuration (.env)
**Status:** ✅ COMPLETED

- Added comprehensive .env structure with clear sections
- Documented where to get each API key
- Added optional services (Resend, Cloudflare R2)

**Next Steps for You:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your test API keys and replace in `.env`:
   ```
   STRIPE_API_KEY=sk_test_your_actual_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key
   ```
3. Generate a secure JWT secret:
   ```bash
   openssl rand -base64 32
   ```
4. Update `JWT_SECRET` in `.env`

---

### 2. Payment Success/Cancel Pages
**Status:** ✅ COMPLETED

**Created Files:**
- `app/payment/success/page.js` - Displays payment confirmation with order details
- `app/payment/cancel/page.js` - Handles cancelled payments

**Features:**
- ✅ Fetches payment status from Stripe
- ✅ Shows order details and next steps
- ✅ Provides navigation to dashboard/marketplace
- ✅ Loading states and error handling

---

### 3. Complete Database Schema
**Status:** ✅ COMPLETED

**Created File:** `supabase-schema-complete.sql`

**New Tables Added:**
- `projects` - Main product catalog with full metadata
- `downloads` - Track all download activity
- `reviews` - User reviews and ratings
- `download_tokens` - Secure token-based downloads

**To Apply:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire content of `supabase-schema-complete.sql`
3. Run the SQL
4. Verify tables were created in Table Editor

---

### 4. Secure Download System
**Status:** ✅ COMPLETED

**Created File:** `app/api/download/[token]/route.js`

**Features:**
- ✅ Token-based authentication
- ✅ Expiration validation (24-hour default)
- ✅ Download limit enforcement (max 3 per purchase)
- ✅ Activity logging (IP, user agent)
- ✅ Integration with Supabase Storage

**Usage:**
```javascript
// Generate download token (from dashboard or purchase page)
POST /api/download
Body: {
  purchase_id: "uuid",
  file_name: "project-files.zip",
  expires_in_hours: 24
}

// Download file
GET /api/download/{token}
```

---

### 5. Stripe Webhook Handler
**Status:** ✅ COMPLETED

**Created File:** `app/api/webhooks/stripe/route.js`

**Events Handled:**
- ✅ `checkout.session.completed` - Creates purchase record
- ✅ `payment_intent.succeeded` - Updates payment status
- ✅ `payment_intent.payment_failed` - Marks payment as failed
- ✅ `charge.refunded` - Handles refunds, removes access

**To Configure:**
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Test locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. For production, add webhook in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: Select all payment-related events
4. Copy webhook secret to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

---

## 🚧 IN PROGRESS

### 6. Connect Dashboard to Real Data
**Status:** 🚧 IN PROGRESS

**What's Needed:**
The current dashboard shows hardcoded sample data. You need to:

1. **Update Dashboard API Calls:**

Create a new file: `app/dashboard/page.js` (replace the current DashboardPage component)

```javascript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [purchases, setPurchases] = useState([])
  const [customRequests, setCustomRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // Fetch purchases
        const purchasesRes = await fetch('/api/user/purchases', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const purchasesData = await purchasesRes.json()
        setPurchases(purchasesData.purchases || [])

        // Fetch custom requests
        const requestsRes = await fetch('/api/user/requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const requestsData = await requestsRes.json()
        setCustomRequests(requestsData.requests || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // ... rest of dashboard UI rendering
}
```

2. **Add Generate Download Token Function:**

```javascript
async function handleDownload(purchase) {
  const token = localStorage.getItem('token')

  const response = await fetch('/api/download', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      purchase_id: purchase.id,
      file_name: `${purchase.project.title}.zip`
    })
  })

  const data = await response.json()
  if (data.download_url) {
    window.location.href = data.download_url
  }
}
```

---

## 📋 REMAINING TASKS

### 7. File Upload & Storage Setup
**Status:** ⏳ PENDING

**Option A: Supabase Storage (Recommended for MVP)**

1. **Create Storage Bucket:**
   - Go to Supabase Dashboard → Storage
   - Create bucket named `projects`
   - Make it public or add custom access policies

2. **Create Upload Page:**

Create `app/seller/upload/page.js`:

```javascript
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UploadProjectPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `projects/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create project record in database
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: 'Your Project Title',
          source_code_url: filePath,
          // ... other project fields
        })

      alert('Project uploaded successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        accept=".zip"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Project'}
      </button>
    </form>
  )
}
```

**Option B: Cloudflare R2 (Better for Production)**

1. Sign up at https://dash.cloudflare.com/
2. Create R2 bucket
3. Get API credentials
4. Install AWS SDK: `npm install @aws-sdk/client-s3`
5. Create upload handler using S3-compatible API

---

### 8. Email Notifications with Resend
**Status:** ⏳ PENDING

1. **Sign up:** https://resend.com
2. **Get API key** and add to `.env`:
   ```
   RESEND_API_KEY=re_your_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
3. **Install:** `npm install resend`

4. **Create Email Service:**

Create `lib/email.js`:

```javascript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPurchaseConfirmation(userEmail, projectTitle, downloadUrl) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: userEmail,
    subject: `Your purchase: ${projectTitle}`,
    html: `
      <h1>Thank you for your purchase!</h1>
      <p>You can download your project here:</p>
      <a href="${downloadUrl}">Download Now</a>
    `
  })
}

export async function sendCustomRequestUpdate(userEmail, requestTitle, status) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: userEmail,
    subject: `Custom Request Update: ${requestTitle}`,
    html: `
      <h1>Your custom request has been updated</h1>
      <p>Status: ${status}</p>
    `
  })
}
```

5. **Integrate into Webhook Handler:**

Update `app/api/webhooks/stripe/route.js`:

```javascript
import { sendPurchaseConfirmation } from '@/lib/email'

// In handleCheckoutSessionCompleted function:
const user = await supabase
  .from('users')
  .select('email')
  .eq('id', session.metadata.user_id)
  .single()

await sendPurchaseConfirmation(
  user.data.email,
  session.metadata.product_name,
  `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
)
```

---

### 9. Admin Panel
**Status:** ⏳ PENDING

Create `app/admin/page.js`:

```javascript
'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPanel() {
  const [pendingProjects, setPendingProjects] = useState([])
  const [customRequests, setCustomRequests] = useState([])

  useEffect(() => {
    fetchPendingProjects()
    fetchCustomRequests()
  }, [])

  async function fetchPendingProjects() {
    const response = await fetch('/api/admin/projects/pending', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await response.json()
    setPendingProjects(data.projects || [])
  }

  async function approveProject(projectId) {
    await fetch(`/api/admin/projects/${projectId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    fetchPendingProjects()
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Pending Projects</TabsTrigger>
          <TabsTrigger value="requests">Custom Requests</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {pendingProjects.map(project => (
            <div key={project.id} className="border p-4 mb-4 rounded">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <button onClick={() => approveProject(project.id)}>
                Approve
              </button>
            </div>
          ))}
        </TabsContent>

        {/* Add other tabs */}
      </Tabs>
    </div>
  )
}
```

Add admin API routes in `app/api/[[...path]]/route.js`:

```javascript
// Route: GET /api/admin/projects/pending
if (pathParts[0] === 'admin' && pathParts[1] === 'projects' && pathParts[2] === 'pending') {
  const decoded = requireAuth(request)

  // Check if user is admin
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', decoded.id)
    .single()

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return NextResponse.json({ success: true, projects })
}
```

---

### 10. Watermarking System
**Status:** ⏳ PENDING

**Implementation Approach:**

1. **On-the-fly Watermarking:**

Create `lib/watermark.js`:

```javascript
import JSZip from 'jszip'

export async function watermarkZipFile(zipBuffer, userEmail, purchaseId) {
  const zip = new JSZip()
  await zip.loadAsync(zipBuffer)

  // Add watermark file
  zip.file('PURCHASE_INFO.txt', `
    This project was purchased by: ${userEmail}
    Purchase ID: ${purchaseId}
    Download Date: ${new Date().toISOString()}

    WARNING: Unauthorized redistribution is prohibited.
    This file is tracked and watermarked.
  `)

  // Watermark README files
  const readme = zip.file(/readme\.md$/i)[0]
  if (readme) {
    const content = await readme.async('string')
    const watermarked = `${content}\n\n---\nPurchase ID: ${purchaseId}\nLicensed to: ${userEmail}\n`
    zip.file(readme.name, watermarked)
  }

  // Watermark code files (add comment at top)
  const codeFiles = zip.file(/\.(js|jsx|ts|tsx|py|java|cpp)$/)
  for (const file of codeFiles) {
    const content = await file.async('string')
    const watermark = `// Licensed to: ${userEmail} | Purchase ID: ${purchaseId}\n`
    zip.file(file.name, watermark + content)
  }

  return await zip.generateAsync({ type: 'nodebuffer' })
}
```

2. **Update Download Endpoint:**

Modify `app/api/download/[token]/route.js`:

```javascript
import { watermarkZipFile } from '@/lib/watermark'

// After downloading file:
const watermarkedFile = await watermarkZipFile(
  fileData,
  downloadToken.purchases.users.email,
  downloadToken.purchase_id
)

return new NextResponse(watermarkedFile, {
  headers: headers
})
```

---

## 🔧 QUICK START CHECKLIST

### Immediate Actions (Do These First):

1. ☐ Update Stripe API keys in `.env`
2. ☐ Generate and set JWT_SECRET in `.env`
3. ☐ Run `supabase-schema-complete.sql` in Supabase Dashboard
4. ☐ Create `projects` storage bucket in Supabase
5. ☐ Test Stripe webhook locally with Stripe CLI
6. ☐ Update payment URLs in `app/page.js` to use new success/cancel pages

### Short-term (This Week):

7. ☐ Connect dashboard to real Supabase data
8. ☐ Implement file upload functionality
9. ☐ Set up Resend email notifications
10. ☐ Test complete purchase flow end-to-end

### Medium-term (Next 2 Weeks):

11. ☐ Build admin panel for project moderation
12. ☐ Implement seller dashboard
13. ☐ Add search with Algolia or built-in Postgres full-text search
14. ☐ Create watermarking system
15. ☐ Add reviews and ratings UI

---

## 📊 Current Status Summary

| Feature | Status | Priority | Est. Time |
|---------|--------|----------|-----------|
| Stripe Integration | ✅ Done | Critical | - |
| Payment Pages | ✅ Done | Critical | - |
| Database Schema | ✅ Done | Critical | - |
| Download System | ✅ Done | High | - |
| Webhook Handler | ✅ Done | High | - |
| Dashboard Data | 🚧 In Progress | High | 2-4 hours |
| File Upload | ⏳ Pending | High | 4-6 hours |
| Email Notifications | ⏳ Pending | Medium | 2-3 hours |
| Admin Panel | ⏳ Pending | Medium | 6-8 hours |
| Watermarking | ⏳ Pending | Medium | 3-4 hours |
| Search Enhancement | ⏳ Pending | Low | 4-6 hours |
| Seller Dashboard | ⏳ Pending | Low | 6-8 hours |

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found: Can't resolve '@/lib/supabase'"
**Solution:** Make sure `lib/supabase.js` exists and is properly configured

### Issue: Stripe webhook not receiving events
**Solution:**
1. Check webhook secret is correct
2. Verify endpoint is publicly accessible
3. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Issue: File downloads return 404
**Solution:**
1. Verify Supabase Storage bucket exists
2. Check file paths in database match storage paths
3. Ensure storage bucket has correct permissions

### Issue: JWT token expired
**Solution:**
1. Check token expiration in `route.js` (currently 7 days)
2. Implement refresh token mechanism for longer sessions

---

## 📚 Additional Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Next.js 14 Docs:** https://nextjs.org/docs
- **Resend Docs:** https://resend.com/docs

---

## 🎯 Next Steps

1. Follow the Quick Start Checklist above
2. Test each feature as you implement it
3. Deploy to staging environment for thorough testing
4. Set up monitoring (Sentry for errors, PostHog for analytics)
5. Create user documentation
6. Launch MVP!

Good luck! 🚀

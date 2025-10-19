import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_API_KEY)

// Get Supabase client
function getSupabase() {
  return getSupabaseAdmin()
}

// JWT helper functions
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'your_super_secure_jwt_secret_here',
    { expiresIn: '7d' }
  )
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'your_super_secure_jwt_secret_here')
}

// Middleware to verify authentication
function requireAuth(req) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required')
  }

  const token = authHeader.substring(7)
  return verifyToken(token)
}

// Middleware to verify admin role
async function requireAdmin(req) {
  const decoded = requireAuth(req)
  const supabase = getSupabaseAdmin()

  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', decoded.id)
    .single()

  if (error || !user || user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return decoded
}

// Middleware to verify seller or admin role
async function requireSellerOrAdmin(req) {
  const decoded = requireAuth(req)
  const supabase = getSupabaseAdmin()

  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', decoded.id)
    .single()

  if (error || !user || (user.role !== 'seller' && user.role !== 'admin')) {
    throw new Error('Seller or admin access required')
  }

  return { ...decoded, role: user.role }
}

// Helper function to get projects from database
async function getProjectsFromDB(filters = {}) {
  const supabase = getSupabase()

  let query = supabase
    .from('projects')
    .select(`
      *,
      users:seller_id (id, name, email)
    `)
    .eq('status', 'approved') // Only show approved projects

  // Apply filters
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.featured) {
    query = query.eq('featured', true)
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  // Order by creation date
  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  // Transform to match frontend format
  return data.map(project => ({
    id: project.id,
    title: project.title,
    category: project.category,
    description: project.description,
    price: parseFloat(project.price),
    rating: parseFloat(project.rating) || 0,
    purchases: project.total_purchases || 0,
    technologies: project.technologies || [],
    thumbnail: project.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    featured: project.featured,
    seller: project.users
  }))
}

// Route handlers
export async function GET(request) {
  try {
    const { pathname } = new URL(request.url)
    const pathParts = pathname.split('/').filter(part => part && part !== 'api')
    
    console.log('GET Request:', pathname, 'Parts:', pathParts)

    // Route: GET /api/projects
    if (pathParts[0] === 'projects' && pathParts.length === 1) {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const search = url.searchParams.get('search')
      const featured = url.searchParams.get('featured') === 'true'

      const projects = await getProjectsFromDB({ category, search, featured })

      return NextResponse.json({
        success: true,
        projects
      })
    }

    // Route: GET /api/projects/:id
    if (pathParts[0] === 'projects' && pathParts.length === 2) {
      const projectId = pathParts[1]
      const supabase = getSupabase()

      const { data: project, error } = await supabase
        .from('projects')
        .select(`
          *,
          users:seller_id (id, name, email),
          reviews (
            id,
            rating,
            title,
            comment,
            created_at,
            users (name)
          )
        `)
        .eq('id', projectId)
        .single()

      if (error || !project) {
        return NextResponse.json(
          { success: false, message: 'Project not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        project: {
          id: project.id,
          title: project.title,
          category: project.category,
          description: project.description,
          detailed_description: project.detailed_description,
          price: parseFloat(project.price),
          rating: parseFloat(project.rating) || 0,
          total_reviews: project.total_reviews || 0,
          purchases: project.total_purchases || 0,
          technologies: project.technologies || [],
          thumbnail: project.thumbnail_url,
          demo_video_url: project.demo_video_url,
          features: project.features || [],
          requirements: project.requirements || [],
          seller: project.users,
          reviews: project.reviews || []
        }
      })
    }

    // Route: GET /api/auth/verify
    if (pathParts[0] === 'auth' && pathParts[1] === 'verify') {
      try {
        const decoded = requireAuth(request)
        const supabase = getSupabaseAdmin()

        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('id', decoded.id)
          .single()

        if (error || !user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        })
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        )
      }
    }

    // Route: GET /api/payments/checkout/status/:sessionId
    if (pathParts[0] === 'payments' && pathParts[1] === 'checkout' &&
        pathParts[2] === 'status' && pathParts[3]) {
      const sessionId = pathParts[3]

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        const supabase = getSupabase()

        // Update transaction in database if payment is complete
        if (session.payment_status === 'paid') {
          const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('session_id', sessionId)
            .single()

          if (transaction && transaction.payment_status !== 'paid') {
            await supabase
              .from('payment_transactions')
              .update({
                payment_status: session.payment_status,
                updated_at: new Date().toISOString()
              })
              .eq('session_id', sessionId)

            // If this is a project purchase, add to user's purchases
            if (session.metadata && session.metadata.project_id) {
              const decoded = requireAuth(request)
              await supabase
                .from('purchases')
                .insert([{
                  user_id: decoded.id,
                  project_id: session.metadata.project_id,
                  session_id: sessionId,
                  amount: session.amount_total / 100,
                  currency: session.currency
                }])
            }
          }
        }

        return NextResponse.json({
          success: true,
          status: session.status,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          metadata: session.metadata
        })
      } catch (error) {
        console.error('Error checking payment status:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to check payment status' },
          { status: 500 }
        )
      }
    }

    // Route: GET /api/user/purchases
    if (pathParts[0] === 'user' && pathParts[1] === 'purchases') {
      try {
        const decoded = requireAuth(request)
        const supabase = getSupabase()

        const { data: purchases, error } = await supabase
          .from('purchases')
          .select(`
            *,
            projects (
              id,
              title,
              category,
              price,
              thumbnail_url
            )
          `)
          .eq('user_id', decoded.id)
          .order('purchased_at', { ascending: false })

        if (error) throw error

        // Format purchases with project details
        const purchasesWithProjects = purchases.map(purchase => ({
          ...purchase,
          project: purchase.projects
        }))

        return NextResponse.json({
          success: true,
          purchases: purchasesWithProjects
        })
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Route: GET /api/user/requests
    if (pathParts[0] === 'user' && pathParts[1] === 'requests') {
      try {
        const decoded = requireAuth(request)
        const supabase = getSupabase()

        const { data: requests, error } = await supabase
          .from('custom_requests')
          .select('*')
          .eq('user_id', decoded.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          success: true,
          requests
        })
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Route: GET /api/seller/projects
    if (pathParts[0] === 'seller' && pathParts[1] === 'projects') {
      try {
        const decoded = requireAuth(request)
        const supabase = getSupabase()

        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('seller_id', decoded.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          success: true,
          projects
        })
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Route: GET /api/seller/stats
    if (pathParts[0] === 'seller' && pathParts[1] === 'stats') {
      try {
        const decoded = requireAuth(request)
        const supabase = getSupabase()

        // Get total projects
        const { count: totalProjects } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', decoded.id)

        // Get total sales
        const { data: projects } = await supabase
          .from('projects')
          .select('total_purchases')
          .eq('seller_id', decoded.id)

        const totalSales = projects?.reduce((sum, p) => sum + (p.total_purchases || 0), 0) || 0

        // Get total revenue
        const { data: purchases } = await supabase
          .from('purchases')
          .select('amount')
          .in('project_id',
            (await supabase.from('projects').select('id').eq('seller_id', decoded.id))
            .data?.map(p => p.id) || []
          )

        const totalRevenue = purchases?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0

        return NextResponse.json({
          success: true,
          stats: {
            total_projects: totalProjects || 0,
            total_sales: totalSales,
            total_revenue: totalRevenue,
            avg_rating: 4.5 // TODO: Calculate from reviews
          }
        })
      } catch (error) {
        console.error('Error fetching seller stats:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to fetch stats' },
          { status: 500 }
        )
      }
    }

    // Route: GET /api/admin/projects
    if (pathParts[0] === 'admin' && pathParts[1] === 'projects') {
      try {
        await requireAdmin(request)
        const supabase = getSupabase()

        const { data: projects, error } = await supabase
          .from('projects')
          .select(`
            *,
            users:seller_id (id, name, email)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          success: true,
          projects
        })
      } catch (error) {
        console.error('Error fetching projects for admin:', error)

        // Check if it's an authorization error
        if (error.message === 'Admin access required' || error.message === 'Authentication required') {
          return NextResponse.json(
            { success: false, message: error.message },
            { status: 403 }
          )
        }

        return NextResponse.json(
          { success: false, message: 'Failed to fetch projects' },
          { status: 500 }
        )
      }
    }

    // Route: GET /api/admin/stats
    if (pathParts[0] === 'admin' && pathParts[1] === 'stats') {
      try {
        await requireAdmin(request)
        const supabase = getSupabase()

        // Get total projects
        const { count: totalProjects } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })

        // Get pending projects
        const { count: pendingProjects } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Get total users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        // Get total revenue
        const { data: purchases } = await supabase
          .from('purchases')
          .select('amount')

        const totalRevenue = purchases?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0

        return NextResponse.json({
          success: true,
          stats: {
            total_projects: totalProjects || 0,
            pending_projects: pendingProjects || 0,
            total_users: totalUsers || 0,
            total_revenue: totalRevenue
          }
        })
      } catch (error) {
        console.error('Error fetching admin stats:', error)

        // Check if it's an authorization error
        if (error.message === 'Admin access required' || error.message === 'Authentication required') {
          return NextResponse.json(
            { success: false, message: error.message },
            { status: 403 }
          )
        }

        return NextResponse.json(
          { success: false, message: 'Failed to fetch stats' },
          { status: 500 }
        )
      }
    }

    // Route: GET /api/admin/custom-requests
    if (pathParts[0] === 'admin' && pathParts[1] === 'custom-requests') {
      try {
        await requireAdmin(request)
        const supabase = getSupabase()

        const { data: requests, error } = await supabase
          .from('custom_requests')
          .select(`
            *,
            users:user_id (id, name, email)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          success: true,
          requests
        })
      } catch (error) {
        console.error('Error fetching custom requests for admin:', error)

        if (error.message === 'Admin access required' || error.message === 'Authentication required') {
          return NextResponse.json(
            { success: false, message: error.message },
            { status: 403 }
          )
        }

        return NextResponse.json(
          { success: false, message: 'Failed to fetch custom requests' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: false, message: 'Route not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { pathname } = new URL(request.url)
    const pathParts = pathname.split('/').filter(part => part && part !== 'api')
    const body = await request.json()
    
    console.log('POST Request:', pathname, 'Parts:', pathParts, 'Body:', body)

    // Route: POST /api/auth/signup
    if (pathParts[0] === 'auth' && pathParts[1] === 'signup') {
      const { name, email, password } = body

      if (!name || !email || !password) {
        return NextResponse.json(
          { success: false, message: 'Name, email and password are required' },
          { status: 400 }
        )
      }

      try {
        const supabase = getSupabaseAdmin()

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('email')
          .eq('email', email)
          .single()

        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'User with this email already exists' },
            { status: 409 }
          )
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10)

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              name,
              email,
              password_hash: hashedPassword
            }
          ])
          .select()
          .single()

        if (insertError) {
          console.error('Supabase insert error:', insertError)
          return NextResponse.json(
            { success: false, message: 'Failed to create user' },
            { status: 500 }
          )
        }

        // Generate token
        const token = generateToken({ id: newUser.id, email: newUser.email })

        return NextResponse.json({
          success: true,
          message: 'User created successfully',
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
          },
          token
        })
      } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to create user' },
          { status: 500 }
        )
      }
    }

    // Route: POST /api/auth/login
    if (pathParts[0] === 'auth' && pathParts[1] === 'login') {
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json(
          { success: false, message: 'Email and password are required' },
          { status: 400 }
        )
      }

      try {
        const supabase = getSupabaseAdmin()

        // Find user
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name, password_hash')
          .eq('email', email)
          .single()

        if (error || !user) {
          return NextResponse.json(
            { success: false, message: 'Invalid credentials' },
            { status: 401 }
          )
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash)
        if (!isValidPassword) {
          return NextResponse.json(
            { success: false, message: 'Invalid credentials' },
            { status: 401 }
          )
        }

        // Generate token
        const token = generateToken({ id: user.id, email: user.email })

        return NextResponse.json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          token
        })
      } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to login' },
          { status: 500 }
        )
      }
    }

    // Route: POST /api/payments/checkout/session
    if (pathParts[0] === 'payments' && pathParts[1] === 'checkout' && pathParts[2] === 'session') {
      try {
        const decoded = requireAuth(request)
        const {
          amount,
          currency = 'usd',
          success_url,
          cancel_url,
          metadata = {}
        } = body

        if (!success_url || !cancel_url) {
          return NextResponse.json(
            { success: false, message: 'Missing success_url or cancel_url' },
            { status: 400 }
          )
        }

        if (!amount) {
          return NextResponse.json(
            { success: false, message: 'Amount is required' },
            { status: 400 }
          )
        }

        // Create line items for custom amount payment
        const line_items = [{
          price_data: {
            currency: currency,
            product_data: {
              name: metadata.product_name || 'Academic Project',
              description: metadata.project_id ? `Project ID: ${metadata.project_id}` : 'Custom Academic Project'
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        }]

        // Add user info to metadata
        metadata.user_id = decoded.id

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: line_items,
          mode: 'payment',
          success_url: success_url,
          cancel_url: cancel_url,
          metadata: metadata,
          customer_email: decoded.email
        })

        // Store transaction in database
        const supabase = getSupabase()
        await supabase
          .from('payment_transactions')
          .insert([{
            session_id: session.id,
            user_id: decoded.id,
            amount: amount,
            currency: currency,
            metadata: metadata,
            payment_status: 'pending'
          }])

        return NextResponse.json({
          success: true,
          url: session.url,
          session_id: session.id
        })
      } catch (error) {
        console.error('Error creating checkout session:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to create checkout session' },
          { status: 500 }
        )
      }
    }

    // Route: POST /api/projects/custom-request
    if (pathParts[0] === 'projects' && pathParts[1] === 'custom-request') {
      try {
        const decoded = requireAuth(request)
        const {
          title,
          category,
          description,
          technologies,
          budget,
          deadline
        } = body

        if (!title || !category || !description || !budget || !deadline) {
          return NextResponse.json(
            { success: false, message: 'All required fields must be filled' },
            { status: 400 }
          )
        }

        const supabase = getSupabase()

        const { data, error } = await supabase
          .from('custom_requests')
          .insert([
            {
              user_id: decoded.id,
              title,
              category,
              description,
              technologies: technologies || [],
              budget,
              deadline,
              status: 'pending'
            }
          ])
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error:', error)
          throw error
        }

        return NextResponse.json({
          success: true,
          message: 'Custom request submitted successfully',
          request: {
            id: data.id,
            title: data.title,
            status: data.status,
            created_at: data.created_at
          }
        })
      } catch (error) {
        console.error('Error creating custom request:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to submit custom request' },
          { status: 500 }
        )
      }
    }

    // Route: POST /api/projects
    if (pathParts[0] === 'projects' && pathParts.length === 1) {
      try {
        const decoded = await requireSellerOrAdmin(request)
        const {
          title,
          category,
          description,
          detailed_description,
          price,
          technologies,
          thumbnail_url,
          demo_video_url,
          features,
          requirements,
          files
        } = body

        if (!title || !category || !description || !price) {
          return NextResponse.json(
            { success: false, message: 'Title, category, description, and price are required' },
            { status: 400 }
          )
        }

        const supabase = getSupabase()

        const { data, error } = await supabase
          .from('projects')
          .insert([
            {
              seller_id: decoded.id,
              title,
              category,
              description,
              detailed_description,
              price,
              technologies: technologies || [],
              thumbnail_url,
              demo_video_url,
              features: features || [],
              requirements: requirements || [],
              status: 'pending' // Projects need admin approval
            }
          ])
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error:', error)
          throw error
        }

        // TODO: Handle file uploads to Supabase Storage

        return NextResponse.json({
          success: true,
          message: 'Project submitted for review',
          project: data
        })
      } catch (error) {
        console.error('Error creating project:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to create project' },
          { status: 500 }
        )
      }
    }

    // Route: POST /api/projects/:id/reviews
    if (pathParts[0] === 'projects' && pathParts[2] === 'reviews' && pathParts.length === 3) {
      try {
        const decoded = requireAuth(request)
        const projectId = pathParts[1]
        const { rating, title, comment } = body

        if (!rating || !title || !comment) {
          return NextResponse.json(
            { success: false, message: 'Rating, title, and comment are required' },
            { status: 400 }
          )
        }

        if (rating < 1 || rating > 5) {
          return NextResponse.json(
            { success: false, message: 'Rating must be between 1 and 5' },
            { status: 400 }
          )
        }

        const supabase = getSupabase()

        // Check if user has purchased this project
        const { data: purchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', decoded.id)
          .eq('project_id', projectId)
          .single()

        if (!purchase) {
          return NextResponse.json(
            { success: false, message: 'You must purchase this project before reviewing it' },
            { status: 403 }
          )
        }

        // Check if user has already reviewed this project
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', decoded.id)
          .eq('project_id', projectId)
          .single()

        if (existingReview) {
          return NextResponse.json(
            { success: false, message: 'You have already reviewed this project' },
            { status: 409 }
          )
        }

        // Create review
        const { data: review, error } = await supabase
          .from('reviews')
          .insert([
            {
              user_id: decoded.id,
              project_id: projectId,
              rating,
              title,
              comment
            }
          ])
          .select()
          .single()

        if (error) throw error

        // Update project rating and review count
        const { data: allReviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('project_id', projectId)

        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

        await supabase
          .from('projects')
          .update({
            rating: avgRating,
            total_reviews: allReviews.length
          })
          .eq('id', projectId)

        return NextResponse.json({
          success: true,
          message: 'Review submitted successfully',
          review
        })
      } catch (error) {
        console.error('Error creating review:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to submit review' },
          { status: 500 }
        )
      }
    }

    // Route: POST /api/upload
    if (pathParts[0] === 'upload') {
      try {
        const decoded = requireAuth(request)
        const contentType = request.headers.get('content-type')

        if (!contentType || !contentType.includes('multipart/form-data')) {
          return NextResponse.json(
            { success: false, message: 'Content-Type must be multipart/form-data' },
            { status: 400 }
          )
        }

        const formData = await request.formData()
        const file = formData.get('file')
        const bucket = formData.get('bucket') || 'project-files'
        const folder = formData.get('folder') || 'uploads'

        if (!file) {
          return NextResponse.json(
            { success: false, message: 'No file provided' },
            { status: 400 }
          )
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${folder}/${decoded.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload to Supabase Storage
        const supabase = getSupabase()
        const fileBuffer = await file.arrayBuffer()
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false
          })

        if (error) {
          console.error('Upload error:', error)
          throw error
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName)

        return NextResponse.json({
          success: true,
          message: 'File uploaded successfully',
          file: {
            path: data.path,
            url: publicUrl,
            name: file.name,
            size: file.size,
            type: file.type
          }
        })
      } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to upload file' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: false, message: 'Route not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { pathname } = new URL(request.url)
    const pathParts = pathname.split('/').filter(part => part && part !== 'api')
    const body = await request.json()

    console.log('PUT Request:', pathname, 'Parts:', pathParts, 'Body:', body)

    // Route: PUT /api/admin/projects/:id
    if (pathParts[0] === 'admin' && pathParts[1] === 'projects' && pathParts[2]) {
      try {
        await requireAdmin(request)
        const projectId = pathParts[2]
        const { status, reason } = body

        if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
          return NextResponse.json(
            { success: false, message: 'Invalid status' },
            { status: 400 }
          )
        }

        const supabase = getSupabase()

        const updateData = {
          status,
          updated_at: new Date().toISOString()
        }

        if (status === 'rejected' && reason) {
          updateData.rejection_reason = reason
        } else if (status === 'approved') {
          updateData.rejection_reason = null
        }

        const { data, error } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', projectId)
          .select()
          .single()

        if (error) throw error

        // TODO: Send email notification to seller

        return NextResponse.json({
          success: true,
          message: `Project ${status} successfully`,
          project: data
        })
      } catch (error) {
        console.error('Error updating project:', error)

        // Check if it's an authorization error
        if (error.message === 'Admin access required' || error.message === 'Authentication required') {
          return NextResponse.json(
            { success: false, message: error.message },
            { status: 403 }
          )
        }

        return NextResponse.json(
          { success: false, message: 'Failed to update project' },
          { status: 500 }
        )
      }
    }

    // Route: PUT /api/admin/custom-requests/:id
    if (pathParts[0] === 'admin' && pathParts[1] === 'custom-requests' && pathParts[2]) {
      try {
        await requireAdmin(request)
        const requestId = pathParts[2]
        const { status, assigned_seller_id, admin_notes, progress } = body

        const validStatuses = ['pending', 'in_review', 'assigned', 'in_progress', 'completed', 'cancelled']
        if (status && !validStatuses.includes(status)) {
          return NextResponse.json(
            { success: false, message: 'Invalid status' },
            { status: 400 }
          )
        }

        const supabase = getSupabase()

        const updateData = {
          updated_at: new Date().toISOString()
        }

        if (status) updateData.status = status
        if (assigned_seller_id !== undefined) updateData.assigned_seller_id = assigned_seller_id
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes
        if (progress !== undefined) updateData.progress = progress

        const { data, error } = await supabase
          .from('custom_requests')
          .update(updateData)
          .eq('id', requestId)
          .select()
          .single()

        if (error) throw error

        // TODO: Send email notification to user

        return NextResponse.json({
          success: true,
          message: 'Custom request updated successfully',
          request: data
        })
      } catch (error) {
        console.error('Error updating custom request:', error)

        if (error.message === 'Admin access required' || error.message === 'Authentication required') {
          return NextResponse.json(
            { success: false, message: error.message },
            { status: 403 }
          )
        }

        return NextResponse.json(
          { success: false, message: 'Failed to update custom request' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: false, message: 'Route not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('PUT Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { pathname } = new URL(request.url)
    const pathParts = pathname.split('/').filter(part => part && part !== 'api')
    
    console.log('DELETE Request:', pathname, 'Parts:', pathParts)

    return NextResponse.json(
      { success: false, message: 'Route not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Secure Download Endpoint
 * GET /api/download/[token]
 *
 * This endpoint validates download tokens and streams files from Supabase Storage
 * Features:
 * - Token expiration validation
 * - Download limit enforcement
 * - Download activity logging
 * - IP address tracking for security
 */
export async function GET(request, { params }) {
  try {
    const { token } = params
    const supabase = getSupabaseAdmin()

    // 1. Validate token
    const { data: downloadToken, error: tokenError } = await supabase
      .from('download_tokens')
      .select(`
        *,
        purchases!inner(id, user_id, project_id),
        projects!inner(id, title, source_code_url)
      `)
      .eq('token', token)
      .single()

    if (tokenError || !downloadToken) {
      return NextResponse.json(
        { error: 'Invalid or expired download token' },
        { status: 404 }
      )
    }

    // 2. Check if token is expired
    if (new Date(downloadToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Download token has expired' },
        { status: 410 }
      )
    }

    // 3. Check download limit
    if (downloadToken.downloads_used >= downloadToken.max_downloads) {
      return NextResponse.json(
        { error: 'Download limit reached for this token' },
        { status: 429 }
      )
    }

    // 4. Get client IP and user agent for logging
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 5. Increment download count
    await supabase
      .from('download_tokens')
      .update({ downloads_used: downloadToken.downloads_used + 1 })
      .eq('id', downloadToken.id)

    // 6. Decrement remaining downloads in purchases
    await supabase
      .from('purchases')
      .update({
        downloads_remaining: Math.max(0, downloadToken.purchases.downloads_remaining - 1)
      })
      .eq('id', downloadToken.purchase_id)

    // 7. Log download activity
    await supabase
      .from('downloads')
      .insert({
        purchase_id: downloadToken.purchase_id,
        user_id: downloadToken.purchases.user_id,
        project_id: downloadToken.purchases.project_id,
        file_name: downloadToken.file_name,
        ip_address: ip,
        user_agent: userAgent
      })

    // 8. Get file from Supabase Storage
    const filePath = downloadToken.projects.source_code_url

    if (!filePath) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Extract bucket and path from the URL
    // Expected format: bucket-name/path/to/file.zip
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('projects') // Your storage bucket name
      .download(filePath)

    if (fileError || !fileData) {
      console.error('File download error:', fileError)
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      )
    }

    // 9. Return file with appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="${downloadToken.file_name}"`)
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    return new NextResponse(fileData, {
      status: 200,
      headers: headers
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    )
  }
}

/**
 * Generate Download Token Helper Function
 * This should be called from the purchase success page or dashboard
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { purchase_id, file_name, expires_in_hours = 24 } = body

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify purchase exists and belongs to user
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*, projects(id, source_code_url)')
      .eq('id', purchase_id)
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Check if user still has downloads remaining
    if (purchase.downloads_remaining <= 0) {
      return NextResponse.json(
        { error: 'No downloads remaining for this purchase' },
        { status: 403 }
      )
    }

    // Generate secure random token
    const crypto = require('crypto')
    const token = crypto.randomBytes(32).toString('hex')

    // Calculate expiration time
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours)

    // Create download token
    const { data: downloadToken, error: tokenError } = await supabase
      .from('download_tokens')
      .insert({
        token,
        purchase_id: purchase.id,
        user_id: purchase.user_id,
        project_id: purchase.project_id,
        file_name: file_name || 'project-files.zip',
        expires_at: expiresAt.toISOString(),
        max_downloads: 1 // Single use token
      })
      .select()
      .single()

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return NextResponse.json(
        { error: 'Failed to generate download token' },
        { status: 500 }
      )
    }

    // Return download URL
    const downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/download/${token}`

    return NextResponse.json({
      success: true,
      download_url: downloadUrl,
      token,
      expires_at: expiresAt.toISOString(),
      downloads_remaining: purchase.downloads_remaining
    })

  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate download token' },
      { status: 500 }
    )
  }
}

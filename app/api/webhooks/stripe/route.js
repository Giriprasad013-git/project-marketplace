import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_API_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 *
 * This endpoint receives webhook events from Stripe to process payments asynchronously
 * Events handled:
 * - checkout.session.completed
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - charge.refunded
 */
export async function POST(request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, supabase)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, supabase)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, supabase)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session, supabase) {
  try {
    console.log('Processing checkout.session.completed:', session.id)

    // Update payment transaction status
    const { data: transaction, error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        payment_status: 'paid',
        stripe_payment_intent_id: session.payment_intent
      })
      .eq('session_id', session.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return
    }

    // If this is a project purchase, create purchase record
    if (session.metadata && session.metadata.project_id) {
      // Check if purchase already exists
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('session_id', session.id)
        .single()

      if (!existingPurchase) {
        // Create new purchase record
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: session.metadata.user_id,
            project_id: session.metadata.project_id,
            session_id: session.id,
            amount: session.amount_total / 100,
            currency: session.currency,
            downloads_remaining: 3 // Allow 3 downloads
          })

        if (purchaseError) {
          console.error('Error creating purchase:', purchaseError)
          return
        }

        console.log('Purchase record created successfully')

        // TODO: Send confirmation email to user
        // await sendPurchaseConfirmationEmail(session.metadata.user_id, session.metadata.project_id)
      }
    }

    // If this is a custom request, update custom request status
    if (session.metadata && session.metadata.custom_request_id) {
      await supabase
        .from('custom_requests')
        .update({
          status: 'in_progress',
          progress: 0
        })
        .eq('id', session.metadata.custom_request_id)

      console.log('Custom request status updated')

      // TODO: Notify admin about new custom request payment
      // await sendCustomRequestNotification(session.metadata.custom_request_id)
    }

  } catch (error) {
    console.error('Error handling checkout session:', error)
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent, supabase) {
  try {
    console.log('Processing payment_intent.succeeded:', paymentIntent.id)

    // Update any transactions associated with this payment intent
    await supabase
      .from('payment_transactions')
      .update({
        payment_status: 'paid',
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent, supabase) {
  try {
    console.log('Processing payment_intent.payment_failed:', paymentIntent.id)

    // Update transaction status to failed
    await supabase
      .from('payment_transactions')
      .update({
        payment_status: 'failed',
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    // TODO: Send payment failure notification to user
    // await sendPaymentFailureEmail(paymentIntent.metadata.user_id)

  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(charge, supabase) {
  try {
    console.log('Processing charge.refunded:', charge.id)

    // Find the payment transaction
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*, purchases(*)')
      .eq('stripe_payment_intent_id', charge.payment_intent)
      .single()

    if (transaction) {
      // Update transaction status
      await supabase
        .from('payment_transactions')
        .update({ payment_status: 'refunded' })
        .eq('id', transaction.id)

      // If there's an associated purchase, remove access
      if (transaction.purchases && transaction.purchases.length > 0) {
        const purchase = transaction.purchases[0]

        // Update purchase to mark as refunded
        await supabase
          .from('purchases')
          .update({ downloads_remaining: 0 })
          .eq('id', purchase.id)

        // Invalidate any active download tokens
        await supabase
          .from('download_tokens')
          .update({ max_downloads: 0 })
          .eq('purchase_id', purchase.id)
      }

      console.log('Refund processed successfully')

      // TODO: Send refund confirmation email
      // await sendRefundConfirmationEmail(transaction.user_id)
    }

  } catch (error) {
    console.error('Error handling charge refunded:', error)
  }
}

// Disable body parsing, need raw body for webhook verification
export const config = {
  api: {
    bodyParser: false
  }
}

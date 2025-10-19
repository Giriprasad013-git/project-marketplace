'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Download, ArrowRight, Loader2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setError('No session ID found')
      setLoading(false)
      return
    }

    // Fetch payment status from backend
    const fetchPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/checkout/status/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch payment status')
        }

        const data = await response.json()
        setPaymentDetails(data)
      } catch (err) {
        console.error('Error fetching payment status:', err)
        setError('Failed to verify payment')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentStatus()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-600">Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6 text-center">{error}</p>
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPaymentSuccessful = paymentDetails?.payment_status === 'paid'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 p-4">
      <Card className="w-full max-w-2xl border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-lg">
            Thank you for your purchase. Your project is ready to download.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Order Details</h3>
            <div className="space-y-2">
              {paymentDetails?.metadata?.product_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Project:</span>
                  <span className="font-medium text-gray-800">
                    {paymentDetails.metadata.product_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-800">
                  ${(paymentDetails?.amount_total / 100).toFixed(2)} {paymentDetails?.currency?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Paid
                </span>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>A confirmation email has been sent to your email address</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>You can download your project files from your dashboard</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>You have 30 days of support included with your purchase</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/marketplace')}
              variant="outline"
              className="flex-1"
            >
              Browse More Projects
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Support Information */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Need help? Contact us at{' '}
              <a href="mailto:support@projecthub.com" className="text-orange-600 hover:underline">
                support@projecthub.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-12 w-12 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-base">
            Your payment was cancelled. No charges were made to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Information Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">What happened?</h3>
            <p className="text-sm text-yellow-800">
              You cancelled the payment process or closed the payment window before completing the transaction.
              Your project is still available for purchase if you'd like to try again.
            </p>
          </div>

          {/* Reasons Section */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Common reasons for cancellation:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Changed your mind about the purchase</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Need to check project details again</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Want to compare with other projects</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Payment method issue</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.back()}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Project
            </Button>
            <Button
              onClick={() => router.push('/marketplace')}
              variant="outline"
              className="w-full"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Browse All Projects
            </Button>
          </div>

          {/* Support Information */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">
              Having trouble with payment?
            </p>
            <Button
              variant="link"
              className="text-orange-600 hover:text-orange-700"
              onClick={() => router.push('/support')}
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

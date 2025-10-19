'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, User, Calendar, DollarSign, Code, ArrowLeft, Edit } from "lucide-react"

export default function AdminCustomRequests() {
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [updateData, setUpdateData] = useState({
    status: '',
    admin_notes: '',
    progress: 0
  })

  useEffect(() => {
    fetchCustomRequests()
  }, [])

  async function fetchCustomRequests() {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/admin/custom-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 403) {
        alert('Access denied. Admin role required.')
        router.push('/')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching custom requests:', error)
      alert('Failed to load custom requests')
    } finally {
      setLoading(false)
    }
  }

  async function updateRequest(requestId) {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/admin/custom-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update request')
      }

      alert('Request updated successfully!')
      setShowUpdateDialog(false)
      setSelectedRequest(null)
      fetchCustomRequests() // Refresh list
    } catch (error) {
      console.error('Error updating request:', error)
      alert(error.message || 'Failed to update request')
    }
  }

  function openUpdateDialog(request) {
    setSelectedRequest(request)
    setUpdateData({
      status: request.status,
      admin_notes: request.admin_notes || '',
      progress: request.progress || 0
    })
    setShowUpdateDialog(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_review: requests.filter(r => r.status === 'in_review').length,
    assigned: requests.filter(r => r.status === 'assigned').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/admin')}
              className="mb-4 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Panel
            </Button>
            <h1 className="text-3xl font-bold text-white">Custom Project Requests</h1>
            <p className="text-gray-400 mt-2">Manage and track custom project requests</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-white">{statusCounts.all}</div>
              <p className="text-xs text-gray-400">Total Requests</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">{statusCounts.pending}</div>
              <p className="text-xs text-gray-400">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-500">{statusCounts.in_progress}</div>
              <p className="text-xs text-gray-400">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{statusCounts.completed}</div>
              <p className="text-xs text-gray-400">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">All Custom Requests</CardTitle>
            <CardDescription className="text-gray-400">
              View and manage custom project requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress ({statusCounts.in_progress})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <RequestsList
                  requests={requests}
                  onUpdate={openUpdateDialog}
                />
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <RequestsList
                  requests={requests.filter(r => r.status === 'pending')}
                  onUpdate={openUpdateDialog}
                />
              </TabsContent>

              <TabsContent value="in_progress" className="mt-6">
                <RequestsList
                  requests={requests.filter(r => r.status === 'in_progress' || r.status === 'assigned' || r.status === 'in_review')}
                  onUpdate={openUpdateDialog}
                />
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <RequestsList
                  requests={requests.filter(r => r.status === 'completed')}
                  onUpdate={openUpdateDialog}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Update Request: {selectedRequest?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the status and details of this custom request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Status</label>
              <Select
                value={updateData.status}
                onValueChange={(value) => setUpdateData({...updateData, status: value})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="pending" className="text-white">Pending</SelectItem>
                  <SelectItem value="in_review" className="text-white">In Review</SelectItem>
                  <SelectItem value="assigned" className="text-white">Assigned</SelectItem>
                  <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                  <SelectItem value="completed" className="text-white">Completed</SelectItem>
                  <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={updateData.progress}
                onChange={(e) => setUpdateData({...updateData, progress: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Admin Notes</label>
              <Textarea
                value={updateData.admin_notes}
                onChange={(e) => setUpdateData({...updateData, admin_notes: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                rows={4}
                placeholder="Add internal notes about this request..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateRequest(selectedRequest?.id)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RequestsList({ requests, onUpdate }) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-400">No requests found</h3>
        <p className="mt-2 text-sm text-gray-500">
          No custom requests match this filter.
        </p>
      </div>
    )
  }

  const statusColors = {
    'pending': 'bg-yellow-900/50 text-yellow-400',
    'in_review': 'bg-blue-900/50 text-blue-400',
    'assigned': 'bg-purple-900/50 text-purple-400',
    'in_progress': 'bg-blue-900/50 text-blue-400',
    'completed': 'bg-green-900/50 text-green-400',
    'cancelled': 'bg-red-900/50 text-red-400'
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
        >
          {/* Header with Title and Status */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="text-lg font-semibold text-white truncate">{request.title}</h3>
                <Badge className={statusColors[request.status]}>
                  {request.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onUpdate(request)}
              className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              <Edit className="h-4 w-4 mr-1" />
              Update
            </Button>
          </div>

          {/* Description - with line clamp */}
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{request.description}</p>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{request.users?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{request.budget}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{new Date(request.deadline).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{request.category}</span>
            </div>
          </div>

          {/* Technologies */}
          {request.technologies && request.technologies.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">Technologies:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {request.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {request.progress > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span className="font-semibold">{request.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${request.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {request.admin_notes && (
            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
              <p className="text-xs text-gray-400 mb-1 font-semibold">Admin Notes:</p>
              <p className="text-sm text-gray-300 break-words">{request.admin_notes}</p>
            </div>
          )}

          {/* Footer - Timestamps */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-3 border-t border-gray-700">
            <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Updated: {new Date(request.updated_at).toLocaleDateString()}</span>
            {request.users?.email && (
              <>
                <span>•</span>
                <span className="truncate">Contact: {request.users.email}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

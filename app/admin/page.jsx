'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Eye, Users, Package, AlertTriangle, TrendingUp, FileText, ArrowRight } from "lucide-react"

export default function AdminPanel() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [customRequests, setCustomRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  async function fetchAdminData() {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        router.push('/login')
        return
      }

      // Fetch all pending projects for moderation
      const projectsRes = await fetch('/api/admin/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Check for unauthorized access
      if (projectsRes.status === 401 || projectsRes.status === 403) {
        alert('Access denied. Admin role required.')
        router.push('/')
        return
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
      }

      // Fetch admin stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Check for unauthorized access
      if (statsRes.status === 401 || statsRes.status === 403) {
        alert('Access denied. Admin role required.')
        router.push('/')
        return
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      // Fetch custom requests
      const customRequestsRes = await fetch('/api/admin/custom-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (customRequestsRes.ok) {
        const requestsData = await customRequestsRes.json()
        setCustomRequests(requestsData.requests || [])
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      alert('An error occurred. You may not have admin access.')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function updateProjectStatus(projectId, status, reason = '') {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, reason })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update project')
      }

      alert(`Project ${status} successfully!`)
      fetchAdminData() // Refresh data
    } catch (error) {
      console.error('Error updating project:', error)
      alert(error.message || 'Failed to update project')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-400 mt-2">Moderate projects and manage platform</p>
            </div>
            <Button
              onClick={() => router.push('/admin/custom-requests')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              View Custom Requests
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Projects
              </CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.total_projects || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Pending Review
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.pending_projects || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.total_users || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${stats?.total_revenue?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Custom Requests
              </CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {customRequests.length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {customRequests.filter(r => r.status === 'pending').length} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Moderation */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Project Moderation</CardTitle>
            <CardDescription className="text-gray-400">
              Review and moderate submitted projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                <ProjectsList
                  projects={projects.filter(p => p.status === 'pending')}
                  onUpdateStatus={updateProjectStatus}
                  status="pending"
                />
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <ProjectsList
                  projects={projects.filter(p => p.status === 'approved')}
                  onUpdateStatus={updateProjectStatus}
                  status="approved"
                />
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <ProjectsList
                  projects={projects.filter(p => p.status === 'rejected')}
                  onUpdateStatus={updateProjectStatus}
                  status="rejected"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Custom Requests Overview */}
        <Card className="bg-gray-900 border-gray-800 mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Custom Requests</CardTitle>
                <CardDescription className="text-gray-400">
                  Overview of custom project requests from clients
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/custom-requests')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CustomRequestsPreview requests={customRequests.slice(0, 5)} router={router} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProjectsList({ projects, onUpdateStatus, status }) {
  const router = useRouter()

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-400">No {status} projects</h3>
        <p className="mt-2 text-sm text-gray-500">
          There are currently no projects with {status} status.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                <Badge
                  variant={
                    project.status === 'approved'
                      ? 'success'
                      : project.status === 'pending'
                      ? 'warning'
                      : 'destructive'
                  }
                  className={`${
                    project.status === 'approved'
                      ? 'bg-green-900/50 text-green-400'
                      : project.status === 'pending'
                      ? 'bg-yellow-900/50 text-yellow-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}
                >
                  {project.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-400">
                  <span className="font-medium">Category:</span> {project.category}
                </p>
                <p className="text-sm text-gray-400">
                  <span className="font-medium">Price:</span> ${project.price}
                </p>
                <p className="text-sm text-gray-300">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.technologies.map((tech, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/projects/${project.id}`)}
                className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>

              {status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(project.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt('Reason for rejection:')
                      if (reason) {
                        onUpdateStatus(project.id, 'rejected', reason)
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}

              {status === 'rejected' && (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(project.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}

              {status === 'approved' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt('Reason for rejection:')
                    if (reason) {
                      onUpdateStatus(project.id, 'rejected', reason)
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              )}
            </div>
          </div>

          {project.rejection_reason && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded">
              <p className="text-sm text-red-400">
                <span className="font-medium">Rejection Reason:</span> {project.rejection_reason}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CustomRequestsPreview({ requests, router }) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-10 w-10 text-gray-600" />
        <h3 className="mt-3 text-sm font-medium text-gray-400">No custom requests</h3>
        <p className="mt-1 text-xs text-gray-500">
          Custom project requests will appear here
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
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors cursor-pointer"
          onClick={() => router.push('/admin/custom-requests')}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-white truncate">{request.title}</h4>
                <Badge className={statusColors[request.status]}>
                  {request.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 line-clamp-1 mb-2">{request.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{request.users?.name || 'Unknown'}</span>
                <span>•</span>
                <span>{request.budget}</span>
                <span>•</span>
                <span>{new Date(request.deadline).toLocaleDateString()}</span>
              </div>
            </div>
            {request.progress > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${request.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{request.progress}%</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

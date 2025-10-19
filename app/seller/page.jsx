'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Package, ShoppingCart, Star, Plus, TrendingUp } from "lucide-react"

export default function SellerDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSellerData()
  }, [])

  async function fetchSellerData() {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        router.push('/login')
        return
      }

      // Fetch seller stats
      const statsRes = await fetch('/api/seller/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats')
      }

      const statsData = await statsRes.json()
      setStats(statsData.stats)

      // Fetch seller projects
      const projectsRes = await fetch('/api/seller/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!projectsRes.ok) {
        throw new Error('Failed to fetch projects')
      }

      const projectsData = await projectsRes.json()
      setProjects(projectsData.projects)
    } catch (error) {
      console.error('Error fetching seller data:', error)
    } finally {
      setLoading(false)
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Seller Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage your projects and track your sales</p>
          </div>
          <Button
            onClick={() => router.push('/seller/projects/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${stats?.total_revenue?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Sales
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.total_sales || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Projects sold
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Projects
              </CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.total_projects || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Active listings
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Avg. Rating
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.avg_rating?.toFixed(1) || '0.0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Customer satisfaction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Your Projects</CardTitle>
            <CardDescription className="text-gray-400">
              Manage and track all your listed projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="all">All Projects</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <ProjectsList projects={projects} />
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <ProjectsList projects={projects.filter(p => p.status === 'approved')} />
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <ProjectsList projects={projects.filter(p => p.status === 'pending')} />
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <ProjectsList projects={projects.filter(p => p.status === 'rejected')} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProjectsList({ projects }) {
  const router = useRouter()

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-400">No projects found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Get started by creating your first project.
        </p>
        <Button
          onClick={() => router.push('/seller/projects/new')}
          className="mt-6 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-800">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Sales
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Rating
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-800/50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-white">{project.title}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-400">{project.category}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-white">${project.price}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-400">{project.total_purchases || 0}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-white">
                    {project.rating?.toFixed(1) || '0.0'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  project.status === 'approved'
                    ? 'bg-green-900/50 text-green-400'
                    : project.status === 'pending'
                    ? 'bg-yellow-900/50 text-yellow-400'
                    : 'bg-red-900/50 text-red-400'
                }`}>
                  {project.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

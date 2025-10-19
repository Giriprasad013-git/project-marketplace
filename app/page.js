'use client'
import { useState, useEffect, useCallback, memo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  ShoppingCart,
  Star,
  Search,
  Code,
  Smartphone,
  Bot,
  Zap,
  Database,
  Gamepad2,
  Filter,
  Download,
  Users,
  Shield,
  Rocket,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  Eye,
  CheckCircle,
  Play
} from 'lucide-react'

const categories = [
  { id: 'web', name: 'Web Development', icon: Code, color: 'bg-orange-500' },
  { id: 'mobile', name: 'Mobile Apps', icon: Smartphone, color: 'bg-coral-500' },
  { id: 'ai', name: 'AI & Machine Learning', icon: Bot, color: 'bg-peach-500' },
  { id: 'iot', name: 'IoT & Electronics', icon: Zap, color: 'bg-yellow-500' },
  { id: 'data', name: 'Data Science', icon: Database, color: 'bg-pink-500' },
  { id: 'game', name: 'Game Development', icon: Gamepad2, color: 'bg-purple-500' }
]

const sampleProjects = [
  {
    id: '1',
    title: 'E-Commerce Website with Admin Panel',
    category: 'web',
    description: 'Complete online store with user authentication, shopping cart, payment integration, and admin dashboard',
    price: 89,
    rating: 4.9,
    purchases: 234,
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
    featured: true
  },
  {
    id: '2',
    title: 'AI Chatbot with Natural Language Processing',
    category: 'ai',
    description: 'Smart chatbot using OpenAI GPT with conversation memory and sentiment analysis',
    price: 129,
    rating: 4.8,
    purchases: 189,
    technologies: ['Python', 'OpenAI', 'Flask', 'SQLite'],
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
    featured: true
  },
  {
    id: '3',
    title: 'IoT Home Automation System',
    category: 'iot',
    description: 'Smart home control system with sensors, mobile app, and web dashboard',
    price: 159,
    rating: 4.7,
    purchases: 156,
    technologies: ['Arduino', 'React Native', 'Firebase', 'C++'],
    thumbnail: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    featured: true
  },
  {
    id: '4',
    title: 'Data Analytics Dashboard',
    category: 'data',
    description: 'Interactive dashboard with real-time data visualization and predictive analytics',
    price: 99,
    rating: 4.6,
    purchases: 203,
    technologies: ['Python', 'Pandas', 'Plotly', 'Streamlit'],
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'
  },
  {
    id: '5',
    title: 'Mobile Banking App',
    category: 'mobile',
    description: 'Secure banking app with biometric authentication and transaction history',
    price: 179,
    rating: 4.9,
    purchases: 145,
    technologies: ['Flutter', 'Firebase', 'Dart', 'SQLite'],
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400'
  },
  {
    id: '6',
    title: '2D Puzzle Game',
    category: 'game',
    description: 'Engaging puzzle game with multiple levels, scoring system, and leaderboards',
    price: 69,
    rating: 4.5,
    purchases: 187,
    technologies: ['Unity', 'C#', 'Firebase', 'Photon'],
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400'
  }
]

// Component definitions at module level

const Navbar = ({ currentView, setCurrentView, user, logout, isMenuOpen, setIsMenuOpen }) => (
  <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-orange-100 sticky top-0 z-50">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('home')}
            className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent"
          >
            ProjectHub Academy
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Button
            variant={currentView === 'marketplace' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('marketplace')}
            className="text-orange-700 hover:text-orange-900"
          >
            Browse Projects
          </Button>
          <Button
            variant={currentView === 'custom-request' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('custom-request')}
            className="text-orange-700 hover:text-orange-900"
          >
            Request Custom
          </Button>

          {user ? (
            <div className="flex items-center space-x-4">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('dashboard')}
                className="text-orange-700 hover:text-orange-900"
              >
                <User className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={logout}
                className="text-orange-700 hover:text-orange-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('login')}
                className="text-orange-700 hover:text-orange-900"
              >
                Login
              </Button>
              <Button
                onClick={() => setCurrentView('signup')}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden py-4 border-t border-orange-100">
          <div className="flex flex-col space-y-2">
            <Button
              variant="ghost"
              onClick={() => {
                setCurrentView('marketplace')
                setIsMenuOpen(false)
              }}
              className="justify-start text-orange-700"
            >
              Browse Projects
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCurrentView('custom-request')
                setIsMenuOpen(false)
              }}
              className="justify-start text-orange-700"
            >
              Request Custom
            </Button>
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentView('dashboard')
                    setIsMenuOpen(false)
                  }}
                  className="justify-start text-orange-700"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout()
                    setIsMenuOpen(false)
                  }}
                  className="justify-start text-orange-700"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentView('login')
                    setIsMenuOpen(false)
                  }}
                  className="justify-start text-orange-700"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    setCurrentView('signup')
                    setIsMenuOpen(false)
                  }}
                  className="justify-start bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  </nav>
)

const HomePage = ({ setCurrentView, featuredProjects }) => (
  <div className="min-h-screen">
    {/* Hero Section */}
    <section className="relative py-20 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1712353704504-1db1f9e093db)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-yellow-500/20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
            Get Your Dream Academic Project
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-4 font-medium">
            Built or Ready
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            500+ Pre-Built Projects | Custom Projects in 7 Days | Quality Guaranteed
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => setCurrentView('marketplace')}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 text-lg px-8 py-4 h-14"
            >
              <Search className="mr-2 h-5 w-5" />
              Browse Projects
            </Button>
            <Button
              onClick={() => setCurrentView('custom-request')}
              size="lg"
              variant="outline"
              className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 text-lg px-8 py-4 h-14"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Request Custom Project
            </Button>
          </div>

          {/* Floating project previews */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {featuredProjects.slice(0, 3).map((project, index) => (
              <Card key={project.id} className="hover:scale-105 transition-transform duration-200 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                  <CardTitle className="text-sm text-gray-800">{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-600">${project.price}</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{project.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section className="py-16 bg-white/60 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Why Choose ProjectHub Academy?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-orange-50 to-pink-50">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-800">Fast Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                24hr for ready projects, custom projects completed in just 7 days
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-pink-50 to-yellow-50">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-800">Quality Guaranteed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                All projects tested and verified with complete documentation
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-800">Student Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                30-day support included with every project purchase
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* Categories Section */}
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Project Categories
        </h2>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.id}
                className="cursor-pointer hover:scale-105 transition-transform duration-200 border-0 shadow-lg bg-gradient-to-br from-white to-orange-50"
                onClick={() => {
                  setCurrentView('marketplace')
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto w-12 h-12 ${category.color} rounded-full flex items-center justify-center mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-800">{category.name}</h3>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="py-16 bg-white/60 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Browse or Request</h3>
            <p className="text-gray-600">
              Choose from 500+ ready projects or submit your custom requirements
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Make Payment</h3>
            <p className="text-gray-600">
              Secure payment through Stripe with full buyer protection
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Download & Build</h3>
            <p className="text-gray-600">
              Get complete source code, documentation, and video tutorials
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Student Testimonials */}
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          What Students Say
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Got my final year project in 2 days! The code quality is amazing and documentation helped me understand everything."
              </p>
              <div className="flex items-center">
                <Avatar className="mr-3">
                  <AvatarImage src="https://images.unsplash.com/photo-1649769155508-1b5971b6aa50" />
                  <AvatarFallback>RK</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">Rahul Kumar</p>
                  <p className="text-sm text-gray-500">Computer Science, IIT Delhi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-white">
            <CardContent className="p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Custom AI project was exactly what I needed. The team understood my requirements perfectly!"
              </p>
              <div className="flex items-center">
                <Avatar className="mr-3">
                  <AvatarImage src="https://images.unsplash.com/photo-1649767428212-7590dbf20116" />
                  <AvatarFallback>PS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">Priya Sharma</p>
                  <p className="text-sm text-gray-500">AI/ML, NIT Trichy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-white">
            <CardContent className="p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Affordable prices and excellent quality. Saved me months of development time!"
              </p>
              <div className="flex items-center">
                <Avatar className="mr-3">
                  <AvatarImage src="https://images.unsplash.com/photo-1649767662275-b1c8ff96cc28" />
                  <AvatarFallback>AM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">Arjun Mehta</p>
                  <p className="text-sm text-gray-500">Web Dev, BITS Pilani</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* CTA Section */}
    <section className="py-20 bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-500">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Start Your Project Today
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of students who have already built their dream projects with us
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => setCurrentView('marketplace')}
            size="lg"
            className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-4 h-14"
          >
            Browse Projects Now
          </Button>
          <Button
            onClick={() => setCurrentView('custom-request')}
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-orange-600 text-lg px-8 py-4 h-14"
          >
            Get Custom Quote
          </Button>
        </div>
      </div>
    </section>
  </div>
)

const MarketplacePage = ({
  searchQuery,
  handleSearchChange,
  selectedCategory,
  setSelectedCategory,
  filteredProjects,
  setSelectedProject,
  handlePurchase,
  selectedProject,
  setSearchQuery
}) => (
  <div className="py-8">
    <div className="container mx-auto px-4">
      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search projects, technologies..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-3 text-lg border-orange-200 focus:border-orange-500"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48 border-orange-200 focus:border-orange-500">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className="rounded-full"
          >
            All Categories
          </Button>
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className="rounded-full"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="relative">
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  className="w-full h-48 object-cover rounded-md"
                />
                {project.featured && (
                  <Badge className="absolute top-2 left-2 bg-orange-500">
                    Featured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  {categories.find(c => c.id === project.category)?.name}
                </Badge>
              </div>
              <CardTitle className="text-lg mb-2 text-gray-800">{project.title}</CardTitle>
              <CardDescription className="text-sm text-gray-600 mb-3">
                {project.description}
              </CardDescription>

              <div className="flex flex-wrap gap-1 mb-3">
                {project.technologies.slice(0, 3).map(tech => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {project.technologies.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{project.technologies.length - 3}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                  <span className="text-sm font-medium">{project.rating}</span>
                  <span className="text-sm text-gray-500 ml-2">({project.purchases} purchases)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">${project.price}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProject(project)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handlePurchase(project)}
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Buy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No projects found matching your criteria.</p>
          <Button
            onClick={() => {
              setSelectedCategory('all')
              setSearchQuery('')
            }}
            className="mt-4"
            variant="outline"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>

    {/* Project Detail Modal */}
    <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {selectedProject && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-800">{selectedProject.title}</DialogTitle>
              <DialogDescription>
                <Badge variant="outline" className="mb-2">
                  {categories.find(c => c.id === selectedProject.category)?.name}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedProject.thumbnail}
                  alt={selectedProject.title}
                  className="w-full h-64 object-cover rounded-md mb-4"
                />

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-800">Technologies Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.technologies.map(tech => (
                        <Badge key={tech} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-800">What's Included</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>✅ Complete source code</li>
                      <li>✅ Database setup files</li>
                      <li>✅ Documentation & setup guide</li>
                      <li>✅ Video tutorials</li>
                      <li>✅ 30-day support</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-orange-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-orange-600">${selectedProject.price}</span>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="ml-1 font-medium">{selectedProject.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{selectedProject.purchases} students have purchased this</p>

                  <Button
                    onClick={() => handlePurchase(selectedProject)}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-lg py-3"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Buy Now - Instant Download
                  </Button>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Project Description</h4>
                  <p className="text-gray-600 mb-4">{selectedProject.description}</p>

                  <h4 className="font-semibold mb-2 text-gray-800">Key Features</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• User authentication & authorization</li>
                    <li>• Responsive design for all devices</li>
                    <li>• Database integration & management</li>
                    <li>• API endpoints & documentation</li>
                    <li>• Error handling & validation</li>
                    <li>• Testing suite included</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  </div>
)

const CustomRequestPage = ({
  customRequest,
  handleTitleChange,
  handleCategoryChange,
  handleDescriptionChange,
  handleTechnologiesChange,
  handleBudgetChange,
  handleDeadlineChange,
  handleCustomRequest,
  user
}) => (
  <div className="py-8">
    <div className="container mx-auto px-4 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Request Custom Project</h1>
        <p className="text-gray-600">
          Tell us what you need, and we'll build your perfect academic project
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Project Requirements</CardTitle>
          <CardDescription>
            Please provide detailed information about your project needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCustomRequest} className="space-y-6">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={customRequest.title}
                onChange={handleTitleChange}
                placeholder="e.g., AI-powered Student Management System"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={customRequest.category}
                onValueChange={handleCategoryChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                value={customRequest.description}
                onChange={handleDescriptionChange}
                placeholder="Describe your project requirements, features needed, target audience, etc. (minimum 100 characters)"
                rows={5}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {customRequest.description.length} characters (minimum 100)
              </p>
            </div>

            <div>
              <Label htmlFor="technologies">Preferred Technologies</Label>
              <Input
                id="technologies"
                value={customRequest.technologies.join(', ')}
                onChange={handleTechnologiesChange}
                placeholder="e.g., React, Node.js, MongoDB, Python"
              />
              <p className="text-sm text-gray-500 mt-1">
                Separate technologies with commas
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget Range *</Label>
                <Select
                  value={customRequest.budget}
                  onValueChange={handleBudgetChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50-100">$50 - $100</SelectItem>
                    <SelectItem value="100-200">$100 - $200</SelectItem>
                    <SelectItem value="200-500">$200 - $500</SelectItem>
                    <SelectItem value="500+">$500+ (Contact for quote)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={customRequest.deadline}
                  onChange={handleDeadlineChange}
                  min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• We'll review your requirements within 24 hours</li>
                <li>• You'll receive a detailed proposal with timeline</li>
                <li>• Pay 30% deposit to start development</li>
                <li>• Get phase-wise delivery with review checkpoints</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-lg py-3"
              disabled={!user}
            >
              {user ? 'Submit Request' : 'Login to Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
)

const AuthPage = ({
  isLogin,
  loginForm,
  signupForm,
  handleLoginFormChange,
  handleSignupFormChange,
  handleLogin,
  handleSignup,
  setCurrentView
}) => (
  <div className="py-16">
    <div className="container mx-auto px-4 max-w-md">
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-800">
            {isLogin ? 'Welcome Back' : 'Join ProjectHub Academy'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={signupForm.name}
                  onChange={(e) => handleSignupFormChange('name', e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={isLogin ? loginForm.email : signupForm.email}
                onChange={isLogin
                  ? (e) => handleLoginFormChange('email', e.target.value)
                  : (e) => handleSignupFormChange('email', e.target.value)
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={isLogin ? loginForm.password : signupForm.password}
                onChange={isLogin
                  ? (e) => handleLoginFormChange('password', e.target.value)
                  : (e) => handleSignupFormChange('password', e.target.value)
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Button
              variant="link"
              onClick={() => setCurrentView(isLogin ? 'signup' : 'login')}
              className="text-orange-600"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

const DashboardPage = ({ user, customRequests }) => (
  <div className="py-8">
    <div className="container mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">Manage your projects and track your progress</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-500 rounded-full mr-4">
                <Download className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">5</p>
                <p className="text-gray-600">Total Purchases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-pink-500 rounded-full mr-4">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">2</p>
                <p className="text-gray-600">Active Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-500 rounded-full mr-4">
                <Download className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">3</p>
                <p className="text-gray-600">Ready Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchases" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="purchases">My Purchases</TabsTrigger>
          <TabsTrigger value="requests">Custom Requests</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-800">Recent Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleProjects.slice(0, 3).map(project => (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-800">{project.title}</h4>
                        <p className="text-sm text-gray-600">Purchased on Dec 15, 2024</p>
                        <p className="text-lg font-bold text-orange-600">${project.price}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-800">Custom Project Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {customRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Rocket className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No custom requests yet</p>
                  <Button
                    onClick={() => setCurrentView('custom-request')}
                    className="mt-4 bg-gradient-to-r from-orange-500 to-pink-500"
                  >
                    Request Custom Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customRequests.map((request) => {
                    const statusColors = {
                      'pending': { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-800' },
                      'in_review': { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', text: 'text-blue-800' },
                      'assigned': { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-500', text: 'text-purple-800' },
                      'in_progress': { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', text: 'text-blue-800' },
                      'completed': { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500', text: 'text-green-800' },
                      'cancelled': { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500', text: 'text-red-800' }
                    }
                    const colors = statusColors[request.status] || statusColors['pending']

                    return (
                      <div key={request.id} className={`p-4 ${colors.bg} border ${colors.border} rounded-lg`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{request.title}</h4>
                          <Badge className={colors.badge}>{request.status.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{request.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>Budget: {request.budget}</span>
                          <span>Deadline: {new Date(request.deadline).toLocaleDateString()}</span>
                        </div>
                        {request.technologies && request.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {request.technologies.map((tech, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white/50 rounded text-xs">{tech}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                        {request.progress > 0 && request.status !== 'completed' && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                              <div className={`${colors.badge.replace('bg-', 'bg-')} h-2 rounded-full`} style={{width: `${request.progress}%`}}></div>
                            </div>
                            <p className="text-xs text-gray-600">Progress: {request.progress}%</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-800">Available Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleProjects.slice(0, 2).map(project => (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-800">{project.title}</h4>
                        <p className="text-sm text-gray-600">Downloads remaining: 2/3</p>
                        <p className="text-xs text-gray-500">Files: Source code, Documentation, Database</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Download className="h-4 w-4 mr-1" />
                      Download All Files
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
)

// Main component
export default function ProjectHubAcademy() {
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [cart, setCart] = useState([])
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' })
  const [customRequests, setCustomRequests] = useState([])
  const [customRequest, setCustomRequest] = useState({
    title: '',
    category: '',
    description: '',
    technologies: [],
    budget: '',
    deadline: ''
  })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { toast } = useToast()

  const filteredProjects = sampleProjects.filter(project => {
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.technologies.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const featuredProjects = sampleProjects.filter(project => project.featured)

  // Optimized input handlers with useCallback
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleCustomRequestChange = useCallback((field, value) => {
    setCustomRequest(prev => ({...prev, [field]: value}))
  }, [])

  // Memoized handlers for custom request form
  const handleTitleChange = useCallback((e) => {
    setCustomRequest(prev => ({...prev, title: e.target.value}))
  }, [])

  const handleDescriptionChange = useCallback((e) => {
    setCustomRequest(prev => ({...prev, description: e.target.value}))
  }, [])

  const handleTechnologiesChange = useCallback((e) => {
    setCustomRequest(prev => ({...prev, technologies: e.target.value.split(', ').filter(t => t)}))
  }, [])

  const handleCategoryChange = useCallback((value) => {
    setCustomRequest(prev => ({...prev, category: value}))
  }, [])

  const handleBudgetChange = useCallback((value) => {
    setCustomRequest(prev => ({...prev, budget: value}))
  }, [])

  const handleDeadlineChange = useCallback((e) => {
    setCustomRequest(prev => ({...prev, deadline: e.target.value}))
  }, [])

  const handleLoginFormChange = useCallback((field, value) => {
    setLoginForm(prev => ({...prev, [field]: value}))
  }, [])

  const handleSignupFormChange = useCallback((field, value) => {
    setSignupForm(prev => ({...prev, [field]: value}))
  }, [])

  const fetchCustomRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCustomRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching custom requests:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
        localStorage.setItem('token', userData.token)
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        })
        setCurrentView('marketplace')
        // Fetch user's custom requests
        fetchCustomRequests()
      } else {
        const error = await response.json()
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
        localStorage.setItem('token', userData.token)
        toast({
          title: "Welcome to ProjectHub Academy!",
          description: "Your account has been created successfully.",
        })
        setCurrentView('marketplace')
        // Fetch user's custom requests
        fetchCustomRequests()
      } else {
        const error = await response.json()
        toast({
          title: "Signup failed",
          description: error.message || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePurchase = async (project) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to log in to purchase projects.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/payments/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: project.price,
          currency: 'usd',
          success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/payment/cancel`,
          metadata: {
            product_name: project.title,
            project_id: project.id,
            source: 'web_checkout',
            payment_type: 'one_time'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCustomRequest = async (e) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to log in to submit custom requests.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/projects/custom-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(customRequest)
      })

      if (response.ok) {
        toast({
          title: "Request submitted!",
          description: "We'll review your custom project request within 24 hours.",
        })
        setCustomRequest({
          title: '',
          category: '',
          description: '',
          technologies: [],
          budget: '',
          deadline: ''
        })
        setCurrentView('dashboard')
        // Refresh custom requests list
        fetchCustomRequests()
      } else {
        throw new Error('Failed to submit request')
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Unable to submit request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    setCurrentView('home')
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    })
  }

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // In a real app, you'd verify the token with the backend
      // For now, we'll just check if it exists
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          // Fetch custom requests when user is verified
          fetchCustomRequests()
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
    }
  }, [])

  // Fetch custom requests when dashboard view is opened
  useEffect(() => {
    if (user && currentView === 'dashboard') {
      fetchCustomRequests()
    }
  }, [currentView, user])

  return (
    <div className="min-h-screen">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        logout={logout}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      {currentView === 'home' && (
        <HomePage
          setCurrentView={setCurrentView}
          featuredProjects={featuredProjects}
        />
      )}
      {currentView === 'marketplace' && (
        <MarketplacePage
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filteredProjects={filteredProjects}
          setSelectedProject={setSelectedProject}
          handlePurchase={handlePurchase}
          selectedProject={selectedProject}
          setSearchQuery={setSearchQuery}
        />
      )}
      {currentView === 'custom-request' && (
        <CustomRequestPage
          customRequest={customRequest}
          handleTitleChange={handleTitleChange}
          handleCategoryChange={handleCategoryChange}
          handleDescriptionChange={handleDescriptionChange}
          handleTechnologiesChange={handleTechnologiesChange}
          handleBudgetChange={handleBudgetChange}
          handleDeadlineChange={handleDeadlineChange}
          handleCustomRequest={handleCustomRequest}
          user={user}
        />
      )}
      {currentView === 'login' && (
        <AuthPage
          isLogin={true}
          loginForm={loginForm}
          signupForm={signupForm}
          handleLoginFormChange={handleLoginFormChange}
          handleSignupFormChange={handleSignupFormChange}
          handleLogin={handleLogin}
          handleSignup={handleSignup}
          setCurrentView={setCurrentView}
        />
      )}
      {currentView === 'signup' && (
        <AuthPage
          isLogin={false}
          loginForm={loginForm}
          signupForm={signupForm}
          handleLoginFormChange={handleLoginFormChange}
          handleSignupFormChange={handleSignupFormChange}
          handleLogin={handleLogin}
          handleSignup={handleSignup}
          setCurrentView={setCurrentView}
        />
      )}
      {currentView === 'dashboard' && user && (
        <DashboardPage user={user} customRequests={customRequests} />
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Plus, X } from "lucide-react"
import FileUpload from "@/components/FileUpload"

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Blockchain',
  'Game Development',
  'UI/UX Design',
  'Database',
  'API Development',
  'Other'
]

export default function NewProject() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    detailed_description: '',
    price: '',
    technologies: [],
    features: [],
    requirements: [],
    thumbnail_url: '',
    demo_video_url: ''
  })
  const [techInput, setTechInput] = useState('')
  const [featureInput, setFeatureInput] = useState('')
  const [requirementInput, setRequirementInput] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project')
      }

      alert('Project submitted successfully! It will be reviewed by our team.')
      router.push('/seller')
    } catch (error) {
      console.error('Error creating project:', error)
      alert(error.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const addItem = (field, value, setInput) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
      setInput('')
    }
  }

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/seller')}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Create New Project</CardTitle>
            <CardDescription className="text-gray-400">
              Submit your project for review. Once approved, it will be available for purchase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>

                <div>
                  <Label htmlFor="title" className="text-gray-300">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="E.g., E-commerce Platform with React & Node.js"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-gray-300">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-300">Short Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="Brief description of your project (max 200 characters)"
                    rows={3}
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="detailed_description" className="text-gray-300">Detailed Description</Label>
                  <Textarea
                    id="detailed_description"
                    value={formData.detailed_description}
                    onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="Provide a detailed description of your project, its functionality, and use cases"
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-gray-300">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="19.99"
                    required
                  />
                </div>
              </div>

              {/* Technologies */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Technologies Used</h3>

                <div>
                  <Label htmlFor="technologies" className="text-gray-300">Add Technologies</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="technologies"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addItem('technologies', techInput, setTechInput)
                        }
                      }}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="E.g., React, Node.js, MongoDB"
                    />
                    <Button
                      type="button"
                      onClick={() => addItem('technologies', techInput, setTechInput)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.technologies.map((tech, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-sm"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeItem('technologies', index)}
                          className="hover:text-blue-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Features</h3>

                <div>
                  <Label htmlFor="features" className="text-gray-300">Add Features</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="features"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addItem('features', featureInput, setFeatureInput)
                        }
                      }}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="E.g., User authentication, Payment integration"
                    />
                    <Button
                      type="button"
                      onClick={() => addItem('features', featureInput, setFeatureInput)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ul className="space-y-2 mt-2">
                    {formData.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-gray-800 p-2 rounded text-gray-300"
                      >
                        <span>{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeItem('features', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Requirements</h3>

                <div>
                  <Label htmlFor="requirements" className="text-gray-300">Add Requirements</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="requirements"
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addItem('requirements', requirementInput, setRequirementInput)
                        }
                      }}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="E.g., Node.js v16+, MongoDB installed"
                    />
                    <Button
                      type="button"
                      onClick={() => addItem('requirements', requirementInput, setRequirementInput)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ul className="space-y-2 mt-2">
                    {formData.requirements.map((req, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-gray-800 p-2 rounded text-gray-300"
                      >
                        <span>{req}</span>
                        <button
                          type="button"
                          onClick={() => removeItem('requirements', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Media</h3>

                <div>
                  <Label htmlFor="thumbnail_url" className="text-gray-300">Thumbnail URL</Label>
                  <Input
                    id="thumbnail_url"
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended size: 800x600px
                  </p>
                </div>

                <div>
                  <Label htmlFor="demo_video_url" className="text-gray-300">Demo Video URL</Label>
                  <Input
                    id="demo_video_url"
                    type="url"
                    value={formData.demo_video_url}
                    onChange={(e) => setFormData({ ...formData, demo_video_url: e.target.value })}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    YouTube or Vimeo URL
                  </p>
                </div>
              </div>

              {/* Project Files */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Project Files</h3>
                <p className="text-sm text-gray-400">
                  Upload your project source code and documentation. Accepted formats: .zip, .rar, .tar.gz
                </p>

                <FileUpload
                  onUploadComplete={(files) => {
                    setUploadedFiles(prev => [...prev, ...files])
                  }}
                  accept=".zip,.rar,.tar.gz,.7z"
                  maxSize={50 * 1024 * 1024} // 50MB
                  bucket="project-files"
                  folder="projects"
                  multiple={true}
                />

                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Uploaded files:</p>
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-green-400">
                          <span>✓</span>
                          <span>{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit for Review
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/seller')}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

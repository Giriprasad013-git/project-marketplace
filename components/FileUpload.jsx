'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"

export default function FileUpload({
  onUploadComplete,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  bucket = "project-files",
  folder = "uploads",
  multiple = false,
  className = ""
}) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || [])

    // Validate file sizes
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`)
        return false
      }
      return true
    })

    setFiles(prev => multiple ? [...prev, ...validFiles] : validFiles)
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)

    const uploadedFiles = []
    const totalFiles = files.length

    try {
      const token = localStorage.getItem('token')

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', bucket)
        formData.append('folder', folder)

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Upload failed')
        }

        uploadedFiles.push(data.file)
        setProgress(((i + 1) / totalFiles) * 100)
      }

      // Call callback with uploaded files
      if (onUploadComplete) {
        onUploadComplete(multiple ? uploadedFiles : uploadedFiles[0])
      }

      // Clear files
      setFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      alert('Files uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload files')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <Upload className="mr-2 h-4 w-4" />
          Select Files
        </Button>

        {files.length > 0 && (
          <Button
            type="button"
            onClick={uploadFiles}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              `Upload ${files.length} file${files.length > 1 ? 's' : ''}`
            )}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploading && progress > 0 && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-400">Uploading... {Math.round(progress)}%</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Selected files:</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-white font-medium">{file.name}</p>
                    <p className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

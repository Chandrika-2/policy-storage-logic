"use client"

import React from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { useState, useRef } from "react"
import { Progress } from "@/components/ui/progress"

interface PendingFile {
  id: string
  file: File
  name: string
  status: "pending" | "uploading" | "done" | "error"
}

export default function UploadPage() {
  const { policyFiles, addPolicyFiles, removePolicyFile, clearAllPolicyFiles } =
    useAppStore()
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const processFiles = (files: FileList) => {
    const newPendingFiles: PendingFile[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Extract name without extension
      const name = file.name.replace(/\.[^/.]+$/, "")
      newPendingFiles.push({
        id: crypto.randomUUID(),
        file,
        name,
        status: "pending",
      })
    }
    setPendingFiles((prev) => [...prev, ...newPendingFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const updatePendingFileName = (id: string, newName: string) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
    )
  }

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleBulkUpload = async () => {
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    const filesToUpload: Array<{
      name: string
      fileName: string
      fileContent: string
    }> = []
    const totalFiles = pendingFiles.length

    for (let i = 0; i < pendingFiles.length; i++) {
      const pending = pendingFiles[i]

      // Update status to uploading
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === pending.id ? { ...f, status: "uploading" } : f))
      )

      try {
        const fileContent = await fileToBase64(pending.file)
        filesToUpload.push({
          name: pending.name,
          fileName: pending.file.name,
          fileContent,
        })

        // Update status to done
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pending.id ? { ...f, status: "done" } : f))
        )
      } catch {
        // Update status to error
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pending.id ? { ...f, status: "error" } : f))
        )
      }

      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
    }

    // Add all successfully processed files to the store
    if (filesToUpload.length > 0) {
      addPolicyFiles(filesToUpload)
    }

    // Clear pending files after a short delay to show completion
    setTimeout(() => {
      setPendingFiles([])
      setIsUploading(false)
      setUploadProgress(0)
    }, 1500)
  }

  const clearPending = () => {
    setPendingFiles([])
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Upload Policy Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Bulk upload your policy and procedure documents
            </p>
          </header>

          <div className="space-y-6">
            {/* Bulk Upload Area */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Bulk Upload Policy Files
                </CardTitle>
                <CardDescription>
                  Select multiple Word documents (.docx) to upload at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Drag and drop multiple files or{" "}
                      <span className="text-primary underline">browse</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Supports .docx and .doc files - Select up to 40+ files at
                      once
                    </span>
                  </label>
                </div>

                {/* Pending Files List */}
                {pendingFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-card-foreground">
                        {pendingFiles.length} file
                        {pendingFiles.length !== 1 ? "s" : ""} ready to upload
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearPending}
                        disabled={isUploading}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Clear All
                      </Button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                      {pendingFiles.map((pending) => (
                        <div
                          key={pending.id}
                          className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            {pending.status === "pending" && (
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            )}
                            {pending.status === "uploading" && (
                              <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            )}
                            {pending.status === "done" && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {pending.status === "error" && (
                              <AlertCircle className="h-5 w-5 text-destructive" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Input
                              value={pending.name}
                              onChange={(e) =>
                                updatePendingFileName(pending.id, e.target.value)
                              }
                              disabled={isUploading}
                              className="h-8 text-sm bg-input border-border text-foreground"
                              placeholder="Policy name"
                            />
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {pending.file.name}
                            </p>
                          </div>
                          {!isUploading && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePendingFile(pending.id)}
                              className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleBulkUpload}
                      disabled={
                        pendingFiles.length === 0 ||
                        isUploading ||
                        pendingFiles.some((f) => !f.name.trim())
                      }
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading {pendingFiles.length} files...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload {pendingFiles.length} Policy File
                          {pendingFiles.length !== 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Uploaded Files List */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">
                      Uploaded Policy Templates
                    </CardTitle>
                    <CardDescription>
                      {policyFiles.length}{" "}
                      {policyFiles.length === 1 ? "template" : "templates"} stored
                    </CardDescription>
                  </div>
                  {policyFiles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllPolicyFiles}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {policyFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No policy templates uploaded yet.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag and drop your files above to get started.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {policyFiles.map((policy, index) => (
                      <div
                        key={policy.id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-card-foreground font-medium truncate">
                              {policy.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {policy.fileName} - Added{" "}
                              {new Date(policy.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePolicyFile(policy.id)}
                          className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

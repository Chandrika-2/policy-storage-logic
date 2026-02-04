"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { ArrowLeft, FileDown, FileText, CheckCircle, AlertCircle, Building2, Loader2, Archive } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import Image from "next/image"
import { useState } from "react"
import JSZip from "jszip"

export default function GenerateDocumentsPage() {
  const params = useParams()
  const clientId = params.id as string
  const { policyFiles, clients } = useAppStore()
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const client = clients.find((c) => c.id === clientId)
  
  const selectedPolicyFiles = policyFiles.filter((p) =>
    client?.selectedPolicies.includes(p.id)
  )

  const handleGenerateSingle = async (policy: typeof policyFiles[0]) => {
    if (!client) return
    
    setGenerating(policy.id)
    setError(null)
    
    // Check if policy has file content
    if (!policy.fileContent) {
      setError(`Policy "${policy.name}" has no file content. Please re-upload this policy document.`)
      setGenerating(null)
      return
    }
    
    try {
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileContent: policy.fileContent,
          fileName: policy.fileName,
          companyName: client.companyName,
          logo: client.logo,
          headerText: client.headerText || client.companyName,
          footerCenterText: client.footerCenterText,
          footerRightText: client.footerRightText,
          originalCompanyName: "Aistra",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate document")
      }

      // Get the DOCX blob and download it
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${client.companyName.replace(/[^a-zA-Z0-9]/g, "_")}_${policy.name.replace(/[^a-zA-Z0-9]/g, "_")}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setGenerated((prev) => [...prev, policy.id])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate document")
    } finally {
      setGenerating(null)
    }
  }

  const handleGenerateAll = async () => {
    if (!client) return
    
    setGenerating("all")
    setError(null)
    
    const zip = new JSZip()
    const failedPolicies: string[] = []
    
    for (const policy of selectedPolicyFiles) {
      if (!policy.fileContent) {
        failedPolicies.push(policy.name)
        continue
      }
      
      try {
        const response = await fetch("/api/generate-document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileContent: policy.fileContent,
            fileName: policy.fileName,
            companyName: client.companyName,
            logo: client.logo,
            headerText: client.headerText || client.companyName,
            footerCenterText: client.footerCenterText,
            footerRightText: client.footerRightText,
            originalCompanyName: "Aistra",
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate document")
        }

        const blob = await response.blob()
        const fileName = `${policy.name.replace(/[^a-zA-Z0-9]/g, "_")}.docx`
        zip.file(fileName, blob)
        setGenerated((prev) => [...prev, policy.id])
      } catch (err) {
        failedPolicies.push(policy.name)
      }
    }
    
    if (failedPolicies.length > 0 && failedPolicies.length === selectedPolicyFiles.length) {
      setError(`Failed to generate all documents. Please check your policy files.`)
      setGenerating(null)
      return
    }
    
    if (failedPolicies.length > 0) {
      setError(`Some documents failed to generate: ${failedPolicies.join(", ")}`)
    }
    
    // Generate and download the ZIP file
    try {
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${client.companyName.replace(/[^a-zA-Z0-9\s]/g, "_")}_Policies.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError("Failed to create ZIP file")
    }
    
    setGenerating(null)
  }

  if (!client) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-muted-foreground">Client not found.</p>
            <Button asChild className="mt-4">
              <Link href="/clients">Back to Clients</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <Button
              asChild
              variant="ghost"
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Generate Documents</h1>
            <p className="text-muted-foreground mt-1">
              Generate customized policy documents for {client.companyName}
            </p>
          </header>

          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {client.logo ? (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-background border border-border">
                      <Image
                        src={client.logo || "/placeholder.svg"}
                        alt={`${client.companyName} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {client.companyName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPolicyFiles.length} policies selected
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Document Preview</CardTitle>
                <CardDescription>
                  Preview how your header and footer will appear in the DOCX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-border rounded-lg overflow-hidden bg-background">
                  {/* Header Preview */}
                  <div className="bg-muted/50 p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {client.logo ? (
                          <div className="relative h-10 w-10">
                            <Image
                              src={client.logo || "/placeholder.svg"}
                              alt="Logo"
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">Logo (Left)</span>
                      </div>
                      <span className="font-semibold text-card-foreground">
                        {client.headerText || client.companyName}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content Preview */}
                  <div className="p-8 min-h-[200px]">
                    <div className="text-muted-foreground text-center space-y-4">
                      <p className="font-medium">[Document Content from DOCX]</p>
                      <div className="text-xs bg-secondary/50 p-3 rounded-lg max-w-md mx-auto">
                        <p>All instances of <span className="font-mono bg-muted px-1 rounded">Aistra</span> will be replaced with <span className="font-mono bg-primary/20 px-1 rounded">{client.companyName}</span></p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer Preview */}
                  <div className="bg-muted/50 p-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Page 1</span>
                      <span>{client.footerCenterText}</span>
                      <span>{client.footerRightText}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="bg-destructive/10 border-destructive">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <span className="text-card-foreground">{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">Selected Policies</CardTitle>
                    <CardDescription>
                      {selectedPolicyFiles.length} documents to generate as DOCX
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateAll}
                    disabled={generating !== null || selectedPolicyFiles.length === 0}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {generating === "all" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating ZIP...
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-2" />
                        Generate All (ZIP)
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedPolicyFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No policies selected for this client.
                    </p>
                    <Button asChild variant="outline">
                      <Link href={`/clients/${clientId}`}>Edit Client Settings</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPolicyFiles.map((policy) => {
                      const isGenerated = generated.includes(policy.id)
                      const isGenerating = generating === policy.id || generating === "all"
                      return (
                        <div
                          key={policy.id}
                          className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isGenerated ? "bg-primary/20" : "bg-primary/10"}`}>
                              {isGenerating ? (
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                              ) : isGenerated ? (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              ) : (
                                <FileText className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <span className="text-card-foreground font-medium">
                                {policy.name}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {policy.fileName}
                                {!policy.fileContent && (
                                  <span className="text-destructive ml-2">(No file - re-upload needed)</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={isGenerated ? "default" : "outline"}
                            size="sm"
                            disabled={isGenerating || !policy.fileContent}
                            onClick={() => handleGenerateSingle(policy)}
                            className={isGenerated ? "bg-primary text-primary-foreground" : ""}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Generating...
                              </>
                            ) : isGenerated ? (
                              <>
                                <FileDown className="h-4 w-4 mr-1" />
                                Download Again
                              </>
                            ) : (
                              <>
                                <FileDown className="h-4 w-4 mr-1" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {generated.length > 0 && generated.length === selectedPolicyFiles.length && (
              <Card className="bg-primary/10 border-primary">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-card-foreground">
                      All documents have been generated and downloaded!
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

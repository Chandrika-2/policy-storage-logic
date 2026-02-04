"use client"

import React from "react"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppStore } from "@/lib/store"
import { Upload, ArrowLeft, Save, Building2 } from "lucide-react"
import Link from "next/link"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function NewClientPage() {
  const router = useRouter()
  const policyFiles = useAppStore((state) => state.policyFiles)
  const addClient = useAppStore((state) => state.addClient)
  const hasHydrated = useAppStore((state) => state._hasHydrated)
  const [companyName, setCompanyName] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [headerText, setHeaderText] = useState("")
  const [footerCenterText, setFooterCenterText] = useState("Company Internal")
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePolicyToggle = (policyId: string) => {
    setSelectedPolicies((prev) =>
      prev.includes(policyId)
        ? prev.filter((id) => id !== policyId)
        : [...prev, policyId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPolicies.length === policyFiles.length) {
      setSelectedPolicies([])
    } else {
      setSelectedPolicies(policyFiles.map((p) => p.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      addClient({
        companyName,
        logo,
        headerText: headerText || companyName,
        footerLeftText: "Page",
        footerCenterText,
        footerRightText: "Created by SecComply",
        selectedPolicies,
      })

      // Small delay to ensure state is persisted
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push("/clients")
    } catch (error) {
      console.error("[v0] Error creating client:", error)
      setIsSubmitting(false)
    }
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
            <h1 className="text-3xl font-bold text-foreground">Create New Client</h1>
            <p className="text-muted-foreground mt-1">
              Set up a new client with their branding and document preferences
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Company Details</CardTitle>
                <CardDescription>
                  Basic information about the client company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-card-foreground">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company-name"
                    placeholder="Enter company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-input border-border text-foreground"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will replace &quot;Aistra&quot; in all policy documents
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    {logo ? (
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-background border border-border">
                        <Image
                          src={logo || "/placeholder.svg"}
                          alt="Company logo preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-secondary flex items-center justify-center border border-border">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {logo ? "Change Logo" : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 2MB. Will appear in header left side.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Header & Footer Settings</CardTitle>
                <CardDescription>
                  Configure how the document header and footer will appear
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm font-medium text-card-foreground mb-2">Header Preview</p>
                  <div className="flex items-center justify-between p-3 bg-background rounded border border-border">
                    <div className="flex items-center gap-2">
                      {logo ? (
                        <div className="relative h-8 w-8">
                          <Image src={logo || "/placeholder.svg"} alt="Logo" fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">[Logo]</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {headerText || companyName || "[Company Name]"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header-text" className="text-card-foreground">
                    Header Text (Right Side)
                  </Label>
                  <Input
                    id="header-text"
                    placeholder={companyName || "Company name will be used by default"}
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm font-medium text-card-foreground mb-2">Footer Preview</p>
                  <div className="flex items-center justify-between p-3 bg-background rounded border border-border text-xs">
                    <span className="text-muted-foreground">Page 1</span>
                    <span className="text-muted-foreground">{footerCenterText}</span>
                    <span className="text-muted-foreground">Created by SecComply</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-center" className="text-card-foreground">
                    Footer Center Text
                  </Label>
                  <Input
                    id="footer-center"
                    placeholder="Company Internal"
                    value={footerCenterText}
                    onChange={(e) => setFooterCenterText(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">Select Policies</CardTitle>
                    <CardDescription>
                      Choose which policies to generate for this client
                    </CardDescription>
                  </div>
                  {policyFiles.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedPolicies.length === policyFiles.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {policyFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No policy files available. Upload some first.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/upload">Upload Policy Files</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {policyFiles.map((policy) => (
                      <label
                        key={policy.id}
                        className="flex items-center gap-3 p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
                      >
                        <Checkbox
                          checked={selectedPolicies.includes(policy.id)}
                          onCheckedChange={() => handlePolicyToggle(policy.id)}
                        />
                        <span className="text-card-foreground">{policy.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href="/clients">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={!companyName || isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Creating..." : "Create Client"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

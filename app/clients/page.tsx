"use client"

import React from "react"

import { useState, useRef } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAppStore } from "@/lib/store"
import { Users, Trash2, UserPlus, FileDown, Edit, Building2, X, ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ClientsPage() {
  const clients = useAppStore((state) => state.clients)
  const policyFiles = useAppStore((state) => state.policyFiles)
  const addClient = useAppStore((state) => state.addClient)
  const removeClient = useAppStore((state) => state.removeClient)
  const hasHydrated = useAppStore((state) => state._hasHydrated)

  const [isOpen, setIsOpen] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [headerText, setHeaderText] = useState("")
  const [footerCenterText, setFooterCenterText] = useState("Company Internal")
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setCompanyName("")
    setLogo(null)
    setHeaderText("")
    setFooterCenterText("Company Internal")
    setSelectedPolicies([])
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const togglePolicy = (policyId: string) => {
    setSelectedPolicies((prev) =>
      prev.includes(policyId)
        ? prev.filter((id) => id !== policyId)
        : [...prev, policyId]
    )
  }

  const selectAllPolicies = () => {
    if (selectedPolicies.length === policyFiles.length) {
      setSelectedPolicies([])
    } else {
      setSelectedPolicies(policyFiles.map((p) => p.id))
    }
  }

  const handleSubmit = async () => {
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

      await new Promise((resolve) => setTimeout(resolve, 100))
      resetForm()
      setIsOpen(false)
    } catch (error) {
      console.error("[v0] Error creating client:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-secondary rounded mb-4" />
              <div className="h-4 w-64 bg-secondary rounded" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Clients</h1>
              <p className="text-muted-foreground mt-1">
                Manage your clients and generate customized documents
              </p>
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">Create New Client</DialogTitle>
                  <DialogDescription>
                    Enter client details and select policies to generate
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-card-foreground">
                      Company Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      className="bg-input border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will replace &quot;Aistra&quot; in all documents
                    </p>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label className="text-card-foreground">Company Logo</Label>
                    <div className="flex items-start gap-4">
                      {logo ? (
                        <div className="relative">
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-secondary">
                            <Image src={logo || "/placeholder.svg"} alt="Company logo" fill className="object-contain" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setLogo(null)}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => logoInputRef.current?.click()}
                          className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        >
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1">Upload</span>
                        </div>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        Logo will appear on the left side of the header
                      </p>
                    </div>
                  </div>

                  {/* Header Text */}
                  <div className="space-y-2">
                    <Label htmlFor="headerText" className="text-card-foreground">
                      Header Text (Right Side)
                    </Label>
                    <Input
                      id="headerText"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder={companyName || "Company name will be used"}
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  {/* Footer Preview */}
                  <div className="space-y-2">
                    <Label className="text-card-foreground">Footer Configuration</Label>
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Page #</span>
                        <Input
                          value={footerCenterText}
                          onChange={(e) => setFooterCenterText(e.target.value)}
                          className="w-40 h-8 text-center bg-input border-border text-foreground"
                        />
                        <span className="text-muted-foreground">Created by SecComply</span>
                      </div>
                    </div>
                  </div>

                  {/* Policy Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-card-foreground">Select Policies & Procedures</Label>
                      {policyFiles.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={selectAllPolicies}
                          className="text-primary"
                        >
                          {selectedPolicies.length === policyFiles.length
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                      )}
                    </div>
                    {policyFiles.length === 0 ? (
                      <div className="p-4 bg-secondary rounded-lg text-center">
                        <p className="text-muted-foreground text-sm">
                          No policy files uploaded yet.
                        </p>
                        <Button
                          asChild
                          variant="link"
                          className="text-primary p-0 h-auto mt-1"
                        >
                          <Link href="/upload">Upload policies first</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                        {policyFiles.map((policy) => (
                          <label
                            key={policy.id}
                            className="flex items-center gap-3 p-3 hover:bg-secondary cursor-pointer border-b border-border last:border-0"
                          >
                            <Checkbox
                              checked={selectedPolicies.includes(policy.id)}
                              onCheckedChange={() => togglePolicy(policy.id)}
                            />
                            <span className="text-card-foreground">{policy.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {selectedPolicies.length} of {policyFiles.length} policies selected
                    </p>
                  </div>

                  {/* Header/Footer Preview */}
                  <div className="space-y-2">
                    <Label className="text-card-foreground">Document Preview</Label>
                    <div className="border border-border rounded-lg overflow-hidden">
                      {/* Header Preview */}
                      <div className="p-3 bg-secondary border-b border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {logo ? (
                              <div className="relative h-8 w-8">
                                <Image src={logo || "/placeholder.svg"} alt="Logo" fill className="object-contain" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">Logo</span>
                          </div>
                          <span className="text-sm font-medium text-card-foreground">
                            {headerText || companyName || "Company Name"}
                          </span>
                        </div>
                      </div>
                      {/* Content Area */}
                      <div className="h-24 bg-card flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">Document Content</span>
                      </div>
                      {/* Footer Preview */}
                      <div className="p-3 bg-secondary border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Page 1</span>
                          <span>{footerCenterText}</span>
                          <span>Created by SecComply</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!companyName || isSubmitting}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSubmitting ? "Creating..." : "Create Client"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </header>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">All Clients</CardTitle>
              <CardDescription>
                {clients.length} {clients.length === 1 ? "client" : "clients"} registered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No clients created yet.
                  </p>
                  <Button
                    onClick={() => setIsOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Your First Client
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {client.logo ? (
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-background">
                            <Image src={client.logo || "/placeholder.svg"} alt={`${client.companyName} logo`} fill className="object-contain" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="text-card-foreground font-medium text-lg">
                            {client.companyName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {client.selectedPolicies.length} policies selected
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                        >
                          <Link href={`/clients/${client.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Link href={`/clients/${client.id}/generate`}>
                            <FileDown className="h-4 w-4 mr-1" />
                            Generate
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeClient(client.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

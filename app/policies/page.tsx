"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { FileText, Trash2, Upload } from "lucide-react"
import Link from "next/link"

export default function PoliciesPage() {
  const { policyFiles, removePolicyFile } = useAppStore()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Policy Files</h1>
              <p className="text-muted-foreground mt-1">
                Manage your uploaded policy and procedure documents
              </p>
            </div>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload New
              </Link>
            </Button>
          </header>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">All Policy Files</CardTitle>
              <CardDescription>
                {policyFiles.length} {policyFiles.length === 1 ? "file" : "files"} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policyFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No policy files uploaded yet.
                  </p>
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your First File
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {policyFiles.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-card-foreground font-medium">{policy.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Added {new Date(policy.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePolicyFile(policy.id)}
                        className="text-muted-foreground hover:text-destructive"
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
      </main>
    </div>
  )
}

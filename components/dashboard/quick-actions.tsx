"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, UserPlus, FileDown } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Policy Files
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/clients/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Create Client
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/clients">
            <FileDown className="h-4 w-4 mr-2" />
            Generate Documents
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

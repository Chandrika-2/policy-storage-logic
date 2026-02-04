"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Download, CheckCircle } from "lucide-react"
import { useAppStore } from "@/lib/store"

export function StatsCards() {
  const { policyFiles, clients } = useAppStore()

  const stats = [
    {
      title: "Total Policies",
      value: policyFiles.length,
      icon: FileText,
      description: "Policy files uploaded",
    },
    {
      title: "Total Clients",
      value: clients.length,
      icon: Users,
      description: "Active clients",
    },
    {
      title: "Documents Generated",
      value: clients.reduce((acc, c) => acc + c.selectedPolicies.length, 0),
      icon: Download,
      description: "Documents processed",
    },
    {
      title: "Ready for Export",
      value: clients.filter((c) => c.selectedPolicies.length > 0).length,
      icon: CheckCircle,
      description: "Clients ready",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

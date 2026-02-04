"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import { FileText, User } from "lucide-react"

export function RecentActivity() {
  const { policyFiles, clients } = useAppStore()

  const activities = [
    ...policyFiles.map((p) => ({
      type: "policy" as const,
      name: p.name,
      date: new Date(p.uploadedAt),
    })),
    ...clients.map((c) => ({
      type: "client" as const,
      name: c.companyName,
      date: new Date(c.createdAt),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No recent activity. Start by uploading policy files or creating a client.
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                {activity.type === "policy" ? (
                  <FileText className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
                <span className="text-card-foreground flex-1">{activity.name}</span>
                <span className="text-muted-foreground text-xs">
                  {activity.date.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

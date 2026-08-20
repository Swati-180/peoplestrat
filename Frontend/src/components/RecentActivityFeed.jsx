import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mockActivities = [
  {
    id: "1",
    user: "Sarah Johnson",
    action: "uploaded",
    target: "15 CVs",
    timestamp: "2 hours ago",
    type: "upload",
  },
  {
    id: "2",
    user: "Mike Chen",
    action: "updated",
    target: "Employee profile",
    timestamp: "4 hours ago",
    type: "update",
  },
  {
    id: "3",
    user: "Admin",
    action: "generated",
    target: "Monthly report",
    timestamp: "5 hours ago",
    type: "create",
  },
  {
    id: "4",
    user: "Emma Wilson",
    action: "uploaded",
    target: "Activity data (CSV)",
    timestamp: "1 day ago",
    type: "upload",
  },
];

const typeColors = {
  upload: "secondary",
  update: "secondary",
  create: "secondary",
  delete: "destructive",
};

export function RecentActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {activity.user
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user}</span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activity.timestamp}
              </p>
            </div>

            <Badge variant={typeColors[activity.type]} className="text-xs">
              {activity.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

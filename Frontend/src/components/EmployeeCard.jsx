import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";

export function EmployeeCard({
  id,
  name,
  role,
  department,
  email,
  phone,
  fitmentScore,
  onViewDetails,
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover-elevate" data-testid={`card-employee-${id}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-base truncate"
              data-testid={`text-employee-name-${id}`}
            >
              {name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{role}</p>
            <Badge variant="secondary" className="mt-2 text-xs">
              {department}
            </Badge>
          </div>

          {fitmentScore !== undefined && (
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-primary">
                {fitmentScore}%
              </div>
              <p className="text-xs text-muted-foreground">Fitment</p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{email}</span>
          </div>

          {phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{phone}</span>
            </div>
          )}
        </div>

        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => onViewDetails(id)}
            data-testid={`button-view-details-${id}`}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

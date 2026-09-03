import React from 'react';
import { Badge } from "@/components/ui/badge";

export const StatusBadge = ({ status, type = 'risk' }) => {
  const normalized = String(status).toLowerCase();
  
  let variant = "secondary";
  let display = status;
  let icon = null;

  if (type === 'risk') {
    if (normalized === 'high') { variant = 'destructive'; icon = '🔴'; }
    else if (normalized === 'medium') { variant = 'warning'; icon = '🟡'; display = 'Medium'; }
    else if (normalized === 'low') { variant = 'success'; icon = '🟢'; }
  } else if (type === 'fitment') {
    if (normalized === 'fit' || normalized === 'strong') { variant = 'success'; }
    else if (normalized === 'train-to-fit' || normalized === 'stable') { variant = 'warning'; }
    else if (normalized === 'unfit' || normalized === 'critical') { variant = 'destructive'; }
  }

  // Custom colors for non-destructive Shadcn badges
  let className = "text-xs font-semibold px-2 py-0.5 whitespace-nowrap";
  if (variant === 'warning') className += " bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-transparent";
  if (variant === 'success') className += " bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent";

  return (
    <Badge variant={variant === 'warning' || variant === 'success' ? 'secondary' : variant} className={className}>
      {icon && <span className="mr-1">{icon}</span>}
      {display}
    </Badge>
  );
};

import React from "react";
import { KPICard } from "../KPICard";
import { Users } from "lucide-react";

export default function KPICardExample() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 p-6">
      <KPICard
        title="Total Employees"
        value={245}
        icon={Users}
        trend={{ value: 12, isPositive: true }}
      />
    </div>
  );
}

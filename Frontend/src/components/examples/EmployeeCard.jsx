import React from "react";
import { EmployeeCard } from "../EmployeeCard";

export default function EmployeeCardExample() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-6">
      <EmployeeCard
        id="1"
        name="Sarah Johnson"
        role="Senior Developer"
        department="Engineering"
        email="sarah.j@company.com"
        phone="+1 234 567 8900"
        fitmentScore={92}
        onViewDetails={(id) => console.log("View details:", id)}
      />
    </div>
  );
}

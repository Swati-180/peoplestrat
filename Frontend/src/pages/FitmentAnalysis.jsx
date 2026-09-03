import React, { useState, useMemo } from "react";
import { useWorkforceData } from "@/contexts/WorkforceContext";
import { PageHeader } from "@/components/manager/PageHeader";
import { KpiStrip } from "@/components/manager/KpiStrip";
import { CompactTable } from "@/components/manager/CompactTable";
import { InsightList } from "@/components/manager/InsightList";
import { StatusBadge } from "@/components/manager/StatusBadge";
import { Pagination } from "@/components/manager/Pagination";
import EmployeeDrawer from "@/components/EmployeeDrawer";
import { Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFitmentBand } from "@/data/mockEmployeeData";

export default function FitmentAnalysis() {
  const { employees, isLoading } = useWorkforceData();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fitmentMetrics = useMemo(() => {
    if (!employees || employees.length === 0) return { avgFitment: 0, unfitCount: 0, trainCount: 0, fitCount: 0, overfitCount: 0 };
    
    let sum = 0, unfit = 0, train = 0, fit = 0, overfit = 0;
    employees.forEach(e => {
      const score = e.scores?.fitment || e.fitmentScore || 0;
      sum += score;
      const band = getFitmentBand(score);
      if (band === 'Unfit') unfit++;
      else if (band === 'Train-to-Fit') train++;
      else if (band === 'Fit') fit++;
      else if (band === 'Overfit') overfit++;
    });

    return {
      avgFitment: Math.round(sum / employees.length),
      unfitCount: unfit,
      trainCount: train,
      fitCount: fit,
      overfitCount: overfit
    };
  }, [employees]);

  const kpis = [
    { label: "Avg Fitment Score", value: `${fitmentMetrics.avgFitment}%`, trend: 2 },
    { label: "Optimal Fit", value: fitmentMetrics.fitCount + fitmentMetrics.overfitCount, trend: 5 },
    { label: "Train-to-Fit", value: fitmentMetrics.trainCount },
    { label: "Critically Unfit", value: fitmentMetrics.unfitCount, trend: -1 }
  ];

  const insights = useMemo(() => {
    if (!employees) return [];
    
    return [
      {
        title: "Misaligned Talent",
        description: `${fitmentMetrics.unfitCount} employees show critical role misalignment. Consider internal mobility or immediate reskilling.`,
        badge: { text: 'High Risk', type: 'risk' }
      },
      {
        title: "Promotion Ready",
        description: `${fitmentMetrics.overfitCount} employees are over-indexed for their current roles. Evaluate for advancement.`,
        badge: { text: 'Opportunity', type: 'fitment' }
      }
    ];
  }, [employees, fitmentMetrics]);

  const tableData = useMemo(() => {
    if (!employees) return [];
    return employees.map(emp => {
      const score = emp.scores?.fitment || emp.fitmentScore || 0;
      const band = getFitmentBand(score);
      const prod = emp.scores?.productivity || emp.productivity || 0;
      
      return {
        id: emp._id || emp.id,
        employee: emp,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        fitmentScore: score,
        band: band,
        productivity: prod
      };
    }).sort((a, b) => a.fitmentScore - b.fitmentScore);
  }, [employees]);

  const pageSize = 15;
  const totalPages = Math.ceil(tableData.length / pageSize);
  const paginatedData = tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { header: "Employee", accessorKey: "name", className: "font-medium" },
    { header: "Role", accessorKey: "position", className: "text-gray-500" },
    { header: "Department", accessorKey: "department", className: "text-gray-500" },
    { 
      header: "Fitment Score", 
      accessorKey: "fitmentScore",
      cell: (row) => <span className="font-semibold">{row.fitmentScore}%</span>
    },
    { 
      header: "Status", 
      accessorKey: "band",
      cell: (row) => <StatusBadge status={row.band} type="fitment" />
    },
    { 
      header: "Productivity", 
      accessorKey: "productivity",
      cell: (row) => `${row.productivity}%`
    },
    { 
      header: "Action", 
      accessorKey: "action", 
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedEmployee(row.employee); }}>
          View &rarr;
        </Button>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      <PageHeader 
        title={
          <span className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" /> Fitment Analysis
          </span>
        }
        subtitle="Workforce optimization and role alignment insights"
      />

      <KpiStrip items={kpis} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Alignment Details</h3>
          <CompactTable 
            columns={columns} 
            data={paginatedData} 
            onRowClick={(row) => setSelectedEmployee(row.employee)}
          />
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={tableData.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
        <div className="lg:col-span-1">
          <InsightList title="Fitment Insights" insights={insights} />
        </div>
      </div>

      <EmployeeDrawer 
        employee={selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
        defaultTab="fitment"
      />
    </div>
  );
}

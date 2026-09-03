import React, { useState, useMemo } from "react";
import { useWorkforceData } from "@/contexts/WorkforceContext";
import { PageHeader } from "@/components/manager/PageHeader";
import { KpiStrip } from "@/components/manager/KpiStrip";
import { CompactTable } from "@/components/manager/CompactTable";
import { StatusBadge } from "@/components/manager/StatusBadge";
import { Pagination } from "@/components/manager/Pagination";
import EmployeeDrawer from "@/components/EmployeeDrawer";
import { Loader2, Activity, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function Fatigue() {
  const { employees, isLoading } = useWorkforceData();
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Basic filtering for employee view vs manager view
  const displayEmployees = useMemo(() => {
    if (!employees) return [];
    if (isEmployee) {
      return employees.filter(e => e._id === user.id || e.email === user.email);
    }
    return employees;
  }, [isEmployee, user, employees]);

  const fatigueMetrics = useMemo(() => {
    if (displayEmployees.length === 0) return { avgFatigue: 0, criticalCount: 0, highCount: 0, healthyCount: 0 };
    let sum = 0, critical = 0, high = 0, healthy = 0;
    
    displayEmployees.forEach(e => {
      const fatigue = e.scores?.fatigue || e.fatigueScore || 0;
      sum += fatigue;
      if (fatigue >= 75) critical++;
      else if (fatigue >= 50) high++;
      else healthy++;
    });
    
    return {
      avgFatigue: Math.round(sum / displayEmployees.length),
      criticalCount: critical,
      highCount: high,
      healthyCount: healthy
    };
  }, [displayEmployees]);

  const kpis = [
    { label: "Critical Risk", value: fatigueMetrics.criticalCount, trend: 2 },
    { label: "High Risk", value: fatigueMetrics.highCount, trend: -1 },
    { label: "Healthy", value: fatigueMetrics.healthyCount },
    { label: "Average Fatigue", value: `${fatigueMetrics.avgFatigue}%` }
  ];

  const tableData = displayEmployees.map(emp => {
    const fatigueScore = emp.scores?.fatigue || emp.fatigueScore || 0;
    const utilization = emp.scores?.utilization || emp.utilization || 0;
    let riskLevel = 'Low';
    if (fatigueScore >= 75) riskLevel = 'High';
    else if (fatigueScore >= 50) riskLevel = 'Medium';
    
    return {
      id: emp._id || emp.id,
      employee: emp,
      name: emp.name,
      department: emp.department,
      utilization: utilization,
      fatigueScore: fatigueScore,
      riskLevel: riskLevel,
      trend: fatigueScore > 70 ? 'Increasing' : 'Stable'
    };
  }).sort((a, b) => b.fatigueScore - a.fatigueScore);

  const pageSize = 15;
  const totalPages = Math.ceil(tableData.length / pageSize);
  const paginatedData = tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { header: "Employee", accessorKey: "name", className: "font-medium" },
    { header: "Department", accessorKey: "department", className: "text-gray-500" },
    { 
      header: "Work Intensity (Utilization)", 
      accessorKey: "utilization", 
      cell: (row) => `${row.utilization}%`
    },
    { 
      header: "Fatigue Score", 
      accessorKey: "fatigueScore",
      cell: (row) => <span className="font-semibold">{row.fatigueScore}%</span>
    },
    { 
      header: "Risk", 
      accessorKey: "riskLevel",
      cell: (row) => <StatusBadge status={row.riskLevel} />
    },
    { 
      header: "Trend", 
      accessorKey: "trend",
      cell: (row) => (
        <span className={row.trend === 'Increasing' ? 'text-orange-500' : 'text-gray-500'}>
          {row.trend}
        </span>
      )
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
            <HeartPulse className="w-8 h-8 text-orange-500" /> Fatigue Analysis
          </span>
        }
        subtitle="Strategic workforce health and recovery monitoring"
      />

      <KpiStrip items={kpis} />

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Fatigue Risk Matrix</h3>
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

      <EmployeeDrawer 
        employee={selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
        defaultTab="fatigue"
        contextData={{
          fatigue: {
            workloadIntensity: selectedEmployee?.scores?.utilization > 90 ? 'High' : 'Normal',
            overtimeIndex: selectedEmployee?.scores?.fatigue > 75 ? 'Frequent' : 'Normal'
          }
        }}
      />
    </div>
  );
}

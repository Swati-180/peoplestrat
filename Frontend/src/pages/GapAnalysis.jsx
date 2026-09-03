import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/manager/PageHeader";
import { KpiStrip } from "@/components/manager/KpiStrip";
import { CompactTable } from "@/components/manager/CompactTable";
import { InsightList } from "@/components/manager/InsightList";
import { StatusBadge } from "@/components/manager/StatusBadge";
import { Pagination } from "@/components/manager/Pagination";
import EmployeeDrawer from "@/components/EmployeeDrawer";
import { Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function GapAnalysis() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [gapData, setGapData] = useState({ employeesWithGaps: [], summary: { topGaps: [], severityDistribution: [] } });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadGaps = async () => {
      try {
        const response = await api.get("/analysis/gaps");
        if (response.data.success) {
          setGapData(response.data);
        }
      } catch (error) {
        toast({ title: "Error", description: "Could not load gap analysis data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadGaps();
  }, [toast]);

  const kpis = useMemo(() => {
    const high = gapData.summary.severityDistribution.find(d => d.name === 'High')?.value || 0;
    const medium = gapData.summary.severityDistribution.find(d => d.name === 'Medium')?.value || 0;
    const low = gapData.summary.severityDistribution.find(d => d.name === 'Low')?.value || 0;
    
    return [
      { label: "Total Gap Profiles", value: gapData.employeesWithGaps.length },
      { label: "High Severity", value: high, trend: 2 },
      { label: "Medium Severity", value: medium, trend: -1 },
      { label: "Low Severity", value: low }
    ];
  }, [gapData]);

  const insights = useMemo(() => {
    const topGaps = gapData.summary.topGaps.slice(0, 2);
    return topGaps.map(g => ({
      title: "Critical Gap Identified",
      description: `${g.name} has ${g.gaps} identified skill/performance gaps. Requires immediate intervention.`,
      badge: { text: 'Action Required', type: 'risk' }
    }));
  }, [gapData]);

  const columns = [
    { header: "Employee", accessorKey: "name", className: "font-medium" },
    { header: "Role", accessorKey: "position", className: "text-gray-500" },
    { header: "Department", accessorKey: "department", className: "text-gray-500" },
    { 
      header: "Gap Count", 
      accessorKey: "gapCount",
      cell: (row) => <span className="font-semibold">{row.gapCount}</span>
    },
    { 
      header: "Severity", 
      accessorKey: "severity",
      cell: (row) => <StatusBadge status={row.severity} type="risk" />
    },
    { 
      header: "Fitment Score", 
      accessorKey: "fitmentScore",
      cell: (row) => `${row.fitmentScore}%`
    },
    { 
      header: "Action", 
      accessorKey: "action", 
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedEmployee(row); }}>
          View &rarr;
        </Button>
      )
    }
  ];

  const pageSize = 15;
  const totalRecords = gapData.employeesWithGaps.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedData = gapData.employeesWithGaps.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            <Wrench className="w-8 h-8 text-amber-500" /> Gap Analysis
          </span>
        }
        subtitle="Skill, performance & development gaps across the workforce"
      />

      <KpiStrip items={kpis} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Gap Overview</h3>
          <CompactTable 
            columns={columns} 
            data={paginatedData} 
            onRowClick={(row) => setSelectedEmployee(row)}
          />
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
        <div className="lg:col-span-1">
          <InsightList title="Top Priorities" insights={insights} />
        </div>
      </div>

      <EmployeeDrawer 
        employee={selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
        defaultTab="skills"
      />
    </div>
  );
}

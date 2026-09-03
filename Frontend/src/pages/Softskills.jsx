import React, { useState, useMemo } from "react";
import { useWorkforceData } from "@/contexts/WorkforceContext";
import { PageHeader } from "@/components/manager/PageHeader";
import { KpiStrip } from "@/components/manager/KpiStrip";
import { CompactTable } from "@/components/manager/CompactTable";
import { InsightList } from "@/components/manager/InsightList";
import { Pagination } from "@/components/manager/Pagination";
import EmployeeDrawer from "@/components/EmployeeDrawer";
import { Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Softskills() {
  const { employees, isLoading } = useWorkforceData();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const calculateTraits = (emps) => {
    if (!emps || emps.length === 0) return { communication: 0, leadership: 0, resilience: 0, adaptability: 0 };
    let comm = 0, lead = 0, res = 0, adapt = 0;
    
    emps.forEach(e => {
      const skill = e.fitmentScore || e.scores?.fitment || 60;
      const aptitude = e.productivity || e.scores?.productivity || 60;
      const fatigue = e.fatigueScore || e.scores?.fatigue || 0;
      
      comm += skill;
      lead += aptitude;
      res += (100 - fatigue);
      adapt += (skill + aptitude) / 2;
    });

    const total = emps.length;
    return {
      communication: Math.round(comm / total),
      leadership: Math.round(lead / total),
      resilience: Math.round(res / total),
      adaptability: Math.round(adapt / total)
    };
  };

  const traitScores = useMemo(() => calculateTraits(employees), [employees]);

  const kpis = [
    { label: "Communication", value: `${traitScores.communication}%`, trend: 2 },
    { label: "Leadership", value: `${traitScores.leadership}%`, trend: 1 },
    { label: "Resilience", value: `${traitScores.resilience}%`, trend: -3 },
    { label: "Adaptability", value: `${traitScores.adaptability}%` }
  ];

  const insights = useMemo(() => {
    if (!employees) return [];
    const lowLeadership = employees.filter(e => (e.productivity || e.scores?.productivity || 0) < 65).length;
    const lowResilience = employees.filter(e => (e.fatigueScore || e.scores?.fatigue || 0) > 75).length;

    return [
      {
        title: "Leadership Gap",
        description: `${lowLeadership} employees are showing lagging leadership and aptitude indicators. Mentorship recommended.`,
        badge: { text: 'Medium', type: 'fitment' }
      },
      {
        title: "Resilience Warning",
        description: `${lowResilience} employees are showing low stress resilience and high fatigue. Intervention required.`,
        badge: { text: 'High', type: 'risk' }
      }
    ];
  }, [employees]);

  const tableData = useMemo(() => {
    if (!employees) return [];
    return employees.map(emp => {
      const comm = emp.fitmentScore || emp.scores?.fitment || 0;
      const lead = emp.productivity || emp.scores?.productivity || 0;
      const res = 100 - (emp.fatigueScore || emp.scores?.fatigue || 0);
      const adapt = Math.round((comm + lead) / 2);
      
      return {
        id: emp._id || emp.id,
        employee: emp,
        name: emp.name,
        department: emp.department,
        communication: comm,
        leadership: lead,
        resilience: res,
        adaptability: adapt
      };
    });
  }, [employees]);

  const pageSize = 15;
  const totalPages = Math.ceil(tableData.length / pageSize);
  const paginatedData = tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { header: "Employee", accessorKey: "name", className: "font-medium" },
    { header: "Department", accessorKey: "department", className: "text-gray-500" },
    { 
      header: "Comm.", 
      accessorKey: "communication",
      cell: (row) => <span className={`font-semibold ${row.communication < 70 ? 'text-orange-500' : 'text-green-600'}`}>{row.communication}</span>
    },
    { 
      header: "Leadership", 
      accessorKey: "leadership",
      cell: (row) => <span className={`font-semibold ${row.leadership < 70 ? 'text-orange-500' : 'text-green-600'}`}>{row.leadership}</span>
    },
    { 
      header: "Resilience", 
      accessorKey: "resilience",
      cell: (row) => <span className={`font-semibold ${row.resilience < 60 ? 'text-red-500' : 'text-green-600'}`}>{row.resilience}</span>
    },
    { 
      header: "Adaptability", 
      accessorKey: "adaptability",
      cell: (row) => <span className="font-semibold">{row.adaptability}</span>
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
            <Brain className="w-8 h-8 text-purple-600" /> Soft Skills Intelligence
          </span>
        }
        subtitle="Behavioral assessment and cognitive performance analytics"
      />

      <KpiStrip items={kpis} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavioral Assessment Overview</h3>
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
          <InsightList title="Behavioral Insights" insights={insights} />
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

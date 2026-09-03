import React, { useState, useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, predictFlightRisk, getFlightRisk } from "@/services/api";
import { useWorkforceData } from "@/contexts/WorkforceContext";
import { PageHeader } from "@/components/manager/PageHeader";
import { KpiStrip } from "@/components/manager/KpiStrip";
import { CompactTable } from "@/components/manager/CompactTable";
import { StatusBadge } from "@/components/manager/StatusBadge";
import { InsightList } from "@/components/manager/InsightList";
import { Pagination } from "@/components/manager/Pagination";
import EmployeeDrawer from "@/components/EmployeeDrawer";
import { Button } from "@/components/ui/button";

export default function FlightRisk() {
  const { toast } = useToast();
  const { employees, isLoading: empLoading } = useWorkforceData();
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const riskRes = await api.get('/analysis/results', { params: { limit: 1000 } });
        
        if (riskRes.data.success) {
          const riskMapping = {};
          riskRes.data.data.forEach(result => {
            if (result.employee_id && (result.employee_id._id || result.employee_id) && result.flightRiskScore !== undefined) {
              const empId = result.employee_id._id || result.employee_id;
              let riskLevel = 'Low';
              if (result.flightRiskScore >= 40 && result.flightRiskScore <= 69) riskLevel = 'Medium';
              if (result.flightRiskScore >= 70) riskLevel = 'High';
              
              riskMapping[empId] = {
                success: true,
                employeeId: empId,
                flightRiskScore: result.flightRiskScore,
                riskLevel,
                flightRiskFactors: result.flightRiskFactors || [],
                actionItems: (result.actionItems || []).filter(item => item.action && item.action.startsWith('[Flight Risk]')),
                lastCalculated: result.updatedAt
              };
            }
          });
          setRiskData(riskMapping);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load flight risk analysis", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, [toast]);

  // Transform Data for Table
  const tableData = employees?.map(emp => {
    const empIdStr = emp.id || emp._id;
    const risk = riskData[empIdStr];
    
    return {
      id: empIdStr,
      employee: emp,
      name: emp.name,
      role: emp.position,
      riskScore: risk ? risk.flightRiskScore : 0,
      riskLevel: risk ? risk.riskLevel : 'Low',
      keyDriver: risk?.flightRiskFactors?.[0] || 'Unknown',
      hasData: !!risk
    };
  }).sort((a, b) => b.riskScore - a.riskScore) || [];

  const pageSize = 15;
  const totalPages = Math.ceil(tableData.length / pageSize);
  const paginatedData = tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // KPIs
  const highRiskCount = tableData.filter(d => d.riskLevel === 'High').length;
  const mediumRiskCount = tableData.filter(d => d.riskLevel === 'Medium').length;
  const lowRiskCount = tableData.filter(d => d.riskLevel === 'Low').length;
  const attentionCount = highRiskCount + (mediumRiskCount > 0 ? Math.floor(mediumRiskCount / 2) : 0);

  const kpis = [
    { label: "High Risk", value: highRiskCount },
    { label: "Medium Risk", value: mediumRiskCount },
    { label: "Low Risk", value: lowRiskCount },
    { label: "Attention Required", value: attentionCount }
  ];

  const insights = tableData.filter(d => d.riskLevel === 'High').slice(0, 5).map(d => ({
    title: d.name,
    badge: { text: 'High', type: 'risk' },
    description: `Key Driver: ${d.keyDriver}. Immediate check-in recommended.`,
    actionPayload: d.employee
  }));

  const columns = [
    { header: "Employee", accessorKey: "name", className: "font-medium" },
    { header: "Role", accessorKey: "role", className: "text-gray-500" },
    { 
      header: "Risk Score", 
      accessorKey: "riskScore", 
      cell: (row) => row.hasData ? `${row.riskScore}%` : 'N/A'
    },
    { 
      header: "Risk Level", 
      accessorKey: "riskLevel",
      cell: (row) => row.hasData ? <StatusBadge status={row.riskLevel} /> : <span className="text-gray-400">N/A</span>
    },
    { 
      header: "Key Driver", 
      accessorKey: "keyDriver",
      cell: (row) => row.hasData ? <span className="truncate max-w-[200px] inline-block">{row.keyDriver}</span> : '-'
    },
    { 
      header: "Action", 
      accessorKey: "id", 
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedEmployee(row.employee); }}>
          View &rarr;
        </Button>
      )
    }
  ];

  const handleBatchRecalculate = async () => {
    setIsRecalculating(true);
    try {
      toast({ title: "Started", description: "Batch re-calculation initiated. This may take a few moments." });
      await api.post('/analysis/predict-flight-risk-batch');
      toast({ title: "Complete", description: "Flight risk data has been re-analyzed. Refreshing..." });
      window.location.reload();
    } catch (error) {
      toast({ title: "Error", description: "Failed to recalculate.", variant: "destructive" });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      <PageHeader 
        title={
          <span className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" /> Flight Risk Intelligence
          </span>
        }
        subtitle="Identify retention risks early and explore AI-recommended interventions."
        action={
          <Button onClick={handleBatchRecalculate} disabled={isRecalculating || loading || empLoading} variant="outline">
            {isRecalculating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Recalculate All
          </Button>
        }
      />

      {(loading || empLoading) ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#6D8196]" /></div>
      ) : (
        <>
          <KpiStrip items={kpis} />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution Table</h3>
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
              <InsightList 
                title="Attention Required" 
                insights={insights}
                onActionClick={(emp) => setSelectedEmployee(emp)}
              />
            </div>
          </div>
        </>
      )}

      {selectedEmployee && (
        <EmployeeDrawer 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
          defaultTab="flight_risk"
          contextData={{ risk: riskData[selectedEmployee.id || selectedEmployee._id] }}
        />
      )}
    </div>
  );
}

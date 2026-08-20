import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, UserMinus, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFlightRisk, predictFlightRisk, api } from "@/services/api";

export default function FlightRisk() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState({});
  const [analyzingIds, setAnalyzingIds] = useState({});

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
        // Attempt to fetch cached risk for all
        res.data.data.forEach(emp => fetchRiskSilently(emp._id));
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load employees for flight risk analysis", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskSilently = async (empId) => {
    try {
      const res = await getFlightRisk(empId);
      if (res.data.success) {
        setRiskData(prev => ({ ...prev, [empId]: res.data }));
      }
    } catch (e) {
      // Ignore if not calculated yet
    }
  };

  const handlePredict = async (employeeId) => {
    setAnalyzingIds(prev => ({ ...prev, [employeeId]: true }));
    try {
      const res = await predictFlightRisk(employeeId);
      if (res.data.success) {
        // Now fetch it
        const riskRes = await getFlightRisk(employeeId);
        if (riskRes.data.success) {
          setRiskData(prev => ({ ...prev, [employeeId]: riskRes.data }));
          toast({ title: "Analysis Complete", description: "Flight risk factors updated." });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Flight risk prediction failed.", variant: "destructive" });
    } finally {
      setAnalyzingIds(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const getRiskColor = (level) => {
    if (level === 'High') return 'bg-red-100 text-red-800 border-red-200';
    if (level === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (level === 'Low') return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#1A232C] flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500" /> Flight Risk Intelligence
        </h1>
        <p className="text-[#6D8196] mt-2">Identify retention risks early and explore AI-recommended interventions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#6D8196]" /></div>
        ) : employees.length > 0 ? (
          employees.map(emp => {
            const risk = riskData[emp._id];
            const isAnalyzing = analyzingIds[emp._id];

            return (
              <Card key={emp._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{emp.name}</CardTitle>
                      <p className="text-sm text-gray-500">{emp.position}</p>
                    </div>
                    {risk && (
                      <Badge variant="outline" className={getRiskColor(risk.riskLevel)}>
                        {risk.riskLevel} Risk ({risk.flightRiskScore}%)
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {risk ? (
                    <div className="space-y-4">
                      {risk.flightRiskFactors?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Key Risk Factors</p>
                          <ul className="text-sm space-y-1">
                            {risk.flightRiskFactors.slice(0, 3).map((factor, i) => (
                              <li key={i} className="flex items-start gap-2 text-gray-700">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => handlePredict(emp._id)} 
                        disabled={isAnalyzing}
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                      >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Re-Analyze Risk
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <UserMinus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 mb-4">No recent flight risk data available.</p>
                      <Button 
                        onClick={() => handlePredict(emp._id)} 
                        disabled={isAnalyzing}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Run AI Risk Analysis"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-[#64748B]">No employees found.</div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/manager/Pagination";
import { Loader2, Users, Star, ArrowRight, UserPlus, BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchCriticalRoles, fetchSuccessionPlan, predictSuccessors } from "@/services/api";

export default function SuccessionPlanning() {
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await fetchCriticalRoles();
      if (res.data.success) {
        setRoles(res.data.roles);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load critical roles", variant: "destructive" });
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadPlan = async (roleId) => {
    setLoadingPlan(true);
    setSelectedRole(roleId);
    try {
      const res = await fetchSuccessionPlan(roleId);
      if (res.data.success) {
        setPlan(res.data.plan);
        setCurrentPage(1);
      }
    } catch (error) {
      setPlan({ candidates: [] }); // No plan exists yet
    } finally {
      setLoadingPlan(false);
    }
  };

  const handlePredict = async () => {
    if (!selectedRole) return;
    setPredicting(true);
    try {
      const res = await predictSuccessors(selectedRole);
      if (res.data.success) {
        setPlan({ candidates: res.data.candidates.map(c => ({
          employeeId: { name: c.name, position: c.position },
          readinessTimeframe: c.timeframe,
          source: 'AI Recommended',
          rationale: c.rationale,
          score: c.readinessScore
        }))});
        toast({ title: "AI Analysis Complete", description: "Successfully generated succession recommendations." });
      }
    } catch (error) {
      toast({ title: "Error", description: "AI prediction failed.", variant: "destructive" });
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#1A232C]">Succession Planning</h1>
        <p className="text-[#6D8196] mt-2">AI-driven talent pipelining for critical organizational roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar: Critical Roles */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Critical Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {loadingRoles ? <Loader2 className="w-6 h-6 animate-spin text-[#6D8196] mx-auto" /> : 
                roles.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">
                    <p className="text-sm mb-2">No critical roles found.</p>
                    <p className="text-xs text-slate-400">Use the API or seed script to create Job Descriptions with High criticality.</p>
                  </div>
                ) :
                roles.map(role => (
                  <Button 
                    key={role._id} 
                    variant={selectedRole === role._id ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => loadPlan(role._id)}
                  >
                    <div className="truncate">
                      <div className="font-semibold">{role.title}</div>
                      <div className="text-xs opacity-70 font-normal">{role.department}</div>
                    </div>
                  </Button>
                ))
              }
            </CardContent>
          </Card>
        </div>

        {/* Main Area: Plan Details */}
        <div className="md:col-span-3">
          {selectedRole && plan ? (
            <Card className="min-h-[500px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Succession Plan Candidates</CardTitle>
                </div>
                <Button onClick={handlePredict} disabled={predicting} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  {predicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  {predicting ? "Analyzing Workforce..." : "AI Auto-Generate"}
                </Button>
              </CardHeader>
              <CardContent>
                {loadingPlan ? (
                  <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-[#6D8196]" /></div>
                ) : plan.candidates?.length > 0 ? (
                  <div className="space-y-4">
                    {plan.candidates.slice((currentPage - 1) * 15, currentPage * 15).map((cand, i) => (
                      <div key={i} className="p-4 border border-[#E2E8F0] rounded-xl hover:shadow-sm transition-all bg-white flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{cand.employeeId?.name || cand.name}</h3>
                            <p className="text-sm text-[#6D8196]">{cand.employeeId?.position || cand.position}</p>
                          </div>
                          <Badge variant={cand.source === 'AI Recommended' ? 'default' : 'secondary'}>
                            {cand.source || 'Manual'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="bg-[#F1F5F9] px-3 py-1.5 rounded-md font-medium">
                            Readiness: <span className="text-blue-600">{cand.readinessTimeframe || 'Unknown'}</span>
                          </div>
                          {cand.score && (
                            <div className="bg-[#F1F5F9] px-3 py-1.5 rounded-md font-medium">
                              Fit Score: <span className="text-green-600">{cand.score}%</span>
                            </div>
                          )}
                        </div>
                        {cand.rationale && (
                          <div className="mt-2 text-sm bg-blue-50/50 p-3 rounded-md text-blue-900 border border-blue-100">
                            <strong>AI Rationale:</strong> {cand.rationale}
                          </div>
                        )}
                      </div>
                    ))}
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={Math.ceil((plan.candidates?.length || 0) / 15)}
                      totalRecords={plan.candidates?.length || 0}
                      pageSize={15}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-[#E2E8F0] rounded-xl bg-gray-50/50">
                    <UserPlus className="w-12 h-12 text-[#94A3B8] mb-4" />
                    <h3 className="text-lg font-semibold text-[#475569]">No Succession Plan Yet</h3>
                    <p className="text-[#64748B] max-w-sm mt-2 mb-6">Click "AI Auto-Generate" to instantly scan the workforce and recommend top successors for this role.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-12 border-2 border-dashed border-[#E2E8F0] rounded-xl bg-gray-50/50">
              <div className="max-w-md">
                <Users className="w-16 h-16 text-[#94A3B8] mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-[#475569]">Select a Critical Role</h2>
                <p className="text-[#64748B] mt-2">Choose a role from the sidebar to view or generate its succession pipeline.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

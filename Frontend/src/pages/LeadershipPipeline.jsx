import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, BrainCircuit, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchPipelineLeaders, predictPipelineStage } from "@/services/api";
import { api } from "@/services/api";

export default function LeadershipPipeline() {
  const { toast } = useToast();
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingIds, setAnalyzingIds] = useState({});

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    try {
      const res = await fetchPipelineLeaders();
      if (res.data.success) {
        setPipeline(res.data.pipeline);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load leadership pipeline", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadAllEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success) {
        const emps = res.data.data;
        const pipelineMap = new Map(pipeline.map(p => [p.employeeId?._id || p.employeeId, true]));
        const nonPipeline = emps.filter(e => !pipelineMap.has(e._id)).slice(0, 5); // Just show a few for demo
        
        const newPipeline = [...pipeline, ...nonPipeline.map(e => ({
          _id: `temp-${e._id}`,
          employeeId: e,
          stage: 'Unassigned',
          source: 'System'
        }))];
        setPipeline(newPipeline);
      }
    } catch(err) { }
  }

  const handlePredict = async (employeeId, index) => {
    setAnalyzingIds(prev => ({ ...prev, [employeeId]: true }));
    try {
      const res = await predictPipelineStage(employeeId);
      if (res.data.success) {
        const newPipeline = [...pipeline];
        newPipeline[index] = {
          ...newPipeline[index],
          stage: res.data.predictedStage,
          source: 'AI Recommended',
          score: res.data.readinessScore,
          rationale: res.data.rationale
        };
        setPipeline(newPipeline);
        toast({ title: "AI Analysis Complete", description: "Pipeline stage predicted successfully." });
      }
    } catch (error) {
      toast({ title: "Error", description: "AI prediction failed.", variant: "destructive" });
    } finally {
      setAnalyzingIds(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#1A232C]">Leadership Pipeline</h1>
          <p className="text-[#6D8196] mt-2">Track and develop future leaders across the organization.</p>
        </div>
        <Button variant="outline" onClick={loadAllEmployees} className="gap-2">
          <Activity className="w-4 h-4" /> Load Potential Leaders
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Roster</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-[#6D8196]" /></div>
          ) : pipeline.length > 0 ? (
            <div className="space-y-4">
              {pipeline.map((entry, index) => {
                const emp = entry.employeeId;
                const empId = emp?._id || emp;
                const isAnalyzing = analyzingIds[empId];

                return (
                  <div key={entry._id || index} className="p-5 border border-[#E2E8F0] rounded-xl bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-sm transition-all">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{emp?.name || 'Unknown Employee'}</h3>
                      <p className="text-sm text-[#6D8196]">{emp?.position} • {emp?.department}</p>
                      
                      {entry.rationale && (
                        <div className="mt-3 text-sm bg-[#F8FAFC] p-3 rounded-md text-[#334155] border border-[#E2E8F0]">
                          <strong>AI Insights:</strong> {entry.rationale}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Badge variant={entry.stage === 'Unassigned' ? 'outline' : 'default'} className={entry.stage !== 'Unassigned' ? 'bg-indigo-600' : ''}>
                          {entry.stage}
                        </Badge>
                        {entry.score && <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">Score: {entry.score}</span>}
                      </div>
                      
                      <Button 
                        onClick={() => handlePredict(empId, index)} 
                        disabled={isAnalyzing}
                        variant="secondary"
                        size="sm"
                        className="w-full gap-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                      >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                        {isAnalyzing ? "Analyzing 360 & Perf..." : "AI Predict Stage"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-[#64748B]">No leaders currently in the pipeline.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

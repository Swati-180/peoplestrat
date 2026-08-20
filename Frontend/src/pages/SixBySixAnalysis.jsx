import React, { useMemo, useState, useEffect } from "react";
import {
  Brain,
  Zap,
  Grid,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const labels = ["Low", "Emerging", "Stable", "Strong", "Top", "Elite"];

export default function SixBySixAnalysis() {
  const { toast } = useToast();
  const [selectedCell, setSelectedCell] = useState(null); // { x, y, employees }
  const [summary, setSummary] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, resultsRes] = await Promise.all([
          api.get("/analysis/summary"),
          api.get("/analysis/results?limit=500")
        ]);
        
        if (summaryRes.data.success) {
          setSummary(summaryRes.data.summary);
        }
        
        if (resultsRes.data.success) {
          // Use .data if returned by backend (after my Turn 1022 fix)
          setAnalysisResults(resultsRes.data.data || resultsRes.data.results || []);
        }
      } catch (error) {
        console.error("Failed to fetch matrix data:", error);
        toast({
          title: "Error",
          description: "Could not load talent matrix.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);



  // Calculate Max Count for Heat Map
  const maxCount = useMemo(() => {
    let max = 0;
    for (let x = 1; x <= 6; x++) {
      for (let y = 1; y <= 6; y++) {
        const count = analysisResults.filter(r => r.matrix_x === x && r.matrix_y === y).length;
        if (count > max) max = count;
      }
    }
    return max || 1;
  }, [analysisResults]);

  // Helper to get color based on count (Heat Map style)
  const getCellColor = (count) => {
    if (count === 0) return "bg-slate-50/50 border border-slate-100 text-slate-100";
    
    // Professional Scale: Slate to Deep Blue
    const ratio = count / maxCount;
    if (ratio < 0.2) return "bg-slate-200 text-slate-700 border-slate-300";
    if (ratio < 0.4) return "bg-blue-100 text-blue-800 border-blue-200";
    if (ratio < 0.6) return "bg-blue-300 text-blue-900 border-blue-400";
    if (ratio < 0.8) return "bg-blue-600 text-white border-blue-700";
    return "bg-indigo-900 text-white border-indigo-950";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">Generating Talent Matrix...</p>
      </div>
    );
  }

  const handleCellClick = (x, y) => {
    const cellEmps = analysisResults.filter(r => r.matrix_x === x && r.matrix_y === y);
    if (cellEmps.length > 0) {
      setSelectedCell({ x, y, employees: cellEmps });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">6x6 Talent Matrix</h1>
          <p className="text-slate-500 text-sm font-medium">Strategic placement of workforce based on Potential and Performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 border-slate-200 shadow-xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Talent Distribution Grid</CardTitle>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">High Density</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Low Density</span>
               </div>
               <Grid className="h-4 w-4 text-slate-300 ml-2" />
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-12 px-10">
            <div className="flex gap-x-16">
              {/* Y-Axis labels */}
              <div className="flex flex-col justify-between py-2 text-[10px] font-black text-slate-300 uppercase h-[450px] min-w-[60px]">
                {labels.slice().reverse().map((l, idx) => (
                   <span key={l} className="flex items-center justify-end h-full font-bold text-slate-400 pr-3 border-r border-slate-100">
                     {l}
                   </span>
                ))}
              </div>

              {/* Matrix Container */}
              <div className="flex-1 flex flex-col items-center">
                 {/* Y Axis Title */}
                <div className="relative w-full">
                   <div className="absolute top-[225px] left-[-180px] -rotate-90 origin-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 whitespace-nowrap opacity-70">
                     Performance Execution
                   </div>
                </div>

                <div className="grid grid-cols-6 grid-rows-6 gap-2 w-full bg-slate-50/30 p-4 rounded-none border border-slate-100 h-[450px]">
                  {Array.from({ length: 36 }).map((_, i) => {
                    const rowIdx = Math.floor(i / 6);
                    const colIdx = i % 6;
                    const x = colIdx + 1; // Potential
                    const y = 6 - rowIdx; // Performance
                    
                    const cellEmployees = analysisResults.filter(r => r.matrix_x === x && r.matrix_y === y);
                    const count = cellEmployees.length;
                    const isActive = count > 0;

                    return (
                      <div
                        key={i}
                        onClick={() => handleCellClick(x, y)}
                        className={cn(
                          "relative flex flex-col items-center justify-center rounded-none text-sm font-bold transition-all duration-300 group border-2",
                          isActive 
                            ? `${getCellColor(count)} cursor-pointer hover:z-10 shadow-md` 
                            : "bg-white/80 border-slate-100 text-slate-100 hover:bg-white hover:border-slate-200"
                        )}
                      >
                        {isActive && (
                          <>
                            <span className="text-lg mb-0.5">{count}</span>
                            <span className="text-[8px] opacity-70 uppercase tracking-tighter">Employees</span>
                            {/* Subtle Pulse for high count cells */}
                            {count > maxCount * 0.8 && <div className="absolute inset-0 rounded-none bg-current animate-ping opacity-10" />}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* X-Axis labels */}
                <div className="flex justify-between w-full mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {labels.map(l => (
                    <span key={l} className="flex-1 text-center border-t border-slate-100 pt-3">
                      {l}
                    </span>
                  ))}
                </div>
                
                <div className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 opacity-80">
                  Potential Capability
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-slate-400">Total Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{analysisResults.length}</div>
              <p className="text-xs text-slate-500 mt-1">Total analyzed records</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-none text-white overflow-hidden relative">
            <CardContent className="pt-6">
              <Brain className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">AI Summary</h3>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                 "Our analysis indicates {analysisResults.filter(r => r.matrix_x >= 5 && r.matrix_y >= 5).length} High-Potential Elite employees. Performance gaps identified in {analysisResults.filter(r => r.matrix_y <= 2).length} nodes."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-slate-400">Cell:</span>
               {labels[selectedCell?.x-1]} Potential / {labels[selectedCell?.y-1]} Performance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {selectedCell?.employees.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                     {r.employee_id?.name ? r.employee_id.name[0] : "E"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{r.employee_id?.name || "Employee Node"}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">{r.talent_category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                      <p className="text-sm font-bold text-blue-600">{Math.round(r.productivity_score)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Fit</p>
                      <p className="text-sm font-bold text-emerald-600">{Math.round(r.fitment_score)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Brain, Award, BookOpen, ChevronRight, Target, 
  Star, StarHalf, Loader2, Sparkles, TrendingUp, Clock
} from "lucide-react";

export default function SkillsLearning() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/employee/me/skills");
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        toast({ title: "Error", description: "Could not load skills data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="p-4 bg-slate-50 rounded-full">
          <Brain className="h-10 w-10 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium text-center max-w-xs">
          Skills intelligence is being calculated. Please check back shortly or update your profile data.
        </p>
      </div>
    );
  }

  // Pre-process data for safety
  const currentSkills = data.currentSkills || [];
  const requiredSkills = data.requiredSkills || [];
  const skillGaps = data.skillGaps || [];
  const recommendations = data.recommendations || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Skills & Learning</h1>
          <p className="text-muted-foreground mt-1">Analyze skill gaps and plan your learning path</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fitment</p>
            <p className="text-2xl font-black text-blue-600">{data.fitmentScore}%</p>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Skill Match</p>
            <p className="text-2xl font-black text-emerald-600">{data.skillMatchPct}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Matrix */}
        <Card className="shadow-md border-none ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              Your Skill Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {currentSkills.map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Proficiency: {skill.level}%</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`h-3 w-3 ${i <= Math.round(skill.level / 20) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Progress value={skill.level} className="h-2 bg-slate-100" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gap Analysis */}
        <Card className="shadow-md border-none ring-1 ring-slate-100 bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              Role Gap Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Required Skills for Your Role</h4>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map(skill => {
                  const isOwned = currentSkills.some(s => s.name.toLowerCase() === skill.toLowerCase());
                  return (
                    <Badge 
                      key={skill} 
                      className={`px-3 py-1.5 rounded-lg border-none flex items-center gap-1.5 ${
                        isOwned ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {isOwned ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {skill}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="p-5 bg-blue-600 rounded-3xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 transform transition-transform group-hover:rotate-12">
                <Sparkles size={100} />
              </div>
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Growth Insight
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed relative z-10">
                You have {skillGaps.length} critical skill gaps for your current role. 
                Focusing on these will improve your role fitment from <span className="font-bold text-white">{data.fitmentScore || 0}%</span> to over <span className="font-bold text-white">90%</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 px-1">
        <Sparkles className="h-6 w-6 text-amber-500" />
        AI Learning Recommendations
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec, i) => (
          <Card key={i} className="hover:shadow-xl transition-all duration-300 border-none ring-1 ring-slate-100 overflow-hidden group">
            <div className="h-2 bg-blue-600 w-full" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <BookOpen size={20} />
                </div>
                {rec.priority === 'High' && (
                  <Badge className="bg-red-100 text-red-700 border-none px-2 py-0 text-[10px] uppercase font-black">High Priority</Badge>
                )}
              </div>
              <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{rec.course}</h4>
              <p className="text-xs text-slate-500 mb-4">To bridge gap in: <span className="font-semibold text-slate-700">{rec.skill}</span></p>
              
              <div className="flex items-center justify-between text-xs font-medium text-slate-400 mt-auto border-t pt-4 border-slate-50">
                <span className="flex items-center gap-1"><Award size={12} /> {rec.provider}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {rec.duration}</span>
              </div>
              
              <Button variant="ghost" className="w-full mt-4 group-hover:bg-blue-600 group-hover:text-white transition-all rounded-xl text-blue-600 font-bold">
                Start Learning <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CheckCircle({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XCircle({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

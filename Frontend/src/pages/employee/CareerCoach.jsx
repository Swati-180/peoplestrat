import React from "react";
import AIChat from "@/components/AIChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, TrendingUp, Award, Rocket } from "lucide-react";

export default function CareerCoach() {
  const [suggestion, setSuggestion] = React.useState(null);

  const handleSuggest = (text) => {
    setSuggestion(text);
    // Reset so it can be clicked again
    setTimeout(() => setSuggestion(null), 100);
  };

  const careerPrompts = [
    { text: "How can I improve my fitment score?", icon: Target, color: "text-blue-500" },
    { text: "What skills should I learn for a promotion?", icon: TrendingUp, color: "text-emerald-500" },
    { text: "Analyze my performance trends", icon: Sparkles, color: "text-purple-500" },
    { text: "Suggestions for my career growth", icon: Rocket, color: "text-orange-500" },
    { text: "How do I compare to role benchmarks?", icon: Award, color: "text-indigo-500" },
  ];

  return (
    <div className="min-h-screen bg-indigo-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl shadow-sm">
                <Sparkles className="h-8 w-8 text-indigo-600" />
              </div>

              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  AI Career Coach
                </h1>
                <p className="text-slate-500 font-medium">
                  Your personalized strategy for professional growth and role excellence
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 h-[calc(100vh-220px)]">

          {/* Left Sidebar: Career Focus Areas */}
          <div className="lg:col-span-1">
            <Card className="h-full border-indigo-100 bg-white shadow-xl shadow-indigo-100/50">
              <CardHeader className="pb-4 border-b border-indigo-50">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Career Focus areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {careerPrompts.map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full text-left justify-start h-auto p-4 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all group rounded-xl whitespace-normal"
                      onClick={() => handleSuggest(prompt.text)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${prompt.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700 leading-tight">
                          {prompt.text}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right: AI Career Coaching Terminal */}
          <div className="lg:col-span-1">
            <Card className="h-full border-indigo-100 bg-white shadow-2xl shadow-indigo-100/30 overflow-hidden flex flex-col rounded-3xl">
              <CardContent className="p-0 flex-1 relative">
                <AIChat 
                  isFloating={false} 
                  suggestionTrigger={suggestion} 
                  mode="career_coach"
                />
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}

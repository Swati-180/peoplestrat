import React from "react";
import AIChat from "@/components/AIChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export default function AiEmployeeAssistant() {
  const [suggestion, setSuggestion] = React.useState(null);

  const handleSuggest = (text) => {
    setSuggestion(text);
    // Reset so it can be clicked again
    setTimeout(() => setSuggestion(null), 100);
  };

  return (
    <div className="min-h-screen bg-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>

              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                  AI Workforce Assistant
                </h1>

                <div className="flex items-center gap-2 text-slate-600">
                  <span>Powered by ChatGPT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 h-[calc(100vh-200px)]">

          {/* Left Sidebar: Suggested Questions */}
          <div className="lg:col-span-1">
            <Card className="h-full border-blue-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Suggested Questions
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Click to ask about workforce intelligence
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 border-slate-200 hover:bg-blue-50 whitespace-normal"
                  onClick={() => handleSuggest("Who is at burnout risk?")}
                >
                  <span className="text-sm">Who is at burnout risk?</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 border-slate-200 hover:bg-blue-50 whitespace-normal"
                  onClick={() => handleSuggest("Who should be reskilled?")}
                >
                  <span className="text-sm">Who should be reskilled?</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 border-slate-200 hover:bg-blue-50 whitespace-normal"
                  onClick={() => handleSuggest("Who is underutilized?")}
                >
                  <span className="text-sm">Who is underutilized?</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 border-slate-200 hover:bg-blue-50 whitespace-normal"
                  onClick={() => handleSuggest("Show me high-risk employees")}
                >
                  <span className="text-sm">Show me high-risk employees</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 border-slate-200 hover:bg-blue-50 whitespace-normal"
                  onClick={() => handleSuggest("Who are our top performers?")}
                >
                  <span className="text-sm">Who are our top performers?</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 border-slate-200 hover:bg-blue-50 whitespace-normal"
                  onClick={() => handleSuggest("Tell me about Sarah Johnson")}
                >
                  <span className="text-sm">Tell me about Sarah Johnson</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: AI Chat & Results */}
          <div className="lg:col-span-1">
            <Card className="h-full border-blue-200 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0 h-full">
                <AIChat isFloating={false} suggestionTrigger={suggestion} />
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}

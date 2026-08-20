import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const docs = [
  {
    id: "1",
    title: "Getting Started Guide",
    description: "Learn the basics of the AI Workforce Optimization Platform",
    category: "Getting Started",
    icon: BookOpen,
  },
  {
    id: "2",
    title: "Employee Management",
    description: "How to add, edit, and manage employee records",
    category: "Features",
    icon: FileText,
  },
  {
    id: "3",
    title: "Upload Data Documentation",
    description: "Guide for uploading JDs, CVs, and activity data",
    category: "Features",
    icon: FileText,
  },
  {
    id: "4",
    title: "Analytics & Reports",
    description: "Understanding analytics dashboards and generating reports",
    category: "Features",
    icon: FileText,
  },
  {
    id: "5",
    title: "Fitment Engine",
    description: "How the AI-powered fitment scoring works",
    category: "AI Features",
    icon: FileText,
  },
  {
    id: "6",
    title: "Optimization Recommendations",
    description: "Understanding and implementing AI recommendations",
    category: "AI Features",
    icon: FileText,
  },
  {
    id: "7",
    title: "API Documentation",
    description: "REST API reference for developers",
    category: "Developer",
    icon: FileText,
  },
  {
    id: "8",
    title: "Integration Guide",
    description: "SAP, Workday, and third-party integrations",
    category: "Developer",
    icon: FileText,
  },
];

export default function Documentation() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Documentation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Learn how to use the AI Workforce Optimization Platform
        </p>
      </div>

      {/* Quick Start PDF Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">Quick Start PDF</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Download our comprehensive quick start guide to get up and running quickly
                with all platform features.
              </p>
              <Button data-testid="button-download-quickstart">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {docs.map((doc) => {
          const Icon = doc.icon;
          return (
            <Card
              key={doc.id}
              className="hover-elevate"
              data-testid={`card-doc-${doc.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">
                      {doc.category}
                    </div>
                    <h3 className="font-semibold text-base mb-2">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {doc.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="pl-0"
                      onClick={() => console.log("View doc:", doc.id)}
                      data-testid={`button-view-doc-${doc.id}`}
                    >
                      Read More
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

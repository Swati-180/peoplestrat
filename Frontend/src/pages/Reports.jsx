import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, FilePlus } from "lucide-react";

const REPORTS = [
  {
    id: "1",
    title: "Monthly Productivity Report",
    description: "Comprehensive productivity analysis for June 2024",
    date: "2024-06-30",
    type: "Productivity",
    format: "PDF",
    status: "Generated",
  },
  {
    id: "2",
    title: "Employee Fitment Analysis",
    description: "Detailed fitment scores and recommendations",
    date: "2024-06-28",
    type: "Fitment",
    format: "Excel",
    status: "Generated",
  },
  {
    id: "3",
    title: "Work Distribution Report",
    description: "Task allocation and utilization metrics",
    date: "2024-06-25",
    type: "Distribution",
    format: "PDF",
    status: "Generated",
  },
  {
    id: "4",
    title: "Skill Gap Analysis",
    description: "Identifying training opportunities",
    date: "2024-06-20",
    type: "Skills",
    format: "Excel",
    status: "Generated",
  },
];

export default function Reports() {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("latest");

  const filteredReports = REPORTS
    .filter((r) => filter === "all" || r.type === filter)
    .sort((a, b) =>
      sort === "latest"
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View, generate, and download AI-powered workforce reports
          </p>
        </div>

        <Button>
          <FilePlus className="h-4 w-4 mr-2" />
          Generate New Report
        </Button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Productivity">Productivity</SelectItem>
            <SelectItem value="Fitment">Fitment</SelectItem>
            <SelectItem value="Distribution">Distribution</SelectItem>
            <SelectItem value="Skills">Skills</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* EMPTY STATE */}
      {filteredReports.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-3">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">No reports available</h3>
            <p className="text-sm text-muted-foreground">
              Generate your first workforce report to start gaining insights.
            </p>
          </CardContent>
        </Card>
      )}

      {/* REPORTS GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => (
          <Card key={report.id} className="transition hover:shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(report.date).toLocaleDateString()}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{report.type}</Badge>
                <Badge variant="secondary">{report.format}</Badge>
                <Badge variant="outline">{report.status}</Badge>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-3 w-3 mr-2" />
                Download Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { Settings as SettingsIcon, Upload, Save, MapPin, Users, Database, Building2, Target, CheckCircle } from "lucide-react";
import { employees } from "@/data/mockEmployeeData";

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("map");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [teamIdentifier, setTeamIdentifier] = useState("");
  const [burnoutCritical, setBurnoutCritical] = useState(85);
  const [competencyDelta, setCompetencyDelta] = useState(15);
  const [utilizationYield, setUtilizationYield] = useState(92);

  // Mock teams data
  const teams = {
    "Finance": ["Core Finance", "Budget Planning", "Audit Team"],
    "IT": ["Development", "Infrastructure", "Security"],
  };

  // Derive departments from employees
  const departments = useMemo(() => {
    return employees.reduce((acc, emp) => {
      if (!acc[emp.department]) {
        acc[emp.department] = [];
      }
      acc[emp.department].push(emp);
      return acc;
    }, {});
  }, []);

  // Calculate department metrics
  const getDepartmentMetrics = (deptEmployees) => {
    const totalEmployees = deptEmployees.length;
    const avgFitment = deptEmployees.reduce((sum, emp) => sum + emp.scores.fitment, 0) / totalEmployees;
    const avgUtilization = deptEmployees.reduce((sum, emp) => sum + emp.scores.utilization, 0) / totalEmployees;
    const fte = deptEmployees.reduce((sum, emp) => sum + (emp.processes?.reduce((pSum, p) => pSum + p.hours, 0) || 0) / 160, 0);
    return {
      totalEmployees,
      avgFitment: avgFitment.toFixed(1),
      avgUtilization: avgUtilization.toFixed(1),
      fte: fte.toFixed(1)
    };
  };

  const handleInitializeUnit = () => {
    if (!newDepartmentName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a department name",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Unit Initialized",
      description: `New strategic unit "${newDepartmentName}" has been initialized.`,
    });
    setNewDepartmentName("");
  };

  const handleConfirmMap = () => {
    if (!targetUnit || !teamIdentifier.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a target unit and enter team identifier",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Mapping Confirmed",
      description: `Team "${teamIdentifier}" mapped to ${targetUnit}.`,
    });
    setTargetUnit("");
    setTeamIdentifier("");
  };

  const handleLaunchPipeline = () => {
    toast({
      title: "Intelligence Pipeline Launched",
      description: "Mass data ingestion pipeline has been initiated.",
    });
  };

  const handleUpdateLogic = () => {
    toast({
      title: "System Logic Updated",
      description: "Logic thresholds have been updated successfully.",
    });
  };

  const handleEmployeeCommit = (employeeId) => {
    toast({
      title: "Mapping Updated",
      description: `Employee ${employeeId} mapping has been committed.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">GOVERNANCE HUB</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">System Configuration</h1>
                <p className="text-sm text-muted-foreground">ENTERPRISE ARCHITECTURE & LOGIC MAPPING</p>
              </div>
            </div>

            {/* Right Side - Tabs */}
            <div className="flex gap-2">
              <Button
                variant={activeTab === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("map")}
                className="rounded-full"
              >
                Organization Map
              </Button>
              <Button
                variant={activeTab === "allotment" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("allotment")}
                className="rounded-full"
              >
                Workforce Allotment
              </Button>
              <Button
                variant={activeTab === "processing" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("processing")}
                className="rounded-full"
              >
                Data Processing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        {activeTab === "map" && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="col-span-4 space-y-6">
              {/* Global Hierarchy Health */}
              <Card className="bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Global Hierarchy Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Operational Units</span>
                    <span className="font-bold text-xl">{Object.keys(departments).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Teams</span>
                    <span className="font-bold text-xl">{Object.values(teams).flat().length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Mapping Integrity</span>
                    <span className="font-bold text-xl text-green-400">98%</span>
                  </div>
                </CardContent>
              </Card>

              {/* New Strategic Unit */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">New Strategic Unit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="department-name">Department Name</Label>
                    <Input
                      id="department-name"
                      value={newDepartmentName}
                      onChange={(e) => setNewDepartmentName(e.target.value)}
                      placeholder="Enter department name"
                    />
                  </div>
                  <Button onClick={handleInitializeUnit} className="w-full">
                    INITIALIZE UNIT
                  </Button>
                </CardContent>
              </Card>

              {/* Team Topology */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Topology</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-unit">Target Unit</Label>
                    <Select value={targetUnit} onValueChange={setTargetUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(departments).map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-identifier">Team Identifier</Label>
                    <Input
                      id="team-identifier"
                      value={teamIdentifier}
                      onChange={(e) => setTeamIdentifier(e.target.value)}
                      placeholder="Enter team identifier"
                    />
                  </div>
                  <Button onClick={handleConfirmMap} className="w-full">
                    CONFIRM MAP
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Main Grid */}
            <div className="col-span-8">
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(departments).map(([deptName, deptEmployees]) => {
                  const metrics = getDepartmentMetrics(deptEmployees);
                  const deptTeams = teams[deptName] || [];
                  return (
                    <Card key={deptName} className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{deptName}</h3>
                          <Badge variant="outline">DEPT-{deptName.toUpperCase().slice(0, 4)}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">FTE Count</p>
                            <p className="text-2xl font-bold">{metrics.fte}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Avg Fitment %</p>
                            <p className="text-2xl font-bold">{metrics.avgFitment}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Utilization %</p>
                            <p className="text-2xl font-bold">{metrics.avgUtilization}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Active Nodes</p>
                            <p className="text-2xl font-bold">{deptTeams.length}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Active Team Nodes</p>
                          <div className="flex flex-wrap gap-1">
                            {deptTeams.length > 0 ? (
                              deptTeams.map((team) => (
                                <Badge key={team} variant="secondary" className="text-xs">
                                  {team}
                                </Badge>
                              ))
                            ) : (
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded px-3 py-1 text-xs text-muted-foreground">
                                NO LOGICAL TEAMS MAPPED
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "allotment" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Workforce Allotment Engine</h2>
              <p className="text-muted-foreground">Synchronize workforce assets with operational topology</p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Operational Asset</th>
                        <th className="text-left p-4 font-medium">Current Mapping</th>
                        <th className="text-left p-4 font-medium">Target Unit</th>
                        <th className="text-left p-4 font-medium">Target Node</th>
                        <th className="text-left p-4 font-medium">Commit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.employeeId} className="border-b">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {employee.employeeId} • {employee.position}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{employee.department}</Badge>
                          </td>
                          <td className="p-4">
                            <Select>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(departments).map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4">
                            <Select>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(teams).flat().map((team) => (
                                  <SelectItem key={team} value={team}>
                                    {team}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEmployeeCommit(employee.employeeId)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "processing" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Left Card - Mass Data Ingestion */}
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Mass Data Ingestion</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload CSV, JSON, or XLS files to bulk import employee data,
                    organizational structures, and performance metrics
                  </p>
                  <Button onClick={handleLaunchPipeline}>
                    LAUNCH INTELLIGENCE PIPELINE
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Card - Logic Thresholds */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logic Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="burnout-critical">Burnout Critical Level (%)</Label>
                  <Input
                    id="burnout-critical"
                    type="number"
                    value={burnoutCritical}
                    onChange={(e) => setBurnoutCritical(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competency-delta">Competency Delta Gap (%)</Label>
                  <Input
                    id="competency-delta"
                    type="number"
                    value={competencyDelta}
                    onChange={(e) => setCompetencyDelta(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utilization-yield">Utilization Yield Target (%)</Label>
                  <Input
                    id="utilization-yield"
                    type="number"
                    value={utilizationYield}
                    onChange={(e) => setUtilizationYield(parseInt(e.target.value))}
                  />
                </div>
                <Button onClick={handleUpdateLogic} className="w-full">
                  UPDATE SYSTEM LOGIC
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

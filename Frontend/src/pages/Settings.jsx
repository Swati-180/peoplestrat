import { useWorkforceData } from "@/contexts/WorkforceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import { 
  Settings as SettingsIcon, Upload, Save, MapPin, Users, 
  Database, Building2, Target, CheckCircle,
  User, Lock, Bell, Moon, Sun, Shield, UserCircle, Mail,
  Eye, EyeOff, Loader2 
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { user } = useAuth();
  const { employees, getOverallRisk, getFitmentBand, getFatigueRisk } = useWorkforceData();
  
  // Role-based visibility
  const isManager = (user?.role || "").toLowerCase() === "manager";

  if (!employees) return <div className="flex items-center justify-center min-h-screen">Loading system data...</div>;

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

  if (!isManager) {
    return <EmployeeSettings user={user} />;
  }

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
              <Button
                variant={activeTab === "profile" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("profile")}
                className="rounded-full"
              >
                My Profile
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

        {activeTab === "profile" && (
           <div className="-mt-8 -mx-6">
              <EmployeeSettings user={user} />
           </div>
        )}
      </div>
    </div>
  );
}

function EmployeeSettings({ user }) {
  const { toast } = useToast();
  
  // Profile State
  const [profile, setProfile] = useState({
    name: user?.username || "",
    email: user?.email || "",
    location: "Global Headquarters",
    department: "Strategy & Operations"
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Password State
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    aiInsightAlerts: true,
    performanceUpdates: false
  });
  const [isNotifyLoading, setIsNotifyLoading] = useState(false);

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Validation Logic
  const validatePassword = () => {
    const errs = {};
    if (passwords.new.length < 8) errs.new = "Password must be at least 8 characters";
    if (!/[A-Z]/.test(passwords.new)) errs.new = "Must contain at least 1 uppercase letter";
    if (!/[0-9]/.test(passwords.new)) errs.new = "Must contain at least 1 number";
    if (passwords.new !== passwords.confirm) errs.confirm = "Passwords do not match";
    
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // API Handlers
  const handleSaveProfile = async () => {
    if (!profile.name || !profile.email) {
      toast({ title: "Error", description: "Name and Email are required", variant: "destructive" });
      return;
    }

    setIsProfileLoading(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      
      if (!res.ok) throw new Error("Failed to update profile");
      
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.current) {
      toast({ title: "Error", description: "Current password is required", variant: "destructive" });
      return;
    }

    if (!validatePassword()) return;

    setIsPasswordLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Invalid current password");
      }

      toast({ title: "Success", description: "Password changed successfully" });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleUpdateNotifications = async (updated) => {
    const newPrefs = { ...notifications, ...updated };
    setNotifications(newPrefs);
    setIsNotifyLoading(true);
    
    try {
      const res = await fetch("/api/user/update-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs)
      });
      
      if (!res.ok) throw new Error("Failed to update preferences");
      
      toast({ title: "Success", description: "Preferences saved" });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsNotifyLoading(false);
    }
  };

  const togglePasswordVisibility = (key) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">Manage your profile, security, and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <UserCircle className="h-5 w-5 text-primary" />
                <CardTitle>Profile Settings</CardTitle>
              </div>
              <CardDescription>Update your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Employee Name</Label>
                <Input 
                  value={profile.name} 
                  onChange={(e) => setProfile({...profile, name: e.target.value})} 
                  placeholder="Your Full Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  value={profile.email} 
                  onChange={(e) => setProfile({...profile, email: e.target.value})} 
                  placeholder="work@company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    value={profile.location} 
                    onChange={(e) => setProfile({...profile, location: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={profile.department} readOnly className="bg-muted" />
                </div>
              </div>
              <Button 
                onClick={handleSaveProfile} 
                className="w-full gap-2"
                disabled={isProfileLoading || !profile.name || !profile.email}
              >
                {isProfileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>

          {/* Section 2: Password Change */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Security & Password</CardTitle>
              </div>
              <CardDescription>Ensure your account remains secure with a strong password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 relative">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input 
                    type={showPasswords.current ? "text" : "password"} 
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input 
                    type={showPasswords.new ? "text" : "password"} 
                    value={passwords.new}
                    onChange={(e) => {
                      setPasswords({...passwords, new: e.target.value});
                      if (passwordErrors.new) setPasswordErrors(p => ({...p, new: null}));
                    }}
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.new && <p className="text-xs text-destructive mt-1">{passwordErrors.new}</p>}
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Input 
                    type={showPasswords.confirm ? "text" : "password"} 
                    value={passwords.confirm}
                    onChange={(e) => {
                      setPasswords({...passwords, confirm: e.target.value});
                      if (passwordErrors.confirm) setPasswordErrors(p => ({...p, confirm: null}));
                    }}
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.confirm && <p className="text-xs text-destructive mt-1">{passwordErrors.confirm}</p>}
              </div>

              <Button 
                onClick={handleUpdatePassword} 
                variant="outline" 
                className="w-full gap-2"
                disabled={isPasswordLoading || !passwords.current || !passwords.new || !passwords.confirm}
              >
                {isPasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Section 2.5: Account Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Account Security</CardTitle>
              </div>
              <CardDescription>Extra layers of protection for your employee account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Enable extra security for your account</p>
                </div>
                <Button size="sm" variant="secondary">Enable 2FA</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">View and manage devices currently logged in</p>
                </div>
                <Button size="sm" variant="secondary">View Devices</Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>Control how you receive alerts and platform updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly performance summaries via email</p>
                </div>
                <Switch 
                  checked={notifications.emailNotifications} 
                  onCheckedChange={(val) => handleUpdateNotifications({ emailNotifications: val })}
                  disabled={isNotifyLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">AI Insight Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when AI identifies career growth opportunities</p>
                </div>
                <Switch 
                  checked={notifications.aiInsightAlerts} 
                  onCheckedChange={(val) => handleUpdateNotifications({ aiInsightAlerts: val })}
                  disabled={isNotifyLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Performance Updates</Label>
                  <p className="text-sm text-muted-foreground">Real-time alerts for fitment score recalculations</p>
                </div>
                <Switch 
                  checked={notifications.performanceUpdates} 
                  onCheckedChange={(val) => handleUpdateNotifications({ performanceUpdates: val })}
                  disabled={isNotifyLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Theme Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Moon className="h-5 w-5 text-primary" />
                <CardTitle>Interface Customization</CardTitle>
              </div>
              <CardDescription>Personalize your viewing experience for the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-background">
                      {theme === "light" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <Label className="text-base">Display Theme</Label>
                      <p className="text-sm text-muted-foreground">Switch between light and dark visual modes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium uppercase tracking-wider ${theme === "light" ? "text-primary" : "text-muted-foreground"}`}>Light</span>
                    <Switch 
                      checked={theme === "dark"} 
                      onCheckedChange={(val) => setTheme(val ? "dark" : "light")} 
                    />
                    <span className={`text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`}>Dark</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

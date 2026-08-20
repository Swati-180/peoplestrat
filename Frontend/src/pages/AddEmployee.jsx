import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileText, UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/servicess/api";

export default function AddEmployee() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    salary: "",
    location: ""
  });

  // Bulk Upload State
  const [file, setFile] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/employees/add", formData);
      toast({
        title: "Employee Added",
        description: `${formData.name} has been successfully added to the system.`,
      });
      setFormData({ name: "", email: "", department: "", position: "", salary: "", location: "" });
    } catch (error) {
      toast({
        title: "Error adding employee",
        description: error.response?.data?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleBulkUpload = async () => {
    if (!file) return;
    setIsSubmitting(true);
    const formPayload = new FormData();
    formPayload.append("file", file);

    try {
      const response = await api.post("/employees/bulk", formPayload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast({
        title: "Bulk Upload Complete",
        description: `Successfully processed ${response.data.insertedCount} employee records.`,
      });
      setFile(null);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Could not process bulk upload",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-semibold">Add Employee</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Create new employee profiles manually or upload CSV/Excel files for bulk ingestion.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">
            <UserPlus className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload (CSV)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
              <CardDescription>Enter the primary details for the new employee profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" name="department" value={formData.department} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Job Position</Label>
                    <Input id="position" name="position" value={formData.position} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Annual Salary ($)</Label>
                    <Input id="salary" name="salary" type="number" value={formData.salary} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={formData.location} onChange={handleInputChange} />
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Create Employee Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Employee Generation</CardTitle>
              <CardDescription>Upload a CSV file containing employee details. Duplicate emails will be updated automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center">
                <FileText className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">Click to select a CSV file</span>
                  <Input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                </Label>
                {file && <p className="text-sm text-slate-600 mt-2 font-medium">Selected: {file.name}</p>}
                <p className="text-xs text-slate-500 mt-2">Required columns: name, email</p>
              </div>

              <Button onClick={handleBulkUpload} disabled={!file || isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload & Process Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState, useCallback } from "react";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  FileType,
  FileSpreadsheet,
  FileJson,
  Layout,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

export default function UploadData() {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success, error
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (isValidFile(droppedFile)) {
      setFile(droppedFile);
      setUploadStatus("idle");
    }
  }, []);

  const onFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (isValidFile(selectedFile)) {
      setFile(selectedFile);
      setUploadStatus("idle");
    }
  };

  const isValidFile = (file) => {
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json', '.pdf'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(extension)) {
      toast({
        title: "Invalid file type",
        description: `Please upload ${validExtensions.join(", ")} files only.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(30);
      const response = await api.post("/upload/employees", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.min(percentCompleted, 90));
        }
      });

      if (response.data.success) {
        setUploadProgress(100);
        setUploadStatus("success");
        toast({
          title: "Upload Successful",
          description: `${file.name} has been processed and analyzed.`,
        });
      }
    } catch (error) {
      setUploadStatus("error");
      toast({
        title: "Upload Failed",
        description: error.response?.data?.error || "There was a problem processing your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  const getFileIcon = () => {
    if (!file) return <UploadCloud className="h-10 w-10 text-slate-400" />;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText className="h-10 w-10 text-red-500" />;
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileSpreadsheet className="h-10 w-10 text-emerald-500" />;
    if (ext === 'json') return <FileJson className="h-10 w-10 text-amber-500" />;
    return <FileType className="h-10 w-10 text-blue-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Ingestion Pipeline</h1>
        <p className="text-slate-500">Upload your workforce datasets (Excel, CSV, JSON, or PDF) for AI processing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 overflow-hidden border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layout className="h-5 w-5 text-blue-600" />
              Dataset Upload
            </CardTitle>
            <CardDescription>Automated workforce data ingestion</CardDescription>
          </CardHeader>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-6 py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
                    <Clock className="h-10 w-10 text-amber-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Coming Soon</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        The automated data ingestion pipeline is currently being optimized. 
                        Please contact your administrator for manual data synchronization.
                    </p>
                </div>
                <Badge variant="outline" className="px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-600 border-amber-200 bg-amber-50">
                    Feature in Development
                </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">File Requirements</CardTitle>
            <CardDescription>Guidelines for best results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <RequirementItem 
                title="Employee Data" 
                desc="Include Name, Department, and Band." 
                icon={CheckCircle2}
                color="text-emerald-500"
              />
              <RequirementItem 
                title="Performance Metrics" 
                desc="Productivity, Quality, and Hours." 
                icon={CheckCircle2}
                color="text-emerald-500"
              />
              <RequirementItem 
                title="PDF Format" 
                desc="Tables should be clearly formatted." 
                icon={Loader2}
                color="text-amber-500"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 italic text-sm text-blue-800">
              "MAYAAI automatically handles column mapping and data cleaning during ingestion."
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RequirementItem({ title, desc, icon: Icon, color }) {
  return (
    <div className="flex gap-3">
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", color)} />
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

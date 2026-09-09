import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { api, submitPeerFeedback, getAggregatedPeerFeedback, getPeerFeedbackColleagues } from "@/services/api";
import { useWorkforceData } from "@/contexts/WorkforceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Target, Users, X, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/manager/PageHeader";
import { KpiStrip } from "@/components/manager/KpiStrip";
import { CompactTable } from "@/components/manager/CompactTable";
import { Pagination } from "@/components/manager/Pagination";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const COLLABORATION_TAGS = [
  "Team Player", "Innovative", "Helpful", "Problem Solver",
  "Mentor", "Communicator", "Reliable", "Leader",
];

export default function PeerFeedback() {
  const { user } = useAuth();
  const role = (user?.role || "employee").toLowerCase();

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      <PageHeader 
        title={
          <span className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" /> 
            Peer Feedback
          </span>
        }
        subtitle={role === "manager" ? "View team feedback and share insights" : "Share feedback for your colleagues"}
      />
      {role === "manager" || role === "admin" ? <ManagerView /> : <EmployeeView />}
    </div>
  );
}

function FeedbackDrawer({ employee, onClose }) {
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setLoading(true);
      getAggregatedPeerFeedback(employee._id || employee.id)
        .then(res => {
          if (res.data.success) setFeedbackData(res.data.data);
        })
        .finally(() => setLoading(false));
    }
  }, [employee]);

  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col font-['Inter'] animate-in slide-in-from-right duration-500">
        <div className="p-6 border-b bg-gray-50 shrink-0">
          <div className="flex items-center justify-between mb-4">
             <h1 className="text-xs font-black text-gray-400 tracking-widest uppercase">Peer Feedback</h1>
             <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
              {(employee.name || "U").split(' ').map(n=>n[0]).join('').toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900 leading-tight">{employee.name}</p>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{employee.position}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto mt-10 text-gray-400" /> : (
             <>
               <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                 <h3 className="font-bold text-indigo-900 mb-2">Aggregated Rating</h3>
                 {feedbackData?.feedbackCount > 0 ? (
                    <div>
                      <span className="text-4xl font-black text-indigo-700">{feedbackData.averageRating}</span>
                      <span className="text-xl text-indigo-400 ml-1">/ 5</span>
                      <p className="text-sm text-indigo-600 mt-2">Based on {feedbackData.feedbackCount} feedback submissions</p>
                    </div>
                 ) : (
                    <p className="text-sm text-indigo-600/80">No feedback available.</p>
                 )}
               </div>

               <div>
                 <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500" /> Collaboration Tags</h4>
                 {feedbackData?.uniqueTags?.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                     {feedbackData.uniqueTags.map(tag => (
                       <Badge key={tag} className="bg-emerald-50 text-emerald-700 border-emerald-200">
                         {tag}
                       </Badge>
                     ))}
                   </div>
                 ) : (
                   <p className="text-sm text-gray-500 italic">No collaboration tags available.</p>
                 )}
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  )
}

function ManagerView() {
  const { employees, isLoading } = useWorkforceData();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");

  const tableData = useMemo(() => {
    if (!employees) return [];
    return employees.map(emp => ({
      id: emp._id || emp.id,
      employee: emp,
      name: emp.name,
      department: emp.department,
      position: emp.position
    }));
  }, [employees]);

  const pageSize = 15;
  const totalPages = Math.ceil(tableData.length / pageSize);
  const paginatedData = tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { header: "Employee", accessorKey: "name", className: "font-medium" },
    { header: "Department", accessorKey: "department", className: "text-gray-500" },
    { header: "Position", accessorKey: "position", className: "text-gray-500" },
    { 
      header: "Action", 
      accessorKey: "action", 
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedEmployee(row.employee); }}>
          View &rarr;
        </Button>
      )
    }
  ];

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="give-feedback">Give Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Employee Feedback Profiles</h3>
            <p className="text-sm text-gray-500 mb-4">Select an employee to view their aggregated peer feedback, ratings, and collaboration tags.</p>
            <CompactTable 
              columns={columns} 
              data={paginatedData} 
              onRowClick={(row) => setSelectedEmployee(row.employee)}
            />
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={tableData.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </TabsContent>

        <TabsContent value="give-feedback">
          <EmployeeView />
        </TabsContent>
      </Tabs>

      <FeedbackDrawer 
        employee={selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
      />
    </>
  );
}

function EmployeeView() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [myEmployeeId, setMyEmployeeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      try {
        const meRes = await api.get("/employee/me");
        if (meRes.data.success) setMyEmployeeId(meRes.data.data._id);
      } catch (meError) {
        console.warn("Could not load own profile");
      }
      
      const empRes = await getPeerFeedbackColleagues();
      if (empRes.data.success) {
        setEmployees(empRes.data.data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load employee data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetEmployeeId) return toast({ title: "Validation Error", description: "Please select a colleague.", variant: "destructive" });
    if (rating < 1 || rating > 5) return toast({ title: "Validation Error", description: "Please select a rating between 1 and 5.", variant: "destructive" });

    setSubmitting(true);
    try {
      const res = await submitPeerFeedback({ targetEmployeeId, rating, collaborationTags: selectedTags });
      if (res.data.success) {
        toast({ title: "Success", description: "Feedback submitted successfully." });
        setTargetEmployeeId("");
        setRating(0);
        setSelectedTags([]);
      }
    } catch (error) {
      const msg = error.response?.data?.error || "Failed to submit feedback.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const colleagues = employees.filter(emp => emp._id !== myEmployeeId);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <Card className="max-w-2xl bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>Select a colleague to provide anonymous peer feedback.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Colleague</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
            >
              <option value="">-- Select a Colleague --</option>
              {colleagues.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.position})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rating (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setRating(num)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border font-medium transition-colors ${rating === num ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Collaboration Tags</label>
            <div className="flex flex-wrap gap-2">
              {COLLABORATION_TAGS.map(tag => (
                <Badge 
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer px-3 py-1 text-sm ${selectedTags.includes(tag) ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

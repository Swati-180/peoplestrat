import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api, submitPeerFeedback, getAggregatedPeerFeedback, getPeerFeedbackColleagues } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Target, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLLABORATION_TAGS = [
  "Team Player",
  "Innovative",
  "Helpful",
  "Problem Solver",
  "Mentor",
  "Communicator",
  "Reliable",
  "Leader",
];

export default function PeerFeedback() {
  const { user } = useAuth();
  const role = (user?.role || "employee").toLowerCase();

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#1A232C] flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-600" /> 
          Peer Feedback
        </h1>
        <p className="text-[#6D8196] mt-2">
          {role === "manager" 
            ? "View aggregated feedback and collaboration tags for your team." 
            : "Submit feedback for your colleagues."}
        </p>
      </div>

      {role === "manager" ? <ManagerView /> : <EmployeeView />}
    </div>
  );
}

function EmployeeView() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [myEmployeeId, setMyEmployeeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Get my employee ID (wrap in its own try/catch so failure doesn't break everything)
      try {
        const meRes = await api.get("/employee/me");
        if (meRes.data.success) {
          setMyEmployeeId(meRes.data.data._id);
        }
      } catch (meError) {
        console.warn("Could not load own employee profile, continuing without self-filtering.");
      }
      
      // 2. Get all employees for the dropdown
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
      const res = await submitPeerFeedback({
        targetEmployeeId,
        rating,
        collaborationTags: selectedTags
      });

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

  // Filter out self
  const colleagues = employees.filter(emp => emp._id !== myEmployeeId);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#6D8196]" /></div>;
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>Select a colleague and provide a rating and tags. Your identity will remain anonymous in the manager's view.</CardDescription>
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

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ManagerView() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [feedbackData, setFeedbackData] = useState(null);
  const [fetchingFeedback, setFetchingFeedback] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await getPeerFeedbackColleagues();
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load employees.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = async (e) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    if (!empId) {
      setFeedbackData(null);
      return;
    }

    setFetchingFeedback(true);
    try {
      const res = await getAggregatedPeerFeedback(empId);
      if (res.data.success) {
        setFeedbackData(res.data.data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load feedback data.", variant: "destructive" });
      setFeedbackData(null);
    } finally {
      setFetchingFeedback(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#6D8196]" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Select Employee</CardTitle>
          <CardDescription>View aggregated peer feedback for an employee.</CardDescription>
        </CardHeader>
        <CardContent>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={selectedEmployeeId}
            onChange={handleSelectEmployee}
          >
            <option value="">-- Select an Employee --</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.name} ({emp.position})</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {fetchingFeedback && (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#6D8196]" /></div>
      )}

      {selectedEmployeeId && !fetchingFeedback && feedbackData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500" /> Aggregated Rating</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackData.feedbackCount > 0 ? (
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-indigo-600">{feedbackData.averageRating} <span className="text-xl text-gray-400">/ 5</span></div>
                  <p className="text-sm text-gray-500">Based on {feedbackData.feedbackCount} feedback submissions</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No feedback submitted yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /> Unique Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackData.uniqueTags && feedbackData.uniqueTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {feedbackData.uniqueTags.map(tag => (
                    <Badge key={tag} className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No collaboration tags available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

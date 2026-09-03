import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Send, RotateCcw, XCircle, MailPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("employee");
  
  // Form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);

  const fetchInvitations = async () => {
    try {
      const res = await api.get('/auth/invite');
      if (res.data.success) {
        setInvitations(res.data.invitations);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load invitations.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setSending(true);
    
    try {
      const res = await api.post('/auth/invite', { email: inviteEmail, role: activeTab });
      toast({ title: "Success", description: res.data.message });
      setInviteEmail("");
      fetchInvitations();
    } catch (err) {
      toast({ 
        title: "Error", 
        description: err.response?.data?.message || "Failed to send invitation.", 
        variant: "destructive" 
      });
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (id) => {
    try {
      const res = await api.post(`/auth/invite/${id}/resend`);
      toast({ title: "Success", description: res.data.message });
      fetchInvitations();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to resend.", variant: "destructive" });
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await api.post(`/auth/invite/${id}/cancel`);
      toast({ title: "Success", description: res.data.message });
      fetchInvitations();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to cancel.", variant: "destructive" });
    }
  };

  const filteredInvitations = invitations.filter(inv => inv.role === activeTab);

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#1A232C]">User Management</h1>
        <p className="text-[#6D8196] mt-2">Manage invitations for your team.</p>
      </div>

      {user?.role === 'admin' && (
        <div className="flex gap-4 mb-6">
          <Button 
            variant={activeTab === 'employee' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('employee')}
          >
            Employee Invitations
          </Button>
          <Button 
            variant={activeTab === 'manager' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('manager')}
          >
            Manager Invitations
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Invite Form */}
        <div className="md:col-span-1">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <MailPlus className="w-5 h-5 text-blue-600" /> 
                Invite {activeTab === 'employee' ? 'Employee' : 'Manager'}
              </CardTitle>
              <CardDescription>
                Send a secure registration link.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input 
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <Button type="submit" disabled={sending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Invitation
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Invitations List */}
        <div className="md:col-span-2">
          <Card className="shadow-sm border-slate-200 h-full">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                Pending & Past Invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : filteredInvitations.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  No {activeTab} invitations found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">Email</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Sent</th>
                        <th className="px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvitations.map((inv) => (
                        <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{inv.email}</td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={
                                inv.status === 'accepted' ? 'success' : 
                                inv.status === 'pending' ? 'secondary' : 
                                'destructive'
                              }
                              className={
                                inv.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                                inv.status === 'pending' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                'bg-red-100 text-red-700 border-red-200'
                              }
                            >
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {inv.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleResend(inv._id)}
                                  className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" /> Resend
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleCancel(inv._id)}
                                  className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <XCircle className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

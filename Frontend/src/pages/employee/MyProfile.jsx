import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  User, MapPin, Briefcase, Calendar, Award, Mail, Hash, Building2,
  Edit3, Save, X, Plus, Loader2
} from "lucide-react";

export default function MyProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/employee/me");
        if (res.data.success) {
          setProfile(res.data.data);
          setEditData({ location: res.data.data.location || "", skills: res.data.data.skills || [] });
        }
      } catch (err) {
        console.error("Profile load error:", err);
        toast({ title: "Error", description: "Could not load profile.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  const handleSave = async () => {
    try {
      const res = await api.put("/employee/me", editData);
      if (res.data.success) {
        setProfile(res.data.data);
        setIsEditing(false);
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !editData.skills.includes(newSkill.trim())) {
      setEditData(p => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => {
    setEditData(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">No Profile Found</h2>
          <p className="text-muted-foreground">Contact your manager to set up your employee record.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Personal and professional information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
            <Edit3 className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="h-24 w-24 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-black text-blue-600 border-4 border-white">
              {profile.name?.split(' ').map(n => n[0]).join('') || 'E'}
            </div>
          </div>
        </div>
        <CardContent className="pt-16 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
              <p className="text-blue-600 font-semibold mt-1">{profile.position || profile.currentRole || 'Employee'}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location || 'N/A'}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {profile.band && <Badge variant="outline" className="text-xs">{profile.band}</Badge>}
              {profile.process_area && <Badge className="bg-blue-50 text-blue-700 border-blue-100">{profile.process_area}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" /> Professional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Hash} label="Employee ID" value={profile.userid || `EMP-${profile._id?.slice(-6)}`} />
            <InfoRow icon={Building2} label="Department" value={profile.department || 'N/A'} />
            <InfoRow icon={Briefcase} label="Position" value={profile.position || 'N/A'} />
            <InfoRow icon={Calendar} label="Experience" value={`${profile.experience_years || 0} years`} />
            <InfoRow icon={MapPin} label="Location"
              value={isEditing ? (
                <Input
                  value={editData.location}
                  onChange={e => setEditData(p => ({ ...p, location: e.target.value }))}
                  className="h-8 w-48"
                />
              ) : (profile.location || 'N/A')}
            />
            {profile.sub_process && <InfoRow icon={Award} label="Sub Process" value={profile.sub_process} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" /> Performance Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ScoreBar label="Fitment Score" value={profile.scores?.fitment || 0} color="bg-blue-500" />
            <ScoreBar label="Productivity" value={profile.scores?.productivity || 0} color="bg-emerald-500" />
            <ScoreBar label="Utilization" value={profile.scores?.utilization || 0} color="bg-amber-500" />
            <ScoreBar label="Fatigue Risk" value={profile.scores?.fatigue || 0} color={profile.scores?.fatigue > 70 ? "bg-red-500" : "bg-green-500"} />
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" /> Skills & Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(isEditing ? editData.skills : profile.skills || []).map(skill => (
              <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700 border-none capitalize px-3 py-1.5 text-sm">
                {skill}
                {isEditing && (
                  <button onClick={() => removeSkill(skill)} className="ml-2 text-red-400 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {(isEditing ? editData.skills : profile.skills || []).length === 0 && (
              <span className="text-sm text-muted-foreground italic">No skills listed</span>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2 mt-4">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                className="max-w-xs"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button onClick={addSkill} size="sm" variant="outline" className="gap-1">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

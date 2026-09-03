import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, Download, Eye, LayoutTemplate, Briefcase, Mail, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sections, setSections] = useState({
    experience: true,
    skills: true
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/employee/me');
        if (res.data.success) {
          setProfile(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load profile for resume builder', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center mt-20">Could not load profile data.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      {/* Settings Panel - Hidden when printing */}
      <div className="w-full md:w-80 flex-shrink-0 space-y-4 print:hidden">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-blue-600" />
              Resume Sections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Professional Experience</label>
                <Switch 
                  checked={sections.experience} 
                  onCheckedChange={(c) => setSections({...sections, experience: c})} 
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Skills & Competencies</label>
                <Switch 
                  checked={sections.skills} 
                  onCheckedChange={(c) => setSections({...sections, skills: c})} 
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <Button onClick={handlePrint} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4" /> Save as PDF
              </Button>
              <Button onClick={handlePrint} variant="outline" className="w-full gap-2">
                <Printer className="h-4 w-4" /> Print Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resume Preview */}
      <div className="flex-grow overflow-auto bg-slate-50 p-4 sm:p-8 rounded-lg border print:p-0 print:border-none print:bg-white print:overflow-visible shadow-inner print:shadow-none">
        
        {/* The actual A4-like container */}
        <div className="bg-white mx-auto shadow-sm border p-10 max-w-[800px] min-h-[1056px] print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:w-full">
          
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-6 mb-6">
            <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight">{profile.name}</h1>
            <p className="text-xl text-slate-600 mt-2 font-light">{profile.position || profile.currentRole || 'Professional'}</p>
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {profile.email}</span>
              {profile.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {profile.location}</span>}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-8">
            
            {/* Main Column */}
            <div className="col-span-2 space-y-8">
              {sections.experience && (
                <section>
                  <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-1">Experience</h2>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-md font-semibold text-slate-900">{profile.position || 'Employee'}</h3>
                        <span className="text-sm font-medium text-slate-500">{profile.experience_years ? `${profile.experience_years} years total exp.` : 'Present'}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 mb-2">{profile.department || 'Department'}</p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        Currently working in the {profile.process_area || 'core'} process area, specializing in {profile.sub_process || 'various sub-processes'}.
                        Demonstrates high productivity and consistent contribution to team objectives.
                      </p>
                    </div>
                  </div>
                </section>
              )}

            </div>

            {/* Sidebar Column */}
            <div className="col-span-1 space-y-8">
              {sections.skills && (
                <section>
                  <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-1">Skills</h2>
                  <div className="flex flex-col gap-2">
                    {profile.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, idx) => (
                        <div key={idx} className="text-sm text-slate-700 py-1 border-b border-slate-100 last:border-0">
                          {skill}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">No specific skills listed.</p>
                    )}
                  </div>
                </section>
              )}

            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, Download, LayoutTemplate, Mail, MapPin, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Phase 5B Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [draftResume, setDraftResume] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [sections, setSections] = useState({
    summary: true,
    experience: true,
    education: true,
    projects: true,
    skills: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, resumeRes] = await Promise.all([
          api.get('/employee/me'),
          api.get('/employee/me/resume')
        ]);
        if (profileRes.data.success) {
          setProfile(profileRes.data.data);
        }
        if (resumeRes.data.success) {
          setResume(resumeRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load data for resume builder', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toISOString().split('T')[0];
    } catch(e) {
      return '';
    }
  };

  const handleDraftChange = (field, value) => {
    setDraftResume(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, subfield, value) => {
    setDraftResume(prev => {
      const newArr = [...(prev[field] || [])];
      newArr[index] = { ...newArr[index], [subfield]: value };
      return { ...prev, [field]: newArr };
    });
  };

  const handleArrayAdd = (field, defaultObj) => {
    setDraftResume(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), defaultObj]
    }));
  };

  const handleArrayRemove = (field, index) => {
    setDraftResume(prev => {
      const newArr = [...(prev[field] || [])];
      newArr.splice(index, 1);
      return { ...prev, [field]: newArr };
    });
  };

  const handleSkillsChange = (e) => {
    const val = e.target.value;
    setDraftResume(prev => ({ 
      ...prev, 
      skills: val.split(',').map(s => s.trim()).filter(Boolean) 
    }));
  };

  const handleProjectTechChange = (index, value) => {
    const techArr = value.split(',').map(s => s.trim()).filter(Boolean);
    handleArrayChange('projects', index, 'technologies', techArr);
  };

  const saveResume = async () => {
    setIsSaving(true);
    setError('');
    try {
      // Create a clean payload explicitly ignoring userId/organizationId from frontend state
      const payload = {
        summary: draftResume.summary,
        experience: draftResume.experience,
        education: draftResume.education,
        projects: draftResume.projects,
        skills: draftResume.skills
      };
      
      // Clean empty strings in dates to null to avoid CastErrors
      ['experience', 'education', 'projects'].forEach(section => {
        if (payload[section]) {
          payload[section] = payload[section].map(item => {
            const cleaned = { ...item };
            if (cleaned.startDate === '') cleaned.startDate = null;
            if (cleaned.endDate === '') cleaned.endDate = null;
            return cleaned;
          });
        }
      });

      const res = await api.put('/employee/me/resume', payload);
      if (res.data.success) {
        setResume(res.data.data);
        setIsEditing(false);
        setDraftResume(null);
      } else {
        setError(res.data.message || 'Failed to save resume');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile || !resume) {
    return <div className="text-center mt-20">Could not load profile or resume data.</div>;
  }

  const displaySkills = (resume.skills && resume.skills.length > 0) ? resume.skills : profile.skills;

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
                <label className="text-sm font-medium">Summary</label>
                <Switch 
                  checked={sections.summary} 
                  onCheckedChange={(c) => setSections({...sections, summary: c})} 
                  disabled={isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Professional Experience</label>
                <Switch 
                  checked={sections.experience} 
                  onCheckedChange={(c) => setSections({...sections, experience: c})} 
                  disabled={isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Education</label>
                <Switch 
                  checked={sections.education} 
                  onCheckedChange={(c) => setSections({...sections, education: c})} 
                  disabled={isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Projects</label>
                <Switch 
                  checked={sections.projects} 
                  onCheckedChange={(c) => setSections({...sections, projects: c})} 
                  disabled={isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Skills & Competencies</label>
                <Switch 
                  checked={sections.skills} 
                  onCheckedChange={(c) => setSections({...sections, skills: c})} 
                  disabled={isEditing}
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              {!isEditing && (
                <Button 
                  onClick={() => { 
                    setDraftResume(JSON.parse(JSON.stringify(resume))); 
                    setIsEditing(true); 
                  }} 
                  className="w-full gap-2 mb-2 bg-slate-800 hover:bg-slate-900"
                >
                  <Edit className="h-4 w-4" /> Edit Resume
                </Button>
              )}
              <Button onClick={handlePrint} className="w-full gap-2 bg-blue-600 hover:bg-blue-700" disabled={isEditing}>
                <Download className="h-4 w-4" /> Save as PDF
              </Button>
              <Button onClick={handlePrint} variant="outline" className="w-full gap-2" disabled={isEditing}>
                <Printer className="h-4 w-4" /> Print Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      {isEditing ? (
        <div className="flex-grow overflow-auto bg-white p-6 sm:p-8 rounded-lg border shadow-sm space-y-8">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Edit className="w-6 h-6 text-blue-600"/> Edit Resume
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setIsEditing(false); setDraftResume(null); setError(''); }}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={saveResume} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
              </Button>
            </div>
          </div>
          {error && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}

          {/* Summary */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold text-slate-800">Professional Summary</Label>
            <Textarea 
              rows={4} 
              value={draftResume.summary || ''} 
              onChange={e => handleDraftChange('summary', e.target.value)} 
              placeholder="Brief professional summary..." 
            />
          </div>

          {/* Experience */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold text-slate-800">Experience</Label>
              <Button size="sm" variant="outline" onClick={() => handleArrayAdd('experience', { title: '', company: '', startDate: '', endDate: '', description: '' })}>
                <Plus className="w-4 h-4 mr-2"/> Add Experience
              </Button>
            </div>
            {(draftResume.experience || []).map((exp, idx) => (
              <Card key={idx} className="p-4 relative">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleArrayRemove('experience', idx)}>
                  <Trash2 className="w-4 h-4"/>
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 mt-2 pr-8">
                  <div>
                    <Label className="text-xs text-slate-500">Job Title</Label>
                    <Input value={exp.title || ''} onChange={e => handleArrayChange('experience', idx, 'title', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Company</Label>
                    <Input value={exp.company || ''} onChange={e => handleArrayChange('experience', idx, 'company', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Start Date</Label>
                    <Input type="date" value={formatDateForInput(exp.startDate)} onChange={e => handleArrayChange('experience', idx, 'startDate', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">End Date</Label>
                    <Input type="date" value={formatDateForInput(exp.endDate)} onChange={e => handleArrayChange('experience', idx, 'endDate', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Description</Label>
                  <Textarea rows={3} value={exp.description || ''} onChange={e => handleArrayChange('experience', idx, 'description', e.target.value)} />
                </div>
              </Card>
            ))}
          </div>

          {/* Education */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold text-slate-800">Education</Label>
              <Button size="sm" variant="outline" onClick={() => handleArrayAdd('education', { degree: '', institution: '', startDate: '', endDate: '', details: '' })}>
                <Plus className="w-4 h-4 mr-2"/> Add Education
              </Button>
            </div>
            {(draftResume.education || []).map((edu, idx) => (
              <Card key={idx} className="p-4 relative">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleArrayRemove('education', idx)}>
                  <Trash2 className="w-4 h-4"/>
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 mt-2 pr-8">
                  <div>
                    <Label className="text-xs text-slate-500">Degree / Certificate</Label>
                    <Input value={edu.degree || ''} onChange={e => handleArrayChange('education', idx, 'degree', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Institution</Label>
                    <Input value={edu.institution || ''} onChange={e => handleArrayChange('education', idx, 'institution', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Start Date</Label>
                    <Input type="date" value={formatDateForInput(edu.startDate)} onChange={e => handleArrayChange('education', idx, 'startDate', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">End Date</Label>
                    <Input type="date" value={formatDateForInput(edu.endDate)} onChange={e => handleArrayChange('education', idx, 'endDate', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Details</Label>
                  <Textarea rows={2} value={edu.details || ''} onChange={e => handleArrayChange('education', idx, 'details', e.target.value)} />
                </div>
              </Card>
            ))}
          </div>

          {/* Projects */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold text-slate-800">Projects</Label>
              <Button size="sm" variant="outline" onClick={() => handleArrayAdd('projects', { title: '', description: '', technologies: [], startDate: '', endDate: '' })}>
                <Plus className="w-4 h-4 mr-2"/> Add Project
              </Button>
            </div>
            {(draftResume.projects || []).map((proj, idx) => (
              <Card key={idx} className="p-4 relative">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleArrayRemove('projects', idx)}>
                  <Trash2 className="w-4 h-4"/>
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 mt-2 pr-8">
                  <div className="col-span-1 sm:col-span-2">
                    <Label className="text-xs text-slate-500">Project Title</Label>
                    <Input value={proj.title || ''} onChange={e => handleArrayChange('projects', idx, 'title', e.target.value)} />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <Label className="text-xs text-slate-500">Technologies (comma separated)</Label>
                    <Input value={(proj.technologies || []).join(', ')} onChange={e => handleProjectTechChange(idx, e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Start Date</Label>
                    <Input type="date" value={formatDateForInput(proj.startDate)} onChange={e => handleArrayChange('projects', idx, 'startDate', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">End Date</Label>
                    <Input type="date" value={formatDateForInput(proj.endDate)} onChange={e => handleArrayChange('projects', idx, 'endDate', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Description</Label>
                  <Textarea rows={3} value={proj.description || ''} onChange={e => handleArrayChange('projects', idx, 'description', e.target.value)} />
                </div>
              </Card>
            ))}
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold text-slate-800">Skills (comma separated)</Label>
            <Textarea 
              rows={2} 
              value={(draftResume.skills || []).join(', ')} 
              onChange={handleSkillsChange} 
              placeholder="React, Node.js, Project Management..." 
            />
          </div>

        </div>
      ) : (
        /* Resume Preview */
        <div className="flex-grow overflow-auto bg-slate-50 p-4 sm:p-8 rounded-lg border print:p-0 print:border-none print:bg-white print:overflow-visible shadow-inner print:shadow-none relative">
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
                {sections.summary && resume.summary && (
                  <section>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-1">Summary</h2>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{resume.summary}</p>
                  </section>
                )}

                {sections.experience && (
                  <section>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-1">Experience</h2>
                    <div className="space-y-6">
                      {resume.experience && resume.experience.length > 0 ? (
                        resume.experience.map((exp, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="text-md font-semibold text-slate-900">{exp.title}</h3>
                              <span className="text-sm font-medium text-slate-500">
                                {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                                {exp.startDate || exp.endDate ? ' - ' : ''}
                                {exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : (exp.startDate ? 'Present' : '')}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-2">{exp.company}</p>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 italic">No professional experience listed.</p>
                      )}
                    </div>
                  </section>
                )}
                
                {sections.projects && resume.projects && resume.projects.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-1">Projects</h2>
                    <div className="space-y-6">
                      {resume.projects.map((proj, idx) => (
                        <div key={idx}>
                          <h3 className="text-md font-semibold text-slate-900 mb-1">{proj.title}</h3>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-2">{proj.description}</p>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <p className="text-sm text-slate-600"><strong>Tech:</strong> {proj.technologies.join(', ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar Column */}
              <div className="col-span-1 space-y-8">
                {sections.education && (
                  <section>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-1">Education</h2>
                    <div className="space-y-6">
                      {resume.education && resume.education.length > 0 ? (
                        resume.education.map((edu, idx) => (
                          <div key={idx}>
                            <h3 className="text-md font-semibold text-slate-900 mb-1">{edu.degree}</h3>
                            <p className="text-sm font-medium text-slate-600 mb-1">{edu.institution}</p>
                            <div className="text-sm font-medium text-slate-500 mb-2">
                              {edu.startDate ? new Date(edu.startDate).getFullYear() : ''}
                              {edu.startDate && edu.endDate ? ' - ' : ''}
                              {edu.endDate ? new Date(edu.endDate).getFullYear() : ''}
                            </div>
                            {edu.details && <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{edu.details}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 italic">No education listed.</p>
                      )}
                    </div>
                  </section>
                )}

                {sections.skills && (
                  <section>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-1">Skills</h2>
                    <div className="flex flex-col gap-2">
                      {displaySkills && displaySkills.length > 0 ? (
                        displaySkills.map((skill, idx) => (
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
      )}
      
    </div>
  );
}

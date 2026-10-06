import React, { useState } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ResumeUploadModal({ isOpen, onClose, onSuccess }) {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Stages: 'upload', 'preview'
  const [stage, setStage] = useState('upload');
  const [extractedData, setExtractedData] = useState(null);
  const [method, setMethod] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads/resume/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setExtractedData(res.data.data);
        setMethod(res.data.method);
        setStage('preview');
      } else {
        toast({ title: 'Extraction Failed', description: res.data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Extraction Failed', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVerify = async () => {
    setIsSaving(true);
    try {
      const res = await api.post('/uploads/resume/verify', {
        personal: extractedData.personal,
        professional: extractedData.professional,
        education: extractedData.education,
        workExperience: extractedData.workExperience,
        projects: extractedData.projects,
        certifications: extractedData.certifications,
        achievements: extractedData.achievements,
        skills: extractedData.skills,
        experience_years: extractedData.calculatedExperience?.years || extractedData.experience_years || 0
      });

      if (res.data.success) {
        toast({ title: 'Profile Updated', description: 'Your profile has been updated with the verified data.' });
        onSuccess(res.data.data);
        handleClose();
      }
    } catch (err) {
      toast({ title: 'Save Failed', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setStage('upload');
    setExtractedData(null);
    setMethod('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{stage === 'upload' ? 'Upload Resume' : 'Review Extracted Profile'}</DialogTitle>
        </DialogHeader>

        {stage === 'upload' && (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <UploadCloud className="h-10 w-10 text-slate-400 mb-4" />
              <p className="text-sm text-slate-600 mb-2">Upload your PDF resume to automatically extract skills and experience.</p>
              <Input type="file" accept=".pdf" onChange={handleFileChange} className="max-w-[250px]" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleExtract} disabled={!file || isExtracting} className="bg-blue-600 hover:bg-blue-700">
                {isExtracting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting...</> : 'Extract Data'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === 'preview' && extractedData && (
          <div className="space-y-6 py-4">
            <Alert className={method === 'ai' ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}>
              {method === 'ai' ? <CheckCircle2 className="h-4 w-4 text-blue-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
              <AlertDescription className={method === 'ai' ? "text-blue-800" : "text-amber-800"}>
                {method === 'ai'
                  ? 'Data successfully extracted using AI. Please verify before saving.'
                  : 'AI extraction unavailable. Falling back to keyword search. Please verify carefully.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">

              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 border-b pb-1 mb-3">AI-EXTRACTED PROFILE</h4>

                <h5 className="text-sm font-bold text-slate-800 mt-4 mb-2">Personal Information</h5>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium text-slate-700">Name:</span> {extractedData.personal?.name || <span className="text-slate-400 italic">Not found in resume</span>}</p>
                  <p className="text-sm"><span className="font-medium text-slate-700">Email:</span> {extractedData.personal?.email || <span className="text-slate-400 italic">Not found in resume</span>}</p>
                  <p className="text-sm"><span className="font-medium text-slate-700">Phone:</span> {extractedData.personal?.phone || <span className="text-slate-400 italic">Not found in resume</span>}</p>
                  <p className="text-sm"><span className="font-medium text-slate-700">Location:</span> {extractedData.personal?.location || <span className="text-slate-400 italic">Not found in resume</span>}</p>
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h5 className="text-sm font-bold text-slate-800 mt-4 mb-2">Professional</h5>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium text-slate-700">Current Role:</span> {extractedData.professional?.currentRole || <span className="text-slate-400 italic">Not found in resume</span>}</p>
                </div>
              </div>

              {/* Education */}
              <div>
                <h5 className="text-sm font-bold text-slate-800 mt-4 mb-2">Education</h5>
                {extractedData.education && extractedData.education.length > 0 ? (
                  <div className="space-y-3">
                    {extractedData.education.map((edu, idx) => (
                      <div key={idx} className="border-l-2 border-slate-200 pl-3">
                        <p className="font-semibold text-sm text-slate-900">{edu.degree || edu.field || 'Unknown Degree'}</p>
                        <p className="text-sm text-slate-700">{edu.institution || 'Unknown Institution'}</p>
                        <p className="text-xs text-slate-500">
                          {edu.startDate ? edu.startDate : ''} {edu.startDate && edu.endDate ? ' - ' : ''} {edu.endDate ? edu.endDate : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not found in resume</p>
                )}
              </div>

              {/* Work Experience */}
              <div>
                <h5 className="text-sm font-bold text-slate-800 mt-4 mb-2">Work Experience</h5>
                {extractedData.workExperience && extractedData.workExperience.length > 0 ? (
                  <div className="space-y-4">
                    {extractedData.workExperience.map((job, idx) => (
                      <div key={idx} className="border-l-2 border-slate-200 pl-3">
                        <p className="font-semibold text-sm text-slate-900">{job.role || job.jobTitle || 'Unknown Role'}</p>
                        <p className="text-sm text-slate-700">{job.company || 'Unknown Company'}</p>
                        <p className="text-xs text-slate-500">
                          {job.startDate || 'Unknown'} - {job.isCurrent ? 'Present' : (job.endDate || 'Unknown')}
                        </p>

                        {job.responsibilities && job.responsibilities.length > 0 && (
                          <div className="mt-2 text-sm text-slate-600">
                            <ul className="list-disc pl-4 space-y-1">
                              {job.responsibilities.map((resp, rIdx) => (
                                <li key={rIdx}>{resp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {job.achievements && job.achievements.length > 0 && (
                          <div className="mt-2 text-sm text-slate-600">
                            <ul className="list-disc pl-4 space-y-1">
                              {job.achievements.map((ach, aIdx) => (
                                <li key={aIdx}>{ach}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {job.technologies && job.technologies.length > 0 && (
                          <div className="mt-2 text-sm text-slate-600">
                            <span className="font-medium">Technologies: </span>
                            {job.technologies.join(', ')}
                          </div>
                        )}
                        {job.skills && job.skills.length > 0 && (!job.technologies || job.technologies.length === 0) && (
                          <div className="mt-2 text-sm text-slate-600">
                            <span className="font-medium">Technologies: </span>
                            {job.skills.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not found in resume</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <h5 className="text-sm font-bold text-slate-800 mt-4 mb-2">Skills</h5>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border rounded-md">
                  {((extractedData.skills?.technical || []).concat(extractedData.skills?.soft || []).concat(extractedData.skills?.tools || []).concat(extractedData.skills?.languages || [])).length > 0 ? (
                    ((extractedData.skills?.technical || []).concat(extractedData.skills?.soft || []).concat(extractedData.skills?.tools || []).concat(extractedData.skills?.languages || [])).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-white border text-slate-700 text-xs py-0">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Not found in resume</span>
                  )}
                </div>
              </div>

              {/* Projects */}
              <div>
                <h5 className="text-sm font-bold text-slate-800 mt-4 mb-2">Projects</h5>
                {extractedData.projects && extractedData.projects.length > 0 ? (
                  <div className="space-y-3">
                    {extractedData.projects.map((proj, idx) => (
                      <div key={idx} className="border-l-2 border-slate-200 pl-3">
                        <p className="font-semibold text-sm text-slate-900">{proj.name || 'Unknown Project'}</p>
                        <p className="text-sm text-slate-700">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not found in resume</p>
                )}
              </div>

              {/* Certifications */}
              <div>
                <h5 className="text-sm font-bold text-slate-800 mt-4 mb-2">Certifications</h5>
                {extractedData.certifications && extractedData.certifications.length > 0 ? (
                  <ul className="list-disc pl-4 text-sm text-slate-700">
                    {extractedData.certifications.map((cert, idx) => <li key={idx}>{cert}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not found in resume</p>
                )}
              </div>

              {/* Achievements */}
              <div>
                <h5 className="text-sm font-bold text-slate-800 mt-4 mb-2">Achievements</h5>
                {extractedData.achievements && extractedData.achievements.length > 0 ? (
                  <ul className="list-disc pl-4 text-sm text-slate-700">
                    {extractedData.achievements.map((ach, idx) => <li key={idx}>{ach}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not found in resume</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStage('upload')}>Back</Button>
              <Button onClick={handleVerify} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save to My Profile'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

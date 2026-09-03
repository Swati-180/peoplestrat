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
      const res = await api.post('/upload/resume/extract', formData, {
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
      const res = await api.post('/upload/resume/verify', {
        skills: extractedData.skills,
        experience_years: extractedData.experience_years
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
          <DialogTitle>{stage === 'upload' ? 'Upload Resume' : 'Verify Extracted Data'}</DialogTitle>
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
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Total Years of Experience</label>
                <Input 
                  type="number" 
                  value={extractedData.experience_years}
                  onChange={(e) => setExtractedData({...extractedData, experience_years: parseInt(e.target.value) || 0})}
                  className="mt-1 max-w-[150px]"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Extracted Skills</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border rounded-md">
                  {extractedData.skills.length > 0 ? (
                    extractedData.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-white border text-slate-700">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 italic">No skills found. You can add them manually later.</span>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setStage('upload')}>Back</Button>
              <Button onClick={handleVerify} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Verify & Save'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Activity, ShieldCheck, HeartPulse, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PulseCheck() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [responses, setResponses] = useState({
    stressLevel: '',
    workloadManageability: '',
    sleepQuality: ''
  });

  const handleChange = (key, val) => {
    setResponses(p => ({ ...p, [key]: parseInt(val) }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/employee/pulse-check', responses);
      if (res.data.success) {
        setResult(res.data.data);
        toast({ title: 'Pulse Check Submitted', description: 'Thank you for checking in.' });
      }
    } catch (err) {
      toast({ title: 'Submission Failed', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = responses.stressLevel && responses.workloadManageability && responses.sleepQuality;

  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center shadow-lg border-emerald-100">
          <CardHeader className="bg-emerald-50/50 border-b pb-8 pt-10">
            <div className="mx-auto bg-emerald-100 p-4 rounded-full mb-4 inline-flex">
              <HeartPulse className="h-10 w-10 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-950">Check-in Complete</CardTitle>
            <CardDescription className="text-emerald-700/80 mt-2 text-base">
              Thank you for sharing how you feel.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-10">
            <div className="p-6 bg-slate-50 border rounded-xl shadow-inner text-left">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-slate-700">Fatigue Score</span>
                <span className={`text-xl font-bold ${result.fatigueScore > 70 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {result.fatigueScore}/100
                </span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-medium text-slate-700">Status</span>
                <span className="text-slate-900 font-semibold">{result.riskLevel}</span>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-slate-600 italic leading-relaxed text-sm">
                  "{result.recommendation}"
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-center text-xs text-slate-400 items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Your raw responses are private. Managers only see the aggregated score.
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-8 pt-2">
            <Button onClick={() => window.location.href='/dashboard'}>Back to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Activity className="h-8 w-8 text-rose-500" />
          Wellbeing Pulse Check
        </h1>
        <p className="text-muted-foreground mt-2">
          Take a moment to reflect on your current wellbeing.
        </p>
      </div>

      <Alert className="mb-8 bg-blue-50 border-blue-100">
        <ShieldCheck className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Privacy Notice:</strong> Your individual answers to these questions are strictly confidential. Managers will only see an aggregated, derived fatigue risk score.
        </AlertDescription>
      </Alert>

      <Card className="shadow-lg">
        <CardContent className="pt-8 space-y-10">
          {/* Question 1 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">1. Over the past week, how would you rate your overall stress level?</h3>
            <RadioGroup className="flex justify-between gap-2" value={responses.stressLevel.toString()} onValueChange={(v) => handleChange('stressLevel', v)}>
              {[
                { v: 1, label: 'Very Low' },
                { v: 2, label: 'Low' },
                { v: 3, label: 'Moderate' },
                { v: 4, label: 'High' },
                { v: 5, label: 'Very High' }
              ].map(opt => (
                <Label key={opt.v} className="flex-1 text-center cursor-pointer">
                  <RadioGroupItem value={opt.v.toString()} className="sr-only peer" />
                  <div className="p-3 border rounded-lg peer-data-[state=checked]:bg-rose-50 peer-data-[state=checked]:border-rose-500 peer-data-[state=checked]:text-rose-700 hover:bg-slate-50 transition-all">
                    <div className="font-bold text-lg mb-1">{opt.v}</div>
                    <div className="text-xs font-medium text-slate-500 peer-data-[state=checked]:text-rose-600">{opt.label}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Question 2 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">2. How manageable has your workload felt recently?</h3>
            <RadioGroup className="flex justify-between gap-2" value={responses.workloadManageability.toString()} onValueChange={(v) => handleChange('workloadManageability', v)}>
              {[
                { v: 1, label: 'Not at all' },
                { v: 2, label: 'Slightly' },
                { v: 3, label: 'Moderately' },
                { v: 4, label: 'Mostly' },
                { v: 5, label: 'Completely' }
              ].map(opt => (
                <Label key={opt.v} className="flex-1 text-center cursor-pointer">
                  <RadioGroupItem value={opt.v.toString()} className="sr-only peer" />
                  <div className="p-3 border rounded-lg peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:text-blue-700 hover:bg-slate-50 transition-all">
                    <div className="font-bold text-lg mb-1">{opt.v}</div>
                    <div className="text-xs font-medium text-slate-500 peer-data-[state=checked]:text-blue-600">{opt.label}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Question 3 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">3. How would you rate the quality of your sleep?</h3>
            <RadioGroup className="flex justify-between gap-2" value={responses.sleepQuality.toString()} onValueChange={(v) => handleChange('sleepQuality', v)}>
              {[
                { v: 1, label: 'Very Poor' },
                { v: 2, label: 'Poor' },
                { v: 3, label: 'Fair' },
                { v: 4, label: 'Good' },
                { v: 5, label: 'Excellent' }
              ].map(opt => (
                <Label key={opt.v} className="flex-1 text-center cursor-pointer">
                  <RadioGroupItem value={opt.v.toString()} className="sr-only peer" />
                  <div className="p-3 border rounded-lg peer-data-[state=checked]:bg-emerald-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:text-emerald-700 hover:bg-slate-50 transition-all">
                    <div className="font-bold text-lg mb-1">{opt.v}</div>
                    <div className="text-xs font-medium text-slate-500 peer-data-[state=checked]:text-emerald-600">{opt.label}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

        </CardContent>
        <CardFooter className="bg-slate-50 border-t p-6 rounded-b-xl flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={!isComplete || isSubmitting} 
            className="w-full sm:w-auto gap-2 text-base px-8 h-12"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Check-in'} <Send className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

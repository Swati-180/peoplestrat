import React, { useState } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ArrowRight, ArrowLeft, BrainCircuit } from 'lucide-react';

const QUESTIONS = [
  { id: 'q1', text: 'I actively listen to others before expressing my own views.', trait: 'Communication' },
  { id: 'q2', text: 'I can clearly explain complex ideas to non-technical stakeholders.', trait: 'Communication' },
  { id: 'q3', text: 'I take initiative to guide my team through ambiguous situations.', trait: 'Leadership' },
  { id: 'q4', text: 'I am comfortable delegating tasks and trusting my peers.', trait: 'Leadership' },
  { id: 'q5', text: 'I quickly adjust my approach when priorities suddenly change.', trait: 'Adaptability' },
  { id: 'q6', text: 'I embrace new tools and processes willingly.', trait: 'Adaptability' },
  { id: 'q7', text: 'I remain calm and focused during high-pressure situations.', trait: 'Resilience' },
  { id: 'q8', text: 'I bounce back quickly from setbacks or failures.', trait: 'Resilience' },
  { id: 'q9', text: 'I actively seek diverse perspectives when making group decisions.', trait: 'Teamwork' },
  { id: 'q10', text: 'I prioritize team success over individual recognition.', trait: 'Teamwork' },
];

export default function BehaviorAssessment() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSelect = (val) => {
    setResponses(prev => ({ ...prev, [QUESTIONS[currentStep].id]: parseInt(val) }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Format responses for API
    const formattedResponses = Object.keys(responses).map(key => ({
      questionId: key,
      value: responses[key]
    }));

    try {
      const res = await api.post('/employee/assessments/behavior', {
        responses: formattedResponses
      });

      if (res.data.success) {
        setResult(res.data.data.scores);
        toast({ title: 'Assessment Complete', description: 'Your behavioral profile has been updated.' });
      } else {
        toast({ title: 'Error', description: res.data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-emerald-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-900">Assessment Completed</CardTitle>
            <CardDescription className="text-emerald-700">
              Your behavioral profile has been updated. Here are your trait scores:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 px-10">
            {Object.entries(result).map(([trait, score]) => (
              <div key={trait}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700 capitalize">{trait}</span>
                  <span className="font-bold text-slate-900">{score}/100</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="justify-center pb-8 pt-4">
            <Button variant="outline" onClick={() => window.location.href='/dashboard'}>
              Back to Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQ = QUESTIONS[currentStep];
  const progress = ((currentStep) / QUESTIONS.length) * 100;
  const isLast = currentStep === QUESTIONS.length - 1;
  const canProceed = !!responses[currentQ.id];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-indigo-600" />
          Behavioral Assessment
        </h1>
        <p className="text-muted-foreground mt-2">
          Help us understand your working style. These situational questions map to core competencies.
        </p>
      </div>

      <Card className="shadow-lg border-indigo-100">
        <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-4 rounded-t-xl">
          <div className="flex justify-between text-sm font-medium text-indigo-800 mb-2">
            <span>Question {currentStep + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <Progress value={progress} className="h-2 bg-indigo-100 [&>div]:bg-indigo-600" />
        </CardHeader>
        
        <CardContent className="pt-8 pb-10 px-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-8 leading-relaxed">
            "{currentQ.text}"
          </h2>

          <RadioGroup 
            className="space-y-3" 
            value={responses[currentQ.id]?.toString()} 
            onValueChange={handleSelect}
          >
            {[
              { val: '1', label: 'Strongly Disagree' },
              { val: '2', label: 'Disagree' },
              { val: '3', label: 'Neutral' },
              { val: '4', label: 'Agree' },
              { val: '5', label: 'Strongly Agree' }
            ].map((opt) => (
              <Label 
                key={opt.val}
                className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${
                  responses[currentQ.id]?.toString() === opt.val ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50'
                }`}
              >
                <RadioGroupItem value={opt.val} id={`r-${opt.val}`} />
                <span className="font-medium text-slate-700">{opt.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-slate-50/50 p-6 rounded-b-xl">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
          
          {isLast ? (
            <Button onClick={handleSubmit} disabled={!canProceed || isSubmitting} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              {isSubmitting ? 'Submitting...' : 'Complete Assessment'} <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

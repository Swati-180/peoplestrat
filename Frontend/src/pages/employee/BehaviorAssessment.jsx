import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, BrainCircuit, Play, Loader2, Clock, RefreshCw, XCircle } from 'lucide-react';

// Ported from mayamaya_plan.md §7 (Eleviq `quiz.view.tsx`).
// Full replacement of the local 10-question flow: Start button → MayaMaya SDK
// iframe → webhook-driven results with 24h cooldown.

const USE_MAYAMAYA_SDK = true;

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const RESULTS_NOTE_MS = 5 * 60 * 1000;
const QUIZ_RESULT_CHECK_DELAYS_MS = [1000, 5000, 10000, 30000];

// window.MayamayaQuiz is provided by /js/mayamaya-quiz.min.js (see public/js/).
// mountQuiz({ el, getQuizLink, onComplete, onClose, onError }) → { iframe, destroy }

function getRemainingCooldown(completedAt) {
  if (!completedAt) return 0;
  const t = new Date(completedAt).getTime();
  if (Number.isNaN(t)) return 0;
  const elapsed = Date.now() - t;
  return elapsed >= COOLDOWN_MS ? 0 : COOLDOWN_MS - elapsed;
}

function formatCooldown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function BehaviorAssessment() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [quizLink, setQuizLink] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [quizSummary, setQuizSummary] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [scriptError, setScriptError] = useState(null);
  const [mountError, setMountError] = useState(null);

  const mountRef = useRef(null);
  // Handler refs so the mount effect below only depends on `quizLink`
  // (stable across renders — safe under React 18 StrictMode double-effects).
  const handlersRef = useRef({ fetchSummary: null, refetchWithDelays: null, toast: null });

  // Load the vendored MayaMaya browser bundle.
  useEffect(() => {
    if (!USE_MAYAMAYA_SDK) return;
    const existing = document.querySelector('script[data-mayamaya-quiz]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = '/js/mayamaya-quiz.min.js';
    script.async = true;
    script.dataset.mayamayaQuiz = 'true';
    script.onerror = () => setScriptError('Failed to load the assessment player (/js/mayamaya-quiz.min.js).');
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/quiz/summary');
      const summary = res.data?.data?.quizSummary ?? null;
      setQuizSummary(summary);
      setCooldownRemaining(getRemainingCooldown(summary?.completedAt));
      return summary;
    } catch (err) {
      // 401s are handled globally by the api interceptor (redirect to /login).
      if (err?.response?.status !== 401) {
        console.error('[BehaviorAssessment] summary fetch failed:', err?.message || err);
      }
      return null;
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  // Initial summary load.
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Tick the cooldown countdown every second while cooling down.
  useEffect(() => {
    if (!quizSummary?.completedAt) return;
    const remaining = getRemainingCooldown(quizSummary.completedAt);
    if (remaining <= 0) {
      setCooldownRemaining(0);
      return;
    }
    setCooldownRemaining(remaining);
    const id = setInterval(() => {
      setCooldownRemaining(getRemainingCooldown(quizSummary.completedAt));
    }, 1000);
    return () => clearInterval(id);
  }, [quizSummary?.completedAt]);

  const handleStartQuiz = async () => {
    setMountError(null);
    if (getRemainingCooldown(quizSummary?.completedAt) > 0) return;
    if (!window.MayamayaQuiz?.mountQuiz) {
      setMountError('Assessment player is still loading. Please wait a moment and try again.');
      return;
    }
    const userId = user?.id || user?._id;
    if (!userId) {
      toast({ title: 'Error', description: 'You must be logged in to start the assessment.', variant: 'destructive' });
      return;
    }
    setIsStarting(true);
    try {
      // Send the real page origin so the backend binds the quiz link to the
      // exact origin hosting the iframe (maya refuses mismatched framing).
      const res = await api.post('/quiz/start-quiz', {
        userId: String(userId),
        embedOrigin: window.location.origin,
      });
      const link = res.data?.data?.quizLink || res.data?.quizLink;
      if (!link) throw new Error('Server did not return a quiz link.');
      console.info('[BehaviorAssessment] quiz started, embedOrigin=', res.data?.data?.embedOrigin || res.data?.embedOrigin);
      setQuizLink(link);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to start quiz';
      setMountError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsStarting(false);
    }
  };

  const refetchWithDelays = useCallback(() => {
    // The webhook completes asynchronously — staggered re-checks (plan §7).
    QUIZ_RESULT_CHECK_DELAYS_MS.forEach((d) => setTimeout(() => fetchSummary(), d));
  }, [fetchSummary]);

  useEffect(() => {
    handlersRef.current = { fetchSummary, refetchWithDelays, toast };
  });

  // Mount the MayaMaya iframe whenever a quizLink is active. useEffect (not a
  // callback ref) so React 18 StrictMode teardown runs mounted.destroy()
  // correctly instead of leaking duplicate SDK instances.
  useEffect(() => {
    const node = mountRef.current;
    if (!node || !quizLink) return;
    if (!window.MayamayaQuiz?.mountQuiz) {
      setMountError('Assessment player failed to load.');
      return;
    }
    let mounted;
    try {
      mounted = window.MayamayaQuiz.mountQuiz({
        el: node,
        getQuizLink: async () => quizLink,
        onComplete: () => {
          try {
            sessionStorage.setItem('peoplestrat_quiz_submitted_at', String(Date.now()));
          } catch {
            /* sessionStorage unavailable — non-fatal */
          }
          handlersRef.current.toast({ title: 'Assessment Submitted', description: 'Your results will appear here shortly.' });
          handlersRef.current.fetchSummary();
          handlersRef.current.refetchWithDelays();
        },
        onClose: () => {
          handlersRef.current.fetchSummary();
          setQuizLink(null);
        },
        onError: (e) => {
          const message = e?.message || 'The assessment player encountered an error.';
          setMountError(message);
          setQuizLink(null);
        },
      });
    } catch (e) {
      setMountError(e?.message || 'Failed to mount the assessment player.');
      return;
    }
    return () => {
      try {
        mounted?.destroy();
      } catch {
        /* ignore teardown errors */
      }
    };
  }, [quizLink]);

  const handleCancelQuiz = () => {
    setQuizLink(null);
    fetchSummary();
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (isLoadingSummary) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground">Loading your assessment status...</p>
        </div>
      </div>
    );
  }

  // ── Active quiz (iframe mounted) ─────────────────────────────────────
  if (quizLink) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <BrainCircuit className="h-8 w-8 text-indigo-600" />
              Behavioral Assessment
            </h1>
            <p className="text-muted-foreground mt-2">Complete the assessment below. It closes automatically when done.</p>
          </div>
          <Button variant="outline" onClick={handleCancelQuiz} className="gap-2 shrink-0">
            <XCircle className="h-4 w-4" /> Exit
          </Button>
        </div>
        {mountError && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="pt-4 text-sm text-red-700">{mountError}</CardContent>
          </Card>
        )}
        <Card className="shadow-lg border-indigo-100 overflow-hidden">
          <div ref={mountRef} className="min-h-[560px] w-full" />
        </Card>
      </div>
    );
  }

  const isCoolingDown = cooldownRemaining > 0;
  const isCompleted = quizSummary?.status === 'completed' && quizSummary?.completedAt;
  const quadEntries = quizSummary?.results ? Object.entries(quizSummary.results) : [];

  // ── Completed + cooling down ─────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-emerald-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-900">Assessment Completed</CardTitle>
            <CardDescription className="text-emerald-700">
              Completed {quizSummary.completedAt ? new Date(quizSummary.completedAt).toLocaleString() : ''}
              {quizSummary.totalQuestionsAnswered != null && ` · ${quizSummary.totalQuestionsAnswered} questions answered`}
              {quizSummary.cycleNumber != null && ` · Cycle ${quizSummary.cycleNumber}`}
            </CardDescription>
          </CardHeader>
          {quadEntries.length > 0 && (
            <CardContent className="space-y-6 pt-6 px-10">
              {quadEntries.map(([trait, val]) => {
                const score = typeof val?.score === 'number' ? val.score : typeof val === 'number' ? val : null;
                if (score == null) return null;
                return (
                  <div key={trait}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700 capitalize">{trait}</span>
                      <span className="font-bold text-slate-900">{score}/100</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                );
              })}
              {Array.isArray(quizSummary.skills) && quizSummary.skills.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Skill scores</h3>
                  <div className="space-y-4">
                    {quizSummary.skills.map((s) => (
                      <div key={s.name}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-slate-700">{s.name}</span>
                          <span className="font-bold text-slate-900">{s.score}/100</span>
                        </div>
                        <Progress value={s.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
          <CardContent className="pt-4">
            {isCoolingDown ? (
              <div className="flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <Clock className="h-4 w-4" />
                You can retake this assessment in {formatCooldown(cooldownRemaining)}.
              </div>
            ) : (
              <div className="flex justify-center">
                <Button onClick={handleStartQuiz} disabled={isStarting} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isStarting ? 'Starting...' : 'Retake Assessment'}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center pb-8 pt-2">
            <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
              Back to Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── Start screen ─────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-indigo-600" />
          Behavioral Assessment
        </h1>
        <p className="text-muted-foreground mt-2">
          Understand your working style. This science-backed assessment maps to core competencies.
        </p>
      </div>

      <Card className="shadow-lg border-indigo-100">
        <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-4 rounded-t-xl">
          <CardTitle className="text-lg text-indigo-900">What to expect</CardTitle>
          <CardDescription className="text-indigo-700">
            Answer honestly — there are no right or wrong answers. Your results may take up to{' '}
            {Math.round(RESULTS_NOTE_MS / 60000)} minutes to appear after submission.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 pb-8 px-8 space-y-4">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
              Takes about 10–15 minutes to complete in one sitting.
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
              Measures communication, leadership, adaptability, resilience, and teamwork.
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
              You can retake it once every 24 hours.
            </li>
          </ul>

          {scriptError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{scriptError}</div>
          )}
          {mountError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{mountError}</div>
          )}
          {isCoolingDown && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <Clock className="h-4 w-4" />
              Available again in {formatCooldown(cooldownRemaining)}.
            </div>
          )}
          {quizSummary?.status === 'initiated' && !isCoolingDown && (
            <div className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
              You have an assessment in progress. Press Start to resume it with a fresh link.
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t bg-slate-50/50 p-6 rounded-b-xl">
          <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
            Back to Profile
          </Button>
          <Button
            onClick={handleStartQuiz}
            disabled={isStarting || isCoolingDown}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 min-w-[200px]"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start Assessment
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

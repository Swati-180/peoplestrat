# MayaMaya Quiz SDK — Portable Implementation Plan + Code Snippets

Copy-paste plan to re-implement Eleviq's quiz in another project. All snippets below are taken directly from the current implementation.

---

## 0. Architecture to replicate

```text
Frontend (React) --POST /quiz/start-quiz--> Backend --initiate(userId)--> MayaMaya Cloud
Frontend <--{quizLink}-- Backend (save initiated doc)
Frontend --mountQuiz({el, getQuizLink})--> iframe (/js/mayamaya-quiz.min.js)
MayaMaya Cloud --POST /quiz/webhook (signed mmQuizzes.results.completed)--> Backend
Backend --saveWebhookResult + post-pipeline--> Mongo (QuizResult -> Capabilities -> Pathways -> Report)
Frontend --GET /quiz/:orgId/:userId (poll 1s/5s/10s/30s)--> Backend (24h cooldown)
```

Active flag in Eleviq: `frontend/src/features/participant/quiz/components/quiz.view.tsx:26`

```ts
const USE_MAYAMAYA_SDK = true;
```

---

## 1. Install server SDK

From `backend/package.json:39`:

```json
{
  "dependencies": {
    "mmquizzes-server-sdk": "file:mmquizzes-server-sdk-0.1.0.tgz"
  }
}
```

In new project:

```bash
# copy mmquizzes-server-sdk-0.1.0.tgz from eleviq/backend/
npm install ./mmquizzes-server-sdk-0.1.0.tgz
# provides: MayamayaQuizClient, MayamayaWebhookEvent
```

Frontend has **no npm dep** — vendored browser bundle:

```bash
# copy
eleviq/frontend/public/js/mayamaya-quiz.min.js -> <new-project>/public/js/mayamaya-quiz.min.js
# served as /js/mayamaya-quiz.min.js
```

---

## 2. Env (backend)

From `backend/src/config/env.ts:44-47,87-88`:

```ts
// config/env.ts (zod)
MAYAMAYA_API_KEY: z.string().min(1, 'MAYAMAYA_API_KEY is required'),
MAYAMAYA_BASE_URL: z.string().default('https://developers-api-01.mayamaya.ai'),
MAYAMAYA_WEBHOOK_URL: z.string().url().default('http://localhost:5000/api/quiz/webhook'),
MAYAMAYA_EMBED_ORIGIN: z.string().url().optional(),
```

```ts
// after parse:
MAYAMAYA_EMBED_ORIGIN: (baseEnv.MAYAMAYA_EMBED_ORIGIN || baseEnv.FRONTEND_APP_URL).replace(/\/$/, ''),
```

`.env` for new project:

```env
MAYAMAYA_API_KEY=xxx
MAYAMAYA_BASE_URL=https://developers-api-01.mayamaya.ai
MAYAMAYA_WEBHOOK_URL=https://<public-backend>/api/quiz/webhook
MAYAMAYA_EMBED_ORIGIN=https://<frontend>
FRONTEND_APP_URL=https://<frontend>
```

Frontend env from `frontend/src/config/env.ts:4`:

```ts
VITE_API_URL: z.string().url().default('http://localhost:5000/api')
```

---

## 3. Shared contract

From `shared/src/assessment/quiz/quiz.schema.ts:1-25`:

```ts
import { z } from 'zod';

export const quizAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
});

export const quizSubmitSchema = z.object({
  params: z.object({ orgId: z.string().min(1) }),
  body: z.object({
    userId: z.string().min(1),
    organizationId: z.string().min(1),
    answers: z.array(quizAnswerSchema).min(1).max(60),
    cycleNumber: z.number().int().positive().optional(),
    sprintNumber: z.number().int().positive().optional(),
  }),
});
```

Types from `shared/src/assessment/quiz/quiz.types.ts:37-52`:

```ts
export interface QuizWebhookData {
  userId: string;
  cycleNumber: number;
  sprintNumber: number;
  totalQuestionsAnswered: number;
  completedAt: string;
  results: { spirit:{score:number|null}; purpose:{score:number|null}; rewards:{score:number|null}; profession:{score:number|null} };
  skills: { name:string; score:number; subcategories:{name:string;score:number}[] }[];
}
```

---

## 4. Backend — Model

From `backend/src/modules/quiz/quiz-result.model.ts:31-121`:

```ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IQuizResultDocument extends Document {
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  status: 'initiated' | 'completed';
  quizLink: string;
  expiresAt: Date;
  completedAt?: Date;
  cycleNumber?: number;
  sprintNumber?: number;
  assessmentVersion: 'v1';
  scoringVersion: 'v1';
  totalQuestionsAnswered?: number;
  results?: { spirit:{score:number|null}; purpose:{score:number|null}; rewards:{score:number|null}; profession:{score:number|null} };
  skills?: Array<{ name:string; score:number; subcategories:Array<{name:string;score:number}> }>;
  webhookEventId?: string;
  createdAt: Date; updatedAt: Date;
}

const quizResultSchema = new Schema<IQuizResultDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
  status: { type: String, enum: ['initiated','completed'], required: true },
  quizLink: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  cycleNumber: { type: Number, default: null },
  sprintNumber: { type: Number, default: null },
  assessmentVersion: { type: String, enum: ['v1'], default: 'v1' },
  scoringVersion: { type: String, enum: ['v1'], default: 'v1' },
  totalQuestionsAnswered: { type: Number, default: null },
  results: { type: Schema.Types.Mixed, default: null },
  skills: { type: [Schema.Types.Mixed], default: null },
  webhookEventId: { type: String, default: null },
}, { timestamps: true });

quizResultSchema.index({ userId: 1 });
quizResultSchema.index({ webhookEventId: 1 }, { unique: true, sparse: true });

export const QuizResultModel = model<IQuizResultDocument>('QuizResult', quizResultSchema);
```

---

## 5. Backend — Service (SDK wrapper)

From `backend/src/modules/quiz/quiz.service.ts:31-116`:

```ts
import { MayamayaQuizClient, MayamayaWebhookEvent } from 'mmquizzes-server-sdk';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { QuizResultModel } from './quiz-result.model.js';

export class QuizService {
  private client: MayamayaQuizClient;
  constructor() {
    this.client = new MayamayaQuizClient({
      apiKey: env.MAYAMAYA_API_KEY,
      baseUrl: env.MAYAMAYA_BASE_URL,
      resultsWebhookUrl: env.MAYAMAYA_WEBHOOK_URL,
      embedOrigin: env.MAYAMAYA_EMBED_ORIGIN,
    });
  }

  initiate(userId: string) {
    return this.client.initiate(userId); // -> { quizLink, expiresInSeconds }
  }

  handleWebhookEvent(rawBody: Buffer, headers: Record<string, unknown>): MayamayaWebhookEvent {
    return this.client.constructWebhookEvent(rawBody, headers); // throws on bad signature
  }

  async saveInitiated(userId: string, organizationId: string, quizLink: string, expiresInSeconds: number) {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    await QuizResultModel.deleteMany({ userId: new Types.ObjectId(userId) });
    await QuizResultModel.create({
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      status: 'initiated', quizLink, expiresAt,
    });
  }

  async saveWebhookResult(event: MayamayaWebhookEvent) {
    const { userId, cycleNumber, sprintNumber, totalQuestionsAnswered, completedAt, results, skills } = event.data;
    const existing = await QuizResultModel.findOne({ webhookEventId: event.id });
    if (existing) return null; // idempotent replay guard
    return QuizResultModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: {
          status: 'completed',
          completedAt: new Date(completedAt),
          cycleNumber, sprintNumber,
          assessmentVersion: 'v1', scoringVersion: 'v1',
          totalQuestionsAnswered, results, skills,
          webhookEventId: event.id,
      }},
      { upsert: false, returnDocument: 'after', sort: { createdAt: -1 } }
    );
  }

  async getParticipantQuizSummary(userId: string) {
    const result = await QuizResultModel.findOne({ userId: new Types.ObjectId(userId), status: 'completed' })
      .sort({ completedAt: -1 }).lean();
    if (!result) return null;
    return {
      totalQuestionsAnswered: result.totalQuestionsAnswered ?? null,
      cycleNumber: result.cycleNumber ?? null,
      sprintNumber: result.sprintNumber ?? null,
      completedAt: result.completedAt ?? null,
    };
  }
}
export const quizService = new QuizService();
```

---

## 6. Backend — Controller + Router + App wiring

Router from `backend/src/modules/quiz/quiz.router.ts:10-25`:

```ts
import { Router } from 'express';
import { quizController } from './quiz.controller.js';
import { authenticate } from '../core/middlewares/auth.middleware.js';
import { validate } from '../core/middlewares/validate.middleware.js';
import { requireOrgMembership } from '../core/middlewares/org-auth.middleware.js';
import { quizSubmitSchema } from '@eleviq/shared';

export const quizRouter = Router();
quizRouter.post('/start-quiz', quizController.startQuiz); // public by design
quizRouter.post('/submit/:orgId', validate(quizSubmitSchema), authenticate, requireOrgMembership, quizController.submitQuiz);
quizRouter.post('/webhook', quizController.webhook); // HMAC via SDK, no session
quizRouter.get('/:orgId/:userId', authenticate, requireOrgMembership, quizController.getParticipantQuizSummary);
```

Critical `app.ts` wiring from `backend/src/app.ts:44-50,61`:

```ts
// must preserve rawBody for constructWebhookEvent HMAC
app.use(express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => { req.rawBody = buf; },
}));
app.use('/api/quiz', quizRouter);
```

Controller core from `backend/src/modules/quiz/quiz.controller.ts:17-58,165-216`:

```ts
startQuiz = async (req, res, next) => {
  try {
    const { userId, organizationId } = req.body;
    // 1. verify membership (403 if not member)
    // 2. set User.talentScanStatus = 'In Progress'
    // 3. const result = await quizService.initiate(userId);
    // 4. await quizService.saveInitiated(userId, organizationId, result.quizLink, result.expiresInSeconds);
    // 5. res.json(result);
  } catch (e) {
    // reset talentScanStatus to 'Not Started'
    next(e);
  }
};

webhook = async (req, res, next) => {
  try {
    const rawBody = (req as any).rawBody as Buffer;
    const event = quizService.handleWebhookEvent(rawBody, req.headers as any);
    if (event.type !== 'mmQuizzes.results.completed') return res.json({ received: true });
    const quizResult = await quizService.saveWebhookResult(event);
    if (!quizResult) return res.json({ received: true }); // replay
    await this.runPostQuizPipeline(quizResult, event.data.results, event.data.skills);
    res.json({ received: true });
  } catch (e) {
    res.status(400).json({ message: 'bad signature' });
  }
};
```

Post-pipeline stub (replace with your own downstream — Eleviq does `capability→pathway→report`, failures never fail webhook):

```ts
private async runPostQuizPipeline(quizResult, results, skills) {
  await UserModel.updateOne({ _id: quizResult.userId }, { $set: { talentScanStatus: 'Completed' } });
  try { await capabilityService.saveFromQuizEvent(userId, results, skills, 'v1', 'v1'); } catch(e){ console.error(e); }
  try { await pathwayService.generate(...); } catch(e){ console.error(e); }
  try { await reportService.generate(...); } catch(e){ console.error(e); }
}
```

Full version: `backend/src/modules/quiz/quiz.controller.ts:95-163`.

---

## 7. Frontend — SDK loader + mount (copy-paste)

Type + loader from `frontend/src/features/participant/quiz/components/quiz.view.tsx:28-53,161-169`:

```ts
type MayamayaQuizSdk = {
  mountQuiz: (options: {
    el: HTMLElement;
    getQuizLink: () => Promise<string>;
    onComplete?: (r: { cycleNumber:number|null; questionsAnswered:number|null; completedAt:string|null }) => void;
    onClose?: () => void;
    onError?: (e: Error) => void;
  }) => { iframe: HTMLIFrameElement; destroy: () => void };
};
declare global { interface Window { MayamayaQuiz?: MayamayaQuizSdk } }

// in component:
useEffect(() => {
  const script = document.createElement('script');
  script.src = '/js/mayamaya-quiz.min.js';
  script.async = true;
  document.head.appendChild(script);
  return () => { script.remove(); };
}, []);
```

Start + mount from `frontend/src/features/participant/quiz/components/quiz.view.tsx:171-195,210-254`:

```tsx
const [quizLink, setQuizLink] = useState<string|null>(null);
const mountRef = useRef<HTMLDivElement|null>(null);
const quizLinkRef = useRef<string|null>(null);
useEffect(()=>{ quizLinkRef.current = quizLink; },[quizLink]);

const handleStartQuiz = async () => {
  const res = await fetch(`${env.VITE_API_URL}/quiz/start-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // add if your API uses cookies
    body: JSON.stringify({ userId: user.id, organizationId: activeOrg.id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to start quiz');
  setQuizLink(data.quizLink);
};

const attachMount = useCallback((node: HTMLDivElement|null) => {
  if (!node) return;
  if (!quizLinkRef.current) return;
  const link = quizLinkRef.current;
  const mounted = window.MayamayaQuiz!.mountQuiz({
    el: node,
    getQuizLink: async () => link,
    onComplete: () => {
      sessionStorage.setItem('eleviq_quiz_submitted_at', String(Date.now()));
      refetchQuizSummary();
      // staggered re-checks because webhook is async (1s/5s/10s/30s)
      [1000,5000,10000,30000].forEach(d => setTimeout(()=>refetchQuizSummary(), d));
    },
    onClose: () => { refetchQuizSummary(); setQuizLink(null); },
    onError: (e) => setQuizLink(null),
  });
  return () => mounted.destroy();
}, []);

// JSX:
{quizLink
  ? <div ref={attachMount} className="min-h-[560px] w-full" />
  : <button onClick={handleStartQuiz}>Start Scan</button>}
```

Constants from `:55-58`:

```ts
const COOLDOWN_MS = 24*60*60*1000;
const RESULTS_NOTE_MS = 5*60*1000;
const QUIZ_RESULT_CHECK_DELAYS_MS = [1000,5000,10000,30000];
```

Cooldown helpers from `:60-74` + summary hook from `frontend/src/features/console/participants/api/participant-profile.api.ts:104-126`:

```ts
function getRemainingCooldown(completedAt?: string|null) {
  if (!completedAt) return 0;
  const t = new Date(completedAt).getTime();
  if (isNaN(t)) return 0;
  const elapsed = Date.now() - t;
  return elapsed >= COOLDOWN_MS ? 0 : COOLDOWN_MS - elapsed;
}

// hook:
const getSummary = async (orgId: string, userId: string) => {
  const res = await apiClient.get(`/quiz/${orgId}/${userId}`);
  return res.data.data.quizSummary as { completedAt:string|null } | null;
};
// disable Start while getRemainingCooldown(summary?.completedAt) > 0
// show `Available again in HH:MM:SS`
```

Journey polling (optional but recommended) from `frontend/src/components/ui/journey-ribbon.tsx:47-71`:

```ts
// poll useMe + pathways every 5s (max 10min) while scan In Progress / snapshot processing
useEffect(()=>{
  const pending = user.talentScanStatus==='In Progress' || user.snapshotStatus==='processing';
  if(!pending) return;
  const id = setInterval(()=>{ refetchMe(); refetchPathways(); }, 5000);
  const t = setTimeout(()=>clearInterval(id), 10*60*1000);
  return ()=>{ clearInterval(id); clearTimeout(t); };
},[user]);
```

---

## 8. Optional: local fallback scoring

If you want offline mode without MayaMaya, port `backend/src/modules/quiz/quiz-scoring.ts:71-76,231-282` (`buildQuizScoring`) + `POST /quiz/submit/:orgId` (`backend/src/modules/quiz/quiz.service.ts:118-153`) + frontend `LocalQuizFlow` (`quiz.view.tsx:385-629`, `quiz-questions.api.ts`, `use-quiz-session.ts`, `quiz-rotation.ts:3-11`). Webhook path ignores this and uses MayaMaya's `results/skills` directly.

---

## 9. Integration checklist for new project

1. Copy `mmquizzes-server-sdk-0.1.0.tgz` + `public/js/mayamaya-quiz.min.js` + `quiz-result.model.ts` + `quiz.service.ts` + `quiz.controller.ts` + `quiz.router.ts`.
2. Add env vars (§2), add `rawBody` verify (§6), mount router, ensure `WEBHOOK_URL` is public.
3. Copy shared zod schema (§3) or inline it.
4. Copy frontend mount component (§7), add `GET /quiz/:orgId/:userId` summary hook + 24h cooldown + 5-min note + delayed refetches.
5. Implement `runPostQuizPipeline` stub with your own capability/report tables.
6. Test: `POST /start-quiz` → iframe loads → complete quiz → `POST /webhook` 200 → DB `completed` → summary `completedAt` set → cooldown active.

Thought · 2ms
Done — full plan with code snippets written to:
mayamaya-quiz-sdk.md in /home/splintersword/Projects/Work/eleviq/
It includes:
architecture diagram
server SDK install (mmquizzes-server-sdk-0.1.0.tgz) + vendored /js/mayamaya-quiz.min.js
env vars
shared Zod contract
QuizResultModel, QuizService, controller/router/app rawBody wiring
frontend mountQuiz loader, start/mount, cooldown, polling snippets
local fallback + integration checklist
Open that file to copy-paste into your other project.

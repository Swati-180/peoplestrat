import User from '../models/User.js';
import Employee from '../models/Employee.js';
import BehavioralResult from '../models/BehavioralResult.js';
import { quizService } from '../services/quizService.js';

// Ported from mayamaya_plan.md §6 (Eleviq `quiz.controller.ts`).
// userId-only: identity comes from the JWT (`req.user`), never from an org.

const getAuthUserId = (req) => {
  const u = req.user || {};
  const id = u._id || u.id;
  return id ? String(id) : null;
};

// Origins allowed to host the quiz iframe. The SDK requires the framing origin
// to be opted in by the server holding the API key, so a client-supplied origin
// is only honored when it matches this allowlist — never blindly trusted.
const getAllowedEmbedOrigins = () => {
  const extras = String(process.env.MAYAMAYA_EXTRA_EMBED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const list = [
    process.env.MAYAMAYA_EMBED_ORIGIN,
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000',
    ...extras,
  ]
    .filter(Boolean)
    .map((s) => String(s).replace(/\/$/, ''));
  return [...new Set(list)];
};

const isValidOriginShape = (s) => /^https?:\/\/[^/:]+(:\d+)?$/.test(String(s || ''));

const resolveEmbedOrigin = (requested) => {
  const allowed = getAllowedEmbedOrigins();
  const fallback = allowed[0];
  if (!requested) return { embedOrigin: fallback, allowed };
  const normalized = String(requested).replace(/\/$/, '');
  if (!isValidOriginShape(normalized)) {
    const err = new Error(`Invalid embedOrigin shape (must be an origin like https://app.example.com): ${requested}`);
    err.status = 400;
    throw err;
  }
  if (!allowed.includes(normalized)) {
    const err = new Error(
      `embedOrigin ${normalized} is not allowed. Allowed: ${allowed.join(', ') || '(none configured)'}. ` +
        `Set MAYAMAYA_EMBED_ORIGIN or MAYAMAYA_EXTRA_EMBED_ORIGINS to include it.`
    );
    err.status = 400;
    throw err;
  }
  return { embedOrigin: normalized, allowed };
};

const clampScore = (v, fallback = 0) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.round(Math.min(100, Math.max(0, v)));
};

const avg = (nums) => {
  const valid = nums.filter((n) => typeof n === 'number' && Number.isFinite(n));
  if (valid.length === 0) return null;
  return valid.reduce((s, n) => s + n, 0) / valid.length;
};

// Map MayaMaya's { spirit, purpose, rewards, profession } + skills[] onto
// peoplestrat's 5 behavioral traits. Skill-name matching is keyword based with
// fallback to the overall mean so unknown skill taxonomies still produce scores.
const mapMayaToBehavioralScores = (results, skills) => {
  const quadScores = [results?.spirit?.score, results?.purpose?.score, results?.rewards?.score, results?.profession?.score].filter(
    (n) => typeof n === 'number' && Number.isFinite(n)
  );
  const flatSkills = [];
  (skills || []).forEach((s) => {
    if (typeof s?.score === 'number' && Number.isFinite(s.score)) {
      flatSkills.push({ name: String(s.name || ''), score: s.score });
    }
    (s?.subcategories || []).forEach((sub) => {
      if (typeof sub?.score === 'number' && Number.isFinite(sub.score)) {
        flatSkills.push({ name: `${s?.name || ''} ${sub?.name || ''}`, score: sub.score });
      }
    });
  });

  const overall = avg([...quadScores, ...flatSkills.map((s) => s.score)]);
  const base = overall ?? 0;

  const matchAvg = (patterns) => {
    const hits = flatSkills.filter((s) => patterns.some((p) => p.test(s.name))).map((s) => s.score);
    return avg(hits) ?? base;
  };

  return {
    communication: clampScore(matchAvg([/communic/i, /purpose/i]), clampScore(base)),
    leadership: clampScore(matchAvg([/lead/i, /profession/i, /manage/i]), clampScore(base)),
    adaptability: clampScore(matchAvg([/adapt/i, /purpose/i, /spirit/i, /agil/i, /learn/i]), clampScore(base)),
    resilience: clampScore(matchAvg([/resilien/i, /spirit/i, /reward/i, /grit/i, /stress/i]), clampScore(base)),
    teamwork: clampScore(matchAvg([/team/i, /collab/i, /reward/i, /social/i, /empath/i]), clampScore(base)),
  };
};

// POST /api/quiz/start-quiz (protected)
export const startQuiz = async (req, res) => {
  try {
    const userId = getAuthUserId(req) || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Verify the user exists (protect already did for JWT users, but be explicit).
    if (!String(userId).startsWith('demo-')) {
      const user = await User.findById(userId).select('_id');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
    }

    // The page origin hosting the iframe. Frontend sends window.location.origin;
    // validated against the server allowlist so framing can't be hijacked.
    let embedOrigin;
    try {
      ({ embedOrigin } = resolveEmbedOrigin(req.body?.embedOrigin));
    } catch (e) {
      return res.status(e.status || 400).json({ success: false, error: e.message });
    }

    console.log(`[QUIZ] initiate user=${userId} embedOrigin=${embedOrigin}`);
    const result = await quizService.initiate(String(userId), { embedOrigin });
    await quizService.saveInitiated(String(userId), result.quizLink, result.expiresInSeconds);
    return res.json({ success: true, data: { ...result, embedOrigin }, ...result, embedOrigin });
  } catch (err) {
    const status = err?.status || (err?.message || '').includes('not configured') ? 500 : 500;
    console.error('[QUIZ] startQuiz failed:', err?.message || err);
    return res.status(status).json({ success: false, error: err?.message || 'Failed to start quiz' });
  }
};

// POST /api/quiz/webhook (public — HMAC via SDK, no session)
export const webhook = async (req, res) => {
  try {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const event = quizService.handleWebhookEvent(rawBody, req.headers);
    if (event?.type !== 'mmQuizzes.results.completed') {
      return res.json({ received: true });
    }
    const quizResult = await quizService.saveWebhookResult(event);
    if (!quizResult) {
      return res.json({ received: true }); // idempotent replay
    }
    await runPostQuizPipeline(quizResult, event.data?.results, event.data?.skills);
    return res.json({ received: true });
  } catch (err) {
    console.error('[QUIZ] webhook rejected:', err?.message || err);
    return res.status(400).json({ message: 'bad signature' });
  }
};

// GET /api/quiz/summary (protected — current user)
export const getQuizSummary = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const quizSummary = await quizService.getQuizSummary(String(userId));
    return res.json({ success: true, data: { quizSummary } });
  } catch (err) {
    // Invalid ObjectId (e.g. demo-token user) → no summary rather than 500.
    if ((err?.message || '').startsWith('Invalid userId')) {
      return res.json({ success: true, data: { quizSummary: null } });
    }
    return res.status(500).json({ success: false, error: err?.message || 'Failed to load quiz summary' });
  }
};

// Downstream pipeline: QuizResult → BehavioralResult + Employee.
// Failures are logged and never fail the webhook (plan §6).
async function runPostQuizPipeline(quizResult, results, skills) {
  try {
    const finalScores = mapMayaToBehavioralScores(results, skills);

    // Find the employee record via the quiz owner's email.
    const owner = await User.findById(quizResult.userId).select('email');
    if (!owner?.email) {
      console.error('[QUIZ] pipeline: no user email for quiz owner, skipping Employee update');
      return;
    }
    const emp = await Employee.findOne({ email: owner.email });
    if (!emp) {
      console.error(`[QUIZ] pipeline: no Employee record for ${owner.email}, skipping Employee update`);
      return;
    }

    try {
      const rawResponses = (skills || []).map((s, i) => ({
        questionId: `mayamaya-skill-${i}`,
        responseValue: clampScore(s?.score, 3),
      }));
      await BehavioralResult.create({
        employeeId: emp._id,
        scores: finalScores,
        rawResponses,
      });
    } catch (e) {
      console.error('[QUIZ] pipeline: BehavioralResult save failed:', e?.message || e);
    }

    try {
      emp.communication = finalScores.communication;
      emp.leadership = finalScores.leadership;
      emp.adaptability = finalScores.adaptability;
      emp.resilience = finalScores.resilience;
      emp.teamwork = finalScores.teamwork;
      const avgSoftSkills =
        (emp.communication + emp.leadership + emp.adaptability + emp.resilience + emp.teamwork) / 5;
      const oldFitment = emp.fitmentScore || 50;
      emp.fitmentScore = Math.round(oldFitment * 0.7 + avgSoftSkills * 0.3);
      await emp.save();
    } catch (e) {
      console.error('[QUIZ] pipeline: Employee update failed:', e?.message || e);
    }
  } catch (e) {
    console.error('[QUIZ] pipeline failed:', e?.message || e);
  }
}

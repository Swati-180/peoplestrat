import mongoose from 'mongoose';
import { MayamayaQuizClient } from 'mmquizzes-server-sdk';
import QuizResult from '../models/QuizResult.js';

// Ported from mayamaya_plan.md §5 (Eleviq `quiz.service.ts`).
// userId-only: no organizationId required. organizationId is accepted as
// optional for forward-compat but defaults to null.

const getEnv = () => ({
  apiKey: process.env.MAYAMAYA_API_KEY || '',
  baseUrl: process.env.MAYAMAYA_BASE_URL || 'https://developers-api-01.mayamaya.ai',
  resultsWebhookUrl: process.env.MAYAMAYA_WEBHOOK_URL || 'http://localhost:5001/api/quiz/webhook',
  embedOrigin: (process.env.MAYAMAYA_EMBED_ORIGIN || process.env.FRONTEND_URL || '').replace(/\/$/, ''),
});

const toObjectId = (userId) => {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  if (mongoose.Types.ObjectId.isValid(userId)) return new mongoose.Types.ObjectId(userId);
  throw new Error(`Invalid userId (not an ObjectId): ${userId}`);
};

class QuizService {
  constructor() {
    const env = getEnv();
    this._config = env;
    this.client = null;
    if (env.apiKey) {
      this.client = new MayamayaQuizClient({
        apiKey: env.apiKey,
        baseUrl: env.baseUrl,
        resultsWebhookUrl: env.resultsWebhookUrl,
        embedOrigin: env.embedOrigin || undefined,
      });
    }
  }

  _requireClient() {
    if (!this.client) {
      // Lazily (re)try in case env was set after first import (e.g. tests).
      const env = getEnv();
      if (!env.apiKey) {
        const err = new Error('MAYAMAYA_API_KEY is not configured');
        err.status = 500;
        throw err;
      }
      this.client = new MayamayaQuizClient({
        apiKey: env.apiKey,
        baseUrl: env.baseUrl,
        resultsWebhookUrl: env.resultsWebhookUrl,
        embedOrigin: env.embedOrigin || undefined,
      });
    }
    return this.client;
  }

  initiate(userId, options = {}) {
    const client = this._requireClient();
    // Per-call embedOrigin override (validated by the controller against an
    // allowlist). Falls back to the constructor default from env.
    const { embedOrigin, ...rest } = options || {};
    return client.initiate(String(userId), {
      ...rest,
      ...(embedOrigin ? { embedOrigin } : {}),
    });
  }

  handleWebhookEvent(rawBody, headers) {
    return this._requireClient().constructWebhookEvent(rawBody, headers);
  }

  async saveInitiated(userId, quizLink, expiresInSeconds, organizationId = null) {
    const objectId = toObjectId(userId);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    // Clear prior attempts so GET /summary reflects the latest link.
    await QuizResult.deleteMany({ userId: objectId });
    await QuizResult.create({
      userId: objectId,
      organizationId: organizationId,
      status: 'initiated',
      quizLink,
      expiresAt,
    });
  }

  async saveWebhookResult(event) {
    const { userId, cycleNumber, sprintNumber, totalQuestionsAnswered, completedAt, results, skills } =
      event.data || {};
    // Idempotent replay guard (plan §5).
    const existing = await QuizResult.findOne({ webhookEventId: event.id });
    if (existing) return null;
    return QuizResult.findOneAndUpdate(
      { userId: toObjectId(userId) },
      {
        $set: {
          status: 'completed',
          completedAt: completedAt ? new Date(completedAt) : new Date(),
          cycleNumber: cycleNumber ?? null,
          sprintNumber: sprintNumber ?? null,
          assessmentVersion: 'v1',
          scoringVersion: 'v1',
          totalQuestionsAnswered: totalQuestionsAnswered ?? null,
          results: results ?? null,
          skills: skills ?? null,
          webhookEventId: event.id,
        },
      },
      { upsert: false, returnDocument: 'after', sort: { createdAt: -1 } }
    );
  }

  async getQuizSummary(userId) {
    const result = await QuizResult.findOne({ userId: toObjectId(userId) })
      .sort({ updatedAt: -1 })
      .lean();
    if (!result) return null;
    return {
      status: result.status,
      quizLink: result.status === 'initiated' ? result.quizLink : null,
      totalQuestionsAnswered: result.totalQuestionsAnswered ?? null,
      cycleNumber: result.cycleNumber ?? null,
      sprintNumber: result.sprintNumber ?? null,
      completedAt: result.completedAt ?? null,
      results: result.results ?? null,
      skills: result.skills ?? null,
    };
  }
}

export const quizService = new QuizService();
export default quizService;

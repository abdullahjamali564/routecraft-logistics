import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

export const requireWebhookSecret: RequestHandler = (req, _res, next) => {
  if (!env.N8N_WEBHOOK_SECRET || req.header('x-webhook-secret') !== env.N8N_WEBHOOK_SECRET) return next(new AppError(401, 'The webhook secret is invalid', 'INVALID_WEBHOOK_SECRET'));
  next();
};

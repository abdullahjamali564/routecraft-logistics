import type { RequestHandler } from 'express';
import { z, type ZodType } from 'zod';

export const validateBody = (schema: ZodType): RequestHandler => (req, _res, next) => {
  req.body = schema.parse(req.body);
  next();
};

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid MongoDB ObjectId');

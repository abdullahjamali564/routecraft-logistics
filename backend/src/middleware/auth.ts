import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel, type UserRole } from '../models/User.js';
import { AppError, asyncHandler } from './errors.js';

type TokenPayload = { sub: string; role: UserRole; merchantId?: string };

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'A Bearer token is required', 'AUTHENTICATION_REQUIRED');
  let payload: TokenPayload;
  try {
    payload = jwt.verify(header.slice(7), env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new AppError(401, 'The access token is invalid or expired', 'INVALID_TOKEN');
  }
  if (!payload.sub || !payload.role) throw new AppError(401, 'The access token is malformed', 'INVALID_TOKEN');
  const user = await UserModel.findById(payload.sub).select('_id role status');
  if (!user || user.status !== 'active' || user.role !== payload.role) throw new AppError(401, 'User authentication is no longer valid', 'INVALID_TOKEN');
  req.auth = { userId: user.id, role: user.role, merchantId: payload.merchantId };
  next();
});

export const requireRoles = (...roles: UserRole[]): RequestHandler => (req, _res, next) => {
  if (!req.auth) return next(new AppError(401, 'Authentication is required', 'AUTHENTICATION_REQUIRED'));
  if (!roles.includes(req.auth.role)) return next(new AppError(403, 'You do not have permission to access this resource', 'FORBIDDEN'));
  return next();
};

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

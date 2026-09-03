import type { RequestHandler } from 'express';
import { MerchantProfileModel } from '../models/MerchantProfile.js';
import { UserModel } from '../models/User.js';
import { asyncHandler } from '../middleware/errors.js';
import { login, registerMerchant } from '../services/authService.js';

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const result = await registerMerchant(req.body);
  res.status(201).json({ success: true, data: { token: result.token, user: result.user, merchant: result.merchant } });
});

export const loginUser: RequestHandler = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  res.json({ success: true, data: result });
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.auth!.userId).select('-passwordHash');
  const merchant = req.auth!.merchantId ? await MerchantProfileModel.findById(req.auth!.merchantId) : undefined;
  res.json({ success: true, data: { user, merchant } });
});

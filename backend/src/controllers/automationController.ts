import type { RequestHandler } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errors.js';
import { assignOrder, findIdleDrivers, nightlyMaintenance, recordLocation } from '../services/automationService.js';

const coordinatesSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });
export const locationSchema = coordinatesSchema.extend({ capturedAt: z.coerce.date().optional() });
export const nearbySchema = coordinatesSchema.extend({ radiusMeters: z.number().positive().max(100000).default(5000) });
export const assignSchema = z.object({ driverId: z.string().regex(/^[a-f\d]{24}$/i) });
export const nearbyDrivers: RequestHandler = asyncHandler(async (req, res) => {
  const input = nearbySchema.parse({ latitude: Number(req.query.latitude), longitude: Number(req.query.longitude), radiusMeters: Number(req.query.radiusMeters ?? 5000) });
  const drivers = await findIdleDrivers(input.latitude, input.longitude, input.radiusMeters);
  res.json({ success: true, data: drivers });
});
export const assign: RequestHandler = asyncHandler(async (req, res) => {
  const input = assignSchema.parse(req.body);
  const order = await assignOrder(z.string().parse(req.params.orderId), input.driverId);
  res.json({ success: true, data: order });
});
export const location: RequestHandler = asyncHandler(async (req, res) => {
  const input = locationSchema.parse(req.body);
  const result = await recordLocation(req.auth!.userId, input.latitude, input.longitude, input.capturedAt ?? new Date());
  res.json({ success: true, data: result });
});
export const maintenance: RequestHandler = asyncHandler(async (req, res) => {
  const date = req.query.date ? z.coerce.date().parse(req.query.date) : new Date();
  res.json({ success: true, data: await nightlyMaintenance(date) });
});


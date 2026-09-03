import type { RequestHandler } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errors.js';
import { objectIdSchema } from '../middleware/validate.js';
import { createOrder, findNearbyDrivers, listOrders, scanOrder, updateOrderStage } from '../services/orderService.js';

const coordinateSchema = z.object({ type: z.literal('Point'), coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]) });
const addressSchema = z.object({ addressLine: z.string().min(1), city: z.string().min(1), region: z.string().optional(), postalCode: z.string().optional(), location: coordinateSchema });
export const createOrderSchema = z.object({ trackingNumber: z.string().min(3).max(100), merchantId: objectIdSchema.optional(), pickup: addressSchema, dropoff: addressSchema, recipient: z.object({ phone: z.string().min(7).max(30).optional(), verificationPin: z.string().min(4).max(8).optional() }).optional(), package: z.object({ weight: z.number().nonnegative(), dimensions: z.object({ length: z.number().nonnegative(), width: z.number().nonnegative(), height: z.number().nonnegative() }).optional(), description: z.string().optional() }), priceBreakdown: z.object({ base: z.number().nonnegative(), distance: z.number().nonnegative().default(0), surcharge: z.number().nonnegative().default(0), discount: z.number().nonnegative().default(0), total: z.number().nonnegative(), currency: z.string().length(3).default('USD') }), assignedDriverId: objectIdSchema.optional() });
export const stageSchema = z.object({ stage: z.enum(['assigned', 'picked_up', 'in_transit', 'delivered', 'failed']) });
export const scanSchema = z.object({ barcode: z.string().min(1).max(500), action: z.enum(['pickup', 'dropoff']) });

export const create: RequestHandler = asyncHandler(async (req, res) => {
  const merchantId = req.auth!.role === 'merchant' ? req.auth!.merchantId : req.body.merchantId;
  if (!merchantId) return res.status(400).json({ success: false, error: { code: 'MERCHANT_REQUIRED', message: 'merchantId is required for operational users' } });
  const order = await createOrder(req.body, merchantId);
  res.status(201).json({ success: true, data: order });
});

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const orders = await listOrders(
    req.auth!.role === 'merchant' ? req.auth!.merchantId : undefined,
    req.auth!.role === 'driver' ? req.auth!.userId : undefined,
  );
  res.json({ success: true, data: orders });
});

export const updateStage: RequestHandler = asyncHandler(async (req, res) => {
  const orderId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid MongoDB ObjectId').parse(req.params.orderId);
  const order = await updateOrderStage(orderId, req.body.stage, req.auth!.role === 'merchant' ? req.auth!.merchantId : undefined, req.auth!.role === 'driver' ? req.auth!.userId : undefined);
  res.json({ success: true, data: order });
});

export const scan: RequestHandler = asyncHandler(async (req, res) => {
  const orderId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid MongoDB ObjectId').parse(req.params.orderId);
  const order = await scanOrder(orderId, req.auth!.userId, req.body.barcode, req.body.action);
  res.json({ success: true, data: order });
});

export const nearbyDrivers: RequestHandler = asyncHandler(async (req, res) => {
  const latitude = Number(req.query.latitude); const longitude = Number(req.query.longitude); const radiusMeters = Number(req.query.radiusMeters ?? 5000);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusMeters) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || radiusMeters <= 0 || radiusMeters > 100000) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid coordinates and radiusMeters (1-100000) are required' } });
  const drivers = await findNearbyDrivers([longitude, latitude], radiusMeters);
  res.json({ success: true, data: drivers });
});

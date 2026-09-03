import { AppError } from '../middleware/errors.js';
import { OrderModel, type Order } from '../models/Order.js';
import { DriverProfileModel } from '../models/DriverProfile.js';
import { findAvailableDriversNear } from '../repositories/DriverRepository.js';
import type { Types } from 'mongoose';
import { emitOrderCreated } from './automationService.js';

const stageTransitions: Record<string, string[]> = {
  pending: ['assigned', 'failed'], assigned: ['picked_up', 'failed'], picked_up: ['in_transit', 'failed'], in_transit: ['delivered', 'failed'], delivered: [], failed: []
};

export async function createOrder(input: Partial<Order>, merchantId: string) {
  const order = await OrderModel.create({ ...input, merchantId });
  if (order.stage === 'pending' && order.pickup.location?.coordinates?.length === 2 && order.dropoff.location?.coordinates?.length === 2) {
    void emitOrderCreated({ id: order._id.toString(), trackingNumber: order.trackingNumber, pickup: { location: { coordinates: order.pickup.location.coordinates } }, dropoff: { location: { coordinates: order.dropoff.location.coordinates } }, recipient: order.recipient });
  }
  return order;
}

export async function updateOrderStage(orderId: string, stage: string, merchantId?: string, driverUserId?: string) {
  const driver = driverUserId ? await DriverProfileModel.findOne({ userId: driverUserId }).select('_id') : undefined;
  const order = await OrderModel.findOne({
    _id: orderId,
    ...(merchantId ? { merchantId } : {}),
    ...(driverUserId ? { assignedDriverId: driver?._id } : {})
  });
  if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
  if (!stageTransitions[order.stage]?.includes(stage)) throw new AppError(409, `Cannot move an order from ${order.stage} to ${stage}`, 'INVALID_STAGE_TRANSITION');
  order.stage = stage as Order['stage'];
  return order.save();
}

export async function scanOrder(orderId: string, driverUserId: string, barcode: string, action: 'pickup' | 'dropoff') {
  const driver = await DriverProfileModel.findOne({ userId: driverUserId }).select('_id');
  const order = await OrderModel.findOne({ _id: orderId, assignedDriverId: driver?._id });
  if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
  const trackingNumber = barcode.trim().replace(/\/$/, '').split('/').pop();
  if (trackingNumber !== order.trackingNumber) throw new AppError(400, 'Barcode does not match this order', 'BARCODE_MISMATCH');
  const nextStage = action === 'pickup' ? 'picked_up' : 'delivered';
  if (!stageTransitions[order.stage]?.includes(nextStage)) throw new AppError(409, `Cannot scan ${action} while order is ${order.stage}`, 'INVALID_SCAN_STAGE');
  order.stage = nextStage;
  return order.save();
}

export async function listOrders(merchantId?: string, driverUserId?: string) {
  if (driverUserId) {
    const driver = await DriverProfileModel.findOne({ userId: driverUserId }).select('_id');
    return OrderModel.find(driver ? { assignedDriverId: driver._id } : { _id: { $exists: false } }).sort({ createdAt: -1 }).limit(100);
  }
  return OrderModel.find(merchantId ? { merchantId } : {}).sort({ createdAt: -1 }).limit(100);
}

export async function findNearbyDrivers(coordinates: [number, number], radiusMeters: number) {
  return findAvailableDriversNear(coordinates, radiusMeters);
}

export type OrderId = Types.ObjectId;

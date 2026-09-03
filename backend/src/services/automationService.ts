import { env } from '../config/env.js';
import { AppError } from '../middleware/errors.js';
import { DriverLocationModel } from '../models/DriverLocation.js';
import { DriverProfileModel } from '../models/DriverProfile.js';
import { OrderModel } from '../models/Order.js';
import { VehicleModel } from '../models/Vehicle.js';

export type OrderCreatedEvent = { event: 'order.created'; occurredAt: string; order: { id: string; trackingNumber: string; pickup: { coordinates: [number, number] }; dropoff: { coordinates: [number, number] }; recipient: { phone?: string; verificationPin?: string } } };

async function postN8n(path: string, payload: unknown): Promise<void> {
  if (!env.N8N_BASE_URL) return;
  const response = await fetch(`${env.N8N_BASE_URL.replace(/\/$/, '')}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(env.N8N_WEBHOOK_SECRET ? { 'x-webhook-secret': env.N8N_WEBHOOK_SECRET } : {}) }, body: JSON.stringify(payload), signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`n8n responded with ${response.status}`);
}

export async function emitOrderCreated(order: { id: string; trackingNumber: string; pickup: { location: { coordinates: number[] } }; dropoff: { location: { coordinates: number[] } }; recipient?: { phone?: string | null; verificationPin?: string | null } | null }) {
  const event: OrderCreatedEvent = { event: 'order.created', occurredAt: new Date().toISOString(), order: { id: order.id, trackingNumber: order.trackingNumber, pickup: { coordinates: order.pickup.location.coordinates as [number, number] }, dropoff: { coordinates: order.dropoff.location.coordinates as [number, number] }, recipient: { phone: order.recipient?.phone ?? undefined, verificationPin: order.recipient?.verificationPin ?? undefined } } };
  try { await postN8n('/webhook/order-created', event); } catch (error) { console.error('Unable to emit order.created webhook', error); }
}

export async function findIdleDrivers(latitude: number, longitude: number, radiusMeters: number) {
  return DriverProfileModel.aggregate([
    { $match: { status: 'idle', lastKnownLocation: { $exists: true } } },
    { $geoNear: { near: { type: 'Point', coordinates: [longitude, latitude] }, key: 'lastKnownLocation', distanceField: 'distanceMeters', maxDistance: radiusMeters, spherical: true } },
    { $lookup: { from: 'orders', let: { driverId: '$_id' }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$assignedDriverId', '$$driverId'] }, { $in: ['$stage', ['assigned', 'picked_up', 'in_transit']] }] } } }], as: 'activeOrders' } },
    { $addFields: { currentParcelCount: { $size: '$activeOrders' } } },
    { $sort: { currentParcelCount: 1, distanceMeters: 1 } },
    { $project: { activeOrders: 0 } },
    { $limit: 50 }
  ]);
}

export async function assignOrder(orderId: string, driverId: string) {
  const result = await OrderModel.findOneAndUpdate({ _id: orderId, stage: 'pending', assignedDriverId: { $exists: false } }, { $set: { assignedDriverId: driverId, stage: 'assigned' } }, { new: true });
  if (!result) throw new AppError(409, 'Order is no longer pending or already assigned', 'ORDER_NOT_ASSIGNABLE');
  const driver = await DriverProfileModel.findOneAndUpdate({ _id: driverId, status: 'idle' }, { $set: { status: 'en_route' } }, { new: true });
  if (!driver) { await OrderModel.updateOne({ _id: orderId, assignedDriverId: driverId }, { $unset: { assignedDriverId: 1 }, $set: { stage: 'pending' } }); throw new AppError(409, 'Driver is no longer idle', 'DRIVER_NOT_AVAILABLE'); }
  return result;
}

export async function recordLocation(userId: string, latitude: number, longitude: number, capturedAt: Date) {
  const driver = await DriverProfileModel.findOne({ userId }).select('_id assignedVehicleId');
  if (!driver) throw new AppError(404, 'Driver profile not found', 'DRIVER_NOT_FOUND');
  await DriverProfileModel.updateOne({ _id: driver._id }, { $set: { lastKnownLocation: { type: 'Point', coordinates: [longitude, latitude] } } });
  await DriverLocationModel.create({ driverId: driver._id, vehicleId: driver.assignedVehicleId, location: { type: 'Point', coordinates: [longitude, latitude] }, capturedAt });
  const nearbyOrders = await OrderModel.find({ assignedDriverId: driver._id, stage: { $in: ['assigned', 'picked_up', 'in_transit'] }, 'dropoff.location': { $near: { $geometry: { type: 'Point', coordinates: [longitude, latitude] }, $maxDistance: env.PROXIMITY_RADIUS_METERS } } }).select('_id trackingNumber dropoff recipient');
  await Promise.all(nearbyOrders.map(async (order) => { try { const distanceMeters = haversine([longitude, latitude], order.dropoff.location?.coordinates ?? [] as number[]) * 1000; await postN8n('/webhook/driver-near-dropoff', { event: 'driver.near_dropoff', occurredAt: new Date().toISOString(), driverId: driver.id, order: { id: order.id, trackingNumber: order.trackingNumber, dropoff: order.dropoff, recipient: { phone: order.recipient?.phone ?? undefined, verificationPin: order.recipient?.verificationPin ?? undefined }, distanceMeters, estimatedArrivalMinutes: Math.max(1, Math.ceil(distanceMeters / 500)) } }); } catch (error) { console.error('Unable to emit proximity webhook', error); } }));
  return { accepted: true, proximityEvents: nearbyOrders.length };
}

export async function nightlyMaintenance(date = new Date()) {
  const start = new Date(date); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
  const samples = await DriverLocationModel.find({ vehicleId: { $exists: true }, capturedAt: { $gte: start, $lt: end } }).sort({ vehicleId: 1, capturedAt: 1 }).lean();
  const mileageByVehicle = new Map<string, number>();
  for (let index = 1; index < samples.length; index += 1) { const previous = samples[index - 1]; const current = samples[index]; if (!previous || !current || String(previous.vehicleId) !== String(current.vehicleId)) continue; const previousCoordinates = previous.location?.coordinates; const currentCoordinates = current.location?.coordinates; if (!previousCoordinates || !currentCoordinates || previousCoordinates.length !== 2 || currentCoordinates.length !== 2) continue; mileageByVehicle.set(String(current.vehicleId), (mileageByVehicle.get(String(current.vehicleId)) ?? 0) + haversine(previousCoordinates, currentCoordinates)); }
  const vehicles = await VehicleModel.find({ status: { $ne: 'decommissioned' } });
  const overdue = vehicles.filter((vehicle) => (vehicle.maintenanceIntervalKm && vehicle.lastMaintenanceOdometer != null && vehicle.currentOdometer + (mileageByVehicle.get(vehicle.id) ?? 0) - vehicle.lastMaintenanceOdometer >= vehicle.maintenanceIntervalKm) || (vehicle.maintenanceIntervalDays && vehicle.lastMaintenanceDate && start.getTime() - vehicle.lastMaintenanceDate.getTime() >= vehicle.maintenanceIntervalDays * 86400000));
  await Promise.all(vehicles.map((vehicle) => VehicleModel.updateOne({ _id: vehicle._id }, { $inc: { currentOdometer: mileageByVehicle.get(vehicle.id) ?? 0 }, $set: { maintenanceFlag: overdue.some((item) => item.id === vehicle.id) } })));
  return { date: start.toISOString().slice(0, 10), mileageByVehicle: Object.fromEntries(mileageByVehicle), overdueVehicleIds: overdue.map((vehicle) => vehicle.id) };
}

function haversine(first: number[], second: number[]) { const earthRadiusKm = 6371; const firstLongitude = first[0] ?? 0; const firstLatitude = first[1] ?? 0; const secondLongitude = second[0] ?? 0; const secondLatitude = second[1] ?? 0; const latitudeDelta = (secondLatitude - firstLatitude) * Math.PI / 180; const longitudeDelta = (secondLongitude - firstLongitude) * Math.PI / 180; const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(firstLatitude * Math.PI / 180) * Math.cos(secondLatitude * Math.PI / 180) * Math.sin(longitudeDelta / 2) ** 2; return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }

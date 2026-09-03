import { DriverProfileModel } from '../models/DriverProfile.js';

export async function findAvailableDriversNear(coordinates: [number, number], radiusMeters: number) {
  return DriverProfileModel.find({
    status: 'idle',
    lastKnownLocation: {
      $near: { $geometry: { type: 'Point', coordinates }, $maxDistance: radiusMeters }
    }
  }).populate('userId', 'email phone').populate('assignedVehicleId').limit(50);
}

import { Schema, model, type InferSchemaType } from 'mongoose';

const driverLocationSchema = new Schema({
  driverId: { type: Schema.Types.ObjectId, ref: 'DriverProfile', required: true, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
  location: { type: { type: String, enum: ['Point'], required: true, default: 'Point' }, coordinates: { type: [Number], required: true } },
  capturedAt: { type: Date, required: true, index: true }
}, { timestamps: true, versionKey: false });

driverLocationSchema.index({ location: '2dsphere' });
driverLocationSchema.index({ vehicleId: 1, capturedAt: 1 });
export type DriverLocation = InferSchemaType<typeof driverLocationSchema>;
export const DriverLocationModel = model<DriverLocation>('DriverLocation', driverLocationSchema);

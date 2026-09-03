import { Schema, model, type InferSchemaType } from 'mongoose';

const vehicleSchema = new Schema({
  assetId: { type: String, required: true, unique: true, trim: true },
  plateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  vehicleType: { type: String, enum: ['motorcycle', 'van', 'truck', 'car'], required: true },
  currentOdometer: { type: Number, required: true, min: 0, default: 0 },
  lastMaintenanceDate: { type: Date },
  lastMaintenanceOdometer: { type: Number, min: 0 },
  maintenanceIntervalKm: { type: Number, min: 1 },
  maintenanceIntervalDays: { type: Number, min: 1 },
  maintenanceFlag: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'service', 'decommissioned'], required: true, default: 'active' }
}, { timestamps: true, versionKey: false });

export type Vehicle = InferSchemaType<typeof vehicleSchema>;
export const VehicleModel = model<Vehicle>('Vehicle', vehicleSchema);

import { Schema, model, type InferSchemaType } from 'mongoose';

const pointSchema = new Schema({
  type: { type: String, enum: ['Point'], required: true, default: 'Point' },
  coordinates: { type: [Number], required: true, validate: { validator: (value: number[]) => value.length === 2 } }
}, { _id: false });

const driverProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  assignedVehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
  licenseNumber: { type: String, required: true, trim: true },
  licenseExpiry: { type: Date, required: true },
  status: { type: String, enum: ['idle', 'en_route', 'off_duty'], required: true, default: 'off_duty' },
  lastKnownLocation: { type: pointSchema }
}, { timestamps: true, versionKey: false });

driverProfileSchema.index({ lastKnownLocation: '2dsphere' });
export type DriverProfile = InferSchemaType<typeof driverProfileSchema>;
export const DriverProfileModel = model<DriverProfile>('DriverProfile', driverProfileSchema);

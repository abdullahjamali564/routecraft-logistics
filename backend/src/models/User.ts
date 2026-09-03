import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const userRoles = ['admin', 'merchant', 'driver', 'dispatcher'] as const;
export type UserRole = (typeof userRoles)[number];
export const userStatuses = ['active', 'suspended', 'invited'] as const;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, trim: true },
  role: { type: String, enum: userRoles, required: true, default: 'merchant' },
  status: { type: String, enum: userStatuses, required: true, default: 'active' }
}, { timestamps: true, versionKey: false });

userSchema.index({ email: 1 }, { unique: true });
export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;
export const UserModel = model<User>('User', userSchema);

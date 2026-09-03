import { Schema, model, type InferSchemaType } from 'mongoose';

const merchantProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true, trim: true },
  registrationNumber: { type: String, trim: true },
  billingTerms: { type: String, enum: ['prepaid', 'net_7', 'net_15', 'net_30'], default: 'prepaid' },
  pricingTier: { type: String, enum: ['standard', 'volume', 'enterprise'], default: 'standard' },
  billingEmail: { type: String, lowercase: true, trim: true },
  billingAddress: { type: String, trim: true }
}, { timestamps: true, versionKey: false });

export type MerchantProfile = InferSchemaType<typeof merchantProfileSchema>;
export const MerchantProfileModel = model<MerchantProfile>('MerchantProfile', merchantProfileSchema);

import { Schema, model, type InferSchemaType } from 'mongoose';

const addressSchema = new Schema({
  addressLine: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  region: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true, validate: { validator: (value: number[]) => value.length === 2 } }
  }
}, { _id: false });

const dimensionsSchema = new Schema({ length: { type: Number, min: 0 }, width: { type: Number, min: 0 }, height: { type: Number, min: 0 } }, { _id: false });
const priceBreakdownSchema = new Schema({ base: { type: Number, min: 0, required: true }, distance: { type: Number, min: 0, default: 0 }, surcharge: { type: Number, min: 0, default: 0 }, discount: { type: Number, min: 0, default: 0 }, total: { type: Number, min: 0, required: true }, currency: { type: String, default: 'USD' } }, { _id: false });
const recipientSchema = new Schema({ phone: { type: String, trim: true }, verificationPin: { type: String, trim: true, minlength: 4, maxlength: 8 } }, { _id: false });

const orderSchema = new Schema({
  trackingNumber: { type: String, required: true, unique: true, index: true, trim: true },
  merchantId: { type: Schema.Types.ObjectId, ref: 'MerchantProfile', required: true, index: true },
  assignedDriverId: { type: Schema.Types.ObjectId, ref: 'DriverProfile', index: true },
  pickup: { type: addressSchema, required: true },
  dropoff: { type: addressSchema, required: true },
  recipient: { type: recipientSchema },
  package: { weight: { type: Number, required: true, min: 0 }, dimensions: { type: dimensionsSchema }, description: { type: String, trim: true } },
  stage: { type: String, enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'], default: 'pending', index: true },
  proofOfDeliveryUrl: { type: String, trim: true },
  priceBreakdown: { type: priceBreakdownSchema, required: true }
}, { timestamps: true, versionKey: false });

orderSchema.index({ 'pickup.location': '2dsphere' });
orderSchema.index({ 'dropoff.location': '2dsphere' });
export type Order = InferSchemaType<typeof orderSchema>;
export const OrderModel = model<Order>('Order', orderSchema);

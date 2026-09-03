import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errors.js';
import { signAccessToken } from '../middleware/auth.js';
import { MerchantProfileModel } from '../models/MerchantProfile.js';
import { UserModel, type UserRole } from '../models/User.js';

const SALT_ROUNDS = 12;

export async function registerMerchant(input: { email: string; password: string; phone?: string; companyName: string }) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await UserModel.create({ email: input.email, passwordHash, phone: input.phone, role: 'merchant' });
  try {
    const merchant = await MerchantProfileModel.create({ userId: user._id, companyName: input.companyName, billingEmail: input.email });
    return { user, merchant, token: signAccessToken({ sub: user.id, role: 'merchant', merchantId: merchant.id }) };
  } catch (error) {
    await UserModel.findByIdAndDelete(user._id);
    throw error;
  }
}

export async function login(input: { email: string; password: string }) {
  const user = await UserModel.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash)) || user.status !== 'active') throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  const merchant = user.role === 'merchant' ? await MerchantProfileModel.findOne({ userId: user._id }).select('_id') : null;
  return { user, merchant, token: signAccessToken({ sub: user.id, role: user.role as UserRole, ...(merchant ? { merchantId: merchant.id } : {}) }) };
}

import { Router } from 'express';
import { z } from 'zod';
import { loginUser, me, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(12).max(128) });
const registerSchema = credentialsSchema.extend({ phone: z.string().min(7).max(30).optional(), companyName: z.string().min(2).max(200) });

export const authRoutes = Router();
authRoutes.post('/register', validateBody(registerSchema), register);
authRoutes.post('/login', validateBody(credentialsSchema), loginUser);
authRoutes.get('/me', authenticate, me);

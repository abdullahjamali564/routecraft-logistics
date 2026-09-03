import { Router } from 'express';
import { maintenance, nearbyDrivers } from '../controllers/automationController.js';
import { requireWebhookSecret } from '../middleware/webhookAuth.js';

export const automationRoutes = Router();
automationRoutes.get('/drivers/nearby', requireWebhookSecret, nearbyDrivers);
automationRoutes.post('/maintenance/nightly', requireWebhookSecret, maintenance);

import { Router } from 'express';
import { create, createOrderSchema, list, nearbyDrivers, scan, scanSchema, stageSchema, updateStage } from '../controllers/orderController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const orderRoutes = Router();
orderRoutes.use(authenticate);
orderRoutes.get('/nearby-drivers', requireRoles('admin', 'dispatcher', 'merchant'), nearbyDrivers);
orderRoutes.get('/', requireRoles('admin', 'dispatcher', 'merchant', 'driver'), list);
orderRoutes.post('/', requireRoles('admin', 'dispatcher', 'merchant'), validateBody(createOrderSchema), create);
orderRoutes.patch('/:orderId/stage', requireRoles('admin', 'dispatcher', 'driver', 'merchant'), validateBody(stageSchema), updateStage);
orderRoutes.post('/:orderId/scan', requireRoles('driver'), validateBody(scanSchema), scan);

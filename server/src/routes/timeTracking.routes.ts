import express from 'express';
import { timeTrackingController } from '../di/container';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateUser);

/**
 * Time Tracking Routes
 */
router.post('/', authorizeRoles('student'), timeTrackingController.logTimeSpent.bind(timeTrackingController));
router.get('/user/:userId', authorizeRoles('student'), timeTrackingController.getTotalTimeSpent.bind(timeTrackingController));

export default router;
import express from 'express';
import { certificateController } from '../di/container';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware';

const router = express.Router();
router.use(authenticateUser);

router.post('/', authorizeRoles('student'), certificateController.generateCertificate.bind(certificateController));
router.get('/user/:userId', authorizeRoles('student'), certificateController.getUserCertificates.bind(certificateController));
router.get('/:certificateId', authorizeRoles('student'), certificateController.getCertificateById.bind(certificateController));


export default router;
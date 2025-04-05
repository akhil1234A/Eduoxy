import express from 'express';
import { ICodeRunnerController } from '../interfaces/codeRunner.controller.interface';
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";
import { codeRunnerController } from '../di/container';

const router = express.Router();
  router.use(authenticateUser);

  // Public routes
  router.get('/', codeRunnerController.getProblems.bind(codeRunnerController));
  router.get('/:id', codeRunnerController.getProblemById.bind(codeRunnerController));

  // Protected routes (admin only)
  router.post('/', authorizeRoles("admin"), codeRunnerController.createProblem.bind(codeRunnerController));
  router.put('/:id', authorizeRoles("admin"), codeRunnerController.updateProblem.bind(codeRunnerController));
  router.delete('/:id', authorizeRoles("admin"), codeRunnerController.deleteProblem.bind(codeRunnerController));

  // Code execution routes
  router.post('/execute', codeRunnerController.executeCode.bind(codeRunnerController));
  router.post('/submit', codeRunnerController.submitSolution.bind(codeRunnerController));

  export default router;
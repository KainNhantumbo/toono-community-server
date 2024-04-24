import UserController from './user.controller';
import { Router } from 'express';
import { asyncWrapper } from '../../lib/utils';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new UserController();

router
  .route('/')
  .get(asyncWrapper(controller.findAll))
  .post(asyncWrapper(controller.create))
  .patch(authenticate, asyncWrapper(controller.update))
  .delete(authenticate, asyncWrapper(controller.delete));

router.route('/stats').get(authenticate, asyncWrapper(controller.stats));
router.route('/:id').get(asyncWrapper(controller.findOne));

export { router as user_router };

import CommentController from './comments.controller';
import { asyncWrapper } from '../../lib/utils';
import { authenticate } from '../../middleware/auth.middleware';
import { Router } from 'express';

const router = Router();
const controller = new CommentController();

router.route('/').get(authenticate, asyncWrapper(controller.findAll));

router
  .route('/:id')
  .post(authenticate, asyncWrapper(controller.create))
  .delete(authenticate, asyncWrapper(controller.delete));

router.route('/:postId/:commentId').patch(authenticate, asyncWrapper(controller.update));

export { router as comments_router };

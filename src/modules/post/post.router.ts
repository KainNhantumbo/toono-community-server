import { Router } from 'express';
import { asyncWrapper } from '../../lib/utils';
import { authenticate } from '../../middleware/auth.middleware';
import PostController from './post.controller';

const router = Router();
const controller = new PostController();

router
  .route('/')
  .get(asyncWrapper(controller.findAll))
  .post(authenticate, asyncWrapper(controller.create));

router
  .route('/:id')
  .get(authenticate, asyncWrapper(controller.findOneUserPost))
  .patch(authenticate, asyncWrapper(controller.update))
  .delete(authenticate, asyncWrapper(controller.delete));

router.route('/public/:slug').get(asyncWrapper(controller.findOnePublicPost));

export { router as post_router };

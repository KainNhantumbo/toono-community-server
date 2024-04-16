import PostClapsController from './post-claps.controller';
import { asyncWrapper } from '../../lib/utils';
import { authenticate } from '../../middleware/auth.middleware';
import { Router } from 'express';

const router = Router();
const controller = new PostClapsController();

router
  .route('/:id')
  .post(authenticate, asyncWrapper(controller.create))
  .delete(authenticate, asyncWrapper(controller.delete));

export { router as post_claps_router };

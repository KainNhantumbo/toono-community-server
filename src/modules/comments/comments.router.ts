import CommentController from './comments.controller';
import { asyncWrapper } from '../../lib/utils';
import { authenticate } from '../../middleware/auth.middleware';
import { Router } from 'express';

const router = Router()
const controller = new CommentController()

export {router as comments_router}

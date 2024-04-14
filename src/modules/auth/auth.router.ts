import { Router } from 'express';
import { asyncWrapper } from '../../lib/utils';
import AuthController from './auth.controller';

const router = Router();
const controller = new AuthController();

router.get('/revalidate', asyncWrapper(controller.revalidate));
router.post('/login', asyncWrapper(controller.login));
router.post('/logout', asyncWrapper(controller.logout));

export { router as auth_router };

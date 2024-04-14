import asyncWrapper from '../../lib/utils';
import AuthController from './auth.controller';
import { Router } from 'express';

const router = Router();
const controller = new AuthController();

export { router as auth_router };

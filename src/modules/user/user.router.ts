import UserController from './user.controller';
import { Router } from 'express';

const router = Router();
const controller = new UserController();

export { router as user_router };

import { Router } from 'express';
import PostController from './post.controller';

const router = Router();
const controller = new PostController();

export { router as post_router };

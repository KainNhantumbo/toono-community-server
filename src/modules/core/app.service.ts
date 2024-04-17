import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import swaggerUI from 'swagger-ui-express';
import { corsOptions } from '../../config/cors.config';
import { rateLimiter } from '../../config/throttle.config';
import swaggerSpec from '../../docs/swagger-spec.doc.json';
import ExceptionHandler from '../../middleware/error.middleware';
import { auth_router } from '../auth/auth.router';
import { comments_router } from '../comments/comments.router';
import { post_claps_router } from '../post-claps/post-claps.router';
import { post_router } from '../post/post.router';
import { user_router } from '../user/user.router';
import { error_route } from './app.router';

export default class CreateApp {
  private readonly app = express();

  constructor() {
    this.app.use(helmet());
    this.app.use(corsOptions);
    this.app.use(rateLimiter);
    this.app.use(compression());
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(cookieParser());

    // app routes
    this.app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
    this.app.use('/api/v1/auth', auth_router);
    this.app.use('/api/v1/users', user_router);
    this.app.use('/api/v1/posts', post_router);
    this.app.use('/api/v1/comments', comments_router);
    this.app.use('/api/v1/claps', post_claps_router);

    // errors
    this.app.use(error_route);
    this.app.use(ExceptionHandler.handler);
  }

  getAppInstance() {
    return this.app;
  }
}

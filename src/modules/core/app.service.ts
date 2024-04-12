import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
// import swaggerSpec from '../../docs/swagger-spec.doc.json';
// import swaggerUI from 'swagger-ui-express';
import { corsOptions } from '../../config/cors.config';
import { rateLimiter } from '../../config/throttle.config';
import { errorHandler } from '../../middleware/error.middleware';
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
    // this.app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

    // errors
    this.app.use(error_route);
    this.app.use(errorHandler);
  }

  getAppInstance() {
    return this.app;
  }
}

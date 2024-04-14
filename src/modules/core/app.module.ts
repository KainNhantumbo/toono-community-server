import Package from '../../../package.json';
import { logger } from '../../lib/utils';
import type { Server } from '../../types';
import expressListRoutes from 'express-list-routes';
import { docsGenerator, docsSchema } from '../../config/swagger.config';
import { join } from 'node:path';
import { client as databaseClient } from '../../database/client.config';

export default class Bootstrap {
  public readonly props: Server.AppProps;

  constructor(props: Server.AppProps) {
    this.props = props;
  }

  public async start(): Promise<void> {
    try {
      const instance = this.props.app.listen(this.props.port, () => {
        this.generateDocs();
        this.postStart();
        this.close(instance);
      });
    } catch (error) {
      logger.error(error);
      process.exit(process.exitCode || 0);
    }
  }

  private async generateDocs() {
    try {
      const output = join(__dirname, '..', '..', 'docs', 'swagger-spec.doc.json');
      const endpoints = [join(__dirname, '..', '..', 'index'), join(__dirname, 'app.service')];
      await docsGenerator(output, endpoints, docsSchema);
    } catch (error) {
      logger.error(error);
    }
  }

  private postStart() {
    expressListRoutes(this.props.app, {
      logger: function (method, space, path) {
        logger.info(`ROUTER: [${method}]${space}${path}`);
      },
      color: true,
      spacer: 8
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.warn(`Application in Development Mode.`);
      logger.info(`Server Listening on: http://localhost:${this.props.port}`);
      logger.info(`Server Docs on: http://localhost:${this.props.port}/api-docs`);
    } else {
      logger.warn(`Application in Production Mode.`);
      logger.info(`Server running on: ${Package.url}.`);
      logger.info(`Server Docs on: http://localhost:${Package.url}/api-docs`);
    }
  }

  private close(server: Server.CurrentServer) {
    const signals = ['SIGINT', 'SIGTERM'] as const;
    try {
      for (const signal of signals) {
        process.once(signal, async () => {
          await databaseClient.end();
          server.close(() => logger.info('Closing HTTP Server'));
        });
      }
    } catch (error) {
      console.error(error);
      process.exit(process.exitCode || 1);
    }
  }
}

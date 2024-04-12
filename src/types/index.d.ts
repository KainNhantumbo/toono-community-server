import type { Application, NextFunction, Request, Response } from 'express';
import type { IncomingMessage, Server as HttpServer, ServerResponse } from 'http';

declare namespace Server {
  type CurrentServer = HttpServer<typeof IncomingMessage, typeof ServerResponse>;
  type DecodedPayload = { id: string; role: 'USER' | 'ADMIN' };
  type AppProps = { app: Application; port: number };
  type LoggerProps = { message: string; fileName: string };
  type HandledFunction = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
}

declare namespace Schemas {}

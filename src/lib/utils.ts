import { isEmail, isPhoneNumber } from 'class-validator';
import type { NextFunction, Request, Response } from 'express';
import winston from 'winston';
import { DATE_FORMAT } from '../shared/constants';
import type { Server } from '../types';

/**
 * Wrapper function for global error handling.
 * @param fn asynchronous function to be wrapped and error handled.
 * @returns Promise<...>
 */
export default function asyncWrapper(fn: Server.HandledFunction) {
  return function (req: Request, res: Response, next: NextFunction) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export const logger: winston.Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.label({ label: 'SERVER' }),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, label, timestamp }) => {
      const time = Intl.DateTimeFormat('en-us', {})
      return `[${time.format(timestamp)}] [${label}] ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console(), new winston.transports.Http()]
});

export function isValidEmail(data: unknown): boolean {
  const regex: RegExp = new RegExp(
    // eslint-disable-next-line no-useless-escape
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  const result: RegExpExecArray | null = regex.exec(String(data));
  if (!result) return false;
  if (!isEmail(String(data))) return false;
  return true;
}


import { isEmail } from 'class-validator';
import type { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import winston from 'winston';
import type { Server } from '../types';

/**
 * Wrapper function for global error handling.
 * @param fn asynchronous function to be wrapped and error handled.
 * @returns Promise<...>
 */
export function asyncWrapper(fn: Server.HandledFunction) {
  return function (req: Request, res: Response, next: NextFunction) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * @param data object to save non sensitive user data
 * @param secret jwt secret key
 * @param exp time to token expire
 * @returns Promise<string>
 */
export async function createToken(data: object, secret: string, exp: string) {
  return new Promise<string>((resolve): void => {
    const token = jwt.sign(data, secret, { expiresIn: exp });
    resolve(token);
  });
}

/**
 * An asynchronous function to verify integrity of the token.
 * @param token string
 * @param secret string
 * @returns Promise<DecodedPayload>
 */
export function verifyToken(token: string, secret: string) {
  return new Promise<Server.DecodedPayload>((resolve): void => {
    const result = jwt.verify(token, secret) as Server.DecodedPayload;
    resolve(result);
  });
}

export const logger: winston.Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({ level: true }),
    winston.format.simple(),
    winston.format.label({ label: 'SERVER' }),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, label, timestamp }) => {
      const time = new Date(timestamp).toLocaleString();
      return `[${time}] [${label}] ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console(), new winston.transports.Http()]
});

export const generatePostSlug = (title: string) => {
  const slug = title.toLowerCase().replaceAll('.', '').replaceAll(' ', '-');
  return slug;
};
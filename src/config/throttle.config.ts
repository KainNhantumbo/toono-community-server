import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import Logger from '../lib/logger';

export const rateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: 'Too many requests from your IP, please try again after 60 seconds.',
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  handler: function (req, res, next, options) {
    const event = new Logger({
      message: `Too may requests: ${options.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      fileName: 'rate-limiter.log'
    });
    event.register();
  }
});

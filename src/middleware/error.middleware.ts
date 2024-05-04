import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import { ZodError } from "zod";
import Exception from "../lib/app-exception";
import Logger from "../lib/logger";
import { logger as consoleLogger } from "../lib/utils";

export default class ExceptionHandler {
  static handler(error: Error | Exception, req: Request, res: Response, next: NextFunction) {
    if (error instanceof Exception) {
      const { message, statusCode } = error;
      return res.status(statusCode).json({ message, status: statusCode });
    }

    if (error.name === "MongoServerError") {
      if (error.message.split(" ")[0] == "E11000") {
        return res.status(409).json({
          code: "Conflict Error",
          status: 409,
          message:
            "Data Conflict Error: Some of the given information already exists on the server."
        });
      }
    }

    if (error.name === "PayloadTooLargeError")
      return res.status(413).json({
        code: "PayloadTooLargeError",
        status: 413,
        message: "The file chosen is too large"
      });

    if (error instanceof JsonWebTokenError)
      return res.status(401).json({
        code: "Authorization Error",
        status: 401,
        message: "Unauthorized: invalid credentials."
      });

    if (error instanceof ZodError)
      return res.status(401).json({
        code: "Bad Request Error",
        status: 400,
        message: error.errors
          .map((error) => error.message)
          .reduce((value: string, acc) => value.concat(acc).toString(), "")
      });

    if (error.name === "UploadApiErrorResponse") {
      return res.status(400).json({
        code: error.name,
        status: 400,
        message: error.message
      });
    }

    if (error.name === "ValidationError") {
      const errorMessage = Object.values((error as any).errors)
        .map((obj: any) => obj.message)
        .join(". ")
        .concat(".");
      return res.status(400).json({
        code: "Data Validation Error",
        status: 400,
        message: errorMessage
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        code: "Malformed Data Error",
        status: 400,
        message: "Some of the data sent to the server was malformed."
      });
    }

    if (process.env.NODE_ENV === "development") {
      if (error instanceof Error) {
        consoleLogger.error(
          `An uncaught error has ocurred:\n${error.message}\n\t${error.stack}\n`
        );
        const logger = new Logger({
          message: error.stack ?? error.message,
          fileName: "uncaught-errors.log"
        });
        logger.register();
      } else {
        consoleLogger.error(error);
      }
    }

    res.status(500).json({
      code: "Internal Server Error",
      status: 500,
      message: "An error occurred while processing your request. Please try again later."
    });

    next();
  }
}

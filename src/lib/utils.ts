import * as fs from "node:fs/promises";
import * as path from "node:path";
import sanitizeHtml from "sanitize-html";
import { readingTime } from "reading-time-estimator";
import type { NextFunction, Request, Response } from "express";
import winston from "winston";
import type { Server } from "../types";

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

export const logger: winston.Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({ level: true }),
    winston.format.simple(),
    winston.format.label({ label: "SERVER" }),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, label, timestamp }) => {
      const time = new Date(timestamp).toLocaleString();
      return `[${time}] [${label}] ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console(), new winston.transports.Http()]
});

export const readTime = (text: string) => {
  return new Promise<{ minutes: number; words: number; text: string }>((resolve, reject) => {
    if (typeof text !== "string") reject("The text input must be a string");
    resolve(readingTime(text, 160, "en"));
  });
};

export async function sanitizer(content: string): Promise<string> {
  return new Promise((resolve) => {
    const result = sanitizeHtml(content, {
      enforceHtmlBoundary: false,
      allowVulnerableTags: false,
      disallowedTagsMode: "discard",
      allowedAttributes: {
        "*": ["class", "style", "contenteditable", "type", "data-*"]
      },
      nestingLimit: 50
    });
    resolve(result);
  });
}

export async function deleteFilesInDirectory(directoryPath: string) {
  const files = await fs.readdir(directoryPath);
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    await fs.unlink(filePath);
  }
}

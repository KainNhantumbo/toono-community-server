import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Server } from "../types";

export default class EventLogger {
  private readonly date: string = new Date().toISOString();
  private readonly fileName: string;
  private readonly message: string;

  constructor(props: Server.LoggerProps) {
    this.fileName = props.fileName;
    this.message = props.message;
  }

  public async register() {
    const LOG = `${this.date}\t${randomUUID()}\t${this.message}\n\n\n`;
    try {
      if (!existsSync(join(__dirname, "..", "logs"))) {
        await mkdir(join(__dirname, "..", "logs"));
      }
      await appendFile(join(__dirname, "..", "logs", this.fileName), LOG);
    } catch (err) {
      console.error(err);
    }
  }

  public logger(req: Request, res: Response, next: NextFunction) {
    this.register();
    console.log(`${req.method}\t${req.path}\t${req.url} `);
    next();
  }
}

import type { NextFunction, Request, Response } from "express";
import Exception from "../lib/app-exception";
import { asyncWrapper } from "../lib/utils";
import type { Server } from "../types";
import Token from "../lib/token";

export const authenticate = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      throw new Exception("Unauthorized.", 401);
    const token = authHeader.split(" ")[1];
    const decodedPayload = (await Token.parse(
      token,
      process.env.ACCESS_TOKEN || ""
    )) as Server.DecodedPayload;

    if (!decodedPayload) throw new Exception("Access denied.", 401);
    req.body.session = { id: decodedPayload.id, role: decodedPayload.role };
    next();
  }
);

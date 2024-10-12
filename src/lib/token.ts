import * as jwt from "jsonwebtoken";
import type { Server } from "../types";

export default class Token {
  /**
   * @param data non sensitive data object
   * @param secret secret key
   * @param exp expire time
   * @returns Promise<string>
   */
  static async serialize(data: object, secret: string, exp: string) {
    return new Promise<string>((resolve): void => {
      const token = jwt.sign(data, secret, { expiresIn: exp });
      resolve(token);
    });
  }

  /**
   * Verifies integrity of the token.
   * @param token string
   * @param secret string
   * @returns Promise<DecodedPayload>
   */
  static async parse(token: string, secret: string) {
    return new Promise<Server.DecodedPayload>((resolve): void => {
      const result = jwt.verify(token, secret) as Server.DecodedPayload;
      resolve(result);
    });
  }
}

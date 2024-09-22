import "dotenv/config";
import type { Request, Response } from "express";
import { db } from "../../database/client.database";
import Exception from "../../lib/app-exception";
import os from "node:os";
import { createToken, logger } from "../../lib/utils";
import { ForgotPasswordEmailSchema } from "./account.schema";
import Mail from "../../lib/mail";
import MailTemplate from "../../templates/mail.template";

export default class Account {
  async sendInstructions(req: Request, res: Response) {
    const { email } = await ForgotPasswordEmailSchema.parseAsync(req.body);

    const user = await db.query.users.findFirst({
      where: (table, fn) => fn.eq(table.email, email),
      columns: { id: true, email: true, name: true }
    });

    if (!user) throw new Exception("User account not found.", 400);

    const TOKEN_EXP_TIME = "24h";
    const token = await createToken(
      { id: user.id },
      process.env.ACCESS_TOKEN || "",
      TOKEN_EXP_TIME
    );

    const hostname = os.hostname();
    const template = new MailTemplate(user.name, user.email, hostname).build();
    const mail = new Mail({ html: template });

    const { sent, error } = await mail.send();

    if (!sent) {
      logger.error(error);
      throw new Exception("Failed to send mail instructions.", 500);
    }

    res.status(200).json({ message: "Message sent." });
  }
}

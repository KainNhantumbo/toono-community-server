import * as bcrypt from "bcrypt";
import "dotenv/config";
import * as drizzle from "drizzle-orm";
import type { Request, Response } from "express";
import { Resend } from "resend";
import { db } from "../../database/client.database";
import { users } from "../../database/schema.database";
import Exception from "../../lib/app-exception";
import { createToken, logger, verifyToken } from "../../lib/utils";
import MailTemplate from "../../templates/mail.template";
import { ForgotPasswordEmailSchema, UpdateCredentialsSchema } from "./account.schema";

export default class AccountController {
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

    const CLIENT_URL = new URL(
      `${req.headers["origin"]}/auth/update-credentials?token=${token}`
    );
    const template = new MailTemplate(user.name, user.email, CLIENT_URL.toString());
    const html = template.build();

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: String(process.env.EMAIL_ACCOUNT),
      to: user.email,
      subject: "Password Reset Request",
      html
    });

    if (error) {
      logger.error(error.message);
      throw new Exception("Failed to send mail instructions.", 500);
    }

    res.status(200).json({ message: "Message sent." });
  }

  async updateCredentials(req: Request, res: Response) {
    const data = await UpdateCredentialsSchema.parseAsync(req.body);

    const decodedPayload = await verifyToken(data.token, process.env.ACCESS_TOKEN || "");
    if (!decodedPayload) throw new Exception("Access denied.", 401);

    const user = await db.query.users.findFirst({
      where: (table, fn) => fn.eq(table.id, decodedPayload.id),
      columns: { email: true }
    });

    if (!user) throw new Exception("User not found", 404);
    const hash = await bcrypt.hash(data.password, 10);

    await db
      .update(users)
      .set({ password: hash })
      .where(drizzle.eq(users.id, decodedPayload.id));

    res.sendStatus(200);
  }
}

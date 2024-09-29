import "dotenv/config";
import type { Request, Response } from "express";
import { Resend } from "resend";
import { db } from "../../database/client.database";
import Exception from "../../lib/app-exception";
import { createToken, logger } from "../../lib/utils";
import MailTemplate from "../../templates/mail.template";
import { ForgotPasswordEmailSchema } from "./account.schema";

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

    const CLIENT_URL = `${req.baseUrl}/password-recovery-request`;
    const URL = `${CLIENT_URL}?user=${user.id}&token=${token}`;
    const template = new MailTemplate(user.name, user.email, URL);
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

  updateCredentials(req: Request, res: Response) {
    // const {} = await(req.body);
  }
}

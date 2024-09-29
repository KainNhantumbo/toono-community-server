import "dotenv/config";
import { createTransport } from "nodemailer";
import type { Options } from "nodemailer/lib/mailer";

export default class Mail {
  private data: Omit<Options, "from" | "replyTo">;
  constructor(props: Omit<Options, "from" | "replyTo">) {
    this.data = props;
  }

  async send() {
    try {
      const transporter = createTransport({
        secure: process.env.NODE_ENV !== "production",
        host: "smtp.gmail.com",
        ignoreTLS: true,
        service: "gmail",
        auth: {
          user: process.env.EMAIL_ACCOUNT,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_ACCOUNT,
        replyTo: process.env.EMAIL_ACCOUNT,
        ...this.data
      });

      return { sent: true, error: null };
    } catch (error: unknown) {
      return { sent: false, error };
    }
  }
}

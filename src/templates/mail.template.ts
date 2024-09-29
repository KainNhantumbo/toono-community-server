export default class MailTemplate {
  private userName: string;
  private email: string;
  private redirectUrl: string;

  constructor(userName: string, email: string, redirectUrl: string) {
    this.userName = userName;
    this.email = email;
    this.redirectUrl = redirectUrl;
  }

  build() {
    const rawTemplate = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset Request</title>
                <style>
                    body {
                        font-family: Inter, Roboto, Arial, sans-serif;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                        background-color: #fff;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        color: #FDAD2E;
                    }
                    a {
                        color: #FDAD2E;
                        text-decoration: none;
                    }
                    .button {
                        display: inline-block;
                        font-size: 16px;
                        font-weight: bold;
                        color: #000;
                        background-color: #FDAD2E;
                        padding: 10px 20px;
                        border-radius: 5px;
                        text-align: center;
                        text-decoration: none;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 14px;
                        color: #666;
                    }
                    .footer a {
                        color: #FDAD2E;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Toono Community</h1>
                    <p>Hi ${this.userName},</p>
                    <p>A password reset was requested for your <strong>${this.email}</strong> Toono Community account.</p>
                    <p>Please click the link below to reset your password and set a new one:</p>
                    <div><a href=${this.redirectUrl} class="button" target="_blank">Reset Password</a></div>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you're having trouble clicking the button, copy and paste the URL below into your browser:</p>
                    <p><a href=${this.redirectUrl}>${this.redirectUrl}</a></p>
                    <p>Please let us know if you have any questions, feature requests, or general feedback simply by replying to this email.</p>
                    <p>All the best,<br>The Toono Community Team</p>
                    <p class="footer">If you didn't request it, please ignore this email.</p>
                </div>
            </body>
          </html>
          `;

    return rawTemplate;
  }
}

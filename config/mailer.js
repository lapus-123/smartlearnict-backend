const axios = require("axios");
const nodemailer = require("nodemailer");

const senderEmail =
  process.env.BREVO_SENDER ||
  process.env.BREVO_USER ||
  process.env.SMTP_FROM ||
  process.env.GMAIL_USER;

const hasBrevo = Boolean(process.env.BREVO_API_KEY && senderEmail);
const hasGmail = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
const hasSmtp = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
);

const buildMessage = ({ username, password }) => {
  const textContent = `Hello,

You requested your SmartLearningICT account credentials.

Username: ${username}
Password: ${password}

Please keep your credentials secure. If you did not request this email, please ignore it.

SmartLearningICT Team`;

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2 style="color:#1736F5">SmartLearningICT Account Recovery</h2>
      <p>You requested your SmartLearningICT account credentials.</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please keep your credentials secure. If you did not request this email, please ignore it.</p>
      <p>SmartLearningICT Team</p>
    </div>
  `;

  return {
    subject: "SmartLearningICT Account Recovery",
    textContent,
    htmlContent,
  };
};

const createSmtpTransport = () => {
  if (hasGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  if (hasSmtp) {
    const port = Number(process.env.SMTP_PORT || 587);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
};

exports.getMailerStatus = () => ({
  configured: hasBrevo || hasGmail || hasSmtp,
  provider: hasBrevo ? "brevo" : hasGmail ? "gmail" : hasSmtp ? "smtp" : "none",
});

exports.sendPasswordEmail = async ({ to, username, password }) => {
  const message = buildMessage({ username, password });

  if (hasBrevo) {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "SmartLearningICT",
          email: senderEmail,
        },
        to: [{ email: to }],
        subject: message.subject,
        textContent: message.textContent,
        htmlContent: message.htmlContent,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    console.log("Email sent via Brevo:", to, response.data?.messageId || "");
    return;
  }

  const transport = createSmtpTransport();
  if (!transport) {
    throw new Error(
      "Email service is not configured. Set BREVO_API_KEY or Gmail/SMTP credentials.",
    );
  }

  await transport.sendMail({
    from: `"SmartLearningICT" <${senderEmail || process.env.SMTP_USER}>`,
    to,
    subject: message.subject,
    text: message.textContent,
    html: message.htmlContent,
  });

  console.log("Email sent via SMTP:", to);
};

const status = exports.getMailerStatus();
if (status.configured) {
  console.log(`Mailer ready via ${status.provider}.`);
} else {
  console.warn(
    "Email service is not configured. Set BREVO_API_KEY or Gmail/SMTP credentials.",
  );
}
